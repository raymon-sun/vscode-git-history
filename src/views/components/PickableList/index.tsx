import { FC, ReactNode, useRef, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { sortedIndex } from "lodash";
import classNames from "classnames";
import { useIsKeyPressed } from "./event";

import style from "./index.module.scss";

type Id = string;

interface Props {
	list?: { id: Id; content: string | ReactNode }[];
	onPick?: (ids: Id[]) => void;
}

const PickableList: FC<Props> = ({ list, onPick }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [pickedItems, setPickedItems] = useState<Record<Id, true>>();

	const [containerRect, setContainerRect] = useState<DOMRect | undefined>();
	const [itemYs, setItemYs] = useState<number[]>([]);
	const [dragStartIndex, setDragStartIndex] = useState<number>(-1);
	const [dragCurrentIndex, setDragCurrentIndex] = useState<number>(-1);
	const { checkKeyIsPressed } = useIsKeyPressed();

	const dragBind = useDrag(({ type, values }) => {
		const [x, y] = values;

		const existedItems = checkKeyIsPressed("Meta") ? pickedItems : {};
		if (type === "pointerdown") {
			const realTimeContainerRect =
				containerRef.current?.getBoundingClientRect();
			const realTimeItemYs = Array.from(
				containerRef.current?.children || []
			).map((element) => element.getBoundingClientRect().y);

			const dragStartIndex = sortedIndex(realTimeItemYs, y) - 1;
			setContainerRect(realTimeContainerRect);
			setItemYs(realTimeItemYs);
			setDragStartIndex(dragStartIndex);
			setDragCurrentIndex(dragStartIndex);

			setPickedItems({
				...existedItems,
				[list![dragStartIndex].id]: true,
			});
			return;
		}

		if (type === "pointerup") {
			onPick && onPick(Object.keys(pickedItems!));
			return;
		}

		if (
			containerRect &&
			x > containerRect.x &&
			x < containerRect.x + containerRect.width &&
			y > containerRect.y &&
			y < containerRect.y + containerRect.height
		) {
			const currentIndex = sortedIndex(itemYs, y) - 1;
			setDragCurrentIndex(currentIndex);

			const pickedList = list?.slice(
				Math.min(dragStartIndex, dragCurrentIndex),
				Math.max(dragStartIndex, dragCurrentIndex) + 1
			);
			const currentPickedItems = pickedList!.reduce<Record<Id, true>>(
				(acc, item) => ((acc[item.id] = true), acc),
				{}
			);
			setPickedItems({ ...existedItems, ...currentPickedItems });
		}
	});

	return (
		<div ref={containerRef} {...dragBind()} className={style.container}>
			{list?.map(({ id, content }, index) => (
				<div
					key={id}
					className={classNames(style.item, {
						[style.picked]: pickedItems?.[id],
					})}
				>
					{content}
				</div>
			))}
		</div>
	);
};

export default PickableList;
