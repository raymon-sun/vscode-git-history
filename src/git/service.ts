import { injectable } from "inversify";
import { commands } from "vscode";
import { getBuiltInGitApi } from "./api";
import { API, Status } from "../typings/git-extension";

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
		const changes = await repository!.diffBetween(ref1, ref2);

		const [change] = changes!;

		const query1 = {
			isFileExist: change.status !== Status.INDEX_ADDED,
			ref: ref1,
		};

		const query2 = {
			isFileExist: change.status !== Status.DELETED,
			ref: ref2,
		};

		const uri1 = change.originalUri.with({
			scheme: "git-diff-plus",
			query: JSON.stringify(query1),
		});
		const uri2 = (change.renameUri || change.originalUri).with({
			scheme: "git-diff-plus",
			query: JSON.stringify(query2),
		});
		await commands.executeCommand("vscode.diff", uri1, uri2);
		return changes;
	}
}
