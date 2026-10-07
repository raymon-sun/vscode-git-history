import { parse } from "path";

import { inject, injectable } from "inversify";
import {
	window,
	commands,
	ExtensionContext,
	workspace,
	EventEmitter,
} from "vscode";

import { debounce } from "lodash";

import { TYPES } from "../../../container/types";
import { GitService } from "../../../git/service";
import { GitGraph } from "../../../git/graph";
import { getRepoDisplayNames } from "../../../git/repoName";
import {
	PathCollection,
	resolveChangesCollection,
} from "../../../git/changes/tree";
import { ChangeTreeDataProvider } from "../../changes/ChangeTreeDataProvider";

import type { IBatchedCommits, LogOptions } from "../../../git/types";

import {
	REFRESH_COMMAND,
	RESET_COMMAND,
	SWITCH_BRANCH_COMMAND,
} from "../../../commands/switch";

import {
	FILTER_AUTHOR_COMMAND,
	FILTER_MESSAGE_COMMAND,
} from "../../../commands/filter";

import { INPUT_HASH_COMMAND } from "../../../commands/input";

import {
	ADD_TAG_COMMAND,
	CHECKOUT_COMMAND,
	CHERRY_PICK_COMMAND,
	CREATE_BRANCH_COMMAND,
	DELETE_TAG_COMMAND,
	RESET_TO_COMMIT_COMMAND,
	REVERT_COMMAND,
} from "../../../commands/commit";

import {
	COLUMN_VISIBILITY_STATE_KEY,
	DEFAULT_COLUMN_VISIBILITY,
	IColumnVisibility,
} from "./columnVisibility";
import {
	DATE_FORMAT_STATE_KEY,
	DEFAULT_DATE_FORMAT,
	DateFormat,
} from "./dateFormat";

import { link } from "./link";
import state from "./state";

const SELECTED_REPO_STATE_KEY = "selectedRepo";

@injectable()
export class Source {
	private switchSubscriber?: (batchedCommits: IBatchedCommits) => void;

	private commitsEventEmitter = new EventEmitter<{
		totalCount: number;
		repoName: string;
	}>();
	private columnsChangedEventEmitter = new EventEmitter<void>();

	constructor(
		@inject(TYPES.ExtensionContext) private context: ExtensionContext,
		private git: GitService,
		private graph: GitGraph,
		private ChangeTreeDataProvider: ChangeTreeDataProvider
	) {}

	getSwitchSubscriber() {
		return this.switchSubscriber;
	}

	getCommitsEventEmitter() {
		return this.commitsEventEmitter;
	}

	getColumnsChangedEventEmitter() {
		return this.columnsChangedEventEmitter;
	}

	async setColumnVisibility(visibility: IColumnVisibility) {
		await this.context.globalState.update(
			COLUMN_VISIBILITY_STATE_KEY,
			visibility
		);
		this.columnsChangedEventEmitter.fire();
	}

	@link("promise")
	getWorkspacePath() {
		return Promise.resolve(workspace.workspaceFolders![0].uri.fsPath);
	}

	@link("promise")
	getColumnVisibility() {
		const stored = this.context.globalState.get<Partial<IColumnVisibility>>(
			COLUMN_VISIBILITY_STATE_KEY,
			{}
		);

		return Promise.resolve({ ...DEFAULT_COLUMN_VISIBILITY, ...stored });
	}

	@link("promise")
	getDateFormat() {
		return Promise.resolve(
			this.context.globalState.get<DateFormat>(
				DATE_FORMAT_STATE_KEY,
				DEFAULT_DATE_FORMAT
			)
		);
	}

	@link("promise")
	async setDateFormat(format: DateFormat) {
		await this.context.globalState.update(DATE_FORMAT_STATE_KEY, format);
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

	/**
	 * The repository to display: the last one selected in this workspace, or the
	 * default one. The stored path is validated against the open repositories so
	 * a stale value can never be used.
	 */
	getPreferredRepo() {
		const stored = this.context.globalState.get<string>(
			SELECTED_REPO_STATE_KEY
		);

		if (stored && this.git.getRepositories().includes(stored)) {
			return stored;
		}

		return this.git.getDefaultRepository();
	}

	/** remember the repository the user picked, so it survives a reload */
	async setSelectedRepo(repoPath: string) {
		await this.context.globalState.update(
			SELECTED_REPO_STATE_KEY,
			repoPath
		);
	}

	/** short, unique name of the repository currently on screen */
	private getCurrentRepoName() {
		const repoPath = state.logOptions.repo;
		if (!repoPath) {
			return "";
		}

		const match = getRepoDisplayNames(this.git.getRepositories()).find(
			(repo) => repo.path === repoPath
		);

		return match?.name || parse(repoPath).base;
	}

	@link("subscription")
	async subscribeSwitcher(
		handler: (batchedCommits: IBatchedCommits) => void
	) {
		this.switchSubscriber = handler;
	}

	@link("promise")
	resetLog() {
		return commands.executeCommand<string>(RESET_COMMAND);
	}

	@link("subscription")
	async switchReference() {
		state.logOptions.ref = await commands.executeCommand<string>(
			SWITCH_BRANCH_COMMAND
		);
	}

	@link("subscription")
	async filterMessage(handler: (batchedCommits: IBatchedCommits) => void) {
		await commands.executeCommand(
			FILTER_MESSAGE_COMMAND,
			(keyword: string) => {
				state.logOptions.keyword = keyword;
				this.getCommits(handler, state.logOptions);
			}
		);
	}

	@link("subscription")
	async filterAuthor(handler: (batchedCommits: IBatchedCommits) => void) {
		state.logOptions.authors = await commands.executeCommand<string[]>(
			FILTER_AUTHOR_COMMAND
		);
		this.getCommits(handler, state.logOptions);
	}

	@link("promise")
	async inputHash() {
		return commands.executeCommand<string>(INPUT_HASH_COMMAND);
	}

	@link("promise")
	async checkoutCommit(hash: string) {
		return commands.executeCommand(CHECKOUT_COMMAND, hash);
	}

	@link("promise")
	async createBranch(hash: string) {
		return commands.executeCommand(CREATE_BRANCH_COMMAND, hash);
	}

	@link("promise")
	async addTag(hash: string) {
		return commands.executeCommand(ADD_TAG_COMMAND, hash);
	}

	@link("promise")
	async cherryPick(hash: string) {
		return commands.executeCommand(CHERRY_PICK_COMMAND, hash);
	}

	@link("promise")
	async revertCommit(hash: string) {
		return commands.executeCommand(REVERT_COMMAND, hash);
	}

	@link("promise")
	async resetToCommit(hash: string) {
		return commands.executeCommand(RESET_TO_COMMIT_COMMAND, hash);
	}

	@link("promise")
	async deleteTag(name: string) {
		return commands.executeCommand(DELETE_TAG_COMMAND, name);
	}

	@link("promise")
	async showWarningMessage(message: string) {
		window.showWarningMessage(message);
	}

	@link("subscription")
	async getCommits(
		handler: (batchedCommits: IBatchedCommits) => void,
		options: LogOptions
	) {
		const FIRST_BATCH_SIZE = 300;
		const firstBatchCommits = await this.git.getCommits({
			...options,
			count: FIRST_BATCH_SIZE,
		});

		let _batchNumber = 0;

		this.graph.registerHandler(handler);

		const BATCH_SIZE = 14000;
		if (
			firstBatchCommits &&
			firstBatchCommits.length === FIRST_BATCH_SIZE
		) {
			const totalCount = Number(
				await this.git.getCommitsTotalCount(options)
			);

			this.commitsEventEmitter.fire({
				totalCount,
				repoName: this.getCurrentRepoName(),
			});

			this.graph.attachGraphAndPost({
				totalCount,
				batchNumber: _batchNumber,
				commits: firstBatchCommits,
				options,
			});

			for (let i = FIRST_BATCH_SIZE; i < totalCount; i = i + BATCH_SIZE) {
				const batchNumber = ++_batchNumber;

				this.git
					.getCommits({
						...options,
						count: BATCH_SIZE,
						skip: i,
					})
					.then((commits = []) =>
						this.graph.attachGraphAndPost({
							totalCount,
							batchNumber,
							commits,
							options,
						})
					);
			}
		} else {
			const totalCount = firstBatchCommits?.length || 0;
			this.commitsEventEmitter.fire({
				totalCount,
				repoName: this.getCurrentRepoName(),
			});
			this.graph.attachGraphAndPost({
				totalCount,
				batchNumber: _batchNumber,
				commits: firstBatchCommits || [],
				options,
			});
		}
	}

	@link("promise")
	async viewChanges(refs: string[]) {
		const changesCollection = await this.git.getChangesCollection(
			state.logOptions.repo || "",
			refs
		);
		const newFileTree = resolveChangesCollection(
			changesCollection,
			workspace.workspaceFolders![0].uri.path
		);
		this.updateTreeView(newFileTree);
	}

	@link("promise")
	async autoRefreshLog() {
		const DEBOUNCE_INTERVAL = 12000;
		const debouncedRefresh = debounce(
			() => commands.executeCommand<string>(REFRESH_COMMAND),
			DEBOUNCE_INTERVAL,
			{ leading: true }
		);

		if (!state.logOptions.repo) {
			state.logOptions = { repo: this.getPreferredRepo() };
		}
		debouncedRefresh();

		setTimeout(
			() =>
				this.git.onDidRepoChange((repository) => {
					const { rootUri } = repository;
					if (rootUri.fsPath === state.logOptions.repo) {
						debouncedRefresh();
					}
				}),
			DEBOUNCE_INTERVAL
		);
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
		this.ChangeTreeDataProvider.refresh();
	}
}
