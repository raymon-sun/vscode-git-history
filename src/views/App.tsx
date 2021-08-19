import { useEffect, useState } from "react";
import { getSortedRefs } from "./utils/commit";
import { request } from "./utils/message";
import { Commit } from "../typings/git-extension";
import style from "./App.module.scss";

export default function App() {
	const [commits, setCommits] = useState<Commit[]>([]);
	const [selectedCommits, setSelectedCommits] = useState<{
		[hash: string]: Commit;
	}>({});

	function diff() {
		const sortedRefs = getSortedRefs(selectedCommits);
		request<void>("diff", sortedRefs);
	}

	function selectCommit(commit: Commit) {
		const { hash } = commit;
		if (selectedCommits[hash]) {
			delete selectedCommits[hash];
			setSelectedCommits({ ...selectedCommits });
			return;
		}
		setSelectedCommits({ ...selectedCommits, [hash]: commit });
	}

	useEffect(() => {
		async function requestCommits() {
			const commits = await request<Commit[]>("commits");
			setCommits(commits);
		}
		requestCommits();
	}, []);

	return (
		<div className={style.container}>
			<div className={style["operations-bar"]}>
				<div className={style["filter-container"]}>
					<div>Branch:master</div>
					<div>User:All</div>
					<div>Date:All</div>
					<div onClick={diff}>Diff</div>
				</div>
				<div>
					<input />
				</div>
			</div>
			<div className={style["commits-container"]}>
				{commits.map((commit) => (
					<div
						key={commit.hash}
						className={`${style.commit} ${
							selectedCommits[commit.hash] ? style.selected : ""
						}`}
						onClick={() => selectCommit(commit)}
					>
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
				))}
			</div>
		</div>
	);
}
