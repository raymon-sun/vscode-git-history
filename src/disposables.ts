import { commands, window } from "vscode";
import type { ViewController } from "./views/controller";

export function createDisposables(viewController: ViewController) {
	return [
		commands.registerCommand("git-view.view", async () => {
			viewController.createWebviewPanel();
		}),
		commands.registerCommand("git-view.quit", () => {
			window.showInformationMessage("Quit");
		}),
	];
}
