import { strictEqual } from "assert";

import { formatHistoryDescription } from "./description";

suite("History view description", () => {
	test("should show the commit count alone when nothing is filtered", () => {
		strictEqual(formatHistoryDescription({ totalCount: 42 }), "42 commits");
	});

	test("should show the repository name when known", () => {
		strictEqual(
			formatHistoryDescription({ repoName: "api", totalCount: 42 }),
			"api · 42 commits"
		);
	});

	test("should show an active file filter", () => {
		strictEqual(
			formatHistoryDescription({
				repoName: "api",
				filePath: "src/a.ts",
				totalCount: 7,
			}),
			"api · src/a.ts · 7 commits"
		);
	});

	test("should show a file filter without a repository name", () => {
		strictEqual(
			formatHistoryDescription({ filePath: "src/a.ts", totalCount: 7 }),
			"src/a.ts · 7 commits"
		);
	});

	test("should show a line range of a selection history", () => {
		strictEqual(
			formatHistoryDescription({
				repoName: "api",
				filePath: "src/a.ts",
				lineRange: { startLine: 20, endLine: 24 },
				totalCount: 2,
			}),
			"api · src/a.ts:20-24 · 2 commits"
		);
	});

	test("should show a single selected line as a range too", () => {
		strictEqual(
			formatHistoryDescription({
				filePath: "src/a.ts",
				lineRange: { startLine: 7, endLine: 7 },
				totalCount: 1,
			}),
			"src/a.ts:7-7 · 1 commits"
		);
	});

	test("should ignore a line range that has no path", () => {
		strictEqual(
			formatHistoryDescription({
				lineRange: { startLine: 1, endLine: 2 },
				totalCount: 3,
			}),
			"3 commits"
		);
	});
});
