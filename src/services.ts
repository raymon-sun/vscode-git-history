import { Extension, extensions } from "vscode";
import { GitExtension, API as BuiltInGitApi } from "./types";

export async function getBuiltInGitApi(): Promise<BuiltInGitApi | undefined> {
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
