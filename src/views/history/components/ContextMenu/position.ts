export interface MenuPosition {
	left: number;
	top: number;
}

/**
 * Place the menu at the pointer while keeping it inside the viewport. When the
 * menu would overflow an edge, it flips to the other side of the pointer
 * (falling back to the margin when even that does not fit), like VS Code.
 */
export function placeMenu(
	x: number,
	y: number,
	menuWidth: number,
	menuHeight: number,
	viewportWidth: number,
	viewportHeight: number,
	margin = 0
): MenuPosition {
	let left = x;
	let top = y;

	if (left + menuWidth > viewportWidth) {
		left = Math.max(margin, x - menuWidth);
	}

	if (top + menuHeight > viewportHeight) {
		top = Math.max(margin, y - menuHeight);
	}

	return { left, top };
}
