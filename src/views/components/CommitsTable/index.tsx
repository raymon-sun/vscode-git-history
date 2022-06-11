import {
	FC,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

import classNames from "classnames";

import { Commit } from "../../../git/commit";

import { BatchedCommits } from "../../../git/types";

import PickableList from "../PickableList";
import { ChannelContext } from "../../data/channel";
import GitGraph from "../GitGraph";

import style from "./index.module.scss";

const CommitsTable: FC = () => {
	const channel = useContext(ChannelContext)!;

	const [commits, _setCommits] = useState<Commit[]>([]);
	const commitsRef = useRef(commits);
	const setCommits = (commits: Commit[]) => {
		commitsRef.current = commits;
		_setCommits(commits);
	};
	const [commitsCount, setCommitsCount] = useState<number>(0);

	const dealBatchedCommits = useCallback((batchedCommits: BatchedCommits) => {
		const { commits: newCommits, batchNumber, totalCount } = batchedCommits;
		setCommitsCount(totalCount);
		setCommits(
			batchNumber === 0
				? newCommits
				: commitsRef.current.concat(newCommits)
		);
	}, []);

	function diff(sortedRefs: string[]) {
		channel.viewChanges(sortedRefs);
	}

	const subscribeSwitcher = useCallback(() => {
		channel.subscribeSwitcher((batchedCommits: BatchedCommits) =>
			dealBatchedCommits(batchedCommits)
		);
	}, [channel, dealBatchedCommits]);

	const onFilterAuthor = useCallback(() => {
		channel.filterAuthor((batchedCommits: BatchedCommits) =>
			dealBatchedCommits(batchedCommits)
		);
	}, [channel, dealBatchedCommits]);

	useEffect(() => {
		subscribeSwitcher();
		channel.resetLog();
	}, [channel, dealBatchedCommits, subscribeSwitcher]);

	const getCommitList = () => {
		return commits.map((commit) => ({
			id: commit.hash,
			content: (
				<div className={style.commit}>
					<span className={style.graph}>
						<GitGraph data={commit.graph!} />
					</span>
					<span className={style.hash}>
						{commit.hash.slice(0, 6)}
					</span>
					<span className={style.message}>{commit.message}</span>
					<span className={style["author-name"]}>
						{commit.authorName}
					</span>
					<span className={style["commit-date"]}>
						{commit.commitDate}
					</span>
				</div>
			),
		}));
	};

	return (
		<div className={style.container}>
			<div className={style["commit-headers"]}>
				<div className={classNames(style["header-item"], style.graph)}>
					Graph
				</div>
				<div className={classNames(style["header-item"], style.hash)}>
					<span>Hash</span>
				</div>
				<div
					className={classNames(style["header-item"], style.message)}
				>
					<span>Message</span>
				</div>
				<div
					className={classNames(
						style["header-item"],
						style["author-name"]
					)}
				>
					<span>Author</span>
					<VSCodeButton appearance="icon" onClick={onFilterAuthor}>
						<span className="codicon codicon-filter"></span>
					</VSCodeButton>
				</div>
				<div
					className={classNames(
						style["header-item"],
						style["commit-date"]
					)}
				>
					<span>Date</span>
				</div>
			</div>
			<div className={style["commits-area"]}>
				<PickableList
					list={getCommitList()}
					size={commitsCount}
					onPick={(ids) => diff(ids)}
				/>
			</div>
		</div>
	);
};

export default CommitsTable;
