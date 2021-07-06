import { injectable } from "inversify";
import { commands } from "vscode";
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

	async diffBetween(params: { ref1: string; ref2: string }) {
		const { ref1, ref2 } = params;
		const repository = this.gitApi?.repositories[0];
		const result = await repository!.diffBetween(ref1, ref2);

		const [change] = result!;
		const uri1 = change.originalUri.with({
			scheme: "git-view",
			query: ref1,
		});
		const uri2 = change.originalUri.with({
			scheme: "git-view",
			query: ref2,
		});
		await commands.executeCommand("vscode.diff", uri1, uri2);
		return result;
	}
}
