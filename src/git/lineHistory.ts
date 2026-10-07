/**
 * `git log -L` traces the history of a line range, which is what backs the
 * Selection History command. It streams a patch per commit, so the commits are
 * read back from the format line that starts each entry rather than from a
 * `-z` separated log.
 */
export const LINE_HISTORY_FORMAT = "%H%x1f%an%x1f%at%x1f%s";

const UNIT_SEPARATOR = "\x1f";
const HASH_PATTERN = /^[0-9a-f]{40}$/;

export interface ILineHistoryCommit {
	hash: string;
	author: string;
	/** author timestamp, in seconds */
	timestamp: number;
	subject: string;
}

export interface ILineRange {
	/** first selected line, 1-based */
	startLine: number;
	/** last selected line, 1-based */
	endLine: number;
}

interface ISelectionLike {
	start: { line: number; character: number };
	end: { line: number; character: number };
}

/**
 * Convert an editor selection to a 1-based line range. A selection that ends at
 * column 0 of a line does not include that line, so it is trimmed the way git
 * and other editors expect.
 */
export function getSelectedLineRange(selection: ISelectionLike): ILineRange {
	const { start, end } = selection;
	// `git log -L` needs an ordered range, so normalize the two ends
	const [from, to] = start.line <= end.line ? [start, end] : [end, start];
	const endsOnLineStart = to.character === 0 && to.line > from.line;

	return {
		startLine: from.line + 1,
		endLine: (endsOnLineStart ? to.line - 1 : to.line) + 1,
	};
}

/**
 * Pick the commits out of `git log -L` output. Every commit is introduced by
 * the format line, so any line whose first field is a full hash is a commit and
 * everything else (the patches) is ignored.
 */
export function parseLineHistory(raw: string): ILineHistoryCommit[] {
	const commits: ILineHistoryCommit[] = [];
	const seen = new Set<string>();

	raw.split("\n").forEach((line) => {
		if (!line.includes(UNIT_SEPARATOR)) {
			return;
		}

		const [hash, author, timestamp, subject = ""] =
			line.split(UNIT_SEPARATOR);

		if (!HASH_PATTERN.test(hash) || seen.has(hash)) {
			return;
		}

		const parsedTimestamp = Number(timestamp);
		if (!Number.isFinite(parsedTimestamp)) {
			return;
		}

		seen.add(hash);
		commits.push({
			hash,
			author,
			timestamp: parsedTimestamp,
			subject,
		});
	});

	return commits;
}
