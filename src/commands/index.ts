import { getFilterCommandsDisposable } from "./filter";
import { getInputCommandsDisposable } from "./input";
import { getSwitchCommandsDisposable } from "./switch";

export function getCommandDisposables() {
	return [
		...getFilterCommandsDisposable(),
		...getSwitchCommandsDisposable(),
		...getInputCommandsDisposable(),
	];
}
