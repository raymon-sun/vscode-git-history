import { deepEqual, equal } from "assert";

import { Uri } from "vscode";

import { getFileExistStatus, mergeStatus, Status } from "./status";
import { ChangeItem } from "./tree";

suite("#getFileExistStatus()", () => {
	test("should return { isExistBefore: false, isExistAfter: true } when given added status", () => {
		deepEqual(getFileExistStatus(Status.INDEX_ADDED), {
			isExistBefore: false,
			isExistAfter: true,
		});
	});

	test("should return { isExistBefore: false, isExistAfter: true } when given renamed status", () => {
		deepEqual(getFileExistStatus(Status.INDEX_RENAMED), {
			isExistBefore: false,
			isExistAfter: true,
		});
	});

	test("should return { isExistBefore: true, isExistAfter: false } when given deleted status", () => {
		deepEqual(getFileExistStatus(Status.DELETED), {
			isExistBefore: true,
			isExistAfter: false,
		});
	});

	test("should return { isExistBefore: true, isExistAfter: true } when given modified status", () => {
		deepEqual(getFileExistStatus(Status.MODIFIED), {
			isExistBefore: true,
			isExistAfter: true,
		});
	});

	test("should return undefined when given other status", () => {
		deepEqual(getFileExistStatus(Status.IGNORED), undefined);
	});
});

suite("#mergeStatus()", () => {
	const dummyUri = Uri.parse("");

	test("should merge the status as undefined when added at first and deleted at last", () => {
		const CHANGE_STACK: ChangeItem[] = [
			{
				ref: "",
				change: {
					uri: dummyUri,
					originalUri: dummyUri,
					renameUri: dummyUri,
					status: Status.INDEX_ADDED,
				},
			},
			{
				ref: "",
				change: {
					uri: dummyUri,
					originalUri: dummyUri,
					renameUri: dummyUri,
					status: Status.MODIFIED,
				},
			},
			{
				ref: "",
				change: {
					uri: dummyUri,
					originalUri: dummyUri,
					renameUri: dummyUri,
					status: Status.DELETED,
				},
				isDeletedByRename: false,
			},
		];
		equal(mergeStatus(CHANGE_STACK[0], CHANGE_STACK[2]), undefined);
	});

	test("should merge the status as deleted when deleted at last", () => {
		const CHANGE_STACK: ChangeItem[] = [
			{
				ref: "",
				change: {
					uri: dummyUri,
					originalUri: dummyUri,
					renameUri: dummyUri,
					status: Status.MODIFIED,
				},
			},
			{
				ref: "",
				change: {
					uri: dummyUri,
					originalUri: dummyUri,
					renameUri: dummyUri,
					status: Status.DELETED,
				},
			},
		];
		equal(mergeStatus(CHANGE_STACK[0], CHANGE_STACK[1]), Status.DELETED);
	});

	test("should merge the status as added when added at first", () => {
		const CHANGE_STACK: ChangeItem[] = [
			{
				ref: "",
				change: {
					uri: dummyUri,
					originalUri: dummyUri,
					renameUri: dummyUri,
					status: Status.INDEX_ADDED,
				},
			},
			{
				ref: "",
				change: {
					uri: dummyUri,
					originalUri: dummyUri,
					renameUri: dummyUri,
					status: Status.MODIFIED,
				},
			},
		];
		equal(
			mergeStatus(CHANGE_STACK[0], CHANGE_STACK[1]),
			Status.INDEX_ADDED
		);
	});

	test("should merge the status as modified when just modified", () => {
		const CHANGE_STACK: ChangeItem[] = [
			{
				ref: "",
				change: {
					uri: dummyUri,
					originalUri: dummyUri,
					renameUri: dummyUri,
					status: Status.MODIFIED,
				},
			},
			{
				ref: "",
				change: {
					uri: dummyUri,
					originalUri: dummyUri,
					renameUri: dummyUri,
					status: Status.MODIFIED,
				},
			},
		];
		equal(mergeStatus(CHANGE_STACK[0], CHANGE_STACK[1]), Status.MODIFIED);
	});

	test("should merge the status as deleted when deleted by rename at last", () => {
		const CHANGE_STACK: ChangeItem[] = [
			{
				ref: "",
				change: {
					uri: dummyUri,
					originalUri: dummyUri,
					renameUri: dummyUri,
					status: Status.MODIFIED,
				},
			},
			{
				ref: "",
				change: {
					uri: dummyUri,
					originalUri: dummyUri,
					renameUri: dummyUri,
					status: Status.DELETED,
				},
				isDeletedByRename: true,
				hidden: true,
			},
		];
		equal(mergeStatus(CHANGE_STACK[0], CHANGE_STACK[1]), undefined);
	});

	test("should merge the status as deleted when deleted by rename at last but show", () => {
		const CHANGE_STACK: ChangeItem[] = [
			{
				ref: "",
				change: {
					uri: dummyUri,
					originalUri: dummyUri,
					renameUri: dummyUri,
					status: Status.MODIFIED,
				},
				isDeletedByRename: false,
			},
			{
				ref: "",
				change: {
					uri: dummyUri,
					originalUri: dummyUri,
					renameUri: dummyUri,
					status: Status.DELETED,
				},
				isDeletedByRename: true,
				hidden: false,
			},
		];
		equal(mergeStatus(CHANGE_STACK[0], CHANGE_STACK[1]), Status.DELETED);
	});
});
