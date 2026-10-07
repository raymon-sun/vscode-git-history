export const EXTENSION_SCHEME = "git-history";

export const HISTORY_VIEW_ID = `${EXTENSION_SCHEME}.history`;
export const CHANGES_VIEW_ID = `${EXTENSION_SCHEME}.changes`;

/** `when` context reflecting the Changes view layout ("tree" | "flat") */
export const CHANGES_VIEW_MODE_CONTEXT = "gitHistory.changesViewMode";

/** `when` context for an active file history filter */
export const FILE_FILTER_CONTEXT = "gitHistory.hasFileFilter";
