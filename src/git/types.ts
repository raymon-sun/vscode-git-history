import { IRoughCommit } from "./commit";
import { ILineRange } from "./lineHistory";

export interface GitOptions {
	repo?: string;
}

export interface LogOptions extends GitOptions {
	ref?: string;
	authors?: string[];
	keyword?: string;
	/** repository-relative path to restrict the history to */
	filePath?: string;
	/** line range of the selection history filter, shown next to the view title */
	lineRange?: ILineRange;
	/** show exactly these commits; the caller resolved them, e.g. by `git log -L` */
	hashes?: string[];
	maxLength?: number;
	count?: number;
	skip?: number;
}

export type ICommitGraphSlice = [
	/** commit position */
	number,
	/** commit color */
	string,
	/** lines */
	(number | string)[]
];

export type ICommitGraphLine = [
	/** top */
	number,
	/** bottom */
	number,
	/** color */
	string
];

export enum CommitGraphSliceIndex {
	COMMIT_INDEX,
	COMMIT_COLOR,
	LINES,
}

export interface BatchedCommits {
	totalCount: number;
	batchNumber: number;
	commits: IRoughCommit[];
	options: LogOptions;
}

export type IBatchedCommits = [
	/** total count */
	number,
	/** batch number */
	number,
	/** option:ref */
	string,
	/** options:authors */
	string,
	/** options:keyword */
	string,
	/** option:maxLength */
	number,
	/** commit data collection */
	...string[]
];
