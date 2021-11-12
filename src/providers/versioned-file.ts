import { injectable } from "inversify";
import { TextDocumentContentProvider, Uri } from "vscode";

import { GitService } from "../git/service";

@injectable()
export class VersionedFileProvider implements TextDocumentContentProvider {
	constructor(private git: GitService) {}

	async provideTextDocumentContent(uri: Uri) {
		const { ref, isFileExist } = JSON.parse(uri.query);
		if (!isFileExist) {
			return "";
		}

		const content = await this.git.show(ref, uri.fsPath);
		return content;
	}
}
