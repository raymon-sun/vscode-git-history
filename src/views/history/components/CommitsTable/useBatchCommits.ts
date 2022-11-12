import { useCallback, useRef, useState } from "react";

import type { IBatchedCommits, LogOptions } from "../../../../git/types";

export function useBatchCommits() {
	const [commits, _setCommits] = useState<string[]>([]);
	const commitsRef = useRef(commits);
	const setCommits = (commits: string[]) => {
		commitsRef.current = commits;
		_setCommits(commits);
	};
	const [options, setOptions] = useState<LogOptions>({});
	const [commitsCount, setCommitsCount] = useState<number>(0);

	const setBatchedCommits = useCallback((batchedCommits: IBatchedCommits) => {
		const [
			totalCount,
			batchNumber,
			ref,
			stringifiedAuthors,
			keyword,
			maxLength,
			...commits
		] = batchedCommits;
		setOptions({
			ref,
			authors: JSON.parse(stringifiedAuthors),
			keyword,
			maxLength,
		});
		setCommitsCount(totalCount);
		setCommits(
			batchNumber === 0 ? commits : commitsRef.current.concat(commits)
		);
	}, []);

	return { commits, commitsCount, options, setBatchedCommits };
}
