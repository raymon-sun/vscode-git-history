import { Extension, extensions } from "vscode";
import { GitExtension } from "../typings/git-extension";

export async function getBuiltInGitApi() {
	try {
		const extension = extensions.getExtension(
			"vscode.git"
		) as Extension<GitExtension>;
		if (extension !== undefined) {
			const gitExtension = extension.isActive
				? extension.exports
				: await extension.activate();

			return gitExtension.getAPI(1);
		}
	} catch {}

	return undefined;
}

export async function getCommits() {
	const gitApi = await getBuiltInGitApi();
	return await gitApi?.repositories[0].log();
}

export async function diffBetween(ref1: string, ref2: string) {
	const gitApi = await getBuiltInGitApi();
	return await gitApi?.repositories[0].diffBetween(ref1, ref2);
}
