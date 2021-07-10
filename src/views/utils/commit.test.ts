import { deepStrictEqual } from "assert";
import { getSortedRefs } from "./commit";

suite("Commit utils", () => {
	test("should return empty array when given empty object", () => {
		const mockSelectedCommits = {};
		deepStrictEqual(getSortedRefs(mockSelectedCommits), []);
	});

	test("should return commit hashes sorted by date", () => {
		const mockSelectedCommits = {
			"997e42": {
				hash: "997e42",
				message: "beat Ganon",
				parents: ["e84e6a"],
				authorDate: "2021-05-23T11:35:21.000Z",
				authorName: "Link",
				authorEmail: "link@hyrule.com",
				commitDate: "2021-05-23T11:35:21.000Z",
			},
			"9145fb": {
				hash: "9145fb",
				message: "escape",
				parents: ["997e42"],
				authorDate: "2021-06-26T18:12:18.000Z",
				authorName: "Zelda",
				authorEmail: "zelda@hyrule.com",
				commitDate: "2021-06-26T18:12:18.000Z",
			},
		};

		deepStrictEqual(getSortedRefs(mockSelectedCommits), [
			"997e42",
			"9145fb",
		]);
	});
});
