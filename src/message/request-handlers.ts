import { container } from "../container/inversify.config";
import { GitService } from "../git/service";

const git = container.get(GitService);

export const REQUEST_HANDLER_MAP: {
	[request: string]: (params?: any) => Promise<any>;
} = {
	commits: () => git.getCommits(),
	diff: (args) => git.diffBetween(args),
};
