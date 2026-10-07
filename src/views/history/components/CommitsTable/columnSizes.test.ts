import { deepStrictEqual, strictEqual } from "assert";

import { getSizes, resizeColumns } from "./columnSizes";

import type { IHeader } from "./constants";

const TOTAL_WIDTH = 800;

/** mirrors the real table: Description fills, Hash can be shrunk, Author/Date are pinned */
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
			minWidth: 64,
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

	test("should let the flexible column absorb a resize so the neighbor moves away", () => {
		const columns = createColumns();
		const sizes = getSizes(columns, TOTAL_WIDTH);

		// wide the author column: the description shrinks, the hash keeps its size
		deepStrictEqual(
			resizeColumns(sizes, columns, 3, 30),
			[70, 316, 100, 138, 176]
		);
	});

	test("should use the adjacent column once the flexible column is at its minimum width", () => {
		const columns = createColumns();
		const sizes = [70, 180, 100, 108, 176];

		deepStrictEqual(
			resizeColumns(sizes, columns, 3, 30),
			[70, 180, 70, 138, 176]
		);
	});

	test("should shrink a column below its default width", () => {
		const columns = createColumns();
		const sizes = getSizes(columns, TOTAL_WIDTH);

		// narrow the hash column: it starts at 100 and can go down to 64
		deepStrictEqual(
			resizeColumns(sizes, columns, 2, -30),
			[70, 376, 70, 108, 176]
		);
	});

	test("should clamp shrinking at the minimum width", () => {
		const columns = createColumns();
		const sizes = getSizes(columns, TOTAL_WIDTH);

		deepStrictEqual(
			resizeColumns(sizes, columns, 2, -100),
			[70, 382, 64, 108, 176]
		);
	});

	test("should clamp growing when no column can give space", () => {
		const columns = createColumns();
		const sizes = [70, 180, 64, 108, 176];

		deepStrictEqual(resizeColumns(sizes, columns, 3, 30), sizes);
	});

	test("should grow the hash column against the flexible column on its left", () => {
		const columns = createColumns();
		const sizes = getSizes(columns, TOTAL_WIDTH);

		deepStrictEqual(
			resizeColumns(sizes, columns, 2, 20),
			[70, 326, 120, 108, 176]
		);
	});

	test("should fall back to the adjacent column when there is no flexible column", () => {
		const columns: IHeader[] = [
			{
				prop: "graph",
				label: "Graph",
				width: 70,
				minWidth: 70,
				transformer: () => null,
			},
			{
				prop: "hash",
				label: "Hash",
				width: 100,
				minWidth: 64,
				transformer: () => null,
			},
			{
				prop: "author",
				label: "Author",
				width: 108,
				minWidth: 108,
				transformer: () => null,
			},
		];
		const sizes = getSizes(columns, 278);

		deepStrictEqual(resizeColumns(sizes, columns, 2, 20), [70, 80, 128]);
	});

	test("should keep the total width unchanged for any resize", () => {
		const columns = createColumns();
		const sizes = getSizes(columns, TOTAL_WIDTH);

		for (let index = 1; index < columns.length; index += 1) {
			for (const delta of [-100, -30, 0, 30, 100]) {
				const resized = resizeColumns(sizes, columns, index, delta);
				strictEqual(
					resized.reduce((total, size) => total + size, 0),
					TOTAL_WIDTH
				);
			}
		}
	});
});
