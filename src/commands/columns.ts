import { commands, window, type ExtensionContext } from "vscode";

import { container } from "../container/inversify.config";
import { TYPES } from "../container/types";

import { Source } from "../views/history/data/source";

export const TOGGLE_COLUMNS_COMMAND = "git-history.history.toggle.columns";

export function getColumnsCommandsDisposable() {
	const context = container.get<ExtensionContext>(TYPES.ExtensionContext);
	const source = container.get(Source);

	return [
		commands.registerCommand(TOGGLE_COLUMNS_COMMAND, async () => {
			const currentState = context.globalState.get<{
				showHash: boolean;
				showAuthor: boolean;
				showDate: boolean;
			}>("columnVisibility", {
				showHash: true,
				showAuthor: true,
				showDate: true,
			});

			const quickPick = window.createQuickPick<{
				label: string;
				id: string;
				picked: boolean;
			}>();
			quickPick.title = "Select Columns to Display";
			quickPick.placeholder = "Choose which columns to show";
			quickPick.canSelectMany = true;

			const items = [
				{
					label: "Hash",
					id: "showHash",
					picked: currentState.showHash,
				},
				{
					label: "Author",
					id: "showAuthor",
					picked: currentState.showAuthor,
				},
				{
					label: "Date/Time",
					id: "showDate",
					picked: currentState.showDate,
				},
			];

			quickPick.items = items;
			quickPick.selectedItems = items.filter((item) => item.picked);

			return new Promise((resolve) => {
				quickPick.onDidAccept(() => {
					const selected = quickPick.selectedItems;
					const newState = {
						showHash: selected.some((item) => item.id === "showHash"),
						showAuthor: selected.some((item) => item.id === "showAuthor"),
						showDate: selected.some((item) => item.id === "showDate"),
					};
					context.globalState.update("columnVisibility", newState);
					source.fireColumnsChanged();
					resolve(newState);
					quickPick.dispose();
				});

				quickPick.show();
			});
		}),
	];
}
