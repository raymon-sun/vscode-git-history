import { sep, parse, normalize } from "path";
import { Uri } from "vscode";
import { Change, Status } from "../typings/git-extension";

export function createChangeFileTree(
	changes: Change[],
	workspaceRootPath = ""
) {
	let fileTree: PathCollection = {};
	changes.forEach((change) => {
		const { uri } = change;
		const { path } = uri;
		const { dir, base } = parse(path);
		const workspaceDir = dir.substring(normalize(workspaceRootPath).length);
		const dirSegments = workspaceDir.split(sep);

		let fileNode = fileTree;
		dirSegments.forEach((dirSegment) => {
			if (!dirSegment) {
				return;
			}

			if (!fileNode[dirSegment]) {
				fileNode[dirSegment] = {
					type: PathType.FOLDER,
					path: "",
					children: {},
				};
			}

			fileNode = (fileNode[dirSegment] as FolderNode).children;
		});

		fileNode[base] = {
			type: PathType.FILE,
			status: change.status,
			uri,
		};
	});

	return fileTree;
}

export interface PathCollection {
	[folderOrFile: string]: FolderNode | FileNode;
}

export interface FolderNode {
	type: PathType.FOLDER;
	path: string;
	children: PathCollection;
}

export interface FileNode {
	type: PathType.FILE;
	status: Status;
	uri: Uri;
}

export enum PathType {
	FOLDER = "Folder",
	FILE = "File",
}
