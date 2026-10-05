import { useContext, type FC } from "react";

import { LatestCommitContext } from "../../data/latestCommit";

export type GitGraphNodeKind = "head" | "merge" | "node";

interface Props {
	data: [number, string, (number | string)[]];
	kind?: Exclude<GitGraphNodeKind, "head">;
	hash?: string;
}

const UNIT = 14;
const MIN_WIDTH = 5 * UNIT;
const HEIGHT = 22;
const NODE_CENTER_Y = HEIGHT / 2;

// Geometry mirrors VS Code's built-in Source Control graph
// (src/vs/workbench/contrib/scm/browser/scmHistory.ts).
const CIRCLE_RADIUS = 4;
const CIRCLE_STROKE_WIDTH = 2;
const LINE_WIDTH = 1;

const ROW_BACKGROUND =
	"var(--vscode-panel-background, var(--vscode-editor-background))";
// inner circles keep the row background gap
const NODE_GAP_COLOR = `var(--git-graph-node-gap, ${ROW_BACKGROUND})`;
// the outer circle drops its gap on hover/selection so the node grows and
// merges with the line (mirrors VS Code's graph hover style)
const NODE_OUTER_GAP_COLOR = `var(--git-graph-node-outer-gap, ${NODE_GAP_COLOR})`;

const GitGraph: FC<Props> = ({ data, kind = "node", hash }) => {
	const latestCommit = useContext(LatestCommitContext);

	if (!data) {
		return null;
	}

	// the newest commit is highlighted, like the current item in VS Code's graph
	const nodeKind: GitGraphNodeKind =
		hash && hash === latestCommit ? "head" : kind;

	const [commitPosition, commitColor, lines] = data;
	const commitX = (commitPosition + 1) * UNIT;

	const width =
		(Math.max(
			...mapLines(lines, ([top, bottom]) => Math.max(top, bottom)),
			commitPosition
		) +
			2) *
		UNIT;
	return (
		<svg width={Math.max(width, MIN_WIDTH)} height={HEIGHT}>
			{mapLines(lines, ([top, bottom, color], index) => {
				const topX = (top + 1) * UNIT;
				const bottomX = (bottom + 1) * UNIT;
				let points = `${topX},0 ${topX},4 ${bottomX},11 ${bottomX},${HEIGHT}`;

				if (top === -1 && bottom === -1) {
					return null;
				}

				if (top === -1) {
					points = `${commitX},11 ${bottomX},18 ${bottomX},${HEIGHT}`;
				}

				if (bottom === -1) {
					points = `${topX},0 ${topX},4 ${commitX},11`;
				}

				if (top === -2 && bottom === -1) {
					points = `${commitX},-11 ${commitX},11`;
				}

				return (
					<polyline
						key={index}
						points={points}
						style={{
							fill: "none",
							stroke: color,
							strokeWidth: LINE_WIDTH,
							strokeLinecap: "round",
						}}
					/>
				);
			})}
			{renderNode(nodeKind, commitX, commitColor)}
		</svg>
	);
};

function renderNode(kind: GitGraphNodeKind, cx: number, color: string) {
	const drawCircle = (
		key: string,
		radius: number,
		strokeWidth: number,
		gapColor: string,
		fill?: string
	) => (
		<circle
			key={key}
			cx={cx}
			cy={NODE_CENTER_Y}
			r={radius}
			style={{
				stroke: gapColor,
				strokeWidth,
				fill: fill ?? "none",
			}}
		/>
	);

	switch (kind) {
		case "head":
			return [
				drawCircle(
					"outer",
					CIRCLE_RADIUS + 3,
					CIRCLE_STROKE_WIDTH,
					NODE_OUTER_GAP_COLOR,
					color
				),
				drawCircle(
					"inner",
					CIRCLE_STROKE_WIDTH,
					CIRCLE_RADIUS,
					NODE_GAP_COLOR
				),
			];
		case "merge":
			return [
				drawCircle(
					"outer",
					CIRCLE_RADIUS + 2,
					CIRCLE_STROKE_WIDTH,
					NODE_OUTER_GAP_COLOR,
					color
				),
				drawCircle(
					"inner",
					CIRCLE_RADIUS - 1,
					CIRCLE_STROKE_WIDTH,
					NODE_GAP_COLOR,
					color
				),
			];
		default:
			return [
				drawCircle(
					"node",
					CIRCLE_RADIUS + 1,
					CIRCLE_STROKE_WIDTH,
					NODE_OUTER_GAP_COLOR,
					color
				),
			];
	}
}

function mapLines<T>(
	lines: (number | string)[],
	handler: (line: [number, number, string], index: number) => T
) {
	const results = [];
	for (let i = 0; i < lines.length; i += 3) {
		results.push(
			handler(
				[
					lines[i] as number,
					lines[i + 1] as number,
					lines[i + 2] as string,
				],
				i / 3
			)
		);
	}

	return results;
}

export default GitGraph;
