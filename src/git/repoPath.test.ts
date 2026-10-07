import { deepStrictEqual, strictEqual } from "assert";

import { findRepoForPath, normalizePath, toRepoRelativePath } from "./repoPath";

suite("Repository path helpers", () => {
	test("should find the innermost repository containing a file", () => {
		const repos = ["/work", "/work/packages/inner"];

		strictEqual(
			findRepoForPath(repos, "/work/packages/inner/src/a.ts"),
			"/work/packages/inner"
		);
		strictEqual(findRepoForPath(repos, "/work/other/a.ts"), "/work");
	});

	test("should not match a repository that is only a name prefix", () => {
		// /work/backend-foo must not resolve to /work/backend
		strictEqual(
			findRepoForPath(["/work/backend"], "/work/backend-foo/a.ts"),
			undefined
		);
	});

	test("should match the repository root itself", () => {
		strictEqual(
			findRepoForPath(["/work/repo"], "/work/repo"),
			"/work/repo"
		);
	});

	test("should return undefined when no repository contains the file", () => {
		strictEqual(findRepoForPath(["/work/a"], "/elsewhere/b.ts"), undefined);
	});

	test("should handle windows separators", () => {
		strictEqual(
			findRepoForPath(["C:\\work\\repo"], "C:\\work\\repo\\src\\a.ts"),
			"C:\\work\\repo"
		);
	});

	test("should build a git friendly relative path", () => {
		deepStrictEqual(
			toRepoRelativePath("/work/repo", "/work/repo/src/a.ts"),
			"src/a.ts"
		);
		deepStrictEqual(
			toRepoRelativePath("C:\\work\\repo", "C:\\work\\repo\\src\\a.ts"),
			"src/a.ts"
		);
		deepStrictEqual(toRepoRelativePath("/work/repo", "/work/repo"), "");
	});

	test("should normalize surrounding separators", () => {
		deepStrictEqual(normalizePath("/work/repo/"), "work/repo");
		deepStrictEqual(normalizePath("C:\\work\\repo\\"), "C:/work/repo");
	});
});
