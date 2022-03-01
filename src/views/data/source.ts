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

@injectable()
export class Source {
	constructor(
		@inject(TYPES.ExtensionContext) private context: ExtensionContext,
		private git: GitService,
		private fileTreeProvider: FileTreeProvider
	) {}

	getDefaultRepository = () => {
		const repoPath = this.git.getDefaultRepository();
		return Promise.resolve({
			name: parse(repoPath).base,
			path: repoPath,
		});
	};

	getRepositories = () => {
		const repositories = (this.git.getRepositories() || []).map(
			(repoPath) => ({
				name: parse(repoPath).base,
				path: repoPath,
			})
		);
		return Promise.resolve(repositories);
	};

	getBranches = this.git.getBranches.bind(this.git);

	getAuthors = this.git.getAuthors.bind(this.git);

	getCommits = this.git.getCommits.bind(this.git);

	viewChanges = async (repo: string, refs: string[]) => {
		const changesCollection = await this.git.getChangesCollection(
			repo,
			refs
		);
		const newFileTree = resolveChangesCollection(
			changesCollection,
			workspace.workspaceFolders![0].uri.path
		);
		this.updateTreeView(newFileTree);
	};

	private updateTreeView(fileTree: PathCollection) {
		this.context.globalState.update("changedFileTree", fileTree);
		this.fileTreeProvider.refresh();
	}
}
