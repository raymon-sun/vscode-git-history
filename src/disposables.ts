import { window, workspace } from "vscode";
import { injectable } from "inversify";

import { RevisionTextDocumentContentProvider } from "./providers/revisionTextDocumentContentProvider";
import { ChangeTreeDataProvider } from "./providers/changeTreeDataProvider";
import { GitStatusFileDecorationProvider } from "./providers/gitStatusFileDecorationProvider";
import { EXTENSION_SCHEME } from "./constants";
import { LogWebviewViewProvider } from "./providers/logWebviewViewProvider";
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
				"git-log.files",
				this.ChangeTreeDataProvider
			),
			window.registerFileDecorationProvider(
				this.GitStatusFileDecorationProvider
			),
		];
	}
}
