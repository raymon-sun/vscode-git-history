/**
 * `contextValue` values set on the Changes view items. The `view/item/context`
 * menu contributions in package.json match on these through `viewItem`.
 */
export const CHANGED_FOLDER_CONTEXT = "gitHistory.changedFolder";
export const CHANGED_FILE_CONTEXT = "gitHistory.changedFile";
/** a file that does not exist at the selected revision, so it cannot be opened */
export const DELETED_FILE_CONTEXT = "gitHistory.changedFileDeleted";

export interface IChangeItemKind {
	isFolder: boolean;
	isDeleted: boolean;
}

export function getChangeItemContextValue({
	isFolder,
	isDeleted,
}: IChangeItemKind) {
	if (isFolder) {
		return CHANGED_FOLDER_CONTEXT;
	}

	return isDeleted ? DELETED_FILE_CONTEXT : CHANGED_FILE_CONTEXT;
}
