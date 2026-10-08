import { LogOptions } from "./types";

/**
 * `%H%n%D%n%aN%n%aE%n%at%n%ct%n%P%n%B`, read back by `parseCommits` from the
 * `-z` separated records.
 */
export const COMMIT_FORMAT = "%H%n%D%n%aN%n%aE%n%at%n%ct%n%P%n%B";

/** the refs the history covers when the view is not pinned to one */
export const LOG_TYPE_ARGS = ["--branches", "--remotes", "--tags"];

/**
 * Assemble the `git log` arguments for the history view. An explicit commit set
 * (see `LogOptions.hashes`) is listed as given, newest first, because it was
 * resolved elsewhere, e.g. by `git log -L` for a selection.
 */
export function buildLogArgs(options?: LogOptions) {
	const { authors, keyword, ref, filePath, hashes, maxLength, count, skip } =
		options || {};
	const hasCommitSet = !!hashes && hashes.length > 0;

	const args = ["log", `--format=${COMMIT_FORMAT}`, "-z"];

	if (hasCommitSet) {
		// `--no-walk` lists the given commits without their ancestors
		args.push("--no-walk", ...hashes);
	} else {
		args.push(...(ref ? [ref] : LOG_TYPE_ARGS), "--author-date-order");
	}

	if (authors && authors.length) {
		args.push(...authors.map((author) => `--author=${author}`));
	}

	if (keyword) {
		args.push(`--grep=${keyword}`, `-i`);
	}

	if (maxLength) {
		args.push(`-n${maxLength}`);
	}

	if (skip) {
		args.push(`--skip=${skip}`);
	}

	if (count) {
		args.push(`-${count}`);
	}

	// the pathspec has to come last; a commit set is already limited to the
	// files those commits touched, so it needs none
	if (filePath && !hasCommitSet) {
		args.push("--", filePath);
	}

	return args;
}
