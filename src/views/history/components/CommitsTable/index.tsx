import {
	FC,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { useMeasure } from "react-use";

import type { IBatchedCommits } from "../../../../git/types";

import PickableList from "../PickableList";
import { ChannelContext } from "../../data/channel";
import {
	DEFAULT_COLUMN_VISIBILITY,
	IColumnVisibility,
} from "../../data/columnVisibility";
import {
	DateFormatContext,
	DEFAULT_DATE_FORMAT,
	DateFormat,
} from "../../data/dateFormat";
import { COLUMNS_CHANGED_EVENT } from "../../data/events";
import { LatestCommitContext } from "../../data/latestCommit";
import { onEvent } from "../../utils/message";

import { ICommit, parseCommit } from "../../../../git/commit";

import { useBatchCommits } from "./useBatchCommits";
import { useColumnResize } from "./useColumnResize";

import { HEADERS, applyDateFormatWidth } from "./constants";

import style from "./index.module.scss";

const COMMIT_HASH_LENGTH = 40;

/** relative commit times are refreshed once a minute */
const RELATIVE_TIME_REFRESH_INTERVAL = 60 * 1000;

const CommitsTableInner: FC<{ totalWidth: number }> = ({ totalWidth }) => {
	const channel = useContext(ChannelContext)!;

	const { commits, commitsCount, options, setBatchedCommits } =
		useBatchCommits();

	// commits are ordered newest first
	const latestCommit = commits[0]?.slice(0, COMMIT_HASH_LENGTH);

	function diff(sortedRefs: string[]) {
		channel.viewChanges(sortedRefs);
	}

	const subscribeSwitcher = useCallback(() => {
		channel.subscribeSwitcher((batchedCommits: IBatchedCommits) =>
			setBatchedCommits(batchedCommits)
		);
	}, [channel, setBatchedCommits]);

	const onSelectReference = useCallback(
		() => channel.switchReference(),
		[channel]
	);

	const onFilter = useCallback(
		(prop: string) => {
			switch (prop) {
				case "description":
					channel.filterMessage((batchedCommits: IBatchedCommits) =>
						setBatchedCommits(batchedCommits)
					);
					break;
				case "author":
					channel.filterAuthor((batchedCommits: IBatchedCommits) =>
						setBatchedCommits(batchedCommits)
					);
					break;
			}
		},
		[channel, setBatchedCommits]
	);

	const [locationIndex, setLocationIndex] = useState<number>();
	const onLocate = useCallback(
		async (prop: string) => {
			switch (prop) {
				case "hash":
					const hash = await channel.inputHash();
					if (!hash) {
						return;
					}

					const index = commits.findIndex((commit) =>
						commit.startsWith(hash || "")
					);

					if (index === -1) {
						channel.showWarningMessage("No commit matched!");
					}

					setLocationIndex(index);
					// destroy location index after the blink animation finished
					setTimeout(() => {
						setLocationIndex(undefined);
					}, 1500);
					break;
			}
		},
		[channel, commits]
	);

	const [columnVisibility, setColumnVisibility] = useState<IColumnVisibility>(
		DEFAULT_COLUMN_VISIBILITY
	);

	useEffect(() => {
		const refresh = () => {
			channel.getColumnVisibility().then(setColumnVisibility);
		};

		refresh();

		return onEvent(COLUMNS_CHANGED_EVENT, refresh);
	}, [channel]);

	const [dateFormat, setDateFormat] = useState<DateFormat>(
		DEFAULT_DATE_FORMAT
	);
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		channel.getDateFormat().then(setDateFormat);
	}, [channel]);

	useEffect(() => {
		if (dateFormat !== "relative") {
			return;
		}

		setNow(Date.now());
		const timer = setInterval(
			() => setNow(Date.now()),
			RELATIVE_TIME_REFRESH_INTERVAL
		);

		return () => clearInterval(timer);
	}, [dateFormat]);

	const toggleDateFormat = useCallback(async () => {
		const next: DateFormat =
			dateFormat === "absolute" ? "relative" : "absolute";

		setDateFormat(next);
		await channel.setDateFormat(next);
	}, [channel, dateFormat]);

	const dateFormatContext = useMemo(
		() => ({ format: dateFormat, now }),
		[dateFormat, now]
	);

	const headers = useMemo(
		() =>
			applyDateFormatWidth(
				HEADERS.filter(
					(header) =>
						!header.visibilityKey ||
						columnVisibility[header.visibilityKey]
				),
				dateFormat
			),
		[columnVisibility, dateFormat]
	);

	const { columns } = useColumnResize(headers, totalWidth);

	useEffect(() => {
		subscribeSwitcher();

		channel.autoRefreshLog();
	}, [channel, subscribeSwitcher]);

	return (
		<LatestCommitContext.Provider value={latestCommit}>
			<div className={style["commit-headers"]}>
				{columns.map(
					(
						{
							prop,
							label,
							filterable,
							locatable,
							filterLogOption,
							dateFormatToggle,
							hasDivider,
							size,
							dragBind,
						},
						index
					) => (
						<div
							key={prop}
							className={style["header-item"]}
							style={{
								width: `${size}px`,
							}}
						>
							{hasDivider && (
								<div
									{...dragBind(index)}
									className={style.divider}
								/>
							)}
							{prop === "graph" ? (
								<VSCodeButton
									className={style["ref-button"]}
									data-button
									appearance="icon"
									title={`Select Branch/Reference · ${
										options.ref || "All"
									}`}
									aria-label="All"
									onClick={() => onSelectReference()}
								>
									<span className="codicon codicon-git-branch" />
									<span className={style.text}>
										{options.ref || "All"}
									</span>
								</VSCodeButton>
							) : (
								<>
									<span>{label}</span>
									{filterable && (
										<VSCodeButton
											appearance="icon"
											onClick={() => onFilter(prop)}
										>
											<span
												className={`codicon codicon-filter${
													options[
														filterLogOption as
															| "authors"
															| "keyword"
													]?.length
														? "-filled"
														: ""
												}`}
											/>
										</VSCodeButton>
									)}
									{locatable && (
										<VSCodeButton
											appearance="icon"
											onClick={() => onLocate(prop)}
										>
											<span className="codicon codicon-search" />
										</VSCodeButton>
									)}
									{dateFormatToggle && (
										<VSCodeButton
											appearance="icon"
											title={
												dateFormat === "relative"
													? "Show Full Date/Time"
													: "Show Relative Time"
											}
											onClick={toggleDateFormat}
										>
											<span className="codicon codicon-arrow-swap" />
										</VSCodeButton>
									)}
								</>
							)}
						</div>
					)
				)}
			</div>
			<div className={style["commits-area"]}>
				<DateFormatContext.Provider value={dateFormatContext}>
					<PickableList
						list={commits}
						keyLength={40}
						locationIndex={locationIndex}
						itemPipe={parseCommit}
						itemRender={(commit: ICommit) => (
							<div className={style.commit}>
								{columns.map(({ prop, size, transformer }) => (
									<span
										style={{
											width: `${size}px`,
										}}
										data-prop={prop}
										key={prop}
									>
										{transformer(commit)}
									</span>
								))}
							</div>
						)}
						size={commitsCount}
						onPick={(ids) => diff(ids)}
					/>
				</DateFormatContext.Provider>
			</div>
		</LatestCommitContext.Provider>
	);
};

const CommitsTable: FC = () => {
	const [ref, { width }] = useMeasure<HTMLDivElement>();

	return (
		<div className={style.outer}>
			<div ref={ref} className={style.container}>
				<CommitsTableInner totalWidth={width} />
			</div>
		</div>
	);
};

export default CommitsTable;
