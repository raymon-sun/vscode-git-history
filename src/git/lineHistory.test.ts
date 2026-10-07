import { deepStrictEqual } from "assert";

import { getSelectedLineRange, parseLineHistory } from "./lineHistory";

const H1 = "a".repeat(40);
const H2 = "b".repeat(40);

/** the shape `git log -L --format=%H%x1f%an%x1f%at%x1f%s` streams */
const SAMPLE = [
	`${H1}\x1fAda\x1f1700000000\x1ffirst change`,
	"",
	"diff --git a/a.txt b/a.txt",
	"--- a/a.txt",
	"+++ b/a.txt",
	"@@ -2,1 +2,1 @@",
	"-l2",
	"+l2 changed",
	`${H2}\x1fAlan\x1f1600000000\x1fadd the file`,
	"",
	"diff --git a/a.txt b/a.txt",
	"--- /dev/null",
	"+++ b/a.txt",
	"@@ -0,0 +2,1 @@",
	"+l2",
].join("\n");

suite("Line history parsing", () => {
	test("should read the commits and ignore the patch bodies", () => {
		deepStrictEqual(parseLineHistory(SAMPLE), [
			{
				hash: H1,
				author: "Ada",
				timestamp: 1700000000,
				subject: "first change",
			},
			{
				hash: H2,
				author: "Alan",
				timestamp: 1600000000,
				subject: "add the file",
			},
		]);
	});

	test("should keep a commit with an empty subject", () => {
		deepStrictEqual(parseLineHistory(`${H1}\x1fAda\x1f1700000000\x1f`), [
			{ hash: H1, author: "Ada", timestamp: 1700000000, subject: "" },
		]);
	});

	test("should not treat diff content as a commit", () => {
		// a patch line can contain the separator but not start with a hash
		const raw = [
			`${H1}\x1fAda\x1f1700000000\x1fsubject`,
			"+some\x1fcontent with the separator",
			"+a".repeat(40),
		].join("\n");

		deepStrictEqual(parseLineHistory(raw).length, 1);
	});

	test("should skip duplicated commits", () => {
		const raw = [
			`${H1}\x1fAda\x1f1700000000\x1fsubject`,
			`${H1}\x1fAda\x1f1700000000\x1fsubject`,
		].join("\n");

		deepStrictEqual(parseLineHistory(raw).length, 1);
	});

	test("should return nothing for empty or unrelated output", () => {
		deepStrictEqual(parseLineHistory(""), []);
		deepStrictEqual(parseLineHistory("fatal: no such path"), []);
	});
});

suite("Selected line range", () => {
	const selection = (
		startLine: number,
		startChar: number,
		endLine: number,
		endChar: number
	) => ({
		start: { line: startLine, character: startChar },
		end: { line: endLine, character: endChar },
	});

	test("should cover a single line selection", () => {
		deepStrictEqual(getSelectedLineRange(selection(1, 0, 1, 8)), {
			startLine: 2,
			endLine: 2,
		});
	});

	test("should cover whole lines selected top to bottom", () => {
		// selecting lines 2-4 by dragging over their line endings
		deepStrictEqual(getSelectedLineRange(selection(1, 0, 3, 20)), {
			startLine: 2,
			endLine: 4,
		});
	});

	test("should not include the line a selection ends at column 0", () => {
		deepStrictEqual(getSelectedLineRange(selection(1, 0, 4, 0)), {
			startLine: 2,
			endLine: 4,
		});
	});

	test("should handle a backwards selection", () => {
		deepStrictEqual(getSelectedLineRange(selection(5, 3, 2, 1)), {
			startLine: 3,
			endLine: 6,
		});
	});

	test("should handle a caret only selection", () => {
		deepStrictEqual(getSelectedLineRange(selection(9, 4, 9, 4)), {
			startLine: 10,
			endLine: 10,
		});
	});
});
