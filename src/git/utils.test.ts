import { deepStrictEqual } from "assert";
import {
	PathCollection,
	PathType,
	compareFileTreeNode,
	FileNode,
	FolderNode,
	resolveChangesCollection,
	ChangesCollection,
} from "./utils";

suite("Git utils", () => {
	test("should create a file tree when given changes collection", () => {
		const mockChangesCollection = [
			{
				ref: "123",
				changes: [
					{
						status: 5,
						uri: {
							path: "/projects/public/sword-practice/README.md",
						},
					},
					{
						status: 5,
						uri: {
							path: "/projects/public/sword-practice/src/hands-up.ts",
						},
					},
					{
						status: 2,
						uri: {
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
					},
					{
						status: 3,
						uri: {
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
								change: {
									status: 3,
									uri: {
										path: "/projects/public/sword-practice/src/actions/throw.ts",
									},
								},
								latestRef: "456",
							} as FileNode,
						},
					},
					["hands-up.ts"]: {
						type: PathType.FILE,
						change: {
							status: 5,
							uri: {
								path: "/projects/public/sword-practice/src/hands-up.ts",
							},
						},
						latestRef: "123",
					} as FileNode,
				},
			},
			assets: {
				type: PathType.FOLDER,
				path: "/projects/public/sword-practice/assets",
				children: {
					beans: {
						type: PathType.FILE,
						change: {
							status: 2,
							uri: {
								path: "/projects/public/sword-practice/assets/beans",
							},
						},
						latestRef: "123",
					} as FileNode,
				},
			},
			["README.md"]: {
				type: PathType.FILE,
				change: {
					status: 5,
					uri: {
						path: "/projects/public/sword-practice/README.md",
					},
				},
				latestRef: "123",
				earliestRef: "456",
			} as FileNode,
		});
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
});
