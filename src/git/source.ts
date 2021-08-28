import cp from "child_process";
import path from "path";
import iconv from "iconv-lite-umd";
import { Uri, workspace } from "vscode";
import { exec } from "../base/process";
import { getGitErrorCode, GitError } from "./error";
import { Change, IExecutionResult, SpawnOptions, Status } from "./types";
import { assign, sanitizePath } from "./utils";

export class GitSource {
	private repositoryRoot = workspace.workspaceFolders![0].uri.fsPath;

	constructor(private binPath: string) {}

	async getChangesByRef(ref: string) {
		const args = [
			"log",
			"-p",
			"-1",
			"--pretty=format:",
			"--name-status",
			"-z",
		];

		if (ref) {
			args.push(ref);
		}

		const gitResult = await this.exec(this.repositoryRoot, args);
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

	private async exec(
		cwd: string,
		args: string[],
		options: SpawnOptions = {}
	): Promise<IExecutionResult<string>> {
		options = assign({ cwd }, options || {});
		const child = this.spawn(args, options);

		if (options.onSpawn) {
			options.onSpawn(child);
		}

		if (options.input) {
			child.stdin!.end(options.input, "utf8");
		}

		const bufferResult = await exec(child);

		let encoding = options.encoding || "utf8";
		encoding = iconv.encodingExists(encoding) ? encoding : "utf8";

		const result: IExecutionResult<string> = {
			exitCode: bufferResult.exitCode,
			stdout: iconv.decode(bufferResult.stdout, encoding),
			stderr: bufferResult.stderr,
		};

		if (bufferResult.exitCode) {
			return Promise.reject<IExecutionResult<string>>(
				new GitError({
					message: "Failed to execute git",
					stdout: result.stdout,
					stderr: result.stderr,
					exitCode: result.exitCode,
					gitErrorCode: getGitErrorCode(result.stderr),
					gitCommand: args[0],
					gitArgs: args,
				})
			);
		}

		return result;
	}

	private spawn(args: string[], options: SpawnOptions = {}): cp.ChildProcess {
		if (!this.binPath) {
			throw new Error("git could not be found in the system.");
		}

		if (!options) {
			options = {};
		}

		if (!options.stdio && !options.input) {
			options.stdio = ["ignore", null, null]; // Unless provided, ignore stdin and leave default streams for stdout and stderr
		}

		options.env = assign({}, process.env, options.env || {}, {
			VSCODE_GIT_COMMAND: args[0],
			LC_ALL: "en_US.UTF-8",
			LANG: "en_US.UTF-8",
			GIT_PAGER: "cat",
		});

		if (options.cwd) {
			options.cwd = sanitizePath(options.cwd);
		}

		return cp.spawn(this.binPath, args, options);
	}
}
