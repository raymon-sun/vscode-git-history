import { Disposable, TextDocumentContentProvider, Uri } from "vscode";
import { show } from "../services/git";

export class VersionedFileProvider
	extends Disposable
	implements TextDocumentContentProvider
{
	static scheme = "git-view";

	constructor() {
		super(() => {});
	}

	async provideTextDocumentContent(uri: Uri) {
		const commitHash = uri.query;
		return await show(commitHash, uri.fsPath);
	}
}
