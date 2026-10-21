export type Rgb = [number, number, number];

/** WCAG AA contrast for non-text content such as graph lines */
export const MIN_GRAPH_CONTRAST = 3;

/**
 * Resolve any CSS color expression (including `var(...)`) to RGB.
 *
 * CSS variables are resolved at computed-value time, so a probe element lets
 * the browser do the work instead of re-implementing variable lookups.
 */
export function resolveCssColor(color: string): Rgb | undefined {
	if (typeof document === "undefined") {
		return undefined;
	}

	const probe = document.createElement("span");
	probe.style.color = color;
	probe.style.display = "none";
	document.body.appendChild(probe);

	const resolved = getComputedStyle(probe).color;
	probe.remove();

	return parseRgb(resolved);
}

export function parseRgb(value: string): Rgb | undefined {
	const rgb = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
	if (rgb) {
		return toRgb([Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]);
	}

	// newer Chromium serializes some colors as `color(srgb r g b)` with
	// channels in the 0..1 range
	const srgb = value.match(
		/color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i
	);
	if (srgb) {
		return toRgb([
			Number(srgb[1]) * 255,
			Number(srgb[2]) * 255,
			Number(srgb[3]) * 255,
		]);
	}

	return undefined;
}

function toRgb(channels: number[]): Rgb | undefined {
	if (channels.some((channel) => !Number.isFinite(channel))) {
		return undefined;
	}

	return [clamp(channels[0]), clamp(channels[1]), clamp(channels[2])];
}

function clamp(channel: number) {
	return Math.min(255, Math.max(0, channel));
}

function linearize(channel: number) {
	const value = channel / 255;
	return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance([r, g, b]: Rgb) {
	return (
		0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
	);
}

export function contrastRatio(a: Rgb, b: Rgb) {
	const first = relativeLuminance(a);
	const second = relativeLuminance(b);
	const lighter = Math.max(first, second);
	const darker = Math.min(first, second);

	return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Return a color that stays visible when `color` is too close to
 * `background`, or `undefined` when `color` already has enough contrast.
 *
 * Black or white is used as the fallback: one of them always has a contrast
 * ratio of at least ~4.5 against any background, so the line cannot vanish.
 */
export function readableFallback(
	color: Rgb,
	background: Rgb,
	minContrast = MIN_GRAPH_CONTRAST
): string | undefined {
	if (contrastRatio(color, background) >= minContrast) {
		return undefined;
	}

	const white: Rgb = [255, 255, 255];
	const black: Rgb = [0, 0, 0];

	return contrastRatio(white, background) >= contrastRatio(black, background)
		? "#ffffff"
		: "#000000";
}
