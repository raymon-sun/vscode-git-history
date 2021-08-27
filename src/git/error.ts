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

export const enum GitErrorCodes {
	BadConfigFile = "BadConfigFile",
	AuthenticationFailed = "AuthenticationFailed",
	NoUserNameConfigured = "NoUserNameConfigured",
	NoUserEmailConfigured = "NoUserEmailConfigured",
	NoRemoteRepositorySpecified = "NoRemoteRepositorySpecified",
	NotAGitRepository = "NotAGitRepository",
	NotAtRepositoryRoot = "NotAtRepositoryRoot",
	Conflict = "Conflict",
	StashConflict = "StashConflict",
	UnmergedChanges = "UnmergedChanges",
	PushRejected = "PushRejected",
	RemoteConnectionError = "RemoteConnectionError",
	DirtyWorkTree = "DirtyWorkTree",
	CantOpenResource = "CantOpenResource",
	GitNotFound = "GitNotFound",
	CantCreatePipe = "CantCreatePipe",
	CantAccessRemote = "CantAccessRemote",
	RepositoryNotFound = "RepositoryNotFound",
	RepositoryIsLocked = "RepositoryIsLocked",
	BranchNotFullyMerged = "BranchNotFullyMerged",
	NoRemoteReference = "NoRemoteReference",
	InvalidBranchName = "InvalidBranchName",
	BranchAlreadyExists = "BranchAlreadyExists",
	NoLocalChanges = "NoLocalChanges",
	NoStashFound = "NoStashFound",
	LocalChangesOverwritten = "LocalChangesOverwritten",
	NoUpstreamBranch = "NoUpstreamBranch",
	IsInSubmodule = "IsInSubmodule",
	WrongCase = "WrongCase",
	CantLockRef = "CantLockRef",
	CantRebaseMultipleBranches = "CantRebaseMultipleBranches",
	PatchDoesNotApply = "PatchDoesNotApply",
	NoPathFound = "NoPathFound",
}

export function getGitErrorCode(stderr: string): string | undefined {
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
