import { deepStrictEqual } from "assert";

import { FileNode, FolderNode, PathType } from "./changes/tree";

import { compareFileTreeNode, getUser } from "./utils";

suite("Git utils", () => {
	test("should sort the given file nodes", () => {
		deepStrictEqual(
			compareFileTreeNode(
				[
					"utils",
					{
						type: PathType.FOLDER,
					} as FolderNode,
				],
				[
					"utils",
					{
						type: PathType.FILE,
					} as FileNode,
				]
			),
			-1
		);

		deepStrictEqual(
			compareFileTreeNode(
				[
					"tests",
					{
						type: PathType.FILE,
					} as FileNode,
				],
				[
					"tests",
					{
						type: PathType.FOLDER,
					} as FolderNode,
				]
			),
			1
		);

		deepStrictEqual(
			compareFileTreeNode(
				[
					"state",
					{
						type: PathType.FILE,
					} as FileNode,
				],
				[
					"tsconfig.json",
					{
						type: PathType.FILE,
					} as FileNode,
				]
			),
			-1
		);

		deepStrictEqual(
			compareFileTreeNode(
				[
					".gitignore",
					{
						type: PathType.FILE,
					} as FileNode,
				],
				[
					".editorconfig",
					{
						type: PathType.FILE,
					} as FileNode,
				]
			),
			1
		);
	});

	test("should convert to user info when given shortlog", () => {
		deepStrictEqual(
			getUser("    65\tWolfgang Amadeus Mozart <mozart@mail.com>"),
			{
				name: "Wolfgang Amadeus Mozart",
				email: "mozart@mail.com",
			}
		);

		deepStrictEqual(getUser("3\tMichael Jackson <michael@mail.com>"), {
			name: "Michael Jackson",
			email: "michael@mail.com",
		});

		deepStrictEqual(getUser("1\tanonymous <anonymous@mail.com>"), {
			name: "anonymous",
			email: "anonymous@mail.com",
		});
	});
});
