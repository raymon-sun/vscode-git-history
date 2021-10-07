import { Uri } from "vscode";
import { useContext, useEffect, useState } from "react";
import Select from "react-select";
import { request } from "./utils/message";
import { Commit } from "../typings/git-extension";
import PickableList from "./components/PickableList";
import style from "./App.module.scss";
import { ChannelContext } from "./data/channel";

export default function App() {
	const channel = useContext(ChannelContext)!;
	const [repos, setRepos] = useState<{ repoName: string; rootUri: Uri }[]>(
		[]
	);
	const [commits, setCommits] = useState<Commit[]>([]);

	function diff(sortedRefs: string[]) {
		channel.viewChanges(sortedRefs);
	}

	useEffect(() => {
		async function requestRepos() {
			const repos = await request<{ repoName: string; rootUri: Uri }[]>(
				"repositories"
			);
			setRepos(repos);
		}

		async function requestCommits() {
			const commits = await channel.getCommits();
			setCommits(commits || []);
		}

		requestRepos();
		requestCommits();
	}, []);

	const getCommitList = () => {
		return commits.map((commit) => ({
			id: commit.hash,
			content: (
				<div className={style.commit}>
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
			<div className={style["operations-bar"]}>
				<div className={style["filter-container"]}>
					<Select
						options={repos.map(
							({ repoName, rootUri: { path } }) => ({
								value: path,
								label: repoName,
							})
						)}
					/>
					<div>Branch:master</div>
					<div>User:All</div>
					<div>Date:All</div>
				</div>
				<div>
					<input />
				</div>
			</div>
			<PickableList list={getCommitList()} onPick={(ids) => diff(ids)} />
		</div>
	);
}
