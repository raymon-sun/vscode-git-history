import { Status } from "../types";

import { ChangeItem } from "./tree";

export function mergeStatus(
	firstChangeItem: ChangeItem,
	lastChangeItem: ChangeItem
) {
	if (lastChangeItem.isDeletedByRename && !lastChangeItem.show) {
		return;
	}

	const { status: firstStatus = Status.DELETED } =
		firstChangeItem.change || {};
	const { status: lastStatus = Status.DELETED } = lastChangeItem.change || {};

	const firstFileExistStatus = getFileExistStatus(firstStatus);
	const lastFileExistStatus = getFileExistStatus(lastStatus);

	if (
		firstFileExistStatus?.isExistBefore &&
		lastFileExistStatus?.isExistAfter
	) {
		return Status.MODIFIED;
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
