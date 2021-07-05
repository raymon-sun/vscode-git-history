import { join } from "path";
import { Uri, ViewColumn, Webview, window } from "vscode";
import { REQUEST_HANDLER_MAP } from "../message/request-handlers";
import { IRequestMessage } from "./utils/message";

export class ViewController {
	private webview?: Webview;

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

		this.webview = panel.webview;
		this.webview.html = await this.generateWebviewContent(this.webview);
		this.registerRequestHandlers(this.webview);
	}

	async generateWebviewContent(webview: Webview) {
		const scriptPath = Uri.file(
			join(this.extensionPath, "dist", "view.js")
		);
		const scriptUri = webview.asWebviewUri(scriptPath);
		// const scriptUri = scriptPath.with({ scheme: "vscode-resource" });
		const nonce = this.getNonce();
		// TODO: enhance content policy
		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Git View</title>
			</head>
			<body>
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

	private registerRequestHandlers(webview: Webview) {
		webview.onDidReceiveMessage(async (message: IRequestMessage) => {
			const { id, what, params } = message;
			if (id === undefined) {
				return;
			}

			const handler = REQUEST_HANDLER_MAP[what];
			const result = await handler(params);
			webview.postMessage({ id: message.id, result });
		});
	}
}
