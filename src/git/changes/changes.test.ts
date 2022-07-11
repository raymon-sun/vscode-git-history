import { equal } from "assert";

import { Status } from "../../typings/scmExtension";

import { parseGitChanges } from "./changes";

suite("#parseGitChanges()", () => {
	test("should parse git output to changes", () => {
		const GIT_OUTPUT =
			"D\x00babel.config.js\x00M\x00package-lock.json\x00A\x00package.json\x00";
		const changes = parseGitChanges("/project", GIT_OUTPUT);

		equal(changes.length, 3);

		equal(changes[0].status, Status.DELETED);
		equal(changes[0].uri.path, "/project/babel.config.js");

		equal(changes[1].status, Status.MODIFIED);
		equal(changes[1].uri.path, "/project/package-lock.json");

		equal(changes[2].status, Status.INDEX_ADDED);
		equal(changes[2].uri.path, "/project/package.json");
	});

	test("should parse git output to empty array when given nothing", () => {
		const GIT_OUTPUT = "";
		const changes = parseGitChanges("", GIT_OUTPUT);

		equal(changes.length, 0);
	});
});
