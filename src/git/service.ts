import { injectable } from "inversify";
import simpleGit, { SimpleGit } from "simple-git";
import { getBuiltInGitApi, getGitBinPath } from "./api";
import { API } from "../typings/git-extension";
import { GitSource } from "./source";
import { workspace } from "vscode";
import { getUser, parseGitCommits } from "./utils";

@injectable()
export class GitService {
	private gitExt?: API;
	private gitSource?: GitSource;
	private git?: SimpleGit;

	constructor() {
		this.initializeGitApi();
	}

	private async initializeGitApi() {
		this.gitExt = (await getBuiltInGitApi())!;

		const gitBinPath = await getGitBinPath();
		this.gitSource = new GitSource(gitBinPath!);

		const repositoryRoot = workspace.workspaceFolders![0].uri.fsPath;
		this.git = simpleGit(repositoryRoot, { binary: gitBinPath });
	}

	getRepositories() {
		return this.gitExt?.repositories;
	}

	getBranches() {
		return this.git
			?.raw("branch", "-a", "--format=%(refname:short)")
			.then((res) => res.split("\n"));
	}

	getAuthors() {
		return this.git
			?.raw("shortlog", "-ens", "HEAD")
			.then((res) => {
				const shortlogs = res.split("\n");
				return shortlogs.map((shortlog) => getUser(shortlog));
			})
			.catch((err) => {
				console.log(err);
			});
	}

	async show(commitHash: string, filePath: string) {
		return await this.gitExt?.repositories[0].show(commitHash, filePath);
	}

	async getCommits() {
		const COMMIT_FORMAT = "%H%n%aN%n%aE%n%at%n%ct%n%P%n%B";
		const maxEntries = 3000;
		return await this.git
			?.raw([
				"log",
				`-n${maxEntries}`,
				`--format=${COMMIT_FORMAT}`,
				"-z",
				"--",
			])
			.then((res) => parseGitCommits(res));
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
