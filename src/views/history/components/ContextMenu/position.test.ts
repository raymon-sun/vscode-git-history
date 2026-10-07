import { deepStrictEqual } from "assert";

import { placeMenu } from "./position";

const VIEWPORT_WIDTH = 1000;
const VIEWPORT_HEIGHT = 800;
const MENU_WIDTH = 200;
const MENU_HEIGHT = 240;
const MARGIN = 4;

function place(x: number, y: number) {
	return placeMenu(
		x,
		y,
		MENU_WIDTH,
		MENU_HEIGHT,
		VIEWPORT_WIDTH,
		VIEWPORT_HEIGHT,
		MARGIN
	);
}

suite("Context menu position", () => {
	test("should open at the pointer when it fits", () => {
		deepStrictEqual(place(100, 100), { left: 100, top: 100 });
	});

	test("should flip left when it would overflow the right edge", () => {
		deepStrictEqual(place(900, 100), {
			left: 900 - MENU_WIDTH,
			top: 100,
		});
	});

	test("should flip up when it would overflow the bottom edge", () => {
		deepStrictEqual(place(100, 700), {
			left: 100,
			top: 700 - MENU_HEIGHT,
		});
	});

	test("should flip both ways in a corner", () => {
		deepStrictEqual(place(950, 780), {
			left: 950 - MENU_WIDTH,
			top: 780 - MENU_HEIGHT,
		});
	});

	test("should clamp to the margin when even the flipped side overflows", () => {
		// a menu larger than the viewport overflows on both sides
		deepStrictEqual(
			placeMenu(
				900,
				700,
				1200,
				900,
				VIEWPORT_WIDTH,
				VIEWPORT_HEIGHT,
				MARGIN
			),
			{ left: MARGIN, top: MARGIN }
		);
	});
});
