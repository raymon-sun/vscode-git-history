import { equal } from "assert";

import { Uri } from "vscode";

import { Status } from "./status";

import {
	ChangesCollection,
	getOriginalChangeStackAndUpdateChange,
	getPathMap,
	PathType,
	FileNode,
} from "./tree";

suite("#getPathMap()", () => {
	test("should return path map when given a changes collection", () => {
		const CHANGES_COLLECTION: ChangesCollection = [
			{
				ref: "1",
				repoPath: "",
				changes: [
					{
						uri: Uri.parse("/src/app.ts"),
						originalUri: Uri.parse("/src/app.ts"),
						renameUri: Uri.parse("/src/app.ts"),
						status: Status.MODIFIED,
					},
					{
						uri: Uri.parse("/index.ts"),
						originalUri: Uri.parse("/index.ts"),
						renameUri: Uri.parse("/index.ts"),
						status: Status.INDEX_ADDED,
					},
					{
						uri: Uri.parse("/package.json"),
						originalUri: Uri.parse("/package.json"),
						renameUri: Uri.parse("/package.json"),
						status: Status.MODIFIED,
					},
				],
			},
			{
				ref: "2",
				repoPath: "",
				changes: [
					{
						uri: Uri.parse("/src/enter.ts"),
						originalUri: Uri.parse("/src/app.ts"),
						renameUri: Uri.parse("/src/enter.ts"),
						status: Status.INDEX_RENAMED,
					},
					{
						uri: Uri.parse("/package.json"),
						originalUri: Uri.parse("/package.json"),
						renameUri: Uri.parse("/package.json"),
						status: Status.MODIFIED,
					},
				],
			},
			{
				ref: "3",
				repoPath: "",
				changes: [
					{
						uri: Uri.parse("/assets/icons/logo.svg"),
						originalUri: Uri.parse("/assets/icons/logo.svg"),
						renameUri: Uri.parse("/assets/icons/logo.svg"),
						status: Status.DELETED,
					},
					{
						uri: Uri.parse("/index.ts"),
						originalUri: Uri.parse("/index.ts"),
						renameUri: Uri.parse("/index.ts"),
						status: Status.MODIFIED,
					},
				],
			},
		];

		const pathMap = getPathMap(CHANGES_COLLECTION);
		equal(pathMap["/src/app.ts"].changeStack.length, 2);
		equal(pathMap["/src/app.ts"].changeStack[0].ref, "2");
		equal(
			pathMap["/src/app.ts"].changeStack[0].change.uri.path,
			"/src/app.ts"
		);
		equal(pathMap["/src/app.ts"].changeStack[0].isDeletedByRename, true);
		equal(pathMap["/src/app.ts"].changeStack[0].hidden, true);
		equal(pathMap["/src/app.ts"].changeStack[1].ref, "1");
		equal(
			pathMap["/src/app.ts"].changeStack[1].change.status,
			Status.MODIFIED
		);

		equal(pathMap["/index.ts"].changeStack.length, 2);

		equal(pathMap["/src/enter.ts"].changeStack.length, 1);
		equal(pathMap["/src/enter.ts"].changeStack[0].ref, "2");
		equal(
			pathMap["/src/enter.ts"].changeStack[0].change.status,
			Status.INDEX_RENAMED
		);
	});
});

suite("#getOriginalChangeStackAndUpdateChange()", () => {
	test("should assemble the original change stack chain when given multiple chainable change stacks", () => {
		const PATH_MAP: Record<string, FileNode> = {
			"/assets/temp.svg": {
				type: PathType.FILE,
				uri: Uri.parse(""),
				repoPath: "",
				changeStack: [
					{
						ref: "7",
						change: {
							uri: Uri.parse("/assets/temp.svg"),
							originalUri: Uri.parse("/assets/enter.svg"),
							renameUri: Uri.parse("/assets/temp.svg"),
							status: Status.INDEX_RENAMED,
						},
					},
					{
						ref: "9",
						change: {
							uri: Uri.parse("/assets/temp.svg"),
							originalUri: Uri.parse("/assets/temp.svg"),
							renameUri: Uri.parse("/assets/temp.svg"),
							status: Status.DELETED,
						},
						isDeletedByRename: true,
						hidden: true,
					},
				],
			},
			"/assets/enter.svg": {
				type: PathType.FILE,
				uri: Uri.parse("/assets/enter.svg"),
				repoPath: "",
				changeStack: [
					{
						ref: "3",
						change: {
							uri: Uri.parse("/assets/enter.svg"),
							originalUri: Uri.parse("/assets/enter.svg"),
							renameUri: Uri.parse("/assets/enter.svg"),
							status: Status.DELETED,
						},
						isDeletedByRename: true,
						hidden: true,
					},
				],
				originalChangeStack: [],
			},
		};

		const RENAMED_CHANGE_STACK = [
			{
				ref: "10",
				change: {
					uri: Uri.parse("/assets/temp_renamed.svg"),
					originalUri: Uri.parse("/assets/temp.svg"),
					renameUri: Uri.parse("/assets/temp_renamed.svg"),
					status: Status.INDEX_RENAMED,
				},
			},
			{
				ref: "15",
				change: {
					uri: Uri.parse("/assets/temp_renamed.svg"),
					originalUri: Uri.parse("/assets/temp_renamed.svg"),
					renameUri: Uri.parse("/assets/temp_renamed.svg"),
					status: Status.MODIFIED,
				},
			},
			{
				ref: "18",
				change: {
					uri: Uri.parse("/assets/temp_renamed.svg"),
					originalUri: Uri.parse("/assets/temp_renamed.svg"),
					renameUri: Uri.parse("/assets/temp_renamed.svg"),
					status: Status.MODIFIED,
				},
			},
		];

		const originalChangeStack = getOriginalChangeStackAndUpdateChange(
			PATH_MAP,
			RENAMED_CHANGE_STACK
		);
		equal(originalChangeStack.length, 3);

		equal(originalChangeStack[0].ref, "3");
		equal(originalChangeStack[0].change.uri.path, "/assets/enter.svg");
		equal(
			originalChangeStack[0].change.originalUri.path,
			"/assets/enter.svg"
		);
		equal(originalChangeStack[0].isDeletedByRename, true);
		equal(originalChangeStack[0].hidden, true);

		equal(originalChangeStack[1].ref, "7");
		equal(originalChangeStack[1].change.uri.path, "/assets/temp.svg");
		equal(
			originalChangeStack[1].change.originalUri.path,
			"/assets/enter.svg"
		);
		equal(originalChangeStack[1].isDeletedByRename, undefined);
		equal(originalChangeStack[1].hidden, undefined);

		equal(originalChangeStack[2].ref, "9");
		equal(originalChangeStack[2].change.uri.path, "/assets/temp.svg");
		equal(
			originalChangeStack[2].change.originalUri.path,
			"/assets/temp.svg"
		);
		equal(originalChangeStack[2].isDeletedByRename, true);
		equal(originalChangeStack[2].hidden, true);
	});
});
