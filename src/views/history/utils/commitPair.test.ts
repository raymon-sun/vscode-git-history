import { deepStrictEqual, strictEqual } from "assert";

import { getComparePair } from "./commitPair";

/** the list is newest first, and each entry starts with its hash */
const commits = ["newest1", "middle22", "oldest33"];

suite("Compare pair", () => {
	test("should order the selection oldest to newest", () => {
		deepStrictEqual(getComparePair(["newest1", "oldest33"], commits), {
			from: "oldest33",
			to: "newest1",
		});
	});

	test("should not depend on the selection order", () => {
		deepStrictEqual(getComparePair(["oldest33", "newest1"], commits), {
			from: "oldest33",
			to: "newest1",
		});
	});

	test("should order an adjacent pair", () => {
		deepStrictEqual(getComparePair(["middle22", "oldest33"], commits), {
			from: "oldest33",
			to: "middle22",
		});
	});

	test("should ignore commits that are not in the list", () => {
		strictEqual(getComparePair(["newest1", "missing"], commits), undefined);
	});

	test("should require exactly two commits", () => {
		strictEqual(getComparePair([], commits), undefined);
		strictEqual(getComparePair(["newest1"], commits), undefined);
		strictEqual(
			getComparePair(["newest1", "middle22", "oldest33"], commits),
			undefined
		);
	});

	test("should reject the same commit twice", () => {
		strictEqual(getComparePair(["newest1", "newest1"], commits), undefined);
	});
});
