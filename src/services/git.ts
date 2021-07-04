import { Extension, extensions, commands } from "vscode";
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

export async function show(commitHash: string, filePath: string) {
	const gitApi = await getBuiltInGitApi();
	return await gitApi?.repositories[0].show(commitHash, filePath);
}

export async function diffBetween(params: { ref1: string; ref2: string }) {
	const { ref1, ref2 } = params;
	const gitApi = await getBuiltInGitApi();
	const repository = gitApi?.repositories[0];
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
