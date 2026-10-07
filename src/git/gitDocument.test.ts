import { deepStrictEqual } from "assert";

import { resolveGitDocument } from "./gitDocument";

/** the shape the built-in Git extension's `toGitUri` produces */
const gitRevisionDoc = (path: string, ref: string) => ({
	scheme: "git",
	query: JSON.stringify({ path, ref }),
	fsPath: `/${path.replace(/^\//, "")}`,
});

suite("Git document resolution", () => {
	test("should read the path and revision out of a git document", () => {
		deepStrictEqual(
			resolveGitDocument(gitRevisionDoc("/work/a.ts", "abc123")),
			{ fsPath: "/work/a.ts", ref: "abc123" }
		);
	});

	test("should keep the revision the diff sides point at", () => {
		// the original side of a diff is pinned to `<ref>~`
		deepStrictEqual(
			resolveGitDocument(gitRevisionDoc("/work/a.ts", "abc123~")),
			{ fsPath: "/work/a.ts", ref: "abc123~" }
		);
	});

	test("should fall back to the uri path when the query has no path", () => {
		deepStrictEqual(
			resolveGitDocument({
				scheme: "git",
				query: JSON.stringify({ ref: "abc123" }),
				fsPath: "/work/a.ts",
			}),
			{ fsPath: "/work/a.ts", ref: "abc123" }
		);
	});

	test("should fall back to the uri path when the query is not json", () => {
		deepStrictEqual(
			resolveGitDocument({
				scheme: "git",
				query: "not json",
				fsPath: "/work/a.ts",
			}),
			{ fsPath: "/work/a.ts" }
		);
	});

	test("should treat a plain file document as the working tree file", () => {
		deepStrictEqual(
			resolveGitDocument({
				scheme: "file",
				query: "",
				fsPath: "/work/a.ts",
			}),
			{ fsPath: "/work/a.ts" }
		);
	});

	test("should ignore an empty revision", () => {
		deepStrictEqual(
			resolveGitDocument({
				scheme: "git",
				query: JSON.stringify({ path: "/work/a.ts", ref: "" }),
				fsPath: "/work/a.ts",
			}),
			{ fsPath: "/work/a.ts", ref: undefined }
		);
	});
});
