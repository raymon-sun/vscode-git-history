export interface IHistoryDescriptionParts {
	repoName?: string;
	filePath?: string;
	totalCount: number;
}

/**
 * The text shown next to the view title, e.g. `api · src/a.ts · 12 commits`, so
 * it is always clear which repository and which path filter are on screen.
 */
export function formatHistoryDescription({
	repoName,
	filePath,
	totalCount,
}: IHistoryDescriptionParts) {
	return [repoName, filePath, `${totalCount} commits`]
		.filter(Boolean)
		.join(" · ");
}
