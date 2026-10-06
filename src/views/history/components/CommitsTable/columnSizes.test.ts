import { deepStrictEqual } from "assert";

import { getSizes, resizeColumns } from "./columnSizes";

import type { IHeader } from "./constants";

const TOTAL_WIDTH = 800;

/** mirrors the real table: the description column fills, every other column is pinned at its minimum */
function createColumns(hashWidth = 100): IHeader[] {
	return [
		{
			prop: "graph",
			label: "Graph",
			width: 70,
			minWidth: 70,
			transformer: () => null,
		},
		{
			prop: "description",
			label: "Description",
			width: "fill",
			minWidth: 180,
			transformer: () => null,
		},
		{
			prop: "hash",
			label: "Hash",
			width: hashWidth,
			minWidth: 100,
			transformer: () => null,
		},
		{
			prop: "author",
			label: "Author",
			width: 108,
			minWidth: 108,
			transformer: () => null,
		},
		{
			prop: "date",
			label: "Date/Time",
			width: 176,
			minWidth: 176,
			transformer: () => null,
		},
	];
}

suite("Commit column sizes", () => {
	test("should fill the flexible column with the remaining width", () => {
		deepStrictEqual(
			getSizes(createColumns(), TOTAL_WIDTH),
			[70, 346, 100, 108, 176]
		);
	});

	test("should grow a column by shrinking its left neighbor", () => {
		const columns = createColumns(140);
		const sizes = getSizes(columns, TOTAL_WIDTH);

		// drag the divider before the author column to the left
		deepStrictEqual(
			resizeColumns(sizes, columns, 3, 30),
			[70, 306, 110, 138, 176]
		);
	});

	test("should take the space from the fill column when the left neighbor is already at its minimum width", () => {
		const columns = createColumns();
		const sizes = getSizes(columns, TOTAL_WIDTH);

		// the hash column cannot shrink, so the author column grows into the description column
		deepStrictEqual(
			resizeColumns(sizes, columns, 3, 30),
			[70, 316, 100, 138, 176]
		);
	});

	test("should split the space between the left neighbor and the fill column", () => {
		const columns = createColumns(120);
		const sizes = getSizes(columns, TOTAL_WIDTH);

		deepStrictEqual(
			resizeColumns(sizes, columns, 3, 50),
			[70, 296, 100, 158, 176]
		);
	});

	test("should clamp when neither the left neighbor nor the fill column can give space", () => {
		const columns = createColumns();
		const sizes = [70, 180, 100, 108, 176];

		deepStrictEqual(resizeColumns(sizes, columns, 3, 30), sizes);
	});

	test("should clamp shrinking at the minimum width", () => {
		const columns = createColumns(140);
		const sizes = getSizes(columns, TOTAL_WIDTH);

		// the author column is pinned at its minimum width
		deepStrictEqual(resizeColumns(sizes, columns, 3, -30), sizes);

		// the hash column still has some slack
		deepStrictEqual(
			resizeColumns(sizes, columns, 2, -30),
			[70, 336, 110, 108, 176]
		);
	});

	test("should resize the hash column against the fill column on its left", () => {
		const columns = createColumns();
		const sizes = getSizes(columns, TOTAL_WIDTH);

		deepStrictEqual(
			resizeColumns(sizes, columns, 2, 20),
			[70, 326, 120, 108, 176]
		);
	});

	test("should keep the total width unchanged for any resize", () => {
		const columns = createColumns();
		const sizes = getSizes(columns, TOTAL_WIDTH);

		for (let index = 1; index < columns.length; index += 1) {
			for (const delta of [-100, -30, 0, 30, 100]) {
				const resized = resizeColumns(sizes, columns, index, delta);
				deepStrictEqual(
					resized.reduce((total, size) => total + size, 0),
					TOTAL_WIDTH
				);
			}
		}
	});
});
