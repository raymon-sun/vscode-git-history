import { useDrag } from "@use-gesture/react";
import { useEffect, useMemo, useState } from "react";
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
	const sizes = useMemo(
		() => getSizes(columns, totalWidth),
		[columns, totalWidth]
	);
	const [dragStartSizes, setDragStartSizes] = useState(sizes);
	const [realtimeSizes, setRealTimeSizes] = useState(sizes);

	useEffect(() => {
		setRealTimeSizes(sizes);
	}, [sizes]);

	const dragBind = useDrag(({ type, movement: [mx], args: [index] }) => {
		if (type === "pointerdown") {
			setDragStartSizes(realtimeSizes);
			return;
		}

		const newSizes = [...dragStartSizes];
		newSizes[index] = newSizes[index] - mx;
		newSizes[index - 1] = newSizes[index - 1] + mx;

		const isExceedSize =
			newSizes[index] < columns[index].minWidth ||
			newSizes[index - 1] < columns[index - 1].minWidth;

		!isExceedSize && setRealTimeSizes(newSizes);
	});

	return {
		columns: columns.map((column, index) => ({
			...column,
			hasDivider: index !== 0,
			size: realtimeSizes[index],
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
