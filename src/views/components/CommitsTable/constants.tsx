import type { ReactNode } from "react";

import { Commit } from "../../../git/commit";
import GitGraph from "../GitGraph";

type FillRemainWidth = "fill";

export interface IHeader {
	id: string;
	label: string;
	width: number | FillRemainWidth;
	minWidth: number;
	filterable?: boolean;
	transformer: (commit: Commit) => ReactNode | string;
}

export const HEADERS: IHeader[] = [
	{
		id: "graph",
		label: "Graph",
		width: 70,
		minWidth: 70,
		transformer: (commit) => <GitGraph data={commit.graph!} />,
	},
	{
		id: "message",
		label: "Message",
		width: "fill",
		minWidth: 180,
		transformer: (commit) => commit.message,
	},
	{
		id: "hash",
		label: "Hash",
		width: 100,
		minWidth: 100,
		transformer: (commit) => commit.hash.slice(0, 6),
	},
	{
		id: "author",
		label: "Author",
		width: 108,
		minWidth: 108,
		filterable: true,
		transformer: (commit) => commit.authorName,
	},
	{
		id: "date",
		label: "Date/Time",
		width: 164,
		minWidth: 164,
		transformer: (commit) => commit.commitDate,
	},
];
