import cp from "child_process";
import { CancellationToken, ThemeColor, Uri } from "vscode";
import { loadMessageBundle } from "vscode-nls";

const localize = loadMessageBundle();

export interface SpawnOptions extends cp.SpawnOptions {
	input?: string;
	encoding?: string;
	log?: boolean;
	cancellationToken?: CancellationToken;
	onSpawn?: (childProcess: cp.ChildProcess) => void;
}

export interface GitOptions {
	repo?: string;
}

export interface LogOptions extends GitOptions {
	ref?: string;
	author?: string;
	keyword?: string;
	maxLength?: number;
}

export interface IExecutionResult<T extends string | Buffer> {
	exitCode: number;
	stdout: T;
	stderr: string;
}

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

export const enum Status {
	INDEX_MODIFIED,
	INDEX_ADDED,
	INDEX_DELETED,
	INDEX_RENAMED,
	INDEX_COPIED,

	MODIFIED,
	DELETED,
	UNTRACKED,
	IGNORED,
	INTENT_TO_ADD,

	ADDED_BY_US,
	ADDED_BY_THEM,
	DELETED_BY_US,
	DELETED_BY_THEM,
	BOTH_ADDED,
	BOTH_DELETED,
	BOTH_MODIFIED,
}

export function getColor(status: Status): ThemeColor {
	switch (status) {
		case Status.INDEX_MODIFIED:
			return new ThemeColor(
				"gitDecoration.stageModifiedResourceForeground"
			);
		case Status.MODIFIED:
			return new ThemeColor("gitDecoration.modifiedResourceForeground");
		case Status.INDEX_DELETED:
			return new ThemeColor(
				"gitDecoration.stageDeletedResourceForeground"
			);
		case Status.DELETED:
			return new ThemeColor("gitDecoration.deletedResourceForeground");
		case Status.INDEX_ADDED:
		case Status.INTENT_TO_ADD:
			return new ThemeColor("gitDecoration.addedResourceForeground");
		case Status.INDEX_COPIED:
		case Status.INDEX_RENAMED:
			return new ThemeColor("gitDecoration.renamedResourceForeground");
		case Status.UNTRACKED:
			return new ThemeColor("gitDecoration.untrackedResourceForeground");
		case Status.IGNORED:
			return new ThemeColor("gitDecoration.ignoredResourceForeground");
		case Status.BOTH_DELETED:
		case Status.ADDED_BY_US:
		case Status.DELETED_BY_THEM:
		case Status.ADDED_BY_THEM:
		case Status.DELETED_BY_US:
		case Status.BOTH_ADDED:
		case Status.BOTH_MODIFIED:
			return new ThemeColor(
				"gitDecoration.conflictingResourceForeground"
			);
		default:
			throw new Error("Unknown git status: " + status);
	}
}

export function getStatusText(status: Status) {
	switch (status) {
		case Status.INDEX_MODIFIED:
			return localize("index modified", "Index Modified");
		case Status.MODIFIED:
			return localize("modified", "Modified");
		case Status.INDEX_ADDED:
			return localize("index added", "Index Added");
		case Status.INDEX_DELETED:
			return localize("index deleted", "Index Deleted");
		case Status.DELETED:
			return localize("deleted", "Deleted");
		case Status.INDEX_RENAMED:
			return localize("index renamed", "Index Renamed");
		case Status.INDEX_COPIED:
			return localize("index copied", "Index Copied");
		case Status.UNTRACKED:
			return localize("untracked", "Untracked");
		case Status.IGNORED:
			return localize("ignored", "Ignored");
		case Status.INTENT_TO_ADD:
			return localize("intent to add", "Intent to Add");
		case Status.BOTH_DELETED:
			return localize("both deleted", "Conflict: Both Deleted");
		case Status.ADDED_BY_US:
			return localize("added by us", "Conflict: Added By Us");
		case Status.DELETED_BY_THEM:
			return localize("deleted by them", "Conflict: Deleted By Them");
		case Status.ADDED_BY_THEM:
			return localize("added by them", "Conflict: Added By Them");
		case Status.DELETED_BY_US:
			return localize("deleted by us", "Conflict: Deleted By Us");
		case Status.BOTH_ADDED:
			return localize("both added", "Conflict: Both Added");
		case Status.BOTH_MODIFIED:
			return localize("both modified", "Conflict: Both Modified");
		default:
			return "";
	}
}
