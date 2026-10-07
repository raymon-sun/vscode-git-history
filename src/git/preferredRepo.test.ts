import { deepStrictEqual, strictEqual } from "assert";
import { mkdirSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { pickPreferredRepo } from "./preferredRepo";

const REPO_ONE = "/work/one";
const REPO_TWO = "/work/two";

/** real directories, so the on-disk validation can be exercised */
let sandbox: string;
const realRepo = (name: string) => {
	const repoPath = join(sandbox, name);
	mkdirSync(join(repoPath, ".git"), { recursive: true });
	return repoPath;
};

suite("Preferred repository", () => {
	suiteSetup(() => {
		sandbox = mkdtempSync(join(tmpdir(), "git-history-repo-"));
	});
	suiteTeardown(() => {
		rmSync(sandbox, { recursive: true, force: true });
	});

	test("should prefer a remembered repository", () => {
		strictEqual(
			pickPreferredRepo({
				stored: REPO_TWO,
				repositories: [REPO_ONE, REPO_TWO],
				workspacePath: REPO_ONE,
			}),
			REPO_TWO
		);
	});

	test("should honour a remembered repository the list has not discovered yet", () => {
		// the Git extension fills its repository list asynchronously
		const remembered = realRepo("remembered");
		strictEqual(
			pickPreferredRepo({
				stored: remembered,
				repositories: [REPO_ONE],
			}),
			remembered
		);
		strictEqual(
			pickPreferredRepo({ stored: remembered, repositories: [] }),
			remembered
		);
	});

	test("should ignore a remembered repository that is gone", () => {
		strictEqual(
			pickPreferredRepo({
				stored: join(sandbox, "deleted-repo"),
				repositories: [REPO_ONE, REPO_TWO],
			}),
			REPO_ONE
		);
	});

	test("should use the workspace folder when it is a repository", () => {
		strictEqual(
			pickPreferredRepo({
				repositories: [REPO_ONE, REPO_TWO],
				workspacePath: REPO_TWO,
			}),
			REPO_TWO
		);
	});

	test("should fall back to the first repository", () => {
		// the workspace folder is not a repository (it only contains them)
		strictEqual(
			pickPreferredRepo({
				repositories: [REPO_ONE, REPO_TWO],
				workspacePath: "/work",
			}),
			REPO_ONE
		);
	});

	test("should return nothing when there is no repository yet", () => {
		strictEqual(pickPreferredRepo({ repositories: [] }), undefined);
		deepStrictEqual(pickPreferredRepo({ repositories: [] }), undefined);
	});
});
