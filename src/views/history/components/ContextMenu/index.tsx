import {
	FC,
	Fragment,
	KeyboardEvent,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import classNames from "classnames";

import { placeMenu } from "./position";

import style from "./index.module.scss";

export interface IContextMenuItem {
	id: string;
	label: string;
	/** codicon name without the `codicon-` prefix */
	icon?: string;
	/** render a separator above this item */
	separatorBefore?: boolean;
	disabled?: boolean;
}

interface Props {
	x: number;
	y: number;
	items: IContextMenuItem[];
	onSelect: (id: string) => void;
	onClose: () => void;
}

/** keep the menu away from the very edge of the viewport */
const VIEWPORT_MARGIN = 4;

const ContextMenu: FC<Props> = ({ x, y, items, onSelect, onClose }) => {
	const menuRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ left: x, top: y });
	const [activeIndex, setActiveIndex] = useState(-1);

	const enabledIndexes = useMemo(
		() =>
			items.reduce<number[]>((indexes, item, index) => {
				if (!item.disabled) {
					indexes.push(index);
				}
				return indexes;
			}, []),
		[items]
	);

	// measure the menu, then move it back inside the viewport before painting
	useLayoutEffect(() => {
		const element = menuRef.current;
		if (!element) {
			return;
		}

		const { width, height } = element.getBoundingClientRect();
		setPosition(
			placeMenu(
				x,
				y,
				width,
				height,
				window.innerWidth,
				window.innerHeight,
				VIEWPORT_MARGIN
			)
		);
	}, [x, y, items]);

	useEffect(() => {
		menuRef.current?.focus({ preventScroll: true });

		const handlePointerDown = (event: MouseEvent) => {
			if (menuRef.current?.contains(event.target as Node)) {
				return;
			}

			// swallow the dismiss click, like VS Code, so it cannot pick a commit
			event.preventDefault();
			event.stopPropagation();
			onClose();
		};

		// the list scrolls under the menu, so follow VS Code and dismiss on scroll
		const handleScroll = (event: Event) => {
			if (!menuRef.current?.contains(event.target as Node)) {
				onClose();
			}
		};

		document.addEventListener("mousedown", handlePointerDown, true);
		document.addEventListener("scroll", handleScroll, true);
		window.addEventListener("resize", onClose);
		window.addEventListener("blur", onClose);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown, true);
			document.removeEventListener("scroll", handleScroll, true);
			window.removeEventListener("resize", onClose);
			window.removeEventListener("blur", onClose);
		};
	}, [onClose]);

	const moveActive = useCallback(
		(step: 1 | -1) => {
			if (!enabledIndexes.length) {
				return;
			}

			setActiveIndex((current) => {
				const currentPosition = enabledIndexes.indexOf(current);
				const nextPosition =
					currentPosition === -1
						? step === 1
							? 0
							: enabledIndexes.length - 1
						: (currentPosition + step + enabledIndexes.length) %
						  enabledIndexes.length;

				return enabledIndexes[nextPosition];
			});
		},
		[enabledIndexes]
	);

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				moveActive(1);
				break;
			case "ArrowUp":
				event.preventDefault();
				moveActive(-1);
				break;
			case "Home":
				event.preventDefault();
				setActiveIndex(enabledIndexes[0] ?? -1);
				break;
			case "End":
				event.preventDefault();
				setActiveIndex(enabledIndexes[enabledIndexes.length - 1] ?? -1);
				break;
			case "Enter":
			case " ":
				event.preventDefault();
				if (activeIndex !== -1) {
					onSelect(items[activeIndex].id);
				}
				break;
			case "Escape":
				event.preventDefault();
				onClose();
				break;
		}
	};

	return (
		<div
			ref={menuRef}
			role="menu"
			tabIndex={-1}
			className={style.menu}
			style={{ left: position.left, top: position.top }}
			onKeyDown={handleKeyDown}
			onContextMenu={(event) => event.preventDefault()}
		>
			{items.map((item, index) => (
				<Fragment key={item.id}>
					{item.separatorBefore && (
						<div role="separator" className={style.separator} />
					)}
					<div
						role="menuitem"
						aria-disabled={item.disabled}
						className={classNames(style.item, {
							[style.active]: index === activeIndex,
							[style.disabled]: item.disabled,
						})}
						onMouseEnter={() => {
							!item.disabled && setActiveIndex(index);
						}}
						onClick={() => {
							!item.disabled && onSelect(item.id);
						}}
					>
						{/* always reserve the icon column so labels stay aligned */}
						<span
							className={classNames(
								"codicon",
								style.icon,
								item.icon && `codicon-${item.icon}`
							)}
						/>
						<span className={style.label}>{item.label}</span>
					</div>
				</Fragment>
			))}
		</div>
	);
};

export default ContextMenu;
