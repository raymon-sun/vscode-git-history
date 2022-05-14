import { window, workspace } from "vscode";
import { injectable } from "inversify";

import { VersionedFileProvider } from "./providers/versioned-file";
import { FileTreeProvider } from "./providers/file-tree";
import { GitStatusDecorationProvider } from "./providers/decoration";
import { EXTENSION_SCHEME } from "./constants";
import { WebviewProvider } from "./providers/view";

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
				"git-cruise.files",
				this.fileTreeProvider
			),
			window.registerFileDecorationProvider(
				this.gitStatusDecorationProvider
			),
		];
	}
}
