import { commands, window } from "vscode";

import { container } from "../container/inversify.config";
import { GitService } from "../git/service";

import state from "../views/data/state";

export const FILTER_AUTHOR_COMMAND = "git-log.log.filter.author";
export const FILTER_MESSAGE_COMMAND = "git-log.log.filter.message";

export function getFilterCommandsDisposable() {
	const gitService = container.get(GitService);

	return [
		commands.registerCommand(FILTER_AUTHOR_COMMAND, async () => {
			const authors =
				(await gitService.getAuthors(state.logOptions))?.map(
					({ name }) => ({
						label: name,
						picked: state.logOptions.authors?.includes(name),
					})
				) || [];

			const quickPick = window.createQuickPick();

			quickPick.title = "Authors Select";
			quickPick.placeholder = "Input author name here";
			quickPick.canSelectMany = true;
			quickPick.items = authors;
			quickPick.selectedItems = authors.filter(({ label }) =>
				state.logOptions.authors?.includes(label)
			);

			return new Promise((resolve) => {
				quickPick.onDidAccept(() => {
					resolve(quickPick.selectedItems.map(({ label }) => label));
					quickPick.dispose();
				});

				quickPick.show();
			});
		}),
		commands.registerCommand(FILTER_MESSAGE_COMMAND, async () => {
			const inputBox = window.createInputBox();
			inputBox.value = state.logOptions.keyword || "";

			return new Promise((resolve) => {
				inputBox.onDidAccept(() => {
					resolve(inputBox.value);
					inputBox.dispose();
				});

				inputBox.show();
			});
		}),
	];
}
