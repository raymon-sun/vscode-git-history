import type { FC } from "react";

interface Props {
	data: [number, string, (number | string)[]];
}

const GitGraph: FC<Props> = ({ data }) => {
	if (!data) {
		return null;
	}

	const UNIT = 14;
	const MIN_WIDTH = 5 * UNIT;
	const HEIGHT = 22;

	const RADIUS = 4;

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
