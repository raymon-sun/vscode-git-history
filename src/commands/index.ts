import { getChangesCommandsDisposable } from "./changes";
import { getChangesFileCommandsDisposable } from "./changesFile";
import { getCommitCommandsDisposable } from "./commit";
import { getFileHistoryCommandsDisposable } from "./fileHistory";
import { getSelectionHistoryCommandsDisposable } from "./selectionHistory";
import { getFilterCommandsDisposable } from "./filter";
import { getInputCommandsDisposable } from "./input";
import { getSwitchCommandsDisposable } from "./switch";
import { getColumnsCommandsDisposable } from "./columns";

export function getCommandDisposables() {
	return [
		...getFilterCommandsDisposable(),
		...getSwitchCommandsDisposable(),
		...getInputCommandsDisposable(),
		...getColumnsCommandsDisposable(),
		...getChangesCommandsDisposable(),
		...getChangesFileCommandsDisposable(),
		...getCommitCommandsDisposable(),
		...getFileHistoryCommandsDisposable(),
		...getSelectionHistoryCommandsDisposable(),
	];
}
