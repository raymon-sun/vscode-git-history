import { getChangesCommandsDisposable } from "./changes";
import { getCommitCommandsDisposable } from "./commit";
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
		...getCommitCommandsDisposable(),
	];
}
