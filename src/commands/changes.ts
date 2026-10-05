import { commands, window } from "vscode";

import { container } from "../container/inversify.config";

import { ChangeTreeDataProvider } from "../views/changes/ChangeTreeDataProvider";

export const CHANGES_VIEW_AS_LIST_COMMAND = "git-history.changes.viewAsList";
export const CHANGES_VIEW_AS_TREE_COMMAND = "git-history.changes.viewAsTree";
export const CHANGES_FILTER_COMMAND = "git-history.changes.filter";

export function getChangesCommandsDisposable() {
	const provider = container.get(ChangeTreeDataProvider);

	return [
		commands.registerCommand(CHANGES_VIEW_AS_LIST_COMMAND, () =>
			provider.setFlatMode(true)
		),
		commands.registerCommand(CHANGES_VIEW_AS_TREE_COMMAND, () =>
			provider.setFlatMode(false)
		),
		commands.registerCommand(CHANGES_FILTER_COMMAND, () => {
			const inputBox = window.createInputBox();
			inputBox.title = "Filter Changes";
			inputBox.placeholder = "Type a path to filter changed files";
			inputBox.value = provider.getFilter();

			// filter as the user types
			inputBox.onDidChangeValue((value) => provider.setFilter(value));

			inputBox.onDidAccept(() => inputBox.hide());
			inputBox.onDidHide(() => inputBox.dispose());

			inputBox.show();
		}),
	];
}
