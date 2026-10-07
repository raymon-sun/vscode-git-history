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
});
