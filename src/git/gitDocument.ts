export interface IDocumentUriLike {
	scheme: string;
	query: string;
	fsPath: string;
}

export interface IGitDocument {
	/** the file the document shows, as a plain path */
	fsPath: string;
	/** the revision the document is pinned to, when there is one */
	ref?: string;
}

/**
 * Resolve a document opened on a git revision back to the file and revision it
 * shows. The built-in Git extension opens revisions with a `git:` scheme and
 * carries `{ path, ref }` in the query, so the path cannot be taken from the
 * uri alone and the line numbers only make sense at that revision.
 */
export function resolveGitDocument(uri: IDocumentUriLike): IGitDocument {
	if (uri.scheme !== "git") {
		return { fsPath: uri.fsPath };
	}

	try {
		const { path, ref } = JSON.parse(uri.query || "{}");

		return {
			fsPath: typeof path === "string" && path ? path : uri.fsPath,
			ref: typeof ref === "string" && ref ? ref : undefined,
		};
	} catch {
		return { fsPath: uri.fsPath };
	}
}
