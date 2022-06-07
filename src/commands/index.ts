import { getFilterCommandsDisposable } from "./filter";
import { getSwitchCommandsDisposable } from "./switch";

export function getCommandDisposables() {
	return [...getFilterCommandsDisposable(), ...getSwitchCommandsDisposable()];
}
