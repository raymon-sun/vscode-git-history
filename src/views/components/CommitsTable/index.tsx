import { FC, useCallback, useContext, useEffect } from "react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { useMeasure } from "react-use";

import classNames from "classnames";

import { BatchedCommits } from "../../../git/types";

import PickableList from "../PickableList";
import { ChannelContext } from "../../data/channel";

import { Commit } from "../../../git/commit";

import { useBatchCommits } from "./useBatchCommits";
import { useColumnResize } from "./useColumnResize";

import { HEADERS } from "./constants";

import style from "./index.module.scss";

const CommitsTableInner: FC<{ totalWidth: number }> = ({ totalWidth }) => {
	const channel = useContext(ChannelContext)!;

	const { columns } = useColumnResize(HEADERS, totalWidth);
	const { commits, commitsCount, setBatchedCommits } = useBatchCommits();

	function diff(sortedRefs: string[]) {
		channel.viewChanges(sortedRefs);
	}

	const subscribeSwitcher = useCallback(() => {
		channel.subscribeSwitcher((batchedCommits: BatchedCommits) =>
			setBatchedCommits(batchedCommits)
		);
	}, [channel, setBatchedCommits]);

	const onFilterAuthor = useCallback(() => {
		channel.filterAuthor((batchedCommits: BatchedCommits) =>
			setBatchedCommits(batchedCommits)
		);
	}, [channel, setBatchedCommits]);

	useEffect(() => {
		subscribeSwitcher();
		channel.resetLog();
	}, [channel, setBatchedCommits, subscribeSwitcher]);

	return (
		<>
			<div className={style["commit-headers"]}>
				{columns.map(
					(
						{ id, label, filterable, hasDivider, size, dragBind },
						index
					) => (
						<div
							key={id}
							className={classNames(style["header-item"])}
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
									onClick={onFilterAuthor}
								>
									<span className="codicon codicon-filter"></span>
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
							{columns.map(({ id, size, transformer }) => (
								<span
									style={{
										width: `${size}px`,
									}}
									key={id}
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
