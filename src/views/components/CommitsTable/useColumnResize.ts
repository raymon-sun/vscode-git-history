import { useDrag } from "@use-gesture/react";
import { useState } from "react";
import { sum } from "lodash";

import { IHeader } from "./constants";

export function useColumnResize(
	columns: IHeader[],
	totalWidth = 0
): {
	columns: (IHeader & {
		hasDivider: boolean;
		size: number;
		dragBind: ReturnType<typeof useDrag>;
	})[];
} {
	const [sizes, setSizes] = useState(getSizes(columns, totalWidth));
	const [draggingSizes, setDraggingSizes] = useState(sizes);

	const dragBind = useDrag(({ type, movement: [mx], args: [index] }) => {
		if (type === "pointerdown") {
			setSizes(draggingSizes);
			return;
		}

		const newSizes = [...sizes];
		newSizes[index] = newSizes[index] - mx;
		newSizes[index - 1] = newSizes[index - 1] + mx;

		const isExceedSize =
			newSizes[index] < columns[index].minWidth ||
			newSizes[index - 1] < columns[index - 1].minWidth;

		!isExceedSize && setDraggingSizes(newSizes);
	});

	return {
		columns: columns.map((column, index) => ({
			...column,
			hasDivider: index !== 0,
			size: draggingSizes[index],
			dragBind,
		})),
	};
}

function getSizes(columns: IHeader[], totalWidth: number) {
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
