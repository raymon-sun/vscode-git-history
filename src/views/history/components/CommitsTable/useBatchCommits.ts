import { useCallback, useRef, useState } from "react";

import type { ICommit } from "../../../../git/commit";
import type { BatchedCommits, LogOptions } from "../../../../git/types";

export function useBatchCommits() {
	const [commits, _setCommits] = useState<ICommit[]>([]);
	const commitsRef = useRef(commits);
	const setCommits = (commits: ICommit[]) => {
		commitsRef.current = commits;
		_setCommits(commits);
	};
	const [options, setOptions] = useState<LogOptions>({});
	const [commitsCount, setCommitsCount] = useState<number>(0);

	const setBatchedCommits = useCallback((batchedCommits: BatchedCommits) => {
		const {
			commits: newCommits,
			batchNumber,
			totalCount,
			options,
		} = batchedCommits;
		setOptions(options);
		setCommitsCount(totalCount);
		setCommits(
			batchNumber === 0
				? newCommits
				: commitsRef.current.concat(newCommits)
		);
	}, []);

	return { commits, commitsCount, options, setBatchedCommits };
}
