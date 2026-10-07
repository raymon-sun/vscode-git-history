import { deepStrictEqual, ok, strictEqual } from "assert";

import { isValidRefName, validateRefName } from "./refName";

suite("Git ref name validation", () => {
	test("should accept common branch and tag names", () => {
		[
			"main",
			"feature/login",
			"release/1.2.3",
			"fix_issue-42",
			"v1.0.0",
			"user/feat/UPPER",
		].forEach((name) => {
			strictEqual(
				validateRefName(name),
				undefined,
				`expected '${name}' to be valid`
			);
			ok(isValidRefName(name));
		});
	});

	test("should reject an empty name", () => {
		ok(validateRefName(""));
		ok(validateRefName("   "));
	});

	test("should reject names with forbidden characters", () => {
		["a b", "a~b", "a^b", "a:b", "a?b", "a*b", "a[b", "a\\b"].forEach(
			(name) => ok(validateRefName(name), `expected '${name}' invalid`)
		);
	});

	test("should reject names with invalid sequences", () => {
		["a..b", "a//b", "a@{b"].forEach((name) =>
			ok(validateRefName(name), `expected '${name}' invalid`)
		);
	});

	test("should reject names with invalid boundaries", () => {
		[
			"-branch",
			"/branch",
			"branch/",
			"branch.",
			"branch.lock",
			"@",
		].forEach((name) =>
			ok(validateRefName(name), `expected '${name}' invalid`)
		);
	});

	test("should reject a path component starting with a dot", () => {
		["feature/.hidden", ".hidden"].forEach((name) =>
			ok(validateRefName(name), `expected '${name}' invalid`)
		);
	});

	test("should ignore surrounding whitespace when validating", () => {
		deepStrictEqual(validateRefName("  feature/x  "), undefined);
	});
});
