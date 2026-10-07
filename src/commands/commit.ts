import { commands, QuickPickItem, window } from "vscode";

import { container } from "../container/inversify.config";
import { validateRefName } from "../git/refName";
import { GitService, ResetMode } from "../git/service";
import state from "../views/history/data/state";

import { REFRESH_COMMAND } from "./switch";

export const CREATE_BRANCH_COMMAND = "git-history.commit.createBranch";
export const ADD_TAG_COMMAND = "git-history.commit.addTag";
export const CHERRY_PICK_COMMAND = "git-history.commit.cherryPick";
export const REVERT_COMMAND = "git-history.commit.revert";
export const RESET_TO_COMMIT_COMMAND = "git-history.commit.reset";
export const CHECKOUT_COMMAND = "git-history.commit.checkout";
export const DELETE_TAG_COMMAND = "git-history.tag.delete";

const SHORT_HASH_LENGTH = 7;

const shortenHash = (hash: string) => hash.slice(0, SHORT_HASH_LENGTH);

const RESET_MODES: (QuickPickItem & { mode: ResetMode })[] = [
	{
		label: "Soft",
		description: "Keep the changes, staged",
		mode: "soft",
	},
	{
		label: "Mixed",
		description: "Keep the changes, unstaged",
		mode: "mixed",
	},
	{
		label: "Hard",
		description: "Discard all pending changes",
		mode: "hard",
	},
];

export function getCommitCommandsDisposable() {
	const gitService = container.get(GitService);

	/**
	 * Run a repository operation for the current repository and refresh the
	 * history once it changed something. Errors surface as a notification
	 * instead of an unhandled rejection.
	 */
	async function run(
		failureTitle: string,
		operation: (repo: string) => Promise<boolean>
	) {
		const repo = state.logOptions.repo || gitService.getDefaultRepository();
		if (!repo) {
			window.showWarningMessage("No Git repository is available.");
			return;
		}

		try {
			if (await operation(repo)) {
				await commands.executeCommand(REFRESH_COMMAND);
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			window.showErrorMessage(`${failureTitle}: ${message.trim()}`);
		}
	}

	return [
		commands.registerCommand(CREATE_BRANCH_COMMAND, (hash: string) =>
			run("Create Branch", async (repo) => {
				const name = await window.showInputBox({
					title: "Create Branch",
					prompt: `Create a branch at ${shortenHash(
						hash
					)} and switch to it`,
					placeHolder: "Branch name",
					validateInput: validateRefName,
				});
				if (!name?.trim()) {
					return false;
				}

				await gitService.createBranch(repo, name.trim(), hash);
				window.showInformationMessage(
					`Switched to new branch '${name.trim()}'.`
				);
				return true;
			})
		),
		commands.registerCommand(ADD_TAG_COMMAND, (hash: string) =>
			run("Add Tag", async (repo) => {
				const name = await window.showInputBox({
					title: "Add Tag",
					prompt: `Create a tag at ${shortenHash(hash)}`,
					placeHolder: "Tag name",
					validateInput: validateRefName,
				});
				if (!name?.trim()) {
					return false;
				}

				await gitService.addTag(repo, name.trim(), hash);
				window.showInformationMessage(`Created tag '${name.trim()}'.`);
				return true;
			})
		),
		commands.registerCommand(CHERRY_PICK_COMMAND, (hash: string) =>
			run("Cherry Pick", async (repo) => {
				await gitService.cherryPick(repo, hash);
				window.showInformationMessage(
					`Cherry-picked ${shortenHash(hash)}.`
				);
				return true;
			})
		),
		commands.registerCommand(REVERT_COMMAND, (hash: string) =>
			run("Revert", async (repo) => {
				await gitService.revertCommit(repo, hash);
				window.showInformationMessage(`Reverted ${shortenHash(hash)}.`);
				return true;
			})
		),
		commands.registerCommand(RESET_TO_COMMIT_COMMAND, (hash: string) =>
			run("Reset", async (repo) => {
				const modeItem = await window.showQuickPick(RESET_MODES, {
					title: `Reset Current Branch to ${shortenHash(hash)}`,
					placeHolder: "Select a reset mode",
				});
				if (!modeItem) {
					return false;
				}

				if (modeItem.mode === "hard") {
					const confirmation = await window.showWarningMessage(
						`Discard all pending changes and reset the current branch to ${shortenHash(
							hash
						)}?`,
						{ modal: true },
						"Reset"
					);
					if (confirmation !== "Reset") {
						return false;
					}
				}

				await gitService.resetToCommit(repo, hash, modeItem.mode);
				window.showInformationMessage(
					`Reset the current branch to ${shortenHash(hash)} (${
						modeItem.mode
					}).`
				);
				return true;
			})
		),
		commands.registerCommand(CHECKOUT_COMMAND, (hash: string) =>
			run("Checkout", async (repo) => {
				await gitService.checkoutCommit(repo, hash);
				window.showInformationMessage(
					`Checked out ${shortenHash(hash)} (detached HEAD).`
				);
				return true;
			})
		),
		commands.registerCommand(DELETE_TAG_COMMAND, (name: string) =>
			run("Delete Tag", async (repo) => {
				const confirmation = await window.showWarningMessage(
					`Delete the local tag '${name}'?`,
					{ modal: true },
					"Delete"
				);
				if (confirmation !== "Delete") {
					return false;
				}

				await gitService.deleteTag(repo, name);
				window.showInformationMessage(`Deleted tag '${name}'.`);
				return true;
			})
		),
	];
}
