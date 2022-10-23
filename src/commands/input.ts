import { commands, window } from "vscode";

export const INPUT_HASH_COMMAND = "git-history.history.input.hash";

export function getInputCommandsDisposable() {
	return [
		commands.registerCommand(INPUT_HASH_COMMAND, async () => {
			const inputBox = window.createInputBox();
			inputBox.placeholder = "Input commit hash to locate";

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
