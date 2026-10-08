import { ILineRange } from "../../../git/lineHistory";

export interface IHistoryDescriptionParts {
	repoName?: string;
	filePath?: string;
	/** set when the history is restricted to the commits of a line range */
	lineRange?: ILineRange;
	totalCount: number;
}

/**
 * The text shown next to the view title, e.g. `api · src/a.ts · 12 commits`, or
 * `api · src/a.ts:20-24 · 2 commits` for a selection history, so it is always
 * clear which repository and which filter are on screen.
 */
export function formatHistoryDescription({
	repoName,
	filePath,
	lineRange,
	totalCount,
}: IHistoryDescriptionParts) {
	return [
		repoName,
		formatFilter(filePath, lineRange),
		`${totalCount} commits`,
	]
		.filter(Boolean)
		.join(" · ");
}

function formatFilter(filePath?: string, lineRange?: ILineRange) {
	if (!filePath) {
		return "";
	}

	return lineRange
		? `${filePath}:${lineRange.startLine}-${lineRange.endLine}`
		: filePath;
}
