import { commands, ThemeIcon, window } from "vscode";

import { container } from "../container/inversify.config";
import { GitService } from "../git/service";

import state from "../views/history/data/state";

export const FILTER_AUTHOR_COMMAND = "git-history.history.filter.author";
export const FILTER_MESSAGE_COMMAND = "git-history.history.filter.message";

export function getFilterCommandsDisposable() {
	const gitService = container.get(GitService);

	return [
		commands.registerCommand(FILTER_AUTHOR_COMMAND, async () => {
			const CLEAR_ALL_SELECTIONS_ID = "clear-all";

			const quickPick = window.createQuickPick<{
				label: string;
				value: string;
			}>();
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
					({ name, email, isSelf }) => ({
						label: name + (isSelf ? " (You)" : ""),
						description: email,
						value: `${name} <${email}>`,
						picked: state.logOptions.authors?.includes(name),
					})
				) || [];

			return new Promise((resolve) => {
				quickPick.onDidAccept(() => {
					resolve(quickPick.selectedItems.map(({ value }) => value));
					quickPick.dispose();
				});

				quickPick.items = authorItems;
				quickPick.selectedItems = authorItems.filter(({ value }) =>
					state.logOptions.authors?.includes(value)
				);

				quickPick.busy = false;
			});
		}),
		commands.registerCommand(FILTER_MESSAGE_COMMAND, async () => {
			const inputBox = window.createInputBox();
			inputBox.placeholder = "Input message keywords to filter commits";
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
