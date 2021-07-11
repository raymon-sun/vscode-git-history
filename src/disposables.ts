import { commands, window, workspace } from "vscode";
import { container } from "./container/inversify.config";
import { ViewController } from "./views/controller";
import { VersionedFileProvider } from "./providers/versioned-file";
import { FileTreeProvider } from "./providers/file-tree";

export function createDisposables() {
	return [
		commands.registerCommand("git-view.view", async () => {
			container.get(ViewController).createWebviewPanel();
		}),
		commands.registerCommand("git-view.quit", () => {
			window.showInformationMessage("Quit");
		}),
		workspace.registerTextDocumentContentProvider(
			VersionedFileProvider.scheme,
			container.get(VersionedFileProvider)
		),
		window.registerTreeDataProvider(
			"changedFiles",
			container.get(FileTreeProvider)
		),
	];
}
