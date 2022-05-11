import type { FC } from "react";

import { CommitGraphData } from "../../../git/graph";

interface Props {
	data?: CommitGraphData;
}

const GitGraph: FC<Props> = ({ data }) => {
	if (!data) {
		return null;
	}

	const WIDTH = 80;
	const HEIGHT = 22;
	const UNIT = 14;
	const RADIUS = 3;

	const { commitPosition } = data;
	const commitX = (commitPosition + 1) * UNIT;
	return (
		<svg width={WIDTH} height={HEIGHT}>
			<circle
				cx={commitX}
				cy={HEIGHT / 2}
				r={RADIUS}
				fill="red"
				stroke="red"
				strokeWidth="2"
			/>
			{data?.lines.map(({ top, bottom, color }) => {
				const topX = (top + 1) * UNIT;
				const bottomX = (bottom + 1) * UNIT;
				let points = `${topX},0 ${topX},4 ${bottomX},11 ${bottomX},${HEIGHT}`;
				if (top < 0) {
					points = `${commitX},11 ${bottomX},18 ${bottomX},${HEIGHT}`;
				}

				if (bottom < 0) {
					points = `${topX},0 ${topX},4 ${commitX},11`;
				}
				return (
					<polyline
						points={points}
						style={{
							fill: "none",
							stroke: color,
							strokeWidth: 1,
						}}
					/>
				);
			})}
		</svg>
	);
};

export default GitGraph;
