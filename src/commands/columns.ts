import { commands, window } from "vscode";

import { container } from "../container/inversify.config";

import {
	COLUMN_VISIBILITY_OPTIONS,
	DEFAULT_COLUMN_VISIBILITY,
	IColumnVisibility,
} from "../views/history/data/columnVisibility";
import { Source } from "../views/history/data/source";

export const TOGGLE_COLUMNS_COMMAND = "git-history.history.toggle.columns";

export function getColumnsCommandsDisposable() {
	const source = container.get(Source);

	return [
		commands.registerCommand(TOGGLE_COLUMNS_COMMAND, async () => {
			const currentState = await source.getColumnVisibility();

			const quickPick = window.createQuickPick<{
				label: string;
				id: keyof IColumnVisibility;
				picked: boolean;
			}>();
			quickPick.title = "Select Columns to Display";
			quickPick.placeholder = "Choose which columns to show";
			quickPick.canSelectMany = true;

			const items = COLUMN_VISIBILITY_OPTIONS.map(({ id, label }) => ({
				label,
				id,
				picked: currentState[id],
			}));

			quickPick.items = items;
			quickPick.selectedItems = items.filter(({ picked }) => picked);

			return new Promise((resolve) => {
				quickPick.onDidAccept(async () => {
					const selectedIds = new Set(
						quickPick.selectedItems.map(({ id }) => id)
					);
					const newState = { ...DEFAULT_COLUMN_VISIBILITY };
					COLUMN_VISIBILITY_OPTIONS.forEach(({ id }) => {
						newState[id] = selectedIds.has(id);
					});

					await source.setColumnVisibility(newState);
					resolve(newState);
					quickPick.dispose();
				});

				quickPick.show();
			});
		}),
	];
}
