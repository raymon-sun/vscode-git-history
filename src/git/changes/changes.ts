import path from "path";

import { Uri } from "vscode";

import { Status } from "./status";

import type { ChangeItem } from "./tree";

export interface Change {
	/**
	 * Returns either `originalUri` or `renameUri`, depending
	 * on whether this change is a rename change. When
	 * in doubt always use `uri` over the other two alternatives.
	 */
	readonly uri: Uri;
	readonly originalUri: Uri;
	readonly renameUri: Uri | undefined;
	readonly status: Status;
}

export function parseGitChanges(repoPath: string, gitResult: string) {
	const entries = gitResult.split("\x00");
	let index = 0;
	const result: Change[] = [];

	entriesLoop: while (index < entries.length - 1) {
		const change = entries[index++];
		const resourcePath = entries[index++];
		if (!change || !resourcePath) {
			break;
		}

		const originalUri = Uri.file(
			path.isAbsolute(resourcePath)
				? resourcePath
				: path.join(repoPath, resourcePath)
		);
		let status: Status = Status.UNTRACKED;

		// Copy or Rename status comes with a number, e.g. 'R100'. We don't need the number, so we use only first character of the status.
		switch (change[0]) {
			case "M":
				status = Status.MODIFIED;
				break;

			case "A":
				status = Status.INDEX_ADDED;
				break;

			case "D":
				status = Status.DELETED;
				break;

			// Rename contains two paths, the second one is what the file is renamed/copied to.
			case "R":
				if (index >= entries.length) {
					break;
				}

				const newPath = entries[index++];
				if (!newPath) {
					break;
				}

				const uri = Uri.file(
					path.isAbsolute(newPath)
						? newPath
						: path.join(repoPath, newPath)
				);
				result.push({
					uri,
					renameUri: uri,
					originalUri,
					status: Status.INDEX_RENAMED,
				});

				continue;

			default:
				// Unknown status
				break entriesLoop;
		}

		result.push({
			status,
			originalUri,
			uri: originalUri,
			renameUri: originalUri,
		});
	}

	return result;
}

export function getChangePair(
	originalChangeStack: ChangeItem[] = [],
	changeStack: ChangeItem[]
) {
	const originalChangeItem = originalChangeStack.find(({ change }) => change);

	return [
		originalChangeItem || changeStack[0],
		changeStack[changeStack.length - 1],
	];
}
