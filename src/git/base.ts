import cp from "child_process";
import EventEmitter from "events";
import { CancellationToken, Disposable, Event } from "vscode";
import * as iconv from "iconv-lite-umd";
import { assign } from "./utils";
import { GitErrorCodes } from "../typings/git-extension";

export interface IGitOptions {
	gitPath: string;
	userAgent: string;
	version: string;
	env?: any;
}

export interface IGitErrorData {
	error?: Error;
	message?: string;
	stdout?: string;
	stderr?: string;
	exitCode?: number;
	gitErrorCode?: string;
	gitCommand?: string;
	gitArgs?: string[];
}

export interface SpawnOptions extends cp.SpawnOptions {
	input?: string;
	encoding?: string;
	log?: boolean;
	cancellationToken?: CancellationToken;
	onSpawn?: (childProcess: cp.ChildProcess) => void;
}

export interface IExecutionResult<T extends string | Buffer> {
	exitCode: number;
	stdout: T;
	stderr: string;
}

export interface IDisposable {
	dispose(): void;
}

export class GitBase {
	readonly path: string;
	readonly userAgent: string;
	readonly version: string;
	private env: any;

	private _onOutput = new EventEmitter();
	get onOutput(): EventEmitter {
		return this._onOutput;
	}

	constructor(options: IGitOptions) {
		this.path = options.gitPath;
		this.version = options.version;
		this.userAgent = options.userAgent;
		this.env = options.env || {};
	}

	async exec(
		cwd: string,
		args: string[],
		options: SpawnOptions = {}
	): Promise<IExecutionResult<string>> {
		options = assign({ cwd }, options || {});
		return await this._exec(args, options);
	}

	private async _exec(
		args: string[],
		options: SpawnOptions = {}
	): Promise<IExecutionResult<string>> {
		const child = this.spawn(args, options);

		if (options.onSpawn) {
			options.onSpawn(child);
		}

		if (options.input) {
			child.stdin!.end(options.input, "utf8");
		}

		const bufferResult = await exec(child, options.cancellationToken);

		if (options.log !== false && bufferResult.stderr.length > 0) {
			this.log(`${bufferResult.stderr}\n`);
		}

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

	spawn(args: string[], options: SpawnOptions = {}): cp.ChildProcess {
		if (!this.path) {
			throw new Error("git could not be found in the system.");
		}

		if (!options) {
			options = {};
		}

		if (!options.stdio && !options.input) {
			options.stdio = ["ignore", null, null]; // Unless provided, ignore stdin and leave default streams for stdout and stderr
		}

		options.env = assign({}, process.env, this.env, options.env || {}, {
			VSCODE_GIT_COMMAND: args[0],
			LC_ALL: "en_US.UTF-8",
			LANG: "en_US.UTF-8",
			GIT_PAGER: "cat",
		});

		if (options.cwd) {
			options.cwd = sanitizePath(options.cwd);
		}

		if (options.log !== false) {
			this.log(`> git ${args.join(" ")}\n`);
		}

		return cp.spawn(this.path, args, options);
	}

	private log(output: string): void {
		this._onOutput.emit("log", output);
	}
}

export class GitError {
	error?: Error;
	message: string;
	stdout?: string;
	stderr?: string;
	exitCode?: number;
	gitErrorCode?: string;
	gitCommand?: string;
	gitArgs?: string[];

	constructor(data: IGitErrorData) {
		if (data.error) {
			this.error = data.error;
			this.message = data.error.message;
		} else {
			this.error = undefined;
			this.message = "";
		}

		this.message = this.message || data.message || "Git error";
		this.stdout = data.stdout;
		this.stderr = data.stderr;
		this.exitCode = data.exitCode;
		this.gitErrorCode = data.gitErrorCode;
		this.gitCommand = data.gitCommand;
		this.gitArgs = data.gitArgs;
	}

	toString(): string {
		let result =
			this.message +
			" " +
			JSON.stringify(
				{
					exitCode: this.exitCode,
					gitErrorCode: this.gitErrorCode,
					gitCommand: this.gitCommand,
					stdout: this.stdout,
					stderr: this.stderr,
				},
				null,
				2
			);

		if (this.error) {
			result += (<any>this.error).stack;
		}

		return result;
	}
}

async function exec(
	child: cp.ChildProcess,
	cancellationToken?: CancellationToken
): Promise<IExecutionResult<Buffer>> {
	if (!child.stdout || !child.stderr) {
		throw new GitError({
			message: "Failed to get stdout or stderr from git process.",
		});
	}

	if (cancellationToken && cancellationToken.isCancellationRequested) {
		throw new GitError({ message: "Cancelled" });
	}

	const disposables: IDisposable[] = [];

	const once = (
		ee: NodeJS.EventEmitter,
		name: string,
		fn: (...args: any[]) => void
	) => {
		ee.once(name, fn);
		disposables.push(toDisposable(() => ee.removeListener(name, fn)));
	};

	const on = (
		ee: NodeJS.EventEmitter,
		name: string,
		fn: (...args: any[]) => void
	) => {
		ee.on(name, fn);
		disposables.push(toDisposable(() => ee.removeListener(name, fn)));
	};

	let result = Promise.all<any>([
		new Promise<number>((c, e) => {
			once(child, "error", cpErrorHandler(e));
			once(child, "exit", c);
		}),
		new Promise<Buffer>((c) => {
			const buffers: Buffer[] = [];
			on(child.stdout!, "data", (b: Buffer) => buffers.push(b));
			once(child.stdout!, "close", () => c(Buffer.concat(buffers)));
		}),
		new Promise<string>((c) => {
			const buffers: Buffer[] = [];
			on(child.stderr!, "data", (b: Buffer) => buffers.push(b));
			once(child.stderr!, "close", () =>
				c(Buffer.concat(buffers).toString("utf8"))
			);
		}),
	]) as Promise<[number, Buffer, string]>;

	if (cancellationToken) {
		const cancellationPromise = new Promise<[number, Buffer, string]>(
			(_, e) => {
				onceEvent(cancellationToken.onCancellationRequested)(() => {
					try {
						child.kill();
					} catch (err) {
						// noop
					}

					e(new GitError({ message: "Cancelled" }));
				});
			}
		);

		result = Promise.race([result, cancellationPromise]);
	}

	try {
		const [exitCode, stdout, stderr] = await result;
		return { exitCode, stdout, stderr };
	} finally {
		dispose(disposables);
	}
}

export function onceEvent<T>(event: Event<T>): Event<T> {
	return (
		listener: (e: T) => any,
		thisArgs?: any,
		disposables?: Disposable[]
	) => {
		const result = event(
			(e) => {
				result.dispose();
				return listener.call(thisArgs, e);
			},
			null,
			disposables
		);

		return result;
	};
}

function cpErrorHandler(cb: (reason?: any) => void): (reason?: any) => void {
	return (err) => {
		if (/ENOENT/.test(err.message)) {
			err = new GitError({
				error: err,
				message: "Failed to execute git (ENOENT)",
				gitErrorCode: GitErrorCodes.NotAGitRepository,
			});
		}

		cb(err);
	};
}

export function dispose<T extends IDisposable>(disposables: T[]): T[] {
	disposables.forEach((d) => d.dispose());
	return [];
}

function sanitizePath(path: string): string {
	return path.replace(
		/^([a-z]):\\/i,
		(_, letter) => `${letter.toUpperCase()}:\\`
	);
}

export function toDisposable(dispose: () => void): IDisposable {
	return { dispose };
}

function getGitErrorCode(stderr: string): string | undefined {
	if (
		/Another git process seems to be running in this repository|If no other git process is currently running/.test(
			stderr
		)
	) {
		return GitErrorCodes.RepositoryIsLocked;
	} else if (/Authentication failed/i.test(stderr)) {
		return GitErrorCodes.AuthenticationFailed;
	} else if (/Not a git repository/i.test(stderr)) {
		return GitErrorCodes.NotAGitRepository;
	} else if (/bad config file/.test(stderr)) {
		return GitErrorCodes.BadConfigFile;
	} else if (
		/cannot make pipe for command substitution|cannot create standard input pipe/.test(
			stderr
		)
	) {
		return GitErrorCodes.CantCreatePipe;
	} else if (/Repository not found/.test(stderr)) {
		return GitErrorCodes.RepositoryNotFound;
	} else if (/unable to access/.test(stderr)) {
		return GitErrorCodes.CantAccessRemote;
	} else if (/branch '.+' is not fully merged/.test(stderr)) {
		return GitErrorCodes.BranchNotFullyMerged;
	} else if (/Couldn\'t find remote ref/.test(stderr)) {
		return GitErrorCodes.NoRemoteReference;
	} else if (/A branch named '.+' already exists/.test(stderr)) {
		return GitErrorCodes.BranchAlreadyExists;
	} else if (/'.+' is not a valid branch name/.test(stderr)) {
		return GitErrorCodes.InvalidBranchName;
	} else if (/Please,? commit your changes or stash them/.test(stderr)) {
		return GitErrorCodes.DirtyWorkTree;
	}

	return undefined;
}
