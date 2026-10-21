import { deepStrictEqual, strictEqual } from "assert";

import {
	contrastRatio,
	parseRgb,
	readableFallback,
	relativeLuminance,
} from "./color";

const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];
const MID_GRAY: [number, number, number] = [128, 128, 128];

suite("Color", () => {
	suite("parseRgb", () => {
		test("should parse rgb()", () => {
			deepStrictEqual(parseRgb("rgb(30, 30, 30)"), [30, 30, 30]);
		});

		test("should parse rgba() and ignore the alpha channel", () => {
			deepStrictEqual(parseRgb("rgba(1, 2, 3, 0.5)"), [1, 2, 3]);
		});

		test("should parse the modern space separated syntax", () => {
			deepStrictEqual(parseRgb("rgb(1 2 3)"), [1, 2, 3]);
		});

		test("should parse color(srgb ...)", () => {
			deepStrictEqual(parseRgb("color(srgb 1 0.5 0)"), [255, 127.5, 0]);
		});

		test("should reject values it cannot parse", () => {
			strictEqual(parseRgb("#ff0000"), undefined);
			strictEqual(parseRgb("transparent"), undefined);
			strictEqual(parseRgb(""), undefined);
		});
	});

	suite("contrastRatio", () => {
		test("should reach 21 for black and white", () => {
			strictEqual(contrastRatio(BLACK, WHITE), 21);
		});

		test("should be 1 for the same color", () => {
			strictEqual(contrastRatio(MID_GRAY, MID_GRAY), 1);
		});

		test("should not depend on the argument order", () => {
			strictEqual(
				contrastRatio(BLACK, MID_GRAY),
				contrastRatio(MID_GRAY, BLACK)
			);
		});
	});

	suite("relativeLuminance", () => {
		test("should order black, mid gray and white", () => {
			strictEqual(relativeLuminance(BLACK), 0);
			strictEqual(relativeLuminance(WHITE), 1);

			const gray = relativeLuminance(MID_GRAY);
			strictEqual(gray > 0 && gray < 1, true);
		});
	});

	suite("readableFallback", () => {
		test("should keep a color that already contrasts", () => {
			// bright orange on a dark background
			strictEqual(
				readableFallback([255, 176, 0], [30, 30, 30]),
				undefined
			);
		});

		test("should fall back to white on a dark background", () => {
			strictEqual(
				readableFallback([32, 32, 32], [30, 30, 30]),
				"#ffffff"
			);
		});

		test("should fall back to black on a light background", () => {
			strictEqual(
				readableFallback([245, 245, 245], [255, 255, 255]),
				"#000000"
			);
		});
	});
});
