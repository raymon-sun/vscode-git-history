import { diffBetween, getCommits } from "../git/service";

export const REQUEST_HANDLER_MAP: {
	[request: string]: (params?: any) => Promise<any>;
} = {
	commits: getCommits,
	diff: diffBetween,
};
