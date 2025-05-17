import path from "path";

import { Uri } from "vscode";

import { Change, getChangePair } from "./changes";

import { mergeStatus, Status } from "./status";

export type ChangesCollection = {
	ref: string;
	repoPath: string;
	changes: Change[];
}[];

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
	repoPath: string;
	status?: Status;
	changeStack: ChangeItem[];
	originalChangeStack?: ChangeItem[];
}

export interface ChangeItem {
	ref: string;
	change: Change;
	isDeletedByRename?: boolean;
	hidden?: boolean;
}

export enum PathType {
	FOLDER = "Folder",
	FILE = "File",
}

export function resolveChangesCollection(
	changesCollection: ChangesCollection,
	workspaceRootPath = ""
) {
	const pathMap = getPathMap(changesCollection);

	let fileTree: PathCollection = {};
	Object.entries(pathMap).forEach(([path, node]) => {
		const { originalChangeStack, changeStack } = node;
		const [firstChangeItem, lastChangeItem] = getChangePair(
			originalChangeStack,
			changeStack
		);
		const mergedStatus = mergeStatus(firstChangeItem, lastChangeItem);
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
	changesCollection.reverse().forEach(({ ref, repoPath, changes }) => {
		changes.forEach((change) => {
			const { status, uri, originalUri } = change;
			const { path } = uri;
			const { path: originalPath } = originalUri;
			if (status === Status.INDEX_RENAMED) {
				if (!pathMap[path]) {
					renamedPaths.push(path);
				}

				const deleteChange = {
					status: Status.DELETED,
					uri: originalUri,
					originalUri,
					renameUri: originalUri,
					repository: repoPath,
				};
				if (pathMap[originalPath]) {
					pathMap[originalPath].changeStack.push({
						ref,
						change: deleteChange,
						isDeletedByRename: true,
						hidden: true,
					});
				} else {
					pathMap[originalPath] = {
						type: PathType.FILE,
						repoPath,
						uri: originalUri,
						changeStack: [
							{
								ref,
								change: deleteChange,
								isDeletedByRename: true,
								hidden: true,
							},
						],
					};
				}
			}

			if (pathMap[path]) {
				pathMap[path].changeStack.push({ ref, change });
				return;
			}

			pathMap[path] = {
				type: PathType.FILE,
				repoPath,
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

export function getOriginalChangeStackAndUpdateChange(
	pathMap: Record<string, FileNode>,
	renamedChangeStack: ChangeItem[]
): ChangeItem[] {
	const lastChangeItem = renamedChangeStack[renamedChangeStack.length - 1];
	const renamedChangeItem = renamedChangeStack[0];
	const renamedChange = renamedChangeItem.change!;
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

	// TODO: consider about rename chain
	if (
		renamedChangeItem.ref === lastOriginalChangeItem.ref &&
		lastChangeItem.change.status === Status.DELETED &&
		(!lastChangeItem.isDeletedByRename || !lastChangeItem.hidden)
	) {
		lastOriginalChangeItem.hidden = false;
		lastChangeItem.hidden = true;
	}

	if (originalChangeStack[0].change.status === Status.INDEX_RENAMED) {
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

function attachFileNode(
	fileTree: PathCollection,
	filePath: string,
	workspaceRootPath: string,
	node: FileNode
) {
	const { dir, base } = path.parse(filePath);
	const workspaceDir = dir.substring(
		path.normalize(workspaceRootPath).length
	);
	const dirSegments = workspaceDir.split(path.sep);

	let fileNode = fileTree;
	dirSegments.reduce((prePath, dirSegment) => {
		if (!dirSegment) {
			return prePath;
		}

		const currentPath = `${prePath}${path.sep}${dirSegment}`;
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
