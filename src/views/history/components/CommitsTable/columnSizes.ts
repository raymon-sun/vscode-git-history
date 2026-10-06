import { sum } from "lodash";

import type { IHeader } from "./constants";

export function getSizes(columns: IHeader[], totalWidth: number): number[] {
	let fillIndex = -1;
	const sizes = columns.map(({ width }, index) => {
		if (width === "fill") {
			fillIndex = index;
			return 0;
		}
		return width;
	});

	if (fillIndex !== -1) {
		sizes[fillIndex] = totalWidth - sum(sizes);
	}

	return sizes;
}

/**
 * Move the divider before the column at `index` by `delta` pixels, keeping the
 * total width unchanged. A positive `delta` grows the column to the right of
 * the divider; the space is taken from the column on its left first.
 *
 * When that left column is already at its minimum width, the remainder is taken
 * from the fill column instead, so the left column keeps its size and shifts
 * out of the way.
 */
export function resizeColumns(
	sizes: number[],
	columns: IHeader[],
	index: number,
	delta: number
): number[] {
	const newSizes = [...sizes];
	const leftIndex = index - 1;

	if (delta < 0) {
		const shrink = Math.min(
			-delta,
			Math.max(0, newSizes[index] - columns[index].minWidth)
		);
		newSizes[index] -= shrink;
		newSizes[leftIndex] += shrink;
		return newSizes;
	}

	let remaining = delta;

	const takenFromLeft = Math.min(
		remaining,
		Math.max(0, newSizes[leftIndex] - columns[leftIndex].minWidth)
	);
	newSizes[leftIndex] -= takenFromLeft;
	remaining -= takenFromLeft;

	const fillIndex = columns.findIndex((column) => column.width === "fill");
	const canUseFill =
		fillIndex !== -1 && fillIndex !== leftIndex && fillIndex !== index;
	if (remaining > 0 && canUseFill) {
		const takenFromFill = Math.min(
			remaining,
			Math.max(0, newSizes[fillIndex] - columns[fillIndex].minWidth)
		);
		newSizes[fillIndex] -= takenFromFill;
		remaining -= takenFromFill;
	}

	newSizes[index] += delta - remaining;

	return newSizes;
}
