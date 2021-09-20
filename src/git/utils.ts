import { sep, parse, normalize } from "path";
import { EXTENSION_SCHEME } from "../constants";
import { Change, Status } from "./types";

export type ChangesCollection = { ref: string; changes: Change[] }[];

export function resolveChangesCollection(
	changesCollection: ChangesCollection,
	workspaceRootPath = ""
) {
	const pathMap = transChangeCollectionToMap(changesCollection);

	let fileTree: PathCollection = {};
	Object.entries(pathMap).forEach(([path, node]) => {
		attachFileNode(fileTree, path, workspaceRootPath, node);
	});
	return fileTree;
}

function transChangeCollectionToMap(changesCollection: ChangesCollection) {
	const pathMap: Record<string, FileNode> = {};
	changesCollection.reverse().forEach(({ ref, changes }) => {
		changes.forEach((change) => {
			const {
				uri: { path },
				originalUri: { path: originalPath },
			} = change;
			if (
				change.status === Status.INDEX_RENAMED &&
				pathMap[originalPath]
			) {
				delete pathMap[originalPath];
				pathMap[path] = {
					type: PathType.FILE,
					change: {
						...change,
						status: Status.INDEX_ADDED,
					},
					earliestRef: ref,
				};
				return;
			}

			const existedPathItem = pathMap[path];
			if (existedPathItem) {
				existedPathItem.latestRef = ref;
				if (existedPathItem.change.status === Status.INDEX_ADDED) {
					if (change.status === Status.DELETED) {
						delete pathMap[path];
					}
				} else {
					existedPathItem.change = change;
					existedPathItem.latestRef = ref;
				}
				return;
			}

			pathMap[path] = {
				type: PathType.FILE,
				change,
				earliestRef: ref,
			};
		});
	});
	return pathMap;
}

function attachFileNode(
	fileTree: PathCollection,
	path: string,
	workspaceRootPath: string,
	node: FileNode
) {
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

	fileNode[base] = node;
}

export function getDiffUris(
	[earliestRef, latestRef]: [string, string?],
	change: Change
) {
	const query1 = {
		isFileExist: change.status !== Status.INDEX_ADDED,
		ref: `${earliestRef}~`,
	};

	const query2 = {
		isFileExist: change.status !== Status.DELETED,
		ref: latestRef || earliestRef,
	};

	const uri1 = change.originalUri.with({
		scheme: EXTENSION_SCHEME,
		query: JSON.stringify(query1),
	});
	const uri2 = (change.renameUri || change.originalUri).with({
		scheme: EXTENSION_SCHEME,
		query: JSON.stringify(query2),
	});

	return [uri1, uri2];
}

export function assign<T>(destination: T, ...sources: any[]): T {
	for (const source of sources) {
		Object.keys(source).forEach(
			(key) => ((destination as any)[key] = source[key])
		);
	}

	return destination;
}

export function sanitizePath(path: string): string {
	return path.replace(
		/^([a-z]):\\/i,
		(_, letter) => `${letter.toUpperCase()}:\\`
	);
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
	refs?: string[];
	latestRef?: string;
	earliestRef: string;
}

export enum PathType {
	FOLDER = "Folder",
	FILE = "File",
}
