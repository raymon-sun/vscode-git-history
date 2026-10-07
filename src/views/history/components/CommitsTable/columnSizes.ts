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
 * the divider.
 *
 * The flexible (fill) column absorbs the change first, so the columns next to
 * the divider keep their size and simply move out of the way. Only once the
 * fill column cannot give any more space does the adjacent column step in.
 * A column is never shrunk below its own minimum width.
 */
export function resizeColumns(
	sizes: number[],
	columns: IHeader[],
	index: number,
	delta: number
): number[] {
	const newSizes = [...sizes];
	const leftIndex = index - 1;
	const fillIndex = columns.findIndex((column) => column.width === "fill");

	const takeFrom = (donorIndex: number, amount: number) => {
		const available = Math.max(
			0,
			newSizes[donorIndex] - columns[donorIndex].minWidth
		);
		const taken = Math.min(amount, available);
		newSizes[donorIndex] -= taken;
		return taken;
	};

	if (delta > 0) {
		let remaining = delta;

		// try the flexible column first, then the column next to the divider
		const donors = [...new Set([fillIndex, leftIndex])];
		for (const donorIndex of donors) {
			if (remaining === 0) {
				break;
			}
			if (donorIndex !== -1 && donorIndex !== index) {
				remaining -= takeFrom(donorIndex, remaining);
			}
		}

		newSizes[index] += delta - remaining;

		return newSizes;
	}

	const shrink = Math.min(
		-delta,
		Math.max(0, newSizes[index] - columns[index].minWidth)
	);
	if (shrink === 0) {
		return newSizes;
	}

	newSizes[index] -= shrink;

	const receiverIndex =
		fillIndex !== -1 && fillIndex !== index ? fillIndex : leftIndex;
	newSizes[receiverIndex] += shrink;

	return newSizes;
}
