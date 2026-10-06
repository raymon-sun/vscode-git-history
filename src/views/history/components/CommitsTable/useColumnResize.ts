import { useDrag } from "@use-gesture/react";
import { useEffect, useMemo, useState } from "react";

import { getSizes, resizeColumns } from "./columnSizes";
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

		// dragging the divider to the left grows the column after it
		setRealTimeSizes(resizeColumns(dragStartSizes, columns, index, -mx));
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
