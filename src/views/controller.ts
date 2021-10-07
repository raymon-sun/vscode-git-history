import { inject, injectable } from "inversify";
import { join, parse } from "path";
import {
	commands,
	ExtensionContext,
	Uri,
	ViewColumn,
	Webview,
	window,
	workspace,
} from "vscode";
import { TYPES } from "../container/types";
import { GitService } from "../git/service";
import { PathCollection, resolveChangesCollection } from "../git/utils";
import { FileTreeProvider } from "../providers/file-tree";
import { IRequestMessage } from "./utils/message";
import { Source } from "./data/source";

@injectable()
export class ViewController {
	private webview?: Webview;
	private readonly REQUEST_HANDLER_MAP: {
		[request: string]: (params?: any) => Promise<any> | any;
	} = {
		initialize: () =>
			Object.entries(this.source).map(([name, func]) => {
				// TODO: exclude private key
				this.REQUEST_HANDLER_MAP[name] = func;
				return name;
			}),
		repositories: () =>
			this.git.getRepositories()?.map(({ rootUri }) => ({
				repoName: parse(rootUri.path).base,
				rootUri,
			})),
		commits: () => this.git.getCommits(),
		diff: async (refs: string[]) => {
			const changesCollection = await this.git.getChangesCollection(refs);
			const newFileTree = resolveChangesCollection(
				changesCollection,
				workspace.workspaceFolders![0].uri.path
			);
			this.updateTreeView(newFileTree);
		},
	};

	constructor(
		@inject(TYPES.ExtensionContext) private context: ExtensionContext,
		private git: GitService,
		private source: Source,
		private fileTreeProvider: FileTreeProvider
	) {}

	async createWebviewPanel() {
		const { extensionUri } = this.context;
		commands.executeCommand("workbench.action.editorLayoutTwoRows");
		const panel = window.createWebviewPanel(
			"gitDiffPlus", // Identifies the type of the webview. Used internally
			"Git Diff Picker", // Title of the panel displayed to the user
			ViewColumn.Beside, // Editor column to show the new webview panel in.
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
				<title>Git Diff Picker</title>
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

			const response = this.REQUEST_HANDLER_MAP[what](params);
			const result =
				response instanceof Promise ? await response : response;
			webview.postMessage({ id: message.id, result });
		});
	}

	private updateTreeView(fileTree: PathCollection) {
		this.context.globalState.update("changedFileTree", fileTree);
		this.fileTreeProvider.refresh();
	}
}
