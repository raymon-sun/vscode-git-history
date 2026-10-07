import { deepStrictEqual, strictEqual } from "assert";

import { getRepoDisplayNames } from "./repoName";

suite("Repository display names", () => {
	test("should use the folder name when it is unique", () => {
		deepStrictEqual(
			getRepoDisplayNames(["/work/backend", "/work/frontend"]),
			[
				{ path: "/work/backend", name: "backend" },
				{ path: "/work/frontend", name: "frontend" },
			]
		);
	});

	test("should disambiguate repositories that share a folder name", () => {
		deepStrictEqual(
			getRepoDisplayNames(["/work/api-client", "/work/lib/api-client"]),
			[
				{ path: "/work/api-client", name: "work/api-client" },
				{ path: "/work/lib/api-client", name: "lib/api-client" },
			]
		);
	});

	test("should keep growing until nested duplicates are unique", () => {
		deepStrictEqual(
			getRepoDisplayNames([
				"/a/api",
				"/b/nested/api",
				"/c/b/nested/api",
			]).map(({ name }) => name),
			["a/api", "b/nested/api", "c/b/nested/api"]
		);
	});

	test("should keep every name unique", () => {
		const inputs = [
			"/work/api",
			"/work/api",
			"/other/api",
			"/deep/other/api",
			"/x/y/api",
			"/z/y/api",
		];
		const names = getRepoDisplayNames(inputs).map(({ name }) => name);

		strictEqual(new Set(names).size, new Set(inputs).size);
	});

	test("should handle a single repository", () => {
		deepStrictEqual(getRepoDisplayNames(["/work/repo"]), [
			{ path: "/work/repo", name: "repo" },
		]);
	});

	test("should tolerate trailing separators and windows paths", () => {
		deepStrictEqual(
			getRepoDisplayNames(["C:\\work\\repo\\", "C:\\work\\other"]).map(
				({ name }) => name
			),
			["repo", "other"]
		);
	});

	test("should return an empty list for no repositories", () => {
		deepStrictEqual(getRepoDisplayNames([]), []);
	});
});
