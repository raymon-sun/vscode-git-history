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
import { FILE_FILTER_CONTEXT, HISTORY_VIEW_ID } from "../../../constants";
import { COMPARE_STATE_KEY, ICompareState } from "../../changes/compareState";
import { GitService } from "../../../git/service";
import { GitGraph } from "../../../git/graph";
import { pickPreferredRepo } from "../../../git/preferredRepo";
import { ILineRange } from "../../../git/lineHistory";
import { getRepoDisplayNames } from "../../../git/repoName";
import {
	ChangesCollection,
	PathCollection,
	resolveChangesCollection,
} from "../../../git/changes/tree";
import { ChangeTreeDataProvider } from "../../changes/ChangeTreeDataProvider";

import type { IBatchedCommits, LogOptions } from "../../../git/types";
import type { IRoughCommit } from "../../../git/commit";

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

	/** resolved once, see #getPreferredRepo */
	private preferredRepo?: string;

	private commitsEventEmitter = new EventEmitter<{
		totalCount: number;
		repoName: string;
		filePath?: string;
		lineRange?: ILineRange;
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
	 * default one. The stored path is validated against the repository on disk,
	 * so a stale value can never be used.
	 */
	getPreferredRepo() {
		// resolve once per session: the repository list is discovered
		// asynchronously, so resolving again would pick a different repository
		// and switch the panel under the user
		if (!this.preferredRepo) {
			this.preferredRepo = pickPreferredRepo({
				// workspace scoped: a repository picked in another workspace must
				// not be picked up here
				stored: this.context.workspaceState.get<string>(
					SELECTED_REPO_STATE_KEY
				),
				repositories: this.git.getRepositories(),
				workspacePath: workspace.workspaceFolders?.[0]?.uri.fsPath,
			});
		}

		return this.preferredRepo;
	}

	/** remember the repository the user picked, so it survives a reload */
	async setSelectedRepo(repoPath: string) {
		this.preferredRepo = repoPath;
		await this.context.workspaceState.update(
			SELECTED_REPO_STATE_KEY,
			repoPath
		);
	}

	/**
	 * Restrict the history to a path, which is how the history of a file is
	 * shown, and reveal the panel.
	 */
	async showFileHistory(repo: string, filePath: string) {
		const options = { ...state.logOptions, repo, filePath };
		// the file filter covers the whole file, so any line range is dropped
		delete options.lineRange;
		delete options.hashes;
		state.logOptions = options;
		await commands.executeCommand<string>(REFRESH_COMMAND);
		await commands.executeCommand(`${HISTORY_VIEW_ID}.focus`);
	}

	/**
	 * Restrict the history to the commits that touched a line range, which is
	 * how the history of a selection is shown, and reveal the panel. The commits
	 * are resolved by the caller (`git log -L`) and listed as given.
	 */
	async showSelectionHistory(
		repo: string,
		filePath: string,
		lineRange: ILineRange,
		hashes: string[]
	) {
		state.logOptions = {
			...state.logOptions,
			repo,
			filePath,
			lineRange,
			hashes,
		};
		await commands.executeCommand<string>(REFRESH_COMMAND);
		await commands.executeCommand(`${HISTORY_VIEW_ID}.focus`);
	}

	/** drop the file history filter and show the whole repository again */
	async clearFileFilter() {
		const options = { ...state.logOptions };
		delete options.filePath;
		delete options.lineRange;
		delete options.hashes;
		state.logOptions = options;
		await commands.executeCommand<string>(REFRESH_COMMAND);
	}

	/** show or hide the title bar action that clears the history filter */
	private syncFileFilterContext({ filePath, lineRange }: LogOptions) {
		commands.executeCommand(
			"setContext",
			FILE_FILTER_CONTEXT,
			!!(filePath || lineRange)
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
		this.syncFileFilterContext(options);

		const FIRST_BATCH_SIZE = 300;

		// an explicit commit set is small and fully known, so it is posted in a
		// single batch instead of the paged traversal below
		if (options.hashes && options.hashes.length) {
			const commits = (await this.git.getCommits(options)) || [];

			this.graph.registerHandler(handler);
			this.postSingleBatch(commits, options);

			return;
		}

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
				filePath: options.filePath,
				lineRange: options.lineRange,
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
			this.postSingleBatch(firstBatchCommits || [], options);
		}
	}

	/** post a commit list that is complete, so the panel can render it at once */
	private postSingleBatch(commits: IRoughCommit[], options: LogOptions) {
		const totalCount = commits.length;

		this.commitsEventEmitter.fire({
			totalCount,
			repoName: this.getCurrentRepoName(),
			filePath: options.filePath,
			lineRange: options.lineRange,
		});

		this.graph.attachGraphAndPost({
			totalCount,
			batchNumber: 0,
			commits,
			options,
		});
	}

	@link("promise")
	async viewChanges(refs: string[]) {
		const changesCollection = await this.git.getChangesCollection(
			state.logOptions.repo || "",
			refs
		);
		this.showChangesTree(changesCollection);
	}

	/**
	 * Show the difference between two commits, rather than the changes they
	 * introduced. `fromRef` is the older side, so the diff reads the way the
	 * commit list is read (and works for unrelated commits too).
	 */
	@link("promise")
	async compareCommits(fromRef: string, toRef: string) {
		const repoPath = state.logOptions.repo || "";
		const changes = await this.git.getChangesBetween(
			repoPath,
			fromRef,
			toRef
		);

		this.showChangesTree(
			[{ ref: toRef, baseRef: fromRef, repoPath, changes }],
			{ fromRef, toRef }
		);
	}

	private showChangesTree(
		changesCollection: ChangesCollection,
		compare?: ICompareState
	) {
		const newFileTree = resolveChangesCollection(
			changesCollection,
			workspace.workspaceFolders![0].uri.path
		);
		this.updateTreeView(newFileTree, compare);
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

	private updateTreeView(fileTree: PathCollection, compare?: ICompareState) {
		this.context.globalState.update("changedFileTree", fileTree);
		// let the Changes view label a comparison; any other source clears it
		this.context.globalState.update(COMPARE_STATE_KEY, compare);
		this.ChangeTreeDataProvider.refresh();
	}
}
