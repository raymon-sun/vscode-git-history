import { commands, Uri, window } from "vscode";

import { container } from "../container/inversify.config";
import { PathType } from "../git/changes/tree";
import { resolveGitDocument } from "../git/gitDocument";
import { toRepoRelativePath } from "../git/repoPath";
import { GitService } from "../git/service";
import type { Path } from "../views/changes/ChangeTreeDataProvider";
import { Source } from "../views/history/data/source";

export const SHOW_FILE_HISTORY_COMMAND = "git-history.showFileHistory";
export const CLEAR_FILE_FILTER_COMMAND = "git-history.history.clearFileFilter";

/** a command can be invoked with a uri, a tree item, several of them, or none */
type ResourceArgument = Uri | Path | (Uri | Path)[] | undefined;

interface IResolvedResource {
	fsPath: string;
	/** set when the item already knows its repository */
	repoPath?: string;
}

function resolveResource(
	argument: ResourceArgument
): IResolvedResource | undefined {
	// menus that pass no resource (e.g. the editor body) fall back to the editor
	const item = Array.isArray(argument)
		? argument[0]
		: argument || window.activeTextEditor?.document.uri;
	if (!item) {
		return undefined;
	}

	const props = (item as Path)?.props;
	if (props) {
		return {
			fsPath:
				props.type === PathType.FILE ? props.uri.fsPath : props.path,
			repoPath: props.type === PathType.FILE ? props.repoPath : undefined,
		};
	}

	if (item instanceof Uri) {
		// a `git:` document (e.g. a diff side from the Changes view) only carries
		// the real path in its query
		return resolveGitDocument(item);
	}

	return undefined;
}

export function getFileHistoryCommandsDisposable() {
	const gitService = container.get(GitService);
	const source = container.get(Source);

	return [
		commands.registerCommand(
			SHOW_FILE_HISTORY_COMMAND,
			async (argument?: ResourceArgument) => {
				const resource = resolveResource(argument);
				if (!resource) {
					window.showWarningMessage(
						"Cannot show the file history: no file is selected."
					);
					return;
				}

				const repoPath =
					resource.repoPath ||
					gitService.getRepoForPath(resource.fsPath);
				if (!repoPath) {
					window.showWarningMessage(
						"Cannot show the file history: the file is not inside a Git repository."
					);
					return;
				}

				await source.showFileHistory(
					repoPath,
					toRepoRelativePath(repoPath, resource.fsPath)
				);
			}
		),
		commands.registerCommand(CLEAR_FILE_FILTER_COMMAND, () =>
			source.clearFileFilter()
		),
	];
}
