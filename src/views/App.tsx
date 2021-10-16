import { Uri } from "vscode";
import { useContext, useEffect, useState } from "react";
import Select from "react-select";
import { Commit } from "../typings/git-extension";
import PickableList from "./components/PickableList";
import style from "./App.module.scss";
import { ChannelContext } from "./data/channel";

export default function App() {
	const channel = useContext(ChannelContext)!;
	const [repos, setRepos] = useState<{ repoName: string; rootUri: Uri }[]>(
		[]
	);
	const [users, setUsers] = useState<{ name: string; email: string }[]>([]);
	const [branches, setBranches] = useState<string[]>([]);
	const [commits, setCommits] = useState<Commit[]>([]);

	function diff(sortedRefs: string[]) {
		channel.viewChanges(sortedRefs);
	}

	useEffect(() => {
		async function requestRepos() {
			const repos = await channel.getRepositories();
			setRepos(repos);
		}

		async function requestUsers() {
			const users = await channel.getAuthors();
			setUsers(users!);
		}

		async function requestBranches() {
			const branches = await channel.getBranches();
			setBranches(branches!);
		}

		async function requestCommits() {
			const commits = await channel.getCommits();
			setCommits(commits || []);
		}

		requestRepos();
		requestUsers();
		requestBranches();
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
					<div>Repo:</div>
					<Select
						options={repos.map(
							({ repoName, rootUri: { path } }) => ({
								value: path,
								label: repoName,
							})
						)}
					/>
					<div>Branch:</div>
					<Select
						options={branches.map((branch) => ({
							value: branch,
							label: branch,
						}))}
					/>
					<div>User:</div>
					<Select
						options={users.map(({ name, email }) => ({
							value: email,
							label: name,
						}))}
					/>
				</div>
				<div>
					<input />
				</div>
			</div>
			<PickableList list={getCommitList()} onPick={(ids) => diff(ids)} />
		</div>
	);
}
