import path from "path";
import os from "os";
import { injectable } from "inversify";
import { Uri, workspace, version as vscodeVersion, env } from "vscode";
import { findGit, getBuiltInGitApi } from "./api";
import { API, Change, Status } from "../typings/git-extension";
import { GitBase } from "./base";

@injectable()
export class GitService {
	private gitApi?: API;
	private git?: GitBase;
	private repositoryRoot = workspace.workspaceFolders![0].uri.fsPath;

	constructor() {
		this.initializeGitApi();
	}

	private async initializeGitApi() {
		this.gitApi = (await getBuiltInGitApi())!;

		const pathValue = workspace
			.getConfiguration("git")
			.get<string | string[]>("path");
		let pathHints = Array.isArray(pathValue)
			? pathValue
			: pathValue
			? [pathValue]
			: [];
		const { isTrusted, workspaceFolders = [] } = workspace;
		const excludes = isTrusted
			? []
			: workspaceFolders.map((f) =>
					path.normalize(f.uri.fsPath).replace(/[\r\n]+$/, "")
			  );
		const info = await findGit(pathHints, (gitPath) => {
			if (excludes.length === 0) {
				return true;
			}

			const normalized = path.normalize(gitPath).replace(/[\r\n]+$/, "");
			const skip = excludes.some((e) => normalized.startsWith(e));
			return !skip;
		});

		this.git = new GitBase({
			gitPath: info.path,
			userAgent: `git/${info.version} (${
				(os as any).version?.() ?? os.type()
			} ${os.release()}; ${os.platform()} ${os.arch()}) vscode/${vscodeVersion} (${
				env.appName
			})`,
			version: info.version,
		});
	}

	async show(commitHash: string, filePath: string) {
		return await this.gitApi?.repositories[0].show(commitHash, filePath);
	}

	async getCommits() {
		return await this.gitApi?.repositories[0].log();
	}

	async diffBetween(refs: string[]) {
		const [ref1, ref2] = refs;
		const repository = this.gitApi?.repositories[0];
		return await repository!.diffBetween(ref1, ref2);
	}

	async getChangesCollection(refs: string[]) {
		const result = await this.diffFiles(false, `${refs[1]}...${refs[0]}`);
		console.log(result);
		const repository = this.gitApi?.repositories[0];
		return await Promise.all(
			refs.map((ref) =>
				repository!
					.diffBetween(`${ref}~`, ref)
					.then((changes) => ({ ref, changes }))
			)
		);
	}

	async diffFiles(cached: boolean, ref?: string) {
		const args = ["diff", "--name-status", "-z", "--diff-filter=ADMR"];
		if (cached) {
			args.push("--cached");
		}

		if (ref) {
			args.push(ref);
		}

		const gitResult = await this.git!.exec(this.repositoryRoot, args);
		if (gitResult.exitCode) {
			return [];
		}

		const entries = gitResult.stdout.split("\x00");
		let index = 0;
		const result: Change[] = [];

		entriesLoop: while (index < entries.length - 1) {
			const change = entries[index++];
			const resourcePath = entries[index++];
			if (!change || !resourcePath) {
				break;
			}

			const originalUri = Uri.file(
				path.isAbsolute(resourcePath)
					? resourcePath
					: path.join(this.repositoryRoot, resourcePath)
			);
			let status: Status = Status.UNTRACKED;

			// Copy or Rename status comes with a number, e.g. 'R100'. We don't need the number, so we use only first character of the status.
			switch (change[0]) {
				case "M":
					status = Status.MODIFIED;
					break;

				case "A":
					status = Status.INDEX_ADDED;
					break;

				case "D":
					status = Status.DELETED;
					break;

				// Rename contains two paths, the second one is what the file is renamed/copied to.
				case "R":
					if (index >= entries.length) {
						break;
					}

					const newPath = entries[index++];
					if (!newPath) {
						break;
					}

					const uri = Uri.file(
						path.isAbsolute(newPath)
							? newPath
							: path.join(this.repositoryRoot, newPath)
					);
					result.push({
						uri,
						renameUri: uri,
						originalUri,
						status: Status.INDEX_RENAMED,
					});

					continue;

				default:
					// Unknown status
					break entriesLoop;
			}

			result.push({
				status,
				originalUri,
				uri: originalUri,
				renameUri: originalUri,
			});
		}

		return result;
	}
}
