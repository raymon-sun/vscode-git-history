import path from "path";

import { commands, env, Uri, window, workspace } from "vscode";

import { container } from "../container/inversify.config";
import { getChangePair } from "../git/changes/changes";
import { FileNode, FolderNode, PathType } from "../git/changes/tree";
import { getDiffUriPair } from "../git/utils";
import { GitService } from "../git/service";
import { Path } from "../views/changes/ChangeTreeDataProvider";

export const OPEN_CHANGES_COMMAND = "git-history.changes.openChanges";
export const OPEN_FILE_COMMAND = "git-history.changes.openFile";
export const COPY_PATH_COMMAND = "git-history.changes.copyPath";
export const COPY_RELATIVE_PATH_COMMAND =
	"git-history.changes.copyRelativePath";
export const REVEAL_IN_OS_COMMAND = "git-history.changes.revealInOS";
export const OPEN_IN_TERMINAL_COMMAND = "git-history.changes.openInTerminal";

type ChangesNode = FolderNode | FileNode;

/** a command can be invoked for one item or for a multi-selection */
type ItemArgument = Path | Path[] | undefined;

function getNodes(item: ItemArgument): ChangesNode[] {
	const items = Array.isArray(item) ? item : [item];

	return items
		.map((treeItem) => treeItem?.props)
		.filter((node): node is ChangesNode => !!node);
}

function getFsPath(node: ChangesNode) {
	return node.type === PathType.FILE ? node.uri.fsPath : node.path;
}

function getContainingDir(node: ChangesNode) {
	return node.type === PathType.FILE
		? path.dirname(node.uri.fsPath)
		: node.path;
}

function toRelativePath(fsPath: string) {
	const root = workspace.workspaceFolders?.[0]?.uri.fsPath;
	return root && fsPath.startsWith(root)
		? path.relative(root, fsPath)
		: fsPath;
}

export function getChangesFileCommandsDisposable() {
	const gitService = container.get(GitService);

	return [
		commands.registerCommand(
			OPEN_CHANGES_COMMAND,
			(item?: ItemArgument) => {
				const [node] = getNodes(item);
				if (!node || node.type !== PathType.FILE) {
					return;
				}

				const diffUris = getDiffUriPair(node);
				if (diffUris.length === 1) {
					return commands.executeCommand("vscode.open", diffUris[0]);
				}

				return commands.executeCommand("vscode.diff", ...diffUris);
			}
		),
		commands.registerCommand(OPEN_FILE_COMMAND, (item?: ItemArgument) => {
			const [node] = getNodes(item);
			if (!node || node.type !== PathType.FILE) {
				return;
			}

			// the version of the file at the selected (newest) revision
			const [, lastChangeItem] = getChangePair(
				node.originalChangeStack,
				node.changeStack
			);
			const gitUri = gitService.toGitUri(node.uri, lastChangeItem.ref);
			if (!gitUri) {
				window.showWarningMessage(
					"Cannot open the file: the Git extension is unavailable."
				);
				return;
			}

			return commands.executeCommand("vscode.open", gitUri);
		}),
		commands.registerCommand(COPY_PATH_COMMAND, (item?: ItemArgument) => {
			const nodes = getNodes(item);
			if (!nodes.length) {
				return;
			}

			return env.clipboard.writeText(
				nodes.map((node) => getFsPath(node)).join("\n")
			);
		}),
		commands.registerCommand(
			COPY_RELATIVE_PATH_COMMAND,
			(item?: ItemArgument) => {
				const nodes = getNodes(item);
				if (!nodes.length) {
					return;
				}

				return env.clipboard.writeText(
					nodes
						.map((node) => toRelativePath(getFsPath(node)))
						.join("\n")
				);
			}
		),
		commands.registerCommand(
			REVEAL_IN_OS_COMMAND,
			async (item?: ItemArgument) => {
				const [node] = getNodes(item);
				if (!node) {
					return;
				}

				const dir = getContainingDir(node);
				try {
					await env.openExternal(Uri.file(dir));
				} catch {
					window.showWarningMessage(`Cannot open folder: ${dir}`);
				}
			}
		),
		commands.registerCommand(
			OPEN_IN_TERMINAL_COMMAND,
			(item?: ItemArgument) => {
				const [node] = getNodes(item);
				if (!node) {
					return;
				}

				window.createTerminal({ cwd: getContainingDir(node) }).show();
			}
		),
	];
}
