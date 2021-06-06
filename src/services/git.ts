import { Extension, extensions } from "vscode";
import { GitExtension } from "../types";

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
