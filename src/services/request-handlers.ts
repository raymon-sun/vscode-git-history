import { getCommits } from "./git";

export const REQUEST_HANDLER_MAP: {
	[request: string]: (params?: any) => Promise<any>;
} = {
	commits: getCommits,
};
