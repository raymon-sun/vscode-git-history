import { FC, ReactNode, useRef, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { sortedIndex } from "lodash";
import classNames from "classnames";
import { isNumberBetween } from "./utils";

import style from "./index.module.scss";

type Id = string;

interface Props {
	list?: { id: Id; content: string | ReactNode }[];
	onPick?: (ids: Id[]) => void;
}

const PickableList: FC<Props> = ({ list, onPick }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerRect, setContainerRect] = useState<DOMRect | undefined>();
	const [itemYs, setItemYs] = useState<number[]>([]);
	const [dragStartIndex, setDragStartIndex] = useState<number>(-1);
	const [dragCurrentIndex, setDragCurrentIndex] = useState<number>(-1);

	const bind = useDrag(({ type, values }) => {
		const [x, y] = values;

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
			return;
		}

		if (type === "pointerup") {
			const pickedList = list?.slice(
				Math.min(dragStartIndex, dragCurrentIndex),
				Math.max(dragStartIndex, dragCurrentIndex) + 1
			);
			const ids = pickedList?.map(({ id }) => id);
			onPick && onPick(ids!);
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
		}
	});

	return (
		<div ref={containerRef} {...bind()} className={style.container}>
			{list?.map(({ id, content }, index) => (
				<div
					key={id}
					className={classNames(style.item, {
						[style.picked]: isNumberBetween(index, [
							dragStartIndex,
							dragCurrentIndex,
						]),
					})}
				>
					{content}
				</div>
			))}
		</div>
	);
};

export default PickableList;
