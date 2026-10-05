import { deepStrictEqual, ok } from "assert";

import { buildChangesByRefArgs } from "./service";

suite("#buildChangesByRefArgs()", () => {
	test("should target a single ref with the name-status -z format", () => {
		const args = buildChangesByRefArgs("HEAD");

		deepStrictEqual(args.slice(0, 1), ["log"]);
		deepStrictEqual(args.slice(-2), ["-z", "HEAD"]);
		ok(args.includes("--name-status"));
	});

	test("should show merge commits' changes relative to the first parent", () => {
		const args = buildChangesByRefArgs("HEAD");

		// merge commits are skipped by git unless -m is given
		ok(args.includes("-m"), "merge commits need -m to emit a diff");
		ok(
			args.includes("--first-parent"),
			"a merge's diff should be relative to the first parent"
		);
	});
});
