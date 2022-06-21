import { FC, useCallback, useContext, useEffect, useMemo } from "react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { useMeasure } from "react-use";

import { BatchedCommits } from "../../../git/types";

import PickableList from "../PickableList";
import { ChannelContext } from "../../data/channel";

import { Commit } from "../../../git/commit";

import { useBatchCommits } from "./useBatchCommits";
import { useColumnResize } from "./useColumnResize";

import { HEADERS } from "./constants";

import style from "./index.module.scss";

const GRAPH_COLUMN_ID = "graph";

const CommitsTableInner: FC<{ totalWidth: number }> = ({ totalWidth }) => {
	const channel = useContext(ChannelContext)!;

	const { commits, commitsCount, options, setBatchedCommits } =
		useBatchCommits();

	function diff(sortedRefs: string[]) {
		channel.viewChanges(sortedRefs);
	}

	const subscribeSwitcher = useCallback(() => {
		channel.subscribeSwitcher((batchedCommits: BatchedCommits) =>
			setBatchedCommits(batchedCommits)
		);
	}, [channel, setBatchedCommits]);

	const onFilter = useCallback(
		(prop: string) => {
			switch (prop) {
				case "message":
					channel.filterMessage((batchedCommits: BatchedCommits) =>
						setBatchedCommits(batchedCommits)
					);
					break;
				case "author":
					channel.filterAuthor((batchedCommits: BatchedCommits) =>
						setBatchedCommits(batchedCommits)
					);
					break;
			}
		},
		[channel, setBatchedCommits]
	);

	const headers = useMemo(() => {
		const { authors, keyword } = options;
		if (authors?.length || keyword) {
			return HEADERS.filter(({ prop }) => prop !== GRAPH_COLUMN_ID);
		}

		return HEADERS;
	}, [options]);

	const { columns } = useColumnResize(headers, totalWidth);

	useEffect(() => {
		subscribeSwitcher();
		channel.resetLog();
	}, [channel, setBatchedCommits, subscribeSwitcher]);

	return (
		<>
			<div className={style["commit-headers"]}>
				{columns.map(
					(
						{
							prop,
							label,
							filterable,
							filterLogOption,
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
						</div>
					)
				)}
			</div>
			<div className={style["commits-area"]}>
				<PickableList
					list={commits}
					keyProp="hash"
					itemRender={(commit: Commit) => (
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
			</div>
		</>
	);
};

const CommitsTable: FC = () => {
	const [ref, { width }] = useMeasure<HTMLDivElement>();

	return (
		<div ref={ref} className={style.container}>
			{width && <CommitsTableInner totalWidth={width} />}
		</div>
	);
};

export default CommitsTable;
