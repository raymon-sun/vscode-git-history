import { commands, window, workspace } from "vscode";
import { injectable } from "inversify";
import { ViewController } from "./views/controller";
import { VersionedFileProvider } from "./providers/versioned-file";
import { FileTreeProvider } from "./providers/file-tree";

@injectable()
export class DisposableController {
	constructor(
		private viewController: ViewController,
		private versionedFileProvider: VersionedFileProvider,
		private fileTreeProvider: FileTreeProvider
	) {}

	createDisposables() {
		return [
			commands.registerCommand("git-diff-plus.view", async () => {
				this.viewController.createWebviewPanel();
			}),
			commands.registerCommand("git-diff-plus.quit", () => {
				window.showInformationMessage("Quit");
			}),
			workspace.registerTextDocumentContentProvider(
				VersionedFileProvider.scheme,
				this.versionedFileProvider
			),
			window.registerTreeDataProvider(
				"changedFiles",
				this.fileTreeProvider
			),
		];
	}
}
