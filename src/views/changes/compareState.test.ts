import { strictEqual } from "assert";

import { formatCompareDescription } from "./compareState";

const FROM = "a".repeat(40);
const TO = "b".repeat(40);

suite("Changes view compare description", () => {
	test("should show both revisions when comparing", () => {
		strictEqual(
			formatCompareDescription({ fromRef: FROM, toRef: TO }),
			"Comparing aaaaaaa ↔ bbbbbbb"
		);
	});

	test("should stay silent when the changes are not a comparison", () => {
		strictEqual(formatCompareDescription(undefined), undefined);
	});

	test("should stay silent when a revision is missing", () => {
		strictEqual(
			formatCompareDescription({ fromRef: "", toRef: TO }),
			undefined
		);
		strictEqual(
			formatCompareDescription({ fromRef: FROM, toRef: "" }),
			undefined
		);
	});

	test("should shorten hashes without breaking short refs", () => {
		strictEqual(
			formatCompareDescription({ fromRef: "abc123", toRef: "def456" }),
			"Comparing abc123 ↔ def456"
		);
	});
});
