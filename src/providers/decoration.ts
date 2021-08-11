import { injectable } from "inversify";
import { FileDecorationProvider, Uri } from "vscode";
import { EXTENSION_SCHEME } from "../constants";
import { Status } from "../typings/git-extension";

@injectable()
export class GitStatusDecorationProvider implements FileDecorationProvider {
	private readonly STATUS_BADGE_MAP: { [key in Status]?: string } = {
		[Status.INDEX_ADDED]: "U",
		[Status.INDEX_RENAMED]: "R",
		[Status.MODIFIED]: "M",
		[Status.DELETED]: "D",
	};

	provideFileDecoration(uri: Uri) {
		if (uri.scheme === EXTENSION_SCHEME) {
			const { status } = JSON.parse(uri.query);
			return {
				badge: this.STATUS_BADGE_MAP[status as Status],
			};
		}
	}
}
