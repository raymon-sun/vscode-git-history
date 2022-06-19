import { window, workspace } from "vscode";
import { injectable } from "inversify";

import { VersionedFileProvider } from "./providers/versioned-file";
import { FileTreeProvider } from "./providers/file-tree";
import { GitStatusDecorationProvider } from "./providers/decoration";
import { EXTENSION_SCHEME } from "./constants";
import { WebviewProvider } from "./providers/view";
import { getCommandDisposables } from "./commands";

@injectable()
export class DisposableController {
	constructor(
		private webviewProvider: WebviewProvider,
		private versionedFileProvider: VersionedFileProvider,
		private fileTreeProvider: FileTreeProvider,
		private gitStatusDecorationProvider: GitStatusDecorationProvider
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
				this.fileTreeProvider
			),
			window.registerFileDecorationProvider(
				this.gitStatusDecorationProvider
			),
		];
	}
}
