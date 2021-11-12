import { FC, ReactNode, useEffect, useRef, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { sortedIndex } from "lodash";
import classNames from "classnames";
import { useIsKeyPressed } from "./event";
import { useVirtual } from "react-virtual";

import style from "./index.module.scss";

type Id = string;

interface Props {
	list: { id: Id; content: string | ReactNode }[];
	onPick?: (ids: Id[]) => void;
}

const PickableList: FC<Props> = ({ list, onPick }) => {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const dragContainerRef = useRef<HTMLDivElement>(null);

	const rowVirtualizer = useVirtual({
		size: list.length,
		parentRef: scrollContainerRef,
		overscan: 10,
	});

	const [pickedItems, setPickedItems] = useState<Record<Id, number>>({});
	const [containerRect, setContainerRect] = useState<DOMRect | undefined>();
	const [itemYs, setItemYs] = useState<number[]>([]);
	const [dragStartIndex, setDragStartIndex] = useState<number>(-1);
	const { checkKeyIsPressed } = useIsKeyPressed();

	useEffect(() => {
		setPickedItems({});
	}, [list]);

	const dragBind = useDrag(({ type, xy }) => {
		const [x, y] = xy;

		const existedItems =
			checkKeyIsPressed("Meta") || checkKeyIsPressed("Control")
				? pickedItems
				: {};
		const firstItemIndex = rowVirtualizer.virtualItems[0].index;
		if (type === "pointerdown") {
			const realTimeContainerRect =
				dragContainerRef.current?.getBoundingClientRect();
			const realTimeItemYs = Array.from(
				dragContainerRef.current?.children || []
			).map((element) => element.getBoundingClientRect().y);

			const dragStartIndex =
				firstItemIndex + sortedIndex(realTimeItemYs, y) - 1;
			setContainerRect(realTimeContainerRect);
			setItemYs(realTimeItemYs);
			setDragStartIndex(dragStartIndex);

			setPickedItems({
				...existedItems,
				[list![dragStartIndex].id]: dragStartIndex,
			});
			return;
		}

		if (type === "pointerup") {
			onPick &&
				onPick(
					Object.keys(pickedItems!).sort(
						(id1, id2) => pickedItems[id1] - pickedItems[id2]
					)
				);
			return;
		}

		if (
			containerRect &&
			x > containerRect.x &&
			x < containerRect.x + containerRect.width &&
			y > containerRect.y &&
			y < containerRect.y + containerRect.height
		) {
			const currentIndex = firstItemIndex + sortedIndex(itemYs, y) - 1;
			const currentItems = { ...existedItems };
			for (
				let index = Math.min(dragStartIndex, currentIndex);
				index <= Math.max(dragStartIndex, currentIndex);
				index++
			) {
				const { id } = list![index];
				if (!currentItems.hasOwnProperty(id)) {
					currentItems[id] = index;
				}
			}

			setPickedItems(currentItems);
		}
	});

	return (
		<div
			{...dragBind()}
			ref={scrollContainerRef}
			style={{ overflow: "auto" }}
			className={style.container}
		>
			<div
				ref={dragContainerRef}
				style={{
					height: `${rowVirtualizer.totalSize}px`,
					width: "100%",
					position: "relative",
				}}
			>
				{rowVirtualizer.virtualItems.map((virtualRow) => (
					<div
						key={virtualRow.index}
						ref={virtualRow.measureRef}
						className={classNames(style.item, {
							[style.picked]: pickedItems?.hasOwnProperty(
								list[virtualRow.index].id
							),
						})}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							height: "22px",
							transform: `translateY(${virtualRow.start}px)`,
						}}
					>
						{list[virtualRow.index].content}
					</div>
				))}
			</div>
		</div>
	);
};

export default PickableList;
