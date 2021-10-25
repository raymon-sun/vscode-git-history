import { Uri } from "vscode";
import { useCallback, useContext, useEffect, useState } from "react";
import { Commit } from "../typings/git-extension";
import PickableList from "./components/PickableList";
import Select from "./components/Select";
import style from "./App.module.scss";
import { ChannelContext } from "./data/channel";
import { debounce } from "lodash";

export default function App() {
	const channel = useContext(ChannelContext)!;
	const [repos, setRepos] = useState<{ repoName: string; rootUri: Uri }[]>(
		[]
	);
	const [users, setUsers] = useState<{ name: string; email: string }[]>([]);
	const [selectedUser, setSelectedUser] = useState<string>("");

	const [branches, setBranches] = useState<string[]>([]);
	const [selectedBranch, setSelectedBranch] = useState<string>("");

	const [commits, setCommits] = useState<Commit[]>([]);

	function diff(sortedRefs: string[]) {
		channel.viewChanges(sortedRefs);
	}

	const handleRepoChange = useCallback(async (path: string) => {
		const commits = await channel.getCommits({ repo: path });
		setSelectedBranch("");
		setSelectedUser("");
		setCommits(commits!);
	}, []);

	const handleBranchChange = useCallback(
		async (branch: string) => {
			setSelectedBranch(branch);
			const commits = await channel.getCommits({
				ref: branch,
				author: selectedUser,
			});
			setCommits(commits!);
		},
		[selectedUser]
	);

	const handleUserChange = useCallback(
		async (user: string) => {
			setSelectedUser(user);
			const commits = await channel.getCommits({
				ref: selectedBranch,
				author: user,
			});
			setCommits(commits!);
		},
		[selectedBranch]
	);

	const handleSearch = useCallback(
		debounce(async (keyword: string) => {
			const commits = await channel.getCommits({ keyword });
			setCommits(commits!);
		}, 1000),
		[]
	);

	useEffect(() => {
		async function requestRepos() {
			const repos = await channel.getRepositories();
			setRepos(repos);
		}

		async function requestUsers() {
			const users = await channel.getAuthors();
			setUsers([{ name: "", email: "" }, ...users!]);
		}

		async function requestBranches() {
			const branches = await channel.getBranches();
			setBranches(["", ...branches!]);
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
								path,
								label: repoName,
							})
						)}
						onChange={(value) => {
							handleRepoChange(value!.path);
						}}
					/>
					<div>Branch:</div>
					<Select
						value={{
							branch: selectedBranch,
							label: selectedBranch || "All Branches",
						}}
						options={branches.map((branch) => ({
							branch,
							label: branch || "All Branches",
						}))}
						onChange={(value) => {
							handleBranchChange(value!.branch);
						}}
					/>
					<div>User:</div>
					<Select
						value={{
							user: selectedUser,
							label: selectedUser || "All Users",
						}}
						options={users.map(({ name }) => ({
							user: name,
							label: name || "All Users",
						}))}
						onChange={(value) => {
							handleUserChange(value!.user);
						}}
					/>
				</div>
				<div>
					<input
						placeholder="Search..."
						onChange={(event) => {
							handleSearch(event.target.value);
						}}
					/>
				</div>
			</div>
			<div className={style["commits-area"]}>
				<PickableList
					list={getCommitList()}
					onPick={(ids) => diff(ids)}
				/>
			</div>
		</div>
	);
}
