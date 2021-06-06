import { join } from "path";
import { Uri, ViewColumn, window } from "vscode";
import { getCommits } from "../services/git";

export class ViewController {
	constructor(private extensionPath: string) {}

	async createWebviewPanel() {
		const panel = window.createWebviewPanel(
			"gitView", // Identifies the type of the webview. Used internally
			"Git View", // Title of the panel displayed to the user
			ViewColumn.One, // Editor column to show the new webview panel in.
			{} // Webview options. More on these later.
		);

		panel.webview.html = await this.getWebviewContent();
	}

	async getWebviewContent() {
		const commits = (await getCommits()) || [];
		const scriptPath = Uri.file(
			join(this.extensionPath, "dist", "main.js")
		);
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
}
