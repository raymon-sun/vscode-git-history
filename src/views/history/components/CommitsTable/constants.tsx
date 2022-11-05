import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import type { ReactNode } from "react";

import GitGraph from "../GitGraph";
import GitTag from "../GitTag";

import { IGraphicCommit } from "./GraphicCommitsResolver";

type FillRemainWidth = "fill";

export interface IHeader {
	prop: string;
	label: string;
	width: number | FillRemainWidth;
	minWidth: number;
	filterable?: boolean;
	locatable?: boolean;
	filterLogOption?: string;
	transformer: (commit: IGraphicCommit) => ReactNode | string;
}

export const HEADERS: IHeader[] = [
	{
		prop: "graph",
		label: "Graph",
		width: 70,
		minWidth: 70,
		transformer: (commit) => <GitGraph data={commit.graphSlice!} />,
	},
	{
		prop: "description",
		label: "Description",
		width: "fill",
		minWidth: 180,
		filterable: true,
		filterLogOption: "keyword",
		transformer: ({ refNames, message, graphSlice }) => (
			<>
				<span>
					{refNames?.map((refName) => (
						<GitTag
							key={refName}
							refName={refName}
							color={graphSlice!.commitColor}
						/>
					))}
					<span title={message}>{message}</span>
				</span>
				<VSCodeButton
					data-button
					appearance="icon"
					onClick={() => navigator.clipboard.writeText(message || "")}
					title="Copy Message"
				>
					<span className="codicon codicon-copy" />
				</VSCodeButton>
			</>
		),
	},
	{
		prop: "hash",
		label: "Hash",
		width: 100,
		minWidth: 100,
		locatable: true,
		transformer: ({ hash }) => (
			<>
				<span>{hash.slice(0, 6)}</span>
				<VSCodeButton
					data-button
					appearance="icon"
					onClick={() => navigator.clipboard.writeText(hash)}
					title="Copy Hash"
				>
					<span className="codicon codicon-copy" />
				</VSCodeButton>
			</>
		),
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
