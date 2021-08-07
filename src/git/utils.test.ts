import { deepStrictEqual } from "assert";
import {
	createChangeFileTree,
	PathCollection,
	PathType,
	compareFileTreeNode,
	FileNode,
	FolderNode,
} from "./utils";

suite("Git utils", () => {
	test("should create a file tree when given change list", () => {
		const mockChanges = [
			{
				status: 1,
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
			{
				status: 3,
				uri: {
					path: "/projects/public/sword-practice/src/actions/throw.ts",
				},
			},
		];
		const tree = createChangeFileTree(
			["1", "2"],
			mockChanges as any[],
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
								refs: ["1", "2"],
								change: {
									status: 3,
									uri: {
										path: "/projects/public/sword-practice/src/actions/throw.ts",
									},
								},
							} as FileNode,
						},
					},
					["hands-up.ts"]: {
						type: PathType.FILE,
						refs: ["1", "2"],
						change: {
							status: 5,
							uri: {
								path: "/projects/public/sword-practice/src/hands-up.ts",
							},
						},
					} as FileNode,
				},
			},
			assets: {
				type: PathType.FOLDER,
				path: "/projects/public/sword-practice/assets",
				children: {
					beans: {
						type: PathType.FILE,
						refs: ["1", "2"],
						change: {
							status: 2,
							uri: {
								path: "/projects/public/sword-practice/assets/beans",
							},
						},
					} as FileNode,
				},
			},
			["README.md"]: {
				type: PathType.FILE,
				refs: ["1", "2"],
				change: {
					status: 1,
					uri: {
						path: "/projects/public/sword-practice/README.md",
					},
				},
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
