import { injectable } from "inversify";
import simpleGit, { SimpleGit } from "simple-git";
import { getBuiltInGitApi, getGitBinPath } from "./api";
import { API } from "../typings/git-extension";
import { GitSource } from "./source";
import { workspace } from "vscode";
import { getUser, parseGitCommits } from "./utils";
import { LogOptions } from "./types";

@injectable()
export class GitService {
	private gitExt?: API;
	private gitSource?: GitSource;
	private git?: SimpleGit;
	private readonly rootRepoPath = workspace.workspaceFolders![0].uri.fsPath;

	constructor() {
		this.initializeGitApi();
	}

	private async initializeGitApi() {
		this.gitExt = (await getBuiltInGitApi())!;

		const gitBinPath = await getGitBinPath();
		this.gitSource = new GitSource(gitBinPath!);

		this.git = simpleGit(this.rootRepoPath, { binary: gitBinPath });
	}

	getRepositories() {
		return this.gitExt?.repositories;
	}

	getBranches() {
		return this.git
			?.raw("branch", "-a", "--format=%(refname:short)")
			.then((res) => res.split("\n").filter((branch) => !!branch));
	}

	getAuthors() {
		return this.git
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
		return await this.gitExt?.repositories[0].show(commitHash, filePath);
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

	async getChangesCollection(refs: string[]) {
		return await Promise.all(
			refs.map((ref) =>
				this.gitSource!.getChangesByRef(ref).then((changes) => ({
					ref,
					changes,
				}))
			)
		);
	}
}
