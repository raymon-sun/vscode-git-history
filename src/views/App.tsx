import { useEffect, useState } from "react";
import { request } from "./utils/message";
import { Commit } from "../typings/git-extension";
import style from "./App.module.scss";

function App() {
	const [commits, setCommits] = useState<Commit[]>([]);
	const [selectedCommits, setSelectedCommits] = useState<{
		[hash: string]: true;
	}>({});

	function diff() {
		const [ref1, ref2] = Object.keys(selectedCommits);
		request<any>("diff", { ref1, ref2 });
	}

	function selectCommit(hash: string) {
		if (selectedCommits[hash]) {
			delete selectedCommits[hash];
			setSelectedCommits({ ...selectedCommits });
			return;
		}
		setSelectedCommits({ ...selectedCommits, [hash]: true });
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
				{commits.map(({ hash, message, authorName, commitDate }) => (
					<div
						className={`${style.commit} ${
							selectedCommits[hash] ? style.selected : ""
						}`}
						onClick={() => selectCommit(hash)}
					>
						<span className={style.hash}>{hash.slice(0, 6)}</span>
						<span className={style.message}>{message}</span>
						<span className={style["author-name"]}>
							{authorName}
						</span>
						<span className={style["commit-date"]}>
							{commitDate}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

export default App;
