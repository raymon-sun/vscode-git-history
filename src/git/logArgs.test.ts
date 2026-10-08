import { deepStrictEqual, ok, strictEqual } from "assert";

import { COMMIT_FORMAT, buildLogArgs } from "./logArgs";

const HASH_A = "a".repeat(40);
const HASH_B = "b".repeat(40);

/** the index of the pathspec separator, or -1 when there is none */
const indexOfPathspec = (args: string[]) => args.indexOf("--");

/** nothing after the separator may look like an option, or git reads it as a path */
const optionsPrecedePathspec = (args: string[]) => {
	const index = indexOfPathspec(args);

	return (
		index === -1 ||
		args.slice(index + 1).every((arg) => !arg.startsWith("-"))
	);
};

suite("Log arguments", () => {
	test("should traverse every ref of the repository by default", () => {
		deepStrictEqual(buildLogArgs(), [
			"log",
			`--format=${COMMIT_FORMAT}`,
			"-z",
			"--branches",
			"--remotes",
			"--tags",
			"--author-date-order",
		]);
	});

	test("should pin the traversal to a ref", () => {
		ok(buildLogArgs({ ref: "feature/x" }).includes("feature/x"));
		ok(!buildLogArgs({ ref: "feature/x" }).includes("--branches"));
	});

	test("should put the path filter last", () => {
		const args = buildLogArgs({ filePath: "src/a.ts", count: 300 });
		strictEqual(args[indexOfPathspec(args) + 1], "src/a.ts");
		ok(optionsPrecedePathspec(args));
	});

	test("should list an explicit commit set without walking its ancestors", () => {
		const args = buildLogArgs({ hashes: [HASH_A, HASH_B] });
		const index = args.indexOf("--no-walk");

		ok(index > -1);
		deepStrictEqual(args.slice(index + 1, index + 3), [HASH_A, HASH_B]);
		// the order given is the order shown, so no traversal options are added
		ok(!args.includes("--branches"));
		ok(!args.includes("--author-date-order"));
	});

	test("should not narrow a commit set to a path", () => {
		const args = buildLogArgs({
			filePath: "src/a.ts",
			hashes: [HASH_A],
		});

		strictEqual(indexOfPathspec(args), -1);
	});

	test("should still apply the author, message, range and paging filters", () => {
		const args = buildLogArgs({
			hashes: [HASH_A],
			authors: ["a@b.io"],
			keyword: "fix",
			maxLength: 100,
			count: 300,
			skip: 14000,
		});

		ok(args.includes("--author=a@b.io"));
		ok(args.includes("--grep=fix"));
		ok(args.includes("-n100"));
		ok(args.includes("-300"));
		ok(args.includes("--skip=14000"));
		ok(optionsPrecedePathspec(args));
	});

	test("should traverse normally when the commit set is empty", () => {
		// a filter that resolved to nothing must not turn into `--no-walk`
		const args = buildLogArgs({ hashes: [], filePath: "src/a.ts" });

		ok(!args.includes("--no-walk"));
		ok(args.includes("--branches"));
		strictEqual(args[indexOfPathspec(args) + 1], "src/a.ts");
	});
});
