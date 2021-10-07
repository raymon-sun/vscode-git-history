import { injectable } from "inversify";
import { GitService } from "../../git/service";

@injectable()
export class Source {
	constructor(private git: GitService) {}

	getCommits = () => {
		return this.git.getCommits();
	};
}
