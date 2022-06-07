import { commands, window } from "vscode";

import { container } from "../container/inversify.config";
import { GitService } from "../git/service";

export const FILTER_AUTHOR_COMMAND = "git-cruise.log.filter.author";

export function getFilterCommandsDisposable() {
	const gitService = container.get(GitService);

	return [
		commands.registerCommand(FILTER_AUTHOR_COMMAND, async () => {
			return window.showQuickPick(
				(await gitService.getAuthors({}))?.map(({ name }) => name) ||
					[],
				{
					placeHolder: "Input author name here",
					canPickMany: true,
					onDidSelectItem: (item) =>
						window.showInformationMessage(`Focus ${item}`),
				}
			);
		}),
	];
}
