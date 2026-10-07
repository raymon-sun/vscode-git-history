import { deepStrictEqual, ok } from "assert";

import {
	buildAddTagArgs,
	buildChangesByRefArgs,
	buildCherryPickArgs,
	buildCreateBranchArgs,
	buildResetArgs,
	buildRevertArgs,
} from "./service";

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

suite("Commit operation arguments", () => {
	test("should create a branch at the commit and switch to it", () => {
		deepStrictEqual(buildCreateBranchArgs("feat/x", "abc123"), [
			"checkout",
			"-b",
			"feat/x",
			"abc123",
		]);
	});

	test("should tag the given commit", () => {
		deepStrictEqual(buildAddTagArgs("v1.0.0", "abc123"), [
			"tag",
			"v1.0.0",
			"abc123",
		]);
	});

	test("should cherry-pick the given commit", () => {
		deepStrictEqual(buildCherryPickArgs("abc123"), [
			"cherry-pick",
			"abc123",
		]);
	});

	test("should revert without opening an editor", () => {
		deepStrictEqual(buildRevertArgs("abc123"), [
			"revert",
			"--no-edit",
			"abc123",
		]);
	});

	test("should map every reset mode to its flag", () => {
		(["soft", "mixed", "hard"] as const).forEach((mode) => {
			deepStrictEqual(buildResetArgs(mode, "abc123"), [
				"reset",
				`--${mode}`,
				"abc123",
			]);
		});
	});
});
