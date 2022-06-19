import { commands, window } from "vscode";

import { container } from "../container/inversify.config";
import { GitService } from "../git/service";

import state from "../views/data/state";

export const FILTER_AUTHOR_COMMAND = "git-log.log.filter.author";

export function getFilterCommandsDisposable() {
	const gitService = container.get(GitService);

	return [
		commands.registerCommand(FILTER_AUTHOR_COMMAND, async () => {
			const selectedItems = await window.showQuickPick(
				(
					await gitService.getAuthors(state.logOptions)
				)?.map(({ name }) => ({
					label: name,
					picked: state.logOptions.authors?.includes(name),
				})) || [],
				{
					title: "Authors Select",
					placeHolder: "Input author name here",
					canPickMany: true,
				}
			);

			return selectedItems?.map(({ label }) => label);
		}),
	];
}
