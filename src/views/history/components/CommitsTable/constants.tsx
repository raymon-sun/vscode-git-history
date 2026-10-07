import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import type { ReactNode } from "react";

import { ICommit, CommitIndex } from "../../../../git/commit";
import { CommitGraphSliceIndex } from "../../../../git/types";
import type { IColumnVisibility } from "../../data/columnVisibility";
import type { DateFormat } from "../../data/dateFormat";
import CommitDate from "../CommitDate";
import GitGraph from "../GitGraph";
import type { GitGraphNodeKind } from "../GitGraph";
import GitTag from "../GitTag";

type FillRemainWidth = "fill";

/** the relative format is shorter than the full date, so the column can be narrower */
const DATE_COLUMN_MIN_WIDTH: { [key in DateFormat]: number } = {
	relative: 96,
	absolute: 160,
};

/** the column starts this much wider than its minimum, so it can also be dragged narrower */
const DATE_COLUMN_WIDTH_SLACK = 12;

/** the width the date column starts with, for the current format */
export const DATE_COLUMN_WIDTH: { [key in DateFormat]: number } = {
	relative: DATE_COLUMN_MIN_WIDTH.relative + DATE_COLUMN_WIDTH_SLACK,
	absolute: DATE_COLUMN_MIN_WIDTH.absolute + DATE_COLUMN_WIDTH_SLACK,
};

function getGraphNodeKind(commit: ICommit): Exclude<GitGraphNodeKind, "head"> {
	if (commit[CommitIndex.PARENTS].length > 1) {
		return "merge";
	}

	return "node";
}

export interface IHeader {
	prop: "graph" | "description" | "hash" | "author" | "date";
	label: string;
	/** the width the column starts with; the fill column grows into the leftover space */
	width: number | FillRemainWidth;
	/** the smallest width the column can be dragged down to */
	minWidth: number;
	filterable?: boolean;
	locatable?: boolean;
	filterLogOption?: string;
	visibilityKey?: keyof IColumnVisibility;
	dateFormatToggle?: boolean;
	transformer: (commit: ICommit) => ReactNode | string;
}

export const HEADERS: IHeader[] = [
	{
		prop: "graph",
		label: "Graph",
		width: 70,
		minWidth: 70,
		transformer: (commit) => (
			<GitGraph
				data={commit[CommitIndex.GRAPH_SLICE]!}
				kind={getGraphNodeKind(commit)}
				hash={commit[CommitIndex.HASH]}
			/>
		),
	},
	{
		prop: "description",
		label: "Description",
		width: "fill",
		minWidth: 180,
		filterable: true,
		filterLogOption: "keyword",
		visibilityKey: "showDescription",
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
		// the commit hash is short, so the column can be dragged down a lot
		minWidth: 64,
		locatable: true,
		visibilityKey: "showHash",
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
		visibilityKey: "showAuthor",
		transformer: (commit) => commit[CommitIndex.AUTHOR_NAME],
	},
	{
		prop: "date",
		label: "Date/Time",
		width: DATE_COLUMN_WIDTH.absolute,
		minWidth: DATE_COLUMN_MIN_WIDTH.absolute,
		visibilityKey: "showDate",
		dateFormatToggle: true,
		transformer: (commit) => (
			<CommitDate timestamp={commit[CommitIndex.COMMIT_DATE]} />
		),
	},
];

export function applyDateFormatWidth(
	headers: IHeader[],
	format: DateFormat
): IHeader[] {
	return headers.map((header) =>
		header.prop === "date"
			? {
					...header,
					width: DATE_COLUMN_WIDTH[format],
					minWidth: DATE_COLUMN_MIN_WIDTH[format],
			  }
			: header
	);
}
