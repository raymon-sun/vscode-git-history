import { useEffect, useState } from "react";
import { request } from "./utils/message";
import { Commit } from "../typings/git-extension";
import PickableList from "./components/PickableList";
import style from "./App.module.scss";

export default function App() {
	const [commits, setCommits] = useState<Commit[]>([]);

	function diff(sortedRefs: string[]) {
		request<void>("diff", sortedRefs);
	}

	useEffect(() => {
		async function requestCommits() {
			const commits = await request<Commit[]>("commits");
			setCommits(commits);
		}
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
