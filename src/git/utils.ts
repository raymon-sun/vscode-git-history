import { sep, parse, normalize } from "path";
import { Uri } from "vscode";
import { EXTENSION_SCHEME } from "../constants";
import { Change, Status } from "./types";

export type ChangesCollection = { ref: string; changes: Change[] }[];

export function resolveChangesCollection(
	changesCollection: ChangesCollection,
	workspaceRootPath = ""
) {
	const pathMap = getPathMap(changesCollection);

	let fileTree: PathCollection = {};
	Object.entries(pathMap).forEach(([path, node]) => {
		const mergedStatus = mergeStatus(node.changeStack);
		if (!mergedStatus) {
			delete pathMap[path];
			return;
		}

		node.status = mergedStatus;
		attachFileNode(fileTree, path, workspaceRootPath, node);
	});
	return fileTree;
}

export function getPathMap(changesCollection: ChangesCollection) {
	const pathMap: Record<string, FileNode> = {};
	const renamedPaths: string[] = [];
	changesCollection.reverse().forEach(({ ref, changes }) => {
		changes.forEach((change) => {
			const { status, uri, originalUri } = change;
			const { path } = uri;
			const { path: originalPath } = originalUri;
			if (status === Status.INDEX_RENAMED) {
				if (!pathMap[path]) {
					renamedPaths.push(path);
				}

				if (pathMap[originalPath]) {
					pathMap[originalPath].changeStack.push({
						ref,
						isDeletedByRename: true,
					});
				} else {
					pathMap[originalPath] = {
						type: PathType.FILE,
						uri: originalUri,
						changeStack: [{ ref, isDeletedByRename: true }],
					};
				}
			}

			if (pathMap[path]) {
				pathMap[path].changeStack.push({ ref, change });
				return;
			}

			pathMap[path] = {
				type: PathType.FILE,
				uri,
				changeStack: [{ ref, change }],
			};
		});
	});

	renamedPaths.reverse().forEach((renamedPath) => {
		const renamedChangeStack = pathMap[renamedPath].changeStack;
		pathMap[renamedPath].originalChangeStack =
			getOriginalChangeStackAndUpdateChange(pathMap, renamedChangeStack);
	});

	return pathMap;
}

function getOriginalChangeStackAndUpdateChange(
	pathMap: Record<string, FileNode>,
	renamedChangeStack: ChangeItem[]
): ChangeItem[] {
	const lastChangeItem = renamedChangeStack[renamedChangeStack.length - 1];
	const renamedChange = renamedChangeStack[0].change!;
	const originalChangeStack =
		pathMap[renamedChange.originalUri.path]?.changeStack;
	if (!originalChangeStack) {
		return [];
	}

	const lastOriginalChangeItem =
		originalChangeStack[originalChangeStack.length - 1];
	if (!lastOriginalChangeItem.isDeletedByRename) {
		return [];
	}

	if (
		lastChangeItem.isDeletedByRename === false ||
		lastChangeItem.change?.status === Status.DELETED
	) {
		lastOriginalChangeItem.isDeletedByRename = false;
	}

	if (originalChangeStack[0].change?.status === Status.INDEX_RENAMED) {
		return [
			...getOriginalChangeStackAndUpdateChange(
				pathMap,
				originalChangeStack
			),
			...originalChangeStack,
		];
	}

	return originalChangeStack;
}

function mergeStatus(changeStack: ChangeItem[]) {
	const firstChangeItem = changeStack[0];
	const lastChangeItem = changeStack[changeStack.length - 1];
	if (lastChangeItem.isDeletedByRename) {
		return;
	}

	const { status: firstStatus = Status.DELETED } =
		firstChangeItem.change || {};
	const { status: lastStatus = Status.DELETED } = lastChangeItem.change || {};

	const firstFileExistStatus = getFileExistStatus(firstStatus);
	const lastFileExistStatus = getFileExistStatus(lastStatus);

	if (
		firstFileExistStatus?.isExistBefore &&
		lastFileExistStatus?.isExistAfter
	) {
		return Status.MODIFIED;
	}

	if (
		!firstFileExistStatus?.isExistBefore &&
		lastFileExistStatus?.isExistAfter
	) {
		return firstStatus;
	}

	if (
		firstFileExistStatus?.isExistBefore &&
		!lastFileExistStatus?.isExistAfter
	) {
		return Status.DELETED;
	}
}

function getFileExistStatus(status: Status) {
	if ([Status.INDEX_ADDED, Status.INDEX_RENAMED].includes(status)) {
		return { isExistBefore: false, isExistAfter: true };
	}

	if (status === Status.DELETED) {
		return { isExistBefore: true, isExistAfter: false };
	}

	if (status === Status.MODIFIED) {
		return { isExistBefore: true, isExistAfter: true };
	}
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

export function getDiffUriPair(node: FileNode) {
	const { uri, status, originalChangeStack, changeStack } = node;
	const originalChangeItem = originalChangeStack?.find(
		({ change }) => change
	);

	const { change: preChange, ref: preRef } =
		originalChangeItem || changeStack[0];
	const { change: curChange, ref: curRef } =
		changeStack[changeStack.length - 1];

	const preQuery = {
		isFileExist: status !== Status.INDEX_ADDED,
		ref: `${preRef}~`,
	};

	const curQuery = {
		isFileExist: status !== Status.DELETED,
		ref: curRef,
	};

	return [
		preChange!.originalUri.with({
			scheme: EXTENSION_SCHEME,
			query: JSON.stringify(preQuery),
		}),
		uri.with({
			scheme: EXTENSION_SCHEME,
			query: JSON.stringify(curQuery),
		}),
	];
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
	uri: Uri;
	status?: Status;
	changeStack: ChangeItem[];
	originalChangeStack?: ChangeItem[];
}

export interface ChangeItem {
	ref: string;
	change?: Change;
	isDeletedByRename?: boolean;
}

export enum PathType {
	FOLDER = "Folder",
	FILE = "File",
}
