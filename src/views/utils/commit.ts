import dayjs from "dayjs";
import type { Commit } from "../../typings/git-extension";

export function getSortedRefs(selectedCommits: { [hash: string]: Commit }) {
	// TODO: optimize arithmetic
	return Object.values(selectedCommits)
		.sort(
			({ commitDate: preDate }, { commitDate: nextDate }) =>
				dayjs(nextDate).unix() - dayjs(preDate).unix()
		)
		.map(({ hash }) => hash);
}
