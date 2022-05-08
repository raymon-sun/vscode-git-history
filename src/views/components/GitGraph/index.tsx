import type { FC } from "react";

import { CommitGraphData } from "../../../git/graph";

interface Props {
	data?: CommitGraphData;
}

const GitGraph: FC<Props> = ({ data }) => {
	if (!data) {
		return null;
	}

	const HEIGHT = 22;
	const UNIT = 14;
	const RADIUS = 4;

	const { commitPosition } = data;
	const commitX = commitPosition * UNIT;
	return (
		<svg height={HEIGHT}>
			<circle
				cx={commitX}
				cy={HEIGHT / 2}
				r={RADIUS}
				fill="black"
				stroke="red"
				strokeWidth="2"
			/>
			{data?.lines.map(({ top, bottom, color }) => {
				const topX = top * UNIT;
				const bottomX = bottom * UNIT;
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
							strokeWidth: 2,
						}}
					/>
				);
			})}
		</svg>
	);
};

export default GitGraph;
