import { useCallback, useRef, useState } from "react";

import type { Commit } from "../../../git/commit";
import type { BatchedCommits } from "../../../git/types";

export function useBatchCommits() {
	const [commits, _setCommits] = useState<Commit[]>([]);
	const commitsRef = useRef(commits);
	const setCommits = (commits: Commit[]) => {
		commitsRef.current = commits;
		_setCommits(commits);
	};
	const [commitsCount, setCommitsCount] = useState<number>(0);

	const setBatchedCommits = useCallback((batchedCommits: BatchedCommits) => {
		const { commits: newCommits, batchNumber, totalCount } = batchedCommits;
		setCommitsCount(totalCount);
		setCommits(
			batchNumber === 0
				? newCommits
				: commitsRef.current.concat(newCommits)
		);
	}, []);

	return { commits, commitsCount, setBatchedCommits };
}
