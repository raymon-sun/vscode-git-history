import { existsSync } from "fs";
import { join } from "path";

export interface IPreferredRepoOptions {
	/** the repository the user picked before, if any */
	stored?: string;
	/** the repositories the Git extension has discovered so far */
	repositories: string[];
	/** the first workspace folder, preferred when it is a repository itself */
	workspacePath?: string;
}

/**
 * Choose the repository to show. A remembered choice wins; otherwise the
 * workspace folder is used when it is a repository itself, and the first
 * repository otherwise.
 *
 * The Git extension discovers repositories asynchronously, so the list can
 * still be incomplete when the view first loads. A remembered path is therefore
 * accepted as soon as it is a usable repository on disk, instead of waiting for
 * it to show up in the list, which would otherwise pick the wrong repository
 * early on and a different one once discovery finished.
 */
export function pickPreferredRepo({
	stored,
	repositories,
	workspacePath,
}: IPreferredRepoOptions): string | undefined {
	if (stored && isUsableRepo(stored, repositories)) {
		return stored;
	}

	return (
		repositories.find((repoPath) => repoPath === workspacePath) ||
		repositories[0]
	);
}

function isUsableRepo(repoPath: string, repositories: string[]) {
	return (
		repositories.includes(repoPath) ||
		// a working tree or a linked worktree both have a `.git` entry
		existsSync(join(repoPath, ".git"))
	);
}
