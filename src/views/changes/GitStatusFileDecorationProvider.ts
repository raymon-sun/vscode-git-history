import { injectable } from "inversify";
import { FileDecoration, FileDecorationProvider, Uri } from "vscode";

import { EXTENSION_SCHEME } from "../../constants";
import { getColor, getStatusText, Status } from "../../git/changes/status";

@injectable()
export class GitStatusFileDecorationProvider implements FileDecorationProvider {
	private readonly STATUS_BADGE_MAP: { [key in Status]?: string } = {
		[Status.INDEX_ADDED]: "A",
		[Status.INDEX_RENAMED]: "R",
		[Status.MODIFIED]: "M",
		[Status.DELETED]: "D",
	};

	provideFileDecoration(uri: Uri) {
		if (uri.scheme === EXTENSION_SCHEME) {
			const { status } = JSON.parse(uri.query);
			return new FileDecoration(
				this.STATUS_BADGE_MAP[status as Status],
				getStatusText(status),
				getColor(status)
			);
		}
	}
}
