import { useCallback, useContext, useEffect, useState } from "react";

import { debounce } from "lodash";

import { Commit } from "../git/commit";

import PickableList from "./components/PickableList";
import Select from "./components/Select";
import style from "./App.module.scss";
import { ChannelContext } from "./data/channel";
import GitGraph from "./components/GitGraph";

export default function App() {
	const channel = useContext(ChannelContext)!;
	const [repos, setRepos] = useState<{ name: string; path: string }[]>([]);
	const [selectedRepo, setSelectedRepo] =
		useState<{ name: string; path: string }>();

	const [users, setUsers] = useState<{ name: string; email: string }[]>([]);
	const [selectedUser, setSelectedUser] = useState<string>("");

	const [branches, setBranches] = useState<string[]>([]);
	const [selectedBranch, setSelectedBranch] = useState<string>("");

	const [commits, setCommits] = useState<Commit[]>([]);

	function diff(sortedRefs: string[]) {
		channel.viewChanges(selectedRepo?.path || "", sortedRefs);
	}

	const requestBranches = useCallback(async () => {
		const branches = await channel.getBranches({
			repo: selectedRepo?.path,
		});
		setBranches(["", ...branches!]);
	}, [channel, selectedRepo?.path]);

	const requestUsers = useCallback(async () => {
		const users = await channel.getAuthors({ repo: selectedRepo?.path });
		setUsers([{ name: "", email: "" }, ...users!]);
	}, [channel, selectedRepo?.path]);

	const handleRepoChange = useCallback(
		async (repo: { name: string; path: string; label: string }) => {
			const { name, path } = repo;
			setSelectedRepo({ name, path });
		},
		[]
	);

	const handleBranchChange = useCallback(
		async (branch: string) => {
			setSelectedBranch(branch);
			const commits = await channel.getCommits({
				repo: selectedRepo?.path,
				ref: branch,
				author: selectedUser,
			});
			setCommits(commits!);
		},
		[channel, selectedRepo?.path, selectedUser]
	);

	const handleUserChange = useCallback(
		async (user: string) => {
			setSelectedUser(user);
			const commits = await channel.getCommits({
				repo: selectedRepo?.path,
				ref: selectedBranch,
				author: user,
			});
			setCommits(commits!);
		},
		[channel, selectedBranch, selectedRepo?.path]
	);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const handleSearch = useCallback(
		debounce(async (keyword: string) => {
			const commits = await channel.getCommits({
				repo: selectedRepo?.path,
				ref: selectedBranch,
				author: selectedUser,
				keyword,
			});
			setCommits(commits!);
		}, 1000),
		[selectedRepo, selectedBranch, selectedUser]
	);

	useEffect(() => {
		channel.onReposChange(async (repos) => {
			setRepos(repos);
		});
		channel.getRepositories().then((repos) => {
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

		requestBranches().then(() => setSelectedBranch(""));
		requestUsers().then(() => setSelectedUser(""));

		channel
			.getCommits({
				repo: selectedRepo?.path,
			})
			.then((commits) => {
				setCommits(commits || []);
			});
	}, [channel, requestBranches, requestUsers, selectedRepo?.path]);

	const getCommitList = () => {
		return commits.map((commit) => ({
			id: commit.hash,
			content: (
				<div className={style.commit}>
					{!selectedUser && (
						<span>
							<GitGraph data={commit.graph} />
						</span>
					)}
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
			<div className={style["operations-bar"]}>
				<div className={style["filter-container"]}>
					<div>Repo:</div>
					<Select
						value={{
							name: selectedRepo.name,
							path: selectedRepo.path,
							label: selectedRepo.name,
						}}
						options={repos.map(({ name, path }) => ({
							name,
							path,
							label: name,
						}))}
						onChange={(value) => {
							handleRepoChange(value!);
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
