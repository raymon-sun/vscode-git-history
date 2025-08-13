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
	/** repository name */
	string,
	ICommitGraphSlice?
];

export type IRoughCommit = [
	/** hash */
	string,
	/** parents */
	string[],
	/** commit data */
	string,
	/** repository name */
	string,
	/** author date */
	number
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
	REPOSITORY_NAME,
	GRAPH_SLICE,
}

export const REFS_SEPARATOR = ", ";

export function parseCommits(data: string, repo: string) {
	const commitRegex =
		/([0-9a-f]{40})\n(.*)\n(.*)\n(.*)\n(.*)\n(.*)\n(.*)(?:\n([^]*?))?(?:\x00)/gm;

	let commits: IRoughCommit[] = [];

	let commitData;
	let ref;
	let parents;
	let authorDate
	let match;

	do {
		match = commitRegex.exec(data);
		if (match === null) {
			break;
		}

		[commitData, ref, , , , authorDate, , parents] = match;

		// Stop excessive memory usage by using substr -- https://bugs.chromium.org/p/v8/issues/detail?id=2869
		const commit: IRoughCommit = [
			` ${ref}`.substr(1),
			parents ? parents.split(" ") : [],
			commitData,
			repo,
			authorDate ? Number(authorDate) * 1000 : 0
		];

		commits.push(commit);
	} while (true);

	return commits;
}

export function parseCommit(commitData: string): ICommit {
	const commitRegex =
		/([0-9a-f]{40})\n(.*)\n(.*)\n(.*)\n(.*)\n(.*)\n(.*)(?:\n([^]*?))?(?:\x00)(.*)\n(.*)\n(.*)\n(.*)/g;

	let ref;
	let refNames;
	let authorName;
	let authorEmail;
	let authorDate;
	let commitDate;
	let parents;
	let message;
	let repositoryName;
	let commitPosition;
	let commitColor;
	let stringifiedLines;
	let match;

	match = commitRegex.exec(commitData)!;

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
		repositoryName,
		commitPosition,
		commitColor,
		stringifiedLines,
	] = match;

	if (message[message.length - 1] === "\n") {
		message = message.substr(0, message.length - 1);
	}

	// Stop excessive memory usage by using substr -- https://bugs.chromium.org/p/v8/issues/detail?id=2869
	return [
		` ${ref}`.substr(1),
		refNames ? refNames.split(REFS_SEPARATOR) : [],
		` ${message}`.substr(1),
		parents ? parents.split(" ") : [],
		new Date(Number(authorDate) * 1000).toLocaleString(),
		` ${authorEmail}`.substr(1),
		` ${authorName}`.substr(1),
		new Date(Number(commitDate) * 1000).toLocaleString(),
		repositoryName,
		[Number(commitPosition), commitColor, JSON.parse(stringifiedLines)],
	];
}
