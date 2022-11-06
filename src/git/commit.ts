import { ICommitGraphSlice } from "./types";

export type ICommit = [
	/** hash */
	string,
	/** ref names */
	string[],
	/** message */
	string,
	/** parents */
	string[],
	/** commit date */
	string,
	/** author email */
	string,
	/** author name */
	string,
	/** author date */
	string,
	ICommitGraphSlice?
];

export enum CommitIndex {
	HASH,
	REF_NAMES,
	MESSAGE,
	PARENTS,
	COMMIT_DATE,
	AUTHOR_EMAIL,
	AUTHOR_NAME,
	AUTHOR_DATE,
	GRAPH_SLICE,
}

export const REFS_SEPARATOR = ", ";

export function parseCommits(data: string): ICommit[] {
	const commitRegex =
		/([0-9a-f]{40})\n(.*)\n(.*)\n(.*)\n(.*)\n(.*)\n(.*)(?:\n([^]*?))?(?:\x00)/gm;

	let commits: ICommit[] = [];

	let ref;
	let refNames;
	let authorName;
	let authorEmail;
	let authorDate;
	let commitDate;
	let parents;
	let message;
	let match;

	do {
		match = commitRegex.exec(data);
		if (match === null) {
			break;
		}

		[
			,
			ref,
			refNames,
			authorName,
			authorEmail,
			authorDate,
			commitDate,
			parents,
			message,
		] = match;

		if (message[message.length - 1] === "\n") {
			message = message.substr(0, message.length - 1);
		}

		// Stop excessive memory usage by using substr -- https://bugs.chromium.org/p/v8/issues/detail?id=2869
		const commit: ICommit = [
			` ${ref}`.substr(1),
			refNames ? refNames.split(REFS_SEPARATOR) : [],
			` ${message}`.substr(1),
			parents ? parents.split(" ") : [],
			new Date(Number(authorDate) * 1000).toLocaleString(),
			` ${authorName}`.substr(1),
			` ${authorEmail}`.substr(1),
			new Date(Number(commitDate) * 1000).toLocaleString(),
		];

		commits.push(commit);
	} while (true);

	return commits;
}
