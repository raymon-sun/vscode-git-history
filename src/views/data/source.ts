import { parse } from "path";

import { inject, injectable } from "inversify";
import { commands, ExtensionContext, workspace } from "vscode";

import { TYPES } from "../../container/types";
import { GitService } from "../../git/service";
import {
	PathCollection,
	resolveChangesCollection,
} from "../../git/changes/tree";
import { FileTreeProvider } from "../../providers/file-tree";

import { BatchedCommits, LogOptions } from "../../git/types";

import { RESET_COMMAND } from "../../commands/switch";

import { FILTER_AUTHOR_COMMAND } from "../../commands/filter";

import { link } from "./link";
import state from "./state";

@injectable()
export class Source {
	private switchSubscriber?: (batchedCommits: BatchedCommits) => void;

	constructor(
		@inject(TYPES.ExtensionContext) private context: ExtensionContext,
		private git: GitService,
		private fileTreeProvider: FileTreeProvider
	) {}

	getSwitchSubscriber() {
		return this.switchSubscriber;
	}

	@link("promise")
	getWorkspacePath() {
		return Promise.resolve(workspace.workspaceFolders![0].uri.fsPath);
	}

	@link("promise")
	getDefaultRepository() {
		const repoPath = this.git.getDefaultRepository();
		if (!repoPath) {
			return Promise.resolve();
		}

		return Promise.resolve({
			name: parse(repoPath).base,
			path: repoPath,
		});
	}

	@link("subscription")
	async subscribeSwitcher(handler: (batchedCommits: BatchedCommits) => void) {
		this.switchSubscriber = handler;
	}

	@link("promise")
	resetLog() {
		return commands.executeCommand<string>(RESET_COMMAND);
	}

	@link("subscription")
	async filterAuthor(handler: (batchedCommits: BatchedCommits) => void) {
		state.logOptions.authors = await commands.executeCommand<string[]>(
			FILTER_AUTHOR_COMMAND
		);
		this.getCommits(handler, state.logOptions);
	}

	@link("subscription")
	async getCommits(
		handler: (batchedCommits: BatchedCommits) => void,
		options: LogOptions
	) {
		const BATCH_SIZE = 5000;
		const firstBatchCommits = await this.git.getCommits({
			...options,
			count: BATCH_SIZE,
		});

		if (firstBatchCommits && firstBatchCommits.length === BATCH_SIZE) {
			const totalCount = Number(
				await this.git.getCommitsTotalCount(options)
			);

			handler({
				totalCount,
				batchNumber: 0,
				commits: firstBatchCommits,
				options,
			});

			for (let i = BATCH_SIZE; i < totalCount; i = i + BATCH_SIZE) {
				const commits =
					(await this.git.getCommits({
						...options,
						count: BATCH_SIZE,
						skip: i,
					})) || [];

				handler({
					totalCount,
					batchNumber: Math.floor(i / BATCH_SIZE),
					commits,
					options,
				});
			}
		} else {
			handler({
				totalCount: firstBatchCommits?.length || 0,
				batchNumber: 0,
				commits: firstBatchCommits || [],
				options,
			});
		}
	}

	@link("promise")
	async viewChanges(repo: string, refs: string[]) {
		const changesCollection = await this.git.getChangesCollection(
			repo,
			refs
		);
		const newFileTree = resolveChangesCollection(
			changesCollection,
			workspace.workspaceFolders![0].uri.path
		);
		this.updateTreeView(newFileTree);
	}

	@link("subscription")
	onReposChange(handler: (repos: { name: string; path: string }[]) => void) {
		this.git.onReposChange((repos) => {
			handler(
				repos.map((repoPath) => ({
					name: parse(repoPath).base,
					path: repoPath,
				}))
			);
		});
	}

	private updateTreeView(fileTree: PathCollection) {
		this.context.globalState.update("changedFileTree", fileTree);
		this.fileTreeProvider.refresh();
	}
}
