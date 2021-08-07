import { sep, parse, normalize } from "path";
import { Change } from "../typings/git-extension";

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
		dirSegments.reduce((prePath, dirSegment) => {
			if (!dirSegment) {
				return prePath;
			}

			const currentPath = `${prePath}${sep}${dirSegment}`;
			if (!fileNode[dirSegment]) {
				fileNode[dirSegment] = {
					type: PathType.FOLDER,
					path: currentPath,
					children: {},
				};
			}

			fileNode = (fileNode[dirSegment] as FolderNode).children;
			return currentPath;
		}, workspaceRootPath);

		fileNode[base] = {
			type: PathType.FILE,
			change,
		};
	});

	return fileTree;
}

// TODO: take functions below to another directory
export function compareFileTreeNode(
	[name, node]: [string, FolderNode | FileNode],
	[anotherName, anotherNode]: [string, FolderNode | FileNode]
) {
	node;
	if (node.type === PathType.FOLDER && anotherNode.type === PathType.FILE) {
		return -1;
	}

	if (anotherNode.type === PathType.FOLDER && node.type === PathType.FILE) {
		return 1;
	}

	return compareAndDisambiguateByLength(name, anotherName);
}

function compareAndDisambiguateByLength(one: string, other: string) {
	const collator = new Intl.Collator(undefined, { numeric: true });
	// Check for differences
	let result = collator.compare(one, other);
	if (result !== 0) {
		return result;
	}

	// In a numeric comparison, `foo1` and `foo01` will compare as equivalent.
	// Disambiguate by sorting the shorter string first.
	if (one.length !== other.length) {
		return one.length < other.length ? -1 : 1;
	}

	return 0;
}

export interface PathCollection {
	[folderOrFileName: string]: FolderNode | FileNode;
}

export interface FolderNode {
	type: PathType.FOLDER;
	path: string;
	children: PathCollection;
}

export interface FileNode {
	type: PathType.FILE;
	change: Change;
}

export enum PathType {
	FOLDER = "Folder",
	FILE = "File",
}
