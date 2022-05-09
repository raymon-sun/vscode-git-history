import { parse } from "path";

import { inject, injectable } from "inversify";
import { ExtensionContext, workspace } from "vscode";

import { TYPES } from "../../container/types";
import { GitService } from "../../git/service";
import {
	PathCollection,
	resolveChangesCollection,
} from "../../git/changes/tree";
import { FileTreeProvider } from "../../providers/file-tree";

import { GitOptions, LogOptions } from "../../git/types";

import { attachGraph } from "../../git/graph";

import { link } from "./link";

@injectable()
export class Source {
	constructor(
		@inject(TYPES.ExtensionContext) private context: ExtensionContext,
		private git: GitService,
		private fileTreeProvider: FileTreeProvider
	) {}

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

	@link("promise")
	getRepositories() {
		const repositories = (this.git.getRepositories() || []).map(
			(repoPath) => ({
				name: parse(repoPath).base,
				path: repoPath,
			})
		);
		return Promise.resolve(repositories);
	}

	@link("promise")
	getBranches(options: GitOptions) {
		return this.git.getBranches(options);
	}

	@link("promise")
	getAuthors(options: GitOptions) {
		return this.git.getAuthors(options);
	}

	@link("promise")
	async getCommits(options?: LogOptions) {
		const commits = await this.git.getCommits(options);
		attachGraph(commits || []);
		return commits;
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
		this.git.onDidOpenRepo(() => {
			handler(
				(this.git.getRepositories() || []).map((repoPath) => ({
					name: parse(repoPath).base,
					path: repoPath,
				}))
			);
		});

		this.git.onDidCloseRepo(() => {
			handler(
				(this.git.getRepositories() || []).map((repoPath) => ({
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
