import { inject, injectable } from "inversify";
import { parse } from "path";
import { ExtensionContext, workspace } from "vscode";
import { TYPES } from "../../container/types";
import { GitService } from "../../git/service";
import { PathCollection, resolveChangesCollection } from "../../git/utils";
import { FileTreeProvider } from "../../providers/file-tree";

@injectable()
export class Source {
	constructor(
		@inject(TYPES.ExtensionContext) private context: ExtensionContext,
		private git: GitService,
		private fileTreeProvider: FileTreeProvider
	) {}

	getDefaultRepository = () => {
		const { rootUri } = this.git.getDefaultRepository();
		return Promise.resolve({
			repoName: parse(rootUri.path).base,
			rootUri,
		});
	};

	getRepositories = () => {
		const repositories = (this.git.getRepositories() || []).map(
			({ rootUri }) => ({
				repoName: parse(rootUri.path).base,
				rootUri,
			})
		);
		return Promise.resolve(repositories);
	};

	getBranches = () => this.git.getBranches();

	getAuthors = () => this.git.getAuthors();

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
