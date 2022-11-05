import { useCallback, useRef, useState } from "react";

import type { LogOptions, PagedLog } from "../../../../git/types";

import {
	GraphicCommitsResolver,
	IGraphicCommit,
} from "./GraphicCommitsResolver";

export interface Commit {
	data: string;
	graph: string;
}

export function useCommits() {
	const { current: graphicCommitsResolver } = useRef(
		new GraphicCommitsResolver()
	);

	const pagedLogCollectionRef = useRef<PagedLog[]>([]);
	const handleIndexRef = useRef(0);

	const [commits, _setCommits] = useState<IGraphicCommit[]>([]);
	const commitsRef = useRef(commits);
	const setCommits = (commits: IGraphicCommit[]) => {
		commitsRef.current = commits;
		_setCommits(commits);
	};
	const [options, setOptions] = useState<LogOptions>({});
	const [commitsCount, setCommitsCount] = useState<number>(0);

	const setPagedLog = useCallback(
		(pagedLog: PagedLog) => {
			const { log, pageNumber, totalCount, options } = pagedLog;

			if (pageNumber === 0) {
				setOptions(options);
				setCommitsCount(totalCount);
				graphicCommitsResolver.reset();
				pagedLogCollectionRef.current = [];
				handleIndexRef.current = 0;
			}

			pagedLogCollectionRef.current[pageNumber] = pagedLog;

			while (pagedLogCollectionRef.current[handleIndexRef.current]) {
				const graphicCommits = graphicCommitsResolver.resolveLog(log);
				setCommits(commitsRef.current.concat(graphicCommits));
				handleIndexRef.current++;
			}
		},
		[graphicCommitsResolver]
	);

	return { commits, commitsCount, options, setPagedLog };
}
