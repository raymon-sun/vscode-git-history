import { createContext, useEffect, useMemo, useState } from "react";

import { CommitIndex, parseCommit } from "../../../git/commit";
import { CommitGraphSliceIndex } from "../../../git/types";
import {
	MIN_GRAPH_CONTRAST,
	readableFallback,
	resolveCssColor,
} from "../utils/color";

export interface ILatestCommit {
	/** hash of the newest commit currently shown at the top of the list */
	hash: string;
	/** graph color of the newest commit's chain */
	color: string;
	/** color the head chain is drawn with, adjusted to stay visible */
	lineColor: string;
}

export const LatestCommitContext = createContext<ILatestCommit | undefined>(
	undefined
);

// the graph sits on the rows of the list, which are transparent over the panel
const ROW_BACKGROUND =
	"var(--vscode-panel-background, var(--vscode-editor-background, #1e1e1e))";

/** bump on theme changes so the resolved colors are not kept across themes */
function useThemeVersion() {
	const [version, setVersion] = useState(0);

	useEffect(() => {
		const observer = new MutationObserver(() =>
			setVersion((current) => current + 1)
		);
		const options = {
			attributes: true,
			attributeFilter: [
				"class",
				"style",
				"data-vscode-theme-id",
				"data-vscode-theme-kind",
			],
		};
		observer.observe(document.documentElement, options);
		observer.observe(document.body, options);

		return () => observer.disconnect();
	}, []);

	return version;
}

/**
 * Reads the newest commit so the graph can highlight it. The accent color used
 * for the head chain can be nearly invisible on some themes (focus border is
 * often a subtle color), so a high contrast fallback is picked when needed.
 */
export function useLatestCommit(commits: string[]): ILatestCommit | undefined {
	const head = useMemo(() => {
		const raw = commits[0];
		if (!raw) {
			return undefined;
		}

		const commit = parseCommit(raw);
		const color =
			commit[CommitIndex.GRAPH_SLICE]?.[
				CommitGraphSliceIndex.COMMIT_COLOR
			];

		return color ? { hash: commit[CommitIndex.HASH], color } : undefined;
	}, [commits]);

	const themeVersion = useThemeVersion();
	const [lineColor, setLineColor] = useState<string>();

	useEffect(() => {
		if (!head) {
			setLineColor(undefined);
			return;
		}

		const color = resolveCssColor(head.color);
		const background = resolveCssColor(ROW_BACKGROUND);
		const fallback =
			color && background
				? readableFallback(color, background, MIN_GRAPH_CONTRAST)
				: undefined;

		setLineColor(fallback ?? head.color);
	}, [head, themeVersion]);

	if (!head) {
		return undefined;
	}

	return { ...head, lineColor: lineColor ?? head.color };
}
