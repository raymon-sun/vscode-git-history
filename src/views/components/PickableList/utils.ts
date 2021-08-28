export function isNumberBetween(num: number, range: number[]) {
	return num <= Math.max(...range) && num >= Math.min(...range);
}
