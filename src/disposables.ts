import { window, workspace } from "vscode";
import { injectable } from "inversify";

import { RevisionTextDocumentContentProvider } from "./providers/revisionTextDocumentContent";
import { ChangeTreeDataProvider } from "./providers/changeTreeData";
import { GitStatusFileDecorationProvider } from "./providers/gitStatusFileDecoration";
import { EXTENSION_SCHEME } from "./constants";
import { LogWebviewViewProvider } from "./providers/logWebviewView";
import { getCommandDisposables } from "./commands";

@injectable()
export class DisposableController {
	constructor(
		private webviewProvider: LogWebviewViewProvider,
		private versionedFileProvider: RevisionTextDocumentContentProvider,
		private ChangeTreeDataProvider: ChangeTreeDataProvider,
		private GitStatusFileDecorationProvider: GitStatusFileDecorationProvider
	) {}

	createDisposables() {
		return [
			...getCommandDisposables(),
			window.registerWebviewViewProvider(
				`${EXTENSION_SCHEME}.log`,
				this.webviewProvider,
				{ webviewOptions: { retainContextWhenHidden: true } }
			),
			workspace.registerTextDocumentContentProvider(
				EXTENSION_SCHEME,
				this.versionedFileProvider
			),
			window.registerTreeDataProvider(
				`${EXTENSION_SCHEME}.changes`,
				this.ChangeTreeDataProvider
			),
			window.registerFileDecorationProvider(
				this.GitStatusFileDecorationProvider
			),
		];
	}
}
