import { Extension, extensions } from "vscode";

import { GitExtension } from "../typings/scmExtension";

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
	} catch (err) {
		console.error(err);
	}

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
	} catch (err) {
		console.error(err);
	}

	return undefined;
}
