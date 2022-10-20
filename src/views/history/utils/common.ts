export function getLastItem<T = any>(items: T[]): T | undefined {
	if (items) {
		return items[items.length - 1];
	}
}
