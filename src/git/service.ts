import { injectable } from "inversify";
import { getBuiltInGitApi, getGitBinPath } from "./api";
import { API } from "../typings/git-extension";
import { GitSource } from "./source";

@injectable()
export class GitService {
	private gitExt?: API;
	private git?: GitSource;

	constructor() {
		this.initializeGitApi();
	}

	private async initializeGitApi() {
		this.gitExt = (await getBuiltInGitApi())!;

		const gitBinPath = await getGitBinPath();
		this.git = new GitSource(gitBinPath!);
	}

	getRepositories() {
		return this.gitExt?.repositories;
	}

	async show(commitHash: string, filePath: string) {
		return await this.gitExt?.repositories[0].show(commitHash, filePath);
	}

	async getCommits() {
		return await this.gitExt?.repositories[0].log();
	}

	async getChangesCollection(refs: string[]) {
		return await Promise.all(
			refs.map((ref) =>
				this.git!.getChangesByRef(ref).then((changes) => ({
					ref,
					changes,
				}))
			)
		);
	}
}
