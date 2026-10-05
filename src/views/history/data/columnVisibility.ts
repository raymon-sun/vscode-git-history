export interface IColumnVisibility {
	showDescription: boolean;
	showHash: boolean;
	showAuthor: boolean;
	showDate: boolean;
}

export const DEFAULT_COLUMN_VISIBILITY: IColumnVisibility = {
	showDescription: true,
	showHash: true,
	showAuthor: true,
	showDate: true,
};

export const COLUMN_VISIBILITY_STATE_KEY = "columnVisibility";

export const COLUMN_VISIBILITY_OPTIONS: {
	id: keyof IColumnVisibility;
	label: string;
}[] = [
	{ id: "showDescription", label: "Description" },
	{ id: "showHash", label: "Hash" },
	{ id: "showAuthor", label: "Author" },
	{ id: "showDate", label: "Date/Time" },
];
