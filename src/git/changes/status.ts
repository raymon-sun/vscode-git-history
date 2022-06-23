import { Status } from "../types";

import { ChangeItem } from "./tree";

export function mergeStatus(
	{ change: firstChange }: ChangeItem,
	{ change: lastChange, show }: ChangeItem
) {
	if (show === false) {
		return;
	}

	const {
		status: firstStatus = Status.DELETED,
		originalUri: { path: firstPath },
	} = firstChange || {};
	const {
		status: lastStatus = Status.DELETED,
		renameUri: { path: lastPath } = lastChange.originalUri,
	} = lastChange || {};

	const firstFileExistStatus = getFileExistStatus(firstStatus);
	const lastFileExistStatus = getFileExistStatus(lastStatus);

	if (
		firstFileExistStatus?.isExistBefore &&
		lastFileExistStatus?.isExistAfter
	) {
		return firstPath === lastPath ? Status.MODIFIED : Status.INDEX_RENAMED;
	}

	if (
		!firstFileExistStatus?.isExistBefore &&
		lastFileExistStatus?.isExistAfter
	) {
		return firstStatus;
	}

	if (
		firstFileExistStatus?.isExistBefore &&
		!lastFileExistStatus?.isExistAfter
	) {
		return Status.DELETED;
	}
}

export function getFileExistStatus(status: Status) {
	if ([Status.INDEX_ADDED, Status.INDEX_RENAMED].includes(status)) {
		return { isExistBefore: false, isExistAfter: true };
	}

	if (status === Status.DELETED) {
		return { isExistBefore: true, isExistAfter: false };
	}

	if (status === Status.MODIFIED) {
		return { isExistBefore: true, isExistAfter: true };
	}
}
