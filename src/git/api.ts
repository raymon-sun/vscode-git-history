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

export async function getGitBinPath() {
	try {
		const extension = extensions.getExtension(
			"vscode.git"
		) as Extension<GitExtension>;
		if (extension !== undefined) {
			const gitExtension = extension.isActive
				? extension.exports
				: await extension.activate();

			return gitExtension.getAPI(1).git.path;
		}
	} catch {}

	return undefined;
}
