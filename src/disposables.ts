import { commands, window, workspace } from "vscode";
import { container } from "./container/inversify.config";
import type { ViewController } from "./views/controller";
import { VersionedFileProvider } from "./providers/versioned-file";
import { FileTreeProvider } from "./providers/file-tree";

export function createDisposables(viewController: ViewController) {
	return [
		commands.registerCommand("git-view.view", async () => {
			viewController.createWebviewPanel();
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
			new FileTreeProvider(workspace.workspaceFolders![0].uri.path)
		),
	];
}
