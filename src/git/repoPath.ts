const SEPARATOR = /[\\/]/;

/** compare paths independent of the platform separator */
export function normalizePath(fsPath: string) {
	return fsPath.split(SEPARATOR).filter(Boolean).join("/");
}

/**
 * The repository a file belongs to: the longest repository path it sits under,
 * so nested repositories resolve to the innermost one.
 */
export function findRepoForPath(repos: string[], fsPath: string) {
	const target = normalizePath(fsPath);

	return repos
		.filter((repoPath) => {
			const repo = normalizePath(repoPath);
			return target === repo || target.startsWith(`${repo}/`);
		})
		.sort(
			(left, right) =>
				normalizePath(right).length - normalizePath(left).length
		)[0];
}

/** path of the file relative to its repository, using the separators git expects */
export function toRepoRelativePath(repoPath: string, fsPath: string) {
	const repo = normalizePath(repoPath);
	const target = normalizePath(fsPath);

	if (target === repo) {
		return "";
	}

	return target.startsWith(`${repo}/`)
		? target.slice(repo.length + 1)
		: target;
}
