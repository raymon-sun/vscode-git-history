import { commands, window, ViewColumn } from "vscode";
import { getBuiltInGitApi } from "./services";
import { Commit } from "./types";

export const disposables = [
	commands.registerCommand("git-view.view", async () => {
		const panel = window.createWebviewPanel(
			"gitView", // Identifies the type of the webview. Used internally
			"Git View", // Title of the panel displayed to the user
			ViewColumn.One, // Editor column to show the new webview panel in.
			{} // Webview options. More on these later.
		);

		const gitApi = await getBuiltInGitApi();
		const commits = await gitApi?.repositories[0].log();
		panel.webview.html = getWebviewContent(commits);
	}),
	commands.registerCommand("git-view.quit", () => {
		window.showInformationMessage("Quit");
	}),
];

function getWebviewContent(commits: Commit[] = []) {
	return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Git View</title>
			</head>
			<body>
				${commits.map(({ message }) => `<p>${message}</p>`).join("")}
			</body>
			</html>`;
}
