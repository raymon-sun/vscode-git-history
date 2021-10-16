import { deepStrictEqual } from "assert";
import { Status } from "../typings/git-extension";
import {
	PathCollection,
	PathType,
	compareFileTreeNode,
	FileNode,
	FolderNode,
	resolveChangesCollection,
	ChangesCollection,
	getUser,
} from "./utils";

suite("Git utils", () => {
	test.skip("should create a file tree when given changes collection", () => {
		const mockChangesCollection = [
			{
				ref: "123",
				changes: [
					{
						status: 5,
						uri: {
							path: "/projects/public/sword-practice/README.md",
						},
						originalUri: {
							path: "/projects/public/sword-practice/README.md",
						},
					},
					{
						status: 5,
						uri: {
							path: "/projects/public/sword-practice/src/hands-up.ts",
						},
						originalUri: {
							path: "/projects/public/sword-practice/src/hands-up.ts",
						},
					},
					{
						status: 2,
						uri: {
							path: "/projects/public/sword-practice/assets/beans",
						},
						originalUri: {
							path: "/projects/public/sword-practice/assets/beans",
						},
					},
				],
			},
			{
				ref: "456",
				changes: [
					{
						status: 1,
						uri: {
							path: "/projects/public/sword-practice/README.md",
						},
						originalUri: {
							path: "/projects/public/sword-practice/README.md",
						},
					},
					{
						status: 3,
						uri: {
							path: "/projects/public/sword-practice/src/actions/throw.ts",
						},
						originalUri: {
							path: "/projects/public/sword-practice/src/actions/throw.ts",
						},
					},
				],
			},
		];
		const tree = resolveChangesCollection(
			mockChangesCollection as ChangesCollection,
			"/projects/public/sword-practice"
		);

		deepStrictEqual<PathCollection>(tree, {
			src: {
				type: PathType.FOLDER,
				path: "/projects/public/sword-practice/src",
				children: {
					actions: {
						type: PathType.FOLDER,
						path: "/projects/public/sword-practice/src/actions",
						children: {
							["throw.ts"]: {
								type: PathType.FILE,
							} as FileNode,
						},
					},
					["hands-up.ts"]: {
						type: PathType.FILE,
					} as FileNode,
				},
			},
			assets: {
				type: PathType.FOLDER,
				path: "/projects/public/sword-practice/assets",
				children: {
					beans: {
						type: PathType.FILE,
					} as FileNode,
				},
			},
			["README.md"]: {
				type: PathType.FILE,
			} as FileNode,
		});
	});

	test.skip("should merge file status when given changes collection", () => {
		const mockChangesCollection = [
			{
				ref: "789",
				changes: [
					{
						status: Status.DELETED,
						uri: {
							path: "/y.md",
						},
						originalUri: {
							path: "/y.md",
						},
					},
				],
			},
			{
				ref: "456",
				changes: [
					{
						status: Status.MODIFIED,
						uri: {
							path: "/y.md",
						},
						originalUri: {
							path: "/y.md",
						},
					},
				],
			},
			{
				ref: "123",
				changes: [
					{
						status: Status.INDEX_RENAMED,
						uri: {
							path: "/y.md",
						},
						originalUri: {
							path: "/x.md",
						},
					},
				],
			},
		];

		// const map = getPathMap(mockChangesCollection as any);
		resolveChangesCollection(mockChangesCollection as any);
	});

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
