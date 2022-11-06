import { ICommit } from "./commit";

export interface GitOptions {
	repo?: string;
}

export interface LogOptions extends GitOptions {
	ref?: string;
	authors?: string[];
	keyword?: string;
	maxLength?: number;
	count?: number;
	skip?: number;
}

export type ICommitGraphSlice = [number, string, ICommitGraphLine[]];

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
	commits: ICommit[];
	options: LogOptions;
}
