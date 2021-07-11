import { strictEqual } from "assert";
import { createChangeFileTree } from "./utils";

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
		const tree: any = createChangeFileTree(
			mockChanges as any[],
			"/projects/public/sword-practice"
		);

		strictEqual(tree["README.md"].status, 1);
		strictEqual(tree["README.md"].checkIsFile(), true);

		strictEqual(tree.assets.beans.status, 2);
		strictEqual(tree.assets.beans.checkIsFile(), true);

		strictEqual(tree.src["hands-up.ts"].status, 5);
		strictEqual(tree.src["hands-up.ts"].checkIsFile(), true);

		strictEqual(tree.src.actions["throw.ts"].status, 3);
		strictEqual(tree.src.actions["throw.ts"].checkIsFile(), true);
	});
});
