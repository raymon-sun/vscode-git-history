import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

import classNames from "classnames";

import { Commit } from "../git/commit";

import { BatchedCommits } from "../git/types";

import PickableList from "./components/PickableList";
import style from "./App.module.scss";
import { ChannelContext } from "./data/channel";
import GitGraph from "./components/GitGraph";

import "@vscode/codicons/dist/codicon.css";

export default function App() {
	const channel = useContext(ChannelContext)!;
	const [repos, setRepos] = useState<{ name: string; path: string }[]>([]);
	const [selectedRepo, setSelectedRepo] = useState<{
		name: string;
		path: string;
	}>();

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
		channel.viewChanges(selectedRepo?.path || "", sortedRefs);
	}

	const subscribeSwitcher = useCallback(() => {
		channel.subscribeSwitcher((batchedCommits: BatchedCommits) =>
			dealBatchedCommits(batchedCommits)
		);
	}, [channel, dealBatchedCommits]);

	const onFilterAuthor = useCallback(() => {
		channel.filterAuthor(
			(batchedCommits: BatchedCommits) =>
				dealBatchedCommits(batchedCommits),
			{
				repo: selectedRepo?.path,
			}
		);
	}, [channel, dealBatchedCommits, selectedRepo?.path]);

	useEffect(() => {
		channel.onReposChange(async (repos) => {
			console.log("webview on repos change", repos);
			setRepos(repos);
		});
	}, [channel]);

	useEffect(() => {
		if (selectedRepo) {
			return;
		}
		channel.getDefaultRepository().then((repo) => {
			repo && setSelectedRepo(repo);
		});
	}, [channel, repos, selectedRepo]);

	useEffect(() => {
		if (!selectedRepo?.path) {
			return;
		}

		channel.getCommits(
			(batchedCommits: BatchedCommits) =>
				dealBatchedCommits(batchedCommits),
			{
				repo: selectedRepo?.path,
			}
		);

		subscribeSwitcher();
	}, [channel, dealBatchedCommits, selectedRepo?.path, subscribeSwitcher]);

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

	if (!selectedRepo) {
		return null;
	}

	return (
		<div className={style.container}>
			<div className={style["commit-headers"]}>
				<div className={(style["header-item"], style.graph)}>Graph</div>
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
}
