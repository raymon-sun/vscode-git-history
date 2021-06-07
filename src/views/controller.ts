import { join } from "path";
import { Uri, ViewColumn, Webview, window } from "vscode";
import { getCommits } from "../services/git";

export class ViewController {
	constructor(private extensionPath: string, private extensionUri: Uri) {}

	async createWebviewPanel() {
		const panel = window.createWebviewPanel(
			"gitView", // Identifies the type of the webview. Used internally
			"Git View", // Title of the panel displayed to the user
			ViewColumn.One, // Editor column to show the new webview panel in.
			{
				// Enable scripts in the webview
				enableScripts: true,
				localResourceRoots: [Uri.joinPath(this.extensionUri, "dist")],
			} // Webview options. More on these later.
		);

		const { webview } = panel;
		webview.html = await this.getWebviewContent(webview);
	}

	async getWebviewContent(webview: Webview) {
		const commits = (await getCommits()) || [];
		const scriptPath = Uri.file(
			join(this.extensionPath, "dist", "view.js")
		);
		const scriptUri = webview.asWebviewUri(scriptPath);
		// const scriptUri = scriptPath.with({ scheme: "vscode-resource" });
		const nonce = this.getNonce();
		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${
					webview.cspSource
				}; img-src ${
			webview.cspSource
		} https:; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Git View</title>
			</head>
			<body>
				${commits.map(({ message }) => `<p>${message}</p>`).join("")}
				<div id="root"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	private getNonce() {
		let text = "";
		const possible =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(
				Math.floor(Math.random() * possible.length)
			);
		}
		return text;
	}
}
