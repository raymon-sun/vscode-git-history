import { inject, injectable } from "inversify";
import { join } from "path";
import {
	ExtensionContext,
	Uri,
	ViewColumn,
	Webview,
	window,
	workspace,
} from "vscode";
import { TYPES } from "../container/types";
import { GitService } from "../git/service";
import { createChangeFileTree } from "../git/utils";
import { Change } from "../typings/git-extension";
import { IRequestMessage } from "./utils/message";

@injectable()
export class ViewController {
	private webview?: Webview;
	private readonly REQUEST_HANDLER_MAP: {
		[request: string]: (params?: any) => Promise<any>;
	} = {
		commits: () => this.git.getCommits(),
		diff: async (args: any) => {
			const changes = await this.git.diffBetween(args);
			this.updateTreeView(changes);
		},
	};

	constructor(
		@inject(TYPES.ExtensionContext) private context: ExtensionContext,
		private git: GitService
	) {}

	async createWebviewPanel() {
		const { extensionUri } = this.context;
		const panel = window.createWebviewPanel(
			"gitView", // Identifies the type of the webview. Used internally
			"Git View", // Title of the panel displayed to the user
			ViewColumn.One, // Editor column to show the new webview panel in.
			{
				// Enable scripts in the webview
				enableScripts: true,
				localResourceRoots: [Uri.joinPath(extensionUri, "dist")],
			} // Webview options. More on these later.
		);

		this.webview = panel.webview;
		this.webview.html = await this.generateWebviewContent(this.webview);
		this.registerRequestHandlers(this.webview);
	}

	async generateWebviewContent(webview: Webview) {
		const { extensionPath } = this.context;
		const scriptPath = Uri.file(join(extensionPath, "dist", "view.js"));
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

			const handler = this.REQUEST_HANDLER_MAP[what];
			const result = await handler(params);
			webview.postMessage({ id: message.id, result });
		});
	}

	private updateTreeView(changes: Change[]) {
		const fileTree = createChangeFileTree(
			changes,
			workspace.workspaceFolders![0].uri.path
		);
		this.context.globalState.update("changedFileTree", fileTree);
	}
}
