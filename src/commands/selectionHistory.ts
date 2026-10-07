import { commands, QuickPickItem, window } from "vscode";

import { container } from "../container/inversify.config";
import { CHANGES_VIEW_ID } from "../constants";
import { resolveGitDocument } from "../git/gitDocument";
import { getSelectedLineRange } from "../git/lineHistory";
import { toRepoRelativePath } from "../git/repoPath";
import { GitService } from "../git/service";
import { ChangeTreeDataProvider } from "../views/changes/ChangeTreeDataProvider";
import { Source } from "../views/history/data/source";

export const SELECTION_HISTORY_COMMAND = "git-history.selectionHistory";

const SHORT_HASH_LENGTH = 7;

const shortenHash = (hash: string) => hash.slice(0, SHORT_HASH_LENGTH);

type SelectionHistoryItem = QuickPickItem & { hash: string };

export function getSelectionHistoryCommandsDisposable() {
	const gitService = container.get(GitService);
	const source = container.get(Source);
	const changesProvider = container.get(ChangeTreeDataProvider);

	return [
		commands.registerCommand(SELECTION_HISTORY_COMMAND, async () => {
			const editor = window.activeTextEditor;
			if (!editor || editor.selection.isEmpty) {
				window.showInformationMessage(
					"Select one or more lines to see their history."
				);
				return;
			}

			// a diff side opened from the Changes view is a `git:` document
			// pinned to a revision, so both its path and its line numbers refer
			// to that revision rather than to the working tree
			const { fsPath, ref } = resolveGitDocument(editor.document.uri);
			const repoPath = gitService.getRepoForPath(fsPath);
			if (!repoPath) {
				window.showWarningMessage(
					"Cannot show the selection history: the file is not inside a Git repository."
				);
				return;
			}

			const filePath = toRepoRelativePath(repoPath, fsPath);
			const { startLine, endLine } = getSelectedLineRange(
				editor.selection
			);

			// the history is traced against the committed file, so a pending edit
			// can make the line numbers refer to different lines than selected;
			// a document pinned to a revision is immune to that
			if (
				!ref &&
				(editor.document.isDirty ||
					(await gitService
						.hasUncommittedChanges(repoPath, filePath)
						.catch(() => false)))
			) {
				window.showWarningMessage(
					`Selection History: '${filePath}' has uncommitted changes, so the lines are traced against the committed file.`
				);
			}

			let commits;
			try {
				commits = await gitService.getLineHistory(
					repoPath,
					filePath,
					startLine,
					endLine,
					ref
				);
			} catch (error) {
				// git reports e.g. a range that does not exist at that revision
				const message =
					error instanceof Error ? error.message : String(error);
				window.showErrorMessage(`Selection History: ${message.trim()}`);
				return;
			}

			if (!commits.length) {
				window.showInformationMessage(
					`No commit changed ${filePath}:${startLine}-${endLine}.`
				);
				return;
			}

			const range = `${filePath}:${startLine}-${endLine}`;
			const picked = await window.showQuickPick<SelectionHistoryItem>(
				commits.map(({ hash, author, timestamp, subject }) => ({
					label: `$(git-commit) ${shortenHash(hash)} ${subject}`,
					description: `${author} · ${new Date(
						timestamp * 1000
					).toLocaleDateString()}`,
					hash,
				})),
				{
					title: `Selection History · ${range}`,
					placeHolder:
						"Select a commit to see the changes it made to this file",
				}
			);

			if (!picked) {
				return;
			}

			// focus the Changes view on that commit, narrowed to this file
			changesProvider.setFilter(filePath);
			await source.viewChanges([picked.hash]);
			await commands.executeCommand(`${CHANGES_VIEW_ID}.focus`);
		}),
	];
}
