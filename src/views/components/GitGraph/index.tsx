import type { FC } from "react";

import { CommitGraphData } from "../../../git/graph";

interface Props {
	data: CommitGraphData;
}

const GitGraph: FC<Props> = ({ data }) => {
	if (!data) {
		return null;
	}

	const UNIT = 14;
	const MIN_WIDTH = 5 * UNIT;
	const HEIGHT = 22;

	const RADIUS = 4;

	const { commitPosition, commitColor, lines } = data;
	const commitX = (commitPosition + 1) * UNIT;

	const width =
		(Math.max(
			...lines.map(({ top, bottom }) => Math.max(top, bottom)),
			commitPosition
		) +
			2) *
		UNIT;
	return (
		<svg width={Math.max(width, MIN_WIDTH)} height={HEIGHT}>
			{lines.map(({ top, bottom, color }, index) => {
				const topX = (top + 1) * UNIT;
				const bottomX = (bottom + 1) * UNIT;
				let points = `${topX},0 ${topX},4 ${bottomX},11 ${bottomX},${HEIGHT}`;
				if (top < 0 && bottom < 0) {
					return null;
				}

				if (top < 0) {
					points = `${commitX},11 ${bottomX},18 ${bottomX},${HEIGHT}`;
				}

				if (bottom < 0) {
					points = `${topX},0 ${topX},4 ${commitX},11`;
				}

				return (
					<polyline
						key={index}
						points={points}
						style={{
							fill: "none",
							stroke: color,
							strokeWidth: 2,
						}}
					/>
				);
			})}
			<circle
				cx={commitX}
				cy={HEIGHT / 2}
				r={RADIUS}
				fill={commitColor}
				stroke={commitColor}
				strokeWidth="2"
			/>
		</svg>
	);
};

export default GitGraph;
