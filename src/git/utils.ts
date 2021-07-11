import { sep, parse, normalize } from "path";
import { Change, Status } from "../typings/git-extension";

export function createChangeFileTree(
	changes: Change[],
	workspaceRootPath?: string
) {
	let fileTree: PathNode = {};
	changes.forEach((change) => {
		const { path } = change.uri;
		const { dir, base } = parse(path);
		const workspaceDir = dir.substring(normalize(workspaceRootPath).length);
		const dirSegments = workspaceDir.split(sep);

		let fileNode = fileTree;
		dirSegments.forEach((dirSegment) => {
			if (!dirSegment) {
				return;
			}

			if (!fileNode[dirSegment]) {
				fileNode[dirSegment] = {};
			}

			fileNode = fileNode[dirSegment] as PathNode;
		});

		fileNode[base] = {
			status: change.status,
			checkIsFile: () => true,
		};
	});

	return fileTree;
}

export type PathNode = {
	[dirOrFile: string]: FileNode | PathNode;
};

export type FileNode = {
	status: Status;
	checkIsFile: () => true;
};
