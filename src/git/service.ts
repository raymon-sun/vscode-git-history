import { injectable } from "inversify";
import simpleGit, { SimpleGit } from "simple-git";

import { workspace } from "vscode";

import { API } from "../typings/git-extension";

import { getBuiltInGitApi, getGitBinPath } from "./api";

import { GitOptions, LogOptions } from "./types";
import { parseGitCommits } from "./commit";
import { parseGitChanges } from "./changes/changes";
import { getUser } from "./utils";

@injectable()
export class GitService {
	private gitExt?: API;
	private git?: SimpleGit;
	private readonly rootRepoPath = workspace.workspaceFolders![0].uri.fsPath;

	constructor() {
		this.initializeGitApi();
	}

	private async initializeGitApi() {
		this.gitExt = (await getBuiltInGitApi())!;

		const gitBinPath = await getGitBinPath();

		this.git = simpleGit(this.rootRepoPath, { binary: gitBinPath });
	}

	getDefaultRepository() {
		const workspacePath = workspace.workspaceFolders![0].uri.fsPath;
		const repos = this.getRepositories();

		return repos.find((fsPath) => fsPath === workspacePath) || repos[0];
	}

	getRepositories() {
		return (
			this.gitExt?.repositories.map(({ rootUri }) => rootUri.fsPath) || []
		);
	}

	getBranches(options: GitOptions) {
		const { repo = this.rootRepoPath } = options;
		return this.git
			?.cwd(repo)
			.raw("branch", "--format=%(refname:short)")
			.then((res) => res.split("\n").filter((branch) => !!branch));
	}

	getAuthors(options: GitOptions) {
		const { repo = this.rootRepoPath } = options;
		return this.git
			?.cwd(repo)
			?.raw("shortlog", "-ens", "HEAD")
			.then((res) => {
				const shortlogs = res.split("\n");
				return shortlogs
					.filter((shortlog) => !!shortlog)
					.map((shortlog) => getUser(shortlog));
			})
			.catch((err) => {
				console.log(err);
			});
	}

	async show(commitHash: string, filePath: string) {
		// TODO: record repo path in file node / replace gitExt
		const repoPath = this.getRepositories()
			.sort((fsPathA, fsPathB) => fsPathB.length - fsPathA.length)
			.find((fsPath) => filePath.startsWith(fsPath));

		return await this.gitExt?.repositories
			.find((repo) => repo.rootUri.fsPath === repoPath)!
			.show(commitHash, filePath);
	}

	async getCommits(options?: LogOptions) {
		const COMMIT_FORMAT = "%H%n%aN%n%aE%n%at%n%ct%n%P%n%B";
		const args = ["log", `--format=${COMMIT_FORMAT}`, "-z"];

		const { repo, author, keyword, ref, maxLength } = options || {};
		if (author) {
			args.push(`--author=${author || ""}`);
		}

		if (keyword) {
			args.push(`--grep=${keyword}`);
		}

		if (ref) {
			args.push(ref);
		}

		if (maxLength) {
			args.push(`-n${maxLength}`);
		}

		return await this.git
			?.cwd(repo || this.rootRepoPath)
			.raw(args)
			.then((res) => parseGitCommits(res))
			.catch((err) => console.log(err));
	}

	async getChangesCollection(repoPath: string, refs: string[]) {
		return await Promise.all(
			refs.map((ref) =>
				this.getChangesByRef(repoPath, ref).then((changes) => ({
					ref,
					changes,
				}))
			)
		);
	}

	async getChangesByRef(repoPath: string, ref: string) {
		const args = [
			"log",
			"-p",
			"-1",
			"--pretty=format:",
			"--name-status",
			"-z",
			ref,
		];

		return await this.git!.cwd(repoPath || this.rootRepoPath)
			.raw(args)
			.then((res) => parseGitChanges(repoPath, res));
	}
}
