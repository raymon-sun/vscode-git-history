import { injectable } from "inversify";
import { getBuiltInGitApi } from "./api";
import { API } from "../typings/git-extension";

@injectable()
export class GitService {
	private gitApi?: API;

	constructor() {
		this.initializeGitApi();
	}

	private async initializeGitApi() {
		this.gitApi = (await getBuiltInGitApi())!;
	}

	async show(commitHash: string, filePath: string) {
		return await this.gitApi?.repositories[0].show(commitHash, filePath);
	}

	async getCommits() {
		return await this.gitApi?.repositories[0].log();
	}

	async diffBetween(refs: string[]) {
		const [ref1, ref2] = refs;
		const repository = this.gitApi?.repositories[0];
		return await repository!.diffBetween(ref1, ref2);
	}

	async getChanges(refs: string[]) {
		const repository = this.gitApi?.repositories[0];
		const changesCollection = await Promise.all(
			refs.map((ref) =>
				repository!
					.diffBetween(`${ref}~`, ref)
					.then((changes) => ({ ref, changes }))
			)
		);
	}
}
