import { commands, ThemeIcon, window } from "vscode";

import { container } from "../container/inversify.config";
import { GitService } from "../git/service";

import state from "../views/data/state";

export const FILTER_AUTHOR_COMMAND = "git-log.log.filter.author";
export const FILTER_MESSAGE_COMMAND = "git-log.log.filter.message";

export function getFilterCommandsDisposable() {
	const gitService = container.get(GitService);

	return [
		commands.registerCommand(FILTER_AUTHOR_COMMAND, async () => {
			const CLEAR_ALL_SELECTIONS_ID = "clear-all";

			const quickPick = window.createQuickPick();
			quickPick.title = "Select Authors";
			quickPick.placeholder = "Search author by name or email";
			quickPick.canSelectMany = true;
			quickPick.busy = true;
			quickPick.buttons = [
				{
					iconPath: new ThemeIcon(CLEAR_ALL_SELECTIONS_ID),
					tooltip: "Clear all selections",
				},
			];

			// TODO: set config
			quickPick.onDidTriggerButton(({ iconPath }) => {
				if ((iconPath as ThemeIcon).id === CLEAR_ALL_SELECTIONS_ID) {
					quickPick.selectedItems = [];
				}
			});

			quickPick.show();

			const authorItems =
				(await gitService.getAuthors(state.logOptions))?.map(
					({ name, email }) => ({
						label: name,
						description: email,
						picked: state.logOptions.authors?.includes(name),
					})
				) || [];

			return new Promise((resolve) => {
				quickPick.onDidAccept(() => {
					resolve(quickPick.selectedItems.map(({ label }) => label));
					quickPick.dispose();
				});

				quickPick.items = authorItems;
				quickPick.selectedItems = authorItems.filter(({ label }) =>
					state.logOptions.authors?.includes(label)
				);

				quickPick.busy = false;
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
