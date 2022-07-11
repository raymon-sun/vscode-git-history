import type { ReactNode } from "react";

import { Commit } from "../../../git/commit";
import GitGraph from "../GitGraph";
import GitTag from "../GitTag";

type FillRemainWidth = "fill";

export interface IHeader {
	prop: string;
	label: string;
	width: number | FillRemainWidth;
	minWidth: number;
	filterable?: boolean;
	filterLogOption?: string;
	transformer: (commit: Commit) => ReactNode | string;
}

export const HEADERS: IHeader[] = [
	{
		prop: "graph",
		label: "Graph",
		width: 70,
		minWidth: 70,
		transformer: (commit) => <GitGraph data={commit.graph!} />,
	},
	{
		prop: "message",
		label: "Message",
		width: "fill",
		minWidth: 180,
		filterable: true,
		filterLogOption: "keyword",
		transformer: ({ refNames, message, graph }) => (
			<>
				{refNames.map((refName) => (
					<GitTag
						key={refName}
						refName={refName}
						color={graph!.commitColor}
					/>
				))}
				<span title={message}>{message}</span>
			</>
		),
	},
	{
		prop: "hash",
		label: "Hash",
		width: 100,
		minWidth: 100,
		transformer: (commit) => commit.hash.slice(0, 6),
	},
	{
		prop: "author",
		label: "Author",
		width: 108,
		minWidth: 108,
		filterable: true,
		filterLogOption: "authors",
		transformer: (commit) => commit.authorName,
	},
	{
		prop: "date",
		label: "Date/Time",
		width: 164,
		minWidth: 164,
		transformer: (commit) => commit.commitDate,
	},
];
