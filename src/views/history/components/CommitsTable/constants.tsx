import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import type { ReactNode } from "react";

import { ICommit, CommitIndex } from "../../../../git/commit";
import { CommitGraphSliceIndex } from "../../../../git/types";
import GitGraph from "../GitGraph";
import GitTag from "../GitTag";

type FillRemainWidth = "fill";

export interface IHeader {
	prop:
		| "repositoryName"
		| "graph"
		| "description"
		| "hash"
		| "author"
		| "date";
	label: string;
	width: number | FillRemainWidth;
	minWidth: number;
	filterable?: boolean;
	locatable?: boolean;
	filterLogOption?: string;
	transformer: (commit: ICommit) => ReactNode | string;
}

export const HEADERS: IHeader[] = [
	{
		prop: "repositoryName",
		label: "Repository",
		width: 108,
		minWidth: 108,
		transformer: (commit) => commit[CommitIndex.REPOSITORY_NAME],
	},
	{
		prop: "graph",
		label: "Graph",
		width: 70,
		minWidth: 70,
		transformer: (commit) => (
			<GitGraph data={commit[CommitIndex.GRAPH_SLICE]!} />
		),
	},
	{
		prop: "description",
		label: "Description",
		width: "fill",
		minWidth: 180,
		filterable: true,
		filterLogOption: "keyword",
		transformer: (commit) => (
			<>
				<span>
					{commit[CommitIndex.REF_NAMES].map((refName) => (
						<GitTag
							key={refName}
							refName={refName}
							color={
								commit[CommitIndex.GRAPH_SLICE]![
									CommitGraphSliceIndex.COMMIT_COLOR
								]
							}
						/>
					))}
					<span title={commit[CommitIndex.MESSAGE]}>
						{commit[CommitIndex.MESSAGE]}
					</span>
				</span>
				<VSCodeButton
					data-button
					appearance="icon"
					onClick={() =>
						navigator.clipboard.writeText(
							commit[CommitIndex.MESSAGE]
						)
					}
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
		transformer: (commit) => (
			<>
				<span>{commit[CommitIndex.HASH].slice(0, 6)}</span>
				<VSCodeButton
					data-button
					appearance="icon"
					onClick={() =>
						navigator.clipboard.writeText(commit[CommitIndex.HASH])
					}
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
		transformer: (commit) => commit[CommitIndex.AUTHOR_NAME],
	},
	{
		prop: "date",
		label: "Date/Time",
		width: 164,
		minWidth: 164,
		transformer: (commit) => commit[CommitIndex.COMMIT_DATE],
	},
];
