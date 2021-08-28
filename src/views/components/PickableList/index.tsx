import { FC, ReactNode, useMemo, useRef, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { sortedIndex } from "lodash";
import classNames from "classnames";
import { isNumberBetween } from "./utils";

import style from "./index.module.scss";

type Id = string | number;

interface Props {
	list?: { id: Id; content: string | ReactNode }[];
	onPick?: (ids: Id[]) => void;
}

const PickableList: FC<Props> = ({ list, onPick }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const containerRect = useMemo<DOMRect | undefined>(
		() => containerRef.current?.getBoundingClientRect() || undefined,
		[containerRef.current]
	);
	const itemYs = useMemo(
		() =>
			Array.from(containerRef.current?.children || []).map(
				(element) => element.getBoundingClientRect().y
			),
		[containerRef.current]
	);
	const [dragStartIndex, setDragStartIndex] = useState<number>(-1);
	const [dragCurrentIndex, setDragCurrentIndex] = useState<number>(-1);

	const bind = useDrag(({ type, values }) => {
		if (!containerRect) {
			return;
		}

		const [x, y] = values;

		if (type === "pointerdown") {
			const dragStartIndex = sortedIndex(itemYs, y) - 1;
			setDragStartIndex(dragStartIndex);
			setDragCurrentIndex(-1);
			return;
		}

		if (type === "pointerup") {
			const pickedList = list?.slice(dragStartIndex, dragCurrentIndex);
			const ids = pickedList?.map(({ id }) => id);
			onPick && onPick(ids!);
			return;
		}

		if (
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
		<div ref={containerRef} {...bind()}>
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
