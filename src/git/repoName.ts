export interface RepoDisplayName {
	/** the repository path, as passed in */
	path: string;
	/** a short and unique name to show in the UI */
	name: string;
}

const SEPARATOR = /[\\/]/;

function getSegments(repoPath: string) {
	return repoPath.split(SEPARATOR).filter(Boolean);
}

function shorten(repoPath: string, depth: number) {
	const segments = getSegments(repoPath);
	return segments.slice(Math.max(0, segments.length - depth)).join("/");
}

/**
 * Shorten repository paths to their folder name, one entry per distinct path.
 * Repositories that would share a name (e.g. two `api` folders) keep extra
 * parent folders until every name is unique, so the selector can never show two
 * identical entries.
 */
export function getRepoDisplayNames(paths: string[]): RepoDisplayName[] {
	const uniquePaths = [...new Set(paths)];
	const depth = new Map(uniquePaths.map((repoPath) => [repoPath, 1]));

	// grow the colliding names one segment at a time until all names are unique
	for (;;) {
		const groups = new Map<string, string[]>();
		uniquePaths.forEach((repoPath) => {
			const key = shorten(repoPath, depth.get(repoPath)!);
			groups.set(key, [...(groups.get(key) || []), repoPath]);
		});

		let grew = false;
		groups.forEach((group) => {
			if (group.length < 2) {
				return;
			}

			group.forEach((repoPath) => {
				const currentDepth = depth.get(repoPath)!;
				if (currentDepth < getSegments(repoPath).length) {
					depth.set(repoPath, currentDepth + 1);
					grew = true;
				}
			});
		});

		if (!grew) {
			break;
		}
	}

	return uniquePaths.map((repoPath) => ({
		path: repoPath,
		name: shorten(repoPath, depth.get(repoPath) || 1),
	}));
}
