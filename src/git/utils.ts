import { Uri } from "vscode";

import { container } from "../container/inversify.config";

import { Change, getChangePair } from "./changes/changes";

import {
	FileNode,
	FolderNode,
	type PathCollection,
	PathType,
} from "./changes/tree";
import { GitService } from "./service";
import { Status } from "./changes/status";

export type ChangesCollection = { ref: string; changes: Change[] }[];

export function parseGitConfig(data: string) {
	const configRex = /(.*)=(.*)\n?/gm;

	const config: Record<string, string> = {};

	let key;
	let value;
	let match;
	do {
		match = configRex.exec(data);
		if (match === null) {
			break;
		}

		[, key, value] = match;
		config[key] = value;
	} while (true);

	return config;
}

export function parseGitAuthors(data: string) {
	const authorRex = / *[0-9]+\t(.+) +<(.*)>\n?/gm;
	const authors: { name: string; email: string }[] = [];

	let name;
	let email;
	let match;
	do {
		match = authorRex.exec(data);
		if (match === null) {
			break;
		}

		[, name, email] = match;
		authors.push({ name, email });
	} while (true);

	return authors;
}

export function getDiffUriPair(node: FileNode) {
	const gitService = container.get(GitService);

	const { uri, originalChangeStack, changeStack, status } = node;
	const [{ change: preChange, ref: preRef }, { ref: curRef }] = getChangePair(
		originalChangeStack,
		changeStack
	);

	if (status === Status.INDEX_ADDED) {
		return [gitService.toGitUri(uri, curRef)];
	}

	if (status === Status.DELETED) {
		return [gitService.toGitUri(uri, `${preRef}~`)];
	}

	return [
		gitService.toGitUri(preChange.originalUri, `${preRef}~`),
		gitService.toGitUri(uri, curRef),
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

/** @deprecated */
export function getUser(shortLog: string) {
	const matches = shortLog.match(/ *[0-9]+\t(.+) +<(.*)>/);
	return {
		name: matches?.[1] || "",
		email: matches?.[2] || "",
	};
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

export function removeItemsByIndexList<T>(array: T[], indexList: number[]) {
	for (var i = indexList.length - 1; i >= 0; i--) {
		array.splice(indexList[i], 1);
	}
}

/**
 * globalState cannot pass object with function, so rebuild the uri
 * @param pathCollection
 * @returns
 */
export function rebuildUri(pathCollection?: PathCollection) {
	if (!pathCollection) {
		return pathCollection;
	}

	Object.values(pathCollection).forEach((node) => {
		if (node.type === PathType.FOLDER) {
			rebuildUri(node.children);
		} else if (node.type === PathType.FILE) {
			node.uri = Uri.file(node.uri.path);
			node.changeStack = node.changeStack.map(({ change, ...rest }) => ({
				change: {
					...change,
					uri: Uri.file(change.uri.path),
					renameUri: change.renameUri
						? Uri.file(change.renameUri.path)
						: change.renameUri,
					originalUri: Uri.file(change.originalUri.path),
					status: change.status,
				},
				...rest,
			}));
			node.originalChangeStack = node.originalChangeStack
				? node.originalChangeStack.map(({ change, ...rest }) => ({
						change: {
							...change,
							uri: Uri.file(change.uri.path),
							renameUri: change.renameUri
								? Uri.file(change.renameUri.path)
								: change.renameUri,
							originalUri: Uri.file(change.originalUri.path),
							status: change.status,
						},
						...rest,
				  }))
				: node.originalChangeStack;
		}
	});

	return pathCollection;
}
