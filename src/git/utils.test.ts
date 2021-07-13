import { deepStrictEqual } from "assert";
import { Uri } from "vscode";
import { createChangeFileTree, PathCollection, PathType } from "./utils";

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
			mockChanges as any[],
			"/projects/public/sword-practice"
		);

		deepStrictEqual<PathCollection>(tree, {
			src: {
				type: PathType.FOLDER,
				path: "",
				children: {
					actions: {
						type: PathType.FOLDER,
						path: "",
						children: {
							["throw.ts"]: {
								type: PathType.FILE,
								status: 3,
								uri: {
									path: "/projects/public/sword-practice/src/actions/throw.ts",
								} as Uri,
							},
						},
					},
					["hands-up.ts"]: {
						type: PathType.FILE,
						status: 5,
						uri: {
							path: "/projects/public/sword-practice/src/hands-up.ts",
						} as Uri,
					},
				},
			},
			assets: {
				type: PathType.FOLDER,
				path: "",
				children: {
					beans: {
						type: PathType.FILE,
						status: 2,
						uri: {
							path: "/projects/public/sword-practice/assets/beans",
						} as Uri,
					},
				},
			},
			["README.md"]: {
				type: PathType.FILE,
				status: 1,
				uri: {
					path: "/projects/public/sword-practice/README.md",
				} as Uri,
			},
		});
	});
});
