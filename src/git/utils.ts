import { EXTENSION_SCHEME } from "../constants";

import { getChangePair } from "./changes/changes";

import { FileNode, FolderNode, PathType } from "./changes/tree";

import { Change, Status } from "./types";

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
	const { uri, status, originalChangeStack, changeStack } = node;
	const [{ change: preChange, ref: preRef }, { ref: curRef }] = getChangePair(
		originalChangeStack,
		changeStack
	);

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
