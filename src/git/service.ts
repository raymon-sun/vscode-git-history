import { Pool, spawn, Worker } from "threads";

import { injectable } from "inversify";
import simpleGit, { SimpleGit } from "simple-git";

import { EventEmitter, Uri, workspace } from "vscode";

import { API, Repository } from "../typings/scmExtension";

import { getBuiltInGitApi, getGitBinPath } from "./api";

import { GitOptions, LogOptions } from "./types";
import { parseGitChanges } from "./changes/changes";
import {
	ILineHistoryCommit,
	LINE_HISTORY_FORMAT,
	parseLineHistory,
} from "./lineHistory";
import { pickPreferredRepo } from "./preferredRepo";
import { findRepoForPath } from "./repoPath";
import { parseGitAuthors, parseGitConfig } from "./utils";

import type { GitWorker } from "./worker";
import { IRoughCommit } from "./commit";

const LOG_TYPE_ARGS = ["--branches", "--remotes", "--tags"];

/** an upper bound for `git log -L`, whose output carries a patch per commit */
export const LINE_HISTORY_MAX_COUNT = 100;

/**
 * `-m` makes merge commits emit a diff (they are skipped by default), and
 * `--first-parent` keeps that diff relative to the first parent, so a merge
 * shows the changes it introduced.
 */
export function buildChangesByRefArgs(ref: string) {
	return [
		"log",
		"-m",
		"-1",
		"--first-parent",
		"--pretty=format:",
		"--name-status",
		"-z",
		ref,
	];
}

/**
 * The changes between two revisions. `--name-status -z` emits the same records
 * as `log --name-status -z`, so the change parser and the change tree can be
 * reused as they are.
 */
export function buildChangesBetweenArgs(fromRef: string, toRef: string) {
	return ["diff", "--name-status", "-z", fromRef, toRef];
}

export type ResetMode = "soft" | "mixed" | "hard";

/** `checkout -b` creates the branch and switches to it in one step */
export function buildCreateBranchArgs(name: string, startPoint: string) {
	return ["checkout", "-b", name, startPoint];
}

export function buildAddTagArgs(name: string, hash: string) {
	return ["tag", name, hash];
}

export function buildCherryPickArgs(hash: string) {
	return ["cherry-pick", hash];
}

/** `--no-edit` keeps the revert from opening an editor for the produced commit */
export function buildRevertArgs(hash: string) {
	return ["revert", "--no-edit", hash];
}

export function buildResetArgs(mode: ResetMode, hash: string) {
	return ["reset", `--${mode}`, hash];
}

/**
 * `-L` restricts the log to the given line range, which is how the history of a
 * selection is obtained. The cap keeps the (patch carrying) output bounded.
 *
 * `fromRef` is where the trace starts: the line range is interpreted at that
 * revision, which is what makes the line numbers of a revision document (a
 * `git:` side of a diff) meaningful. It has to be a positional argument;
 * `-L` does not accept the `<rev>:<file>` form.
 */
export function buildLineHistoryArgs(
	filePath: string,
	startLine: number,
	endLine: number,
	maxCount: number,
	fromRef?: string
) {
	return [
		"log",
		"-L",
		`${startLine},${endLine}:${filePath}`,
		"-n",
		String(maxCount),
		`--format=${LINE_HISTORY_FORMAT}`,
		...(fromRef ? [fromRef] : []),
	];
}

@injectable()
export class GitService {
	private gitExt?: API;
	private git?: SimpleGit;
	private readonly rootRepoPath = workspace.workspaceFolders![0].uri.fsPath;

	private storedRepos: string[] = [];
	private readonly reposEvent = new EventEmitter<string[]>();
	private pool = Pool(() => spawn<GitWorker>(new Worker("./worker")), 8);

	constructor() {
		this.initializeGitApi();
	}

	private async initializeGitApi() {
		this.gitExt = (await getBuiltInGitApi())!;

		const gitBinPath = await getGitBinPath();

		this.git = simpleGit(this.rootRepoPath, {
			binary: gitBinPath,
			maxConcurrentProcesses: 10,
		});

		this.initializeReposEvents();
	}

	private initializeReposEvents() {
		const handler = () => {
			this.storedRepos = this.getRepositories() || [];
			this.reposEvent.fire(this.storedRepos);
		};

		this.gitExt?.onDidOpenRepository(handler);
		this.gitExt?.onDidCloseRepository(handler);
	}

	getConfig(repo: string) {
		return this.git
			?.cwd(repo)
			?.raw("config", "--list")
			.then((res) => parseGitConfig(res));
	}

	getDefaultRepository() {
		return pickPreferredRepo({
			repositories: this.getRepositories(),
			workspacePath: workspace.workspaceFolders?.[0]?.uri.fsPath,
		});
	}

	getRepositories() {
		return (
			this.gitExt?.repositories.map(({ rootUri }) => rootUri.fsPath) || []
		);
	}

	getRefs(options: GitOptions) {
		const { repo = this.rootRepoPath } = options;
		return this.git
			?.cwd(repo)
			.raw(
				"for-each-ref",
				"--sort",
				"-committerdate",
				"--format=%(objectname) %(refname)"
			)
			.then((res) => {
				const refs: { hash: string; type: string; name: string }[] = [];
				res.split("\n").forEach((item) => {
					if (!item) {
						return;
					}

					const [, hash, type, name] =
						item.match(
							/^([A-Fa-f0-9]+) refs\/(heads|remotes|tags)\/(.*)$/
						) || [];

					if (hash && type && name) {
						refs.push({ hash, type, name });
					}
				});

				return refs;
			});
	}

	getAuthors(
		options: GitOptions
	): Promise<{ name: string; email: string; isSelf?: true }[]> {
		const { repo = this.rootRepoPath } = options;
		return Promise.allSettled([
			this.git?.cwd(repo)?.raw("shortlog", "-ens", "HEAD"),
			this.getConfig(repo),
		]).then(([settledShortLogResult, settledConfigResult]) => {
			if (
				settledShortLogResult.status !== "fulfilled" ||
				settledConfigResult.status !== "fulfilled"
			) {
				return [];
			}

			const allAuthors = parseGitAuthors(
				settledShortLogResult.value || ""
			);

			const selfAuthor = {
				name: settledConfigResult.value?.["user.name"] || "",
				email: settledConfigResult.value?.["user.email"] || "",
				isSelf: true,
			};

			const otherAuthors = allAuthors.filter(
				({ name, email }) =>
					name !== selfAuthor.name || email !== selfAuthor.email
			);

			if (otherAuthors.length === allAuthors.length) {
				return allAuthors;
			}

			return [selfAuthor, ...otherAuthors];
		});
	}

	async show(commitHash: string, filePath: string) {
		// TODO: record repo path in file node / replace gitExt
		const repoPath = this.getRepositories()
			.sort((fsPathA, fsPathB) => fsPathB.length - fsPathA.length)
			.find((fsPath) => filePath.startsWith(fsPath));

		return await this.gitExt?.repositories
			.find((repo) => repo.rootUri.fsPath === repoPath)!
			.show(commitHash, filePath);
	}

	async getCommits(options?: LogOptions) {
		const COMMIT_FORMAT = "%H%n%D%n%aN%n%aE%n%at%n%ct%n%P%n%B";
		const {
			repo,
			authors,
			keyword,
			ref,
			filePath,
			maxLength,
			count,
			skip,
		} = options || {};
		const args = [
			"log",
			`--format=${COMMIT_FORMAT}`,
			"-z",
			...(ref ? [ref] : LOG_TYPE_ARGS),
			"--author-date-order",
		];

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

		if (filePath) {
			// the pathspec has to come last
			args.push("--", filePath);
		}

		return await this.git
			?.cwd(repo || this.rootRepoPath)
			.raw(args)
			.then<IRoughCommit[]>((res) =>
				this.pool.queue(({ parseCommits }) => parseCommits(res))
			)
			.catch((err) => console.log(err));
	}

	async getCommitsTotalCount(options?: LogOptions) {
		const { repo, ref, authors, keyword, filePath } = options || {};

		// TODO: reuse arguments assembly process in getCommits
		const args = ["rev-list", ...(ref ? [ref] : LOG_TYPE_ARGS), "--count"];

		if (authors && authors.length) {
			args.push(...authors.map((author) => `--author=${author}`));
		}

		if (keyword) {
			args.push(`--grep=${keyword}`, `-i`);
		}

		if (filePath) {
			args.push("--", filePath);
		}

		return await this.git
			?.cwd(repo || this.rootRepoPath)
			.raw(args)
			.catch((err) => console.log(err));
	}

	async getChangesCollection(repoPath: string, refs: string[]) {
		return await Promise.all(
			refs.map((ref) =>
				this.getChangesByRef(repoPath, ref).then((changes) => ({
					ref,
					repoPath,
					changes,
				}))
			)
		);
	}

	async getChangesByRef(repoPath: string, ref: string) {
		return await this.git!.cwd(repoPath || this.rootRepoPath)
			.raw(buildChangesByRefArgs(ref))
			.then((res) => parseGitChanges(repoPath, res));
	}

	/** the changes between two revisions, to compare arbitrary commits */
	async getChangesBetween(repoPath: string, fromRef: string, toRef: string) {
		return await this.git!.cwd(repoPath || this.rootRepoPath)
			.raw(buildChangesBetweenArgs(fromRef, toRef))
			.then((res) => parseGitChanges(repoPath, res));
	}

	private gitAt(repo?: string) {
		return this.git!.cwd(repo || this.rootRepoPath);
	}

	/** create a branch at `hash` and switch to it */
	async createBranch(repo: string | undefined, name: string, hash: string) {
		return this.gitAt(repo).raw(buildCreateBranchArgs(name, hash));
	}

	/** check out `hash` directly, leaving the repository on a detached HEAD */
	async checkoutCommit(repo: string | undefined, hash: string) {
		return this.gitAt(repo).raw(["checkout", hash]);
	}

	async addTag(repo: string | undefined, name: string, hash: string) {
		return this.gitAt(repo).raw(buildAddTagArgs(name, hash));
	}

	async deleteTag(repo: string | undefined, name: string) {
		return this.gitAt(repo).raw(["tag", "-d", name]);
	}

	async cherryPick(repo: string | undefined, hash: string) {
		return this.gitAt(repo).raw(buildCherryPickArgs(hash));
	}

	async revertCommit(repo: string | undefined, hash: string) {
		return this.gitAt(repo).raw(buildRevertArgs(hash));
	}

	async resetToCommit(
		repo: string | undefined,
		hash: string,
		mode: ResetMode
	) {
		return this.gitAt(repo).raw(buildResetArgs(mode, hash));
	}

	/** the repository an absolute path belongs to */
	getRepoForPath(fsPath: string) {
		return findRepoForPath(this.getRepositories(), fsPath);
	}

	/**
	 * Whether the path differs from HEAD in the working tree. `git log -L` traces
	 * the line numbers of the committed file, so this is used to warn that a
	 * pending edit can point the line history at different lines.
	 */
	async hasUncommittedChanges(repo: string | undefined, filePath: string) {
		return this.gitAt(repo)
			.raw(["status", "--porcelain", "--", filePath])
			.then((result) => result.trim().length > 0);
	}

	/**
	 * The commits that touched the given line range of a file, newest first;
	 * the Selection History command. `git log -L` fails when the range does not
	 * exist at that revision, so the caller surfaces the error to the user.
	 */
	async getLineHistory(
		repo: string | undefined,
		filePath: string,
		startLine: number,
		endLine: number,
		fromRef?: string,
		maxCount = LINE_HISTORY_MAX_COUNT
	): Promise<ILineHistoryCommit[]> {
		return this.gitAt(repo)
			.raw(
				buildLineHistoryArgs(
					filePath,
					startLine,
					endLine,
					maxCount,
					fromRef
				)
			)
			.then(parseLineHistory);
	}

	onReposChange(handler: (repos: string[]) => void) {
		handler(this.storedRepos);
		this.reposEvent.event((repos) => {
			handler(repos);
		});
	}

	// can only be called once
	/** different from #onReposChange,
	 * the handler should be fired when the contents of repository changes,
	 * such as index/stash/commit/push
	 */
	onDidRepoChange(handler: (repository: Repository) => void) {
		this.gitExt?.repositories?.forEach((repository) =>
			repository.state.onDidChange(() => handler(repository))
		);
	}

	// TODO: pr options params to vscode
	toGitUri(uri: Uri, ref: string) {
		return this.gitExt?.toGitUri(uri, ref);
	}
}
