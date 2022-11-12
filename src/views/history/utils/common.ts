export function getLastItem<T = any>(items: T[]): T | undefined {
	if (items) {
		return items[items.length - 1];
	}
}

export function removeItemsByIndexList<T>(array: T[], indexList: number[]) {
	for (var i = indexList.length - 1; i >= 0; i--) {
		array.splice(indexList[i], 1);
	}
}
