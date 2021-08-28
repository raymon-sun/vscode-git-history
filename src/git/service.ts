import { injectable } from "inversify";
import { getBuiltInGitApi, getGitBinPath } from "./api";
import { API } from "../typings/git-extension";
import { GitSource } from "./source";

@injectable()
export class GitService {
	private gitApi?: API;
	private git?: GitSource;

	constructor() {
		this.initializeGitApi();
	}

	private async initializeGitApi() {
		this.gitApi = (await getBuiltInGitApi())!;

		const gitBinPath = await getGitBinPath();
		this.git = new GitSource(gitBinPath!);
	}

	async show(commitHash: string, filePath: string) {
		return await this.gitApi?.repositories[0].show(commitHash, filePath);
	}

	async getCommits() {
		return await this.gitApi?.repositories[0].log();
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
