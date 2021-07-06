import { injectable } from "inversify";
import { TextDocumentContentProvider, Uri } from "vscode";
import { GitService } from "../git/service";

@injectable()
export class VersionedFileProvider implements TextDocumentContentProvider {
	static scheme = "git-view";

	constructor(private git: GitService) {}

	async provideTextDocumentContent(uri: Uri) {
		const commitHash = uri.query;
		return await this.git.show(commitHash, uri.fsPath);
	}
}
