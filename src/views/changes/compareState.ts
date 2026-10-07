/** persisted so the Changes view can label a comparison after a reload */
export const COMPARE_STATE_KEY = "changesCompare";

export interface ICompareState {
	fromRef: string;
	toRef: string;
}

const SHORT_HASH_LENGTH = 7;

const shorten = (hash: string) => hash.slice(0, SHORT_HASH_LENGTH);

/**
 * Label for the Changes view title. The changes usually come from the selected
 * commits, so only a comparison needs to say where it came from.
 */
export function formatCompareDescription(
	compare?: ICompareState
): string | undefined {
	if (!compare?.fromRef || !compare?.toRef) {
		return undefined;
	}

	return `Comparing ${shorten(compare.fromRef)} ↔ ${shorten(compare.toRef)}`;
}
