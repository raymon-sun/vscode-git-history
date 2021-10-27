import { commands, window, workspace } from "vscode";
import { injectable } from "inversify";
import { ViewController } from "./views/controller";
import { VersionedFileProvider } from "./providers/versioned-file";
import { FileTreeProvider } from "./providers/file-tree";
import { GitStatusDecorationProvider } from "./providers/decoration";
import { EXTENSION_SCHEME } from "./constants";

@injectable()
export class DisposableController {
	constructor(
		private viewController: ViewController,
		private versionedFileProvider: VersionedFileProvider,
		private fileTreeProvider: FileTreeProvider,
		private gitStatusDecorationProvider: GitStatusDecorationProvider
	) {}

	createDisposables() {
		return [
			commands.registerCommand("git-cruise.view", async () => {
				this.viewController.createWebviewPanel();
			}),
			commands.registerCommand("git-cruise.quit", () => {
				window.showInformationMessage("Quit");
			}),
			workspace.registerTextDocumentContentProvider(
				EXTENSION_SCHEME,
				this.versionedFileProvider
			),
			window.registerTreeDataProvider(
				"changedFiles",
				this.fileTreeProvider
			),
			window.registerFileDecorationProvider(
				this.gitStatusDecorationProvider
			),
		];
	}
}
