import { expose } from "threads/worker";

import { parseGitCommits } from "./commit";
export type GitWorker = typeof gitWorker;

const gitWorker = {
	parseGitCommits,
};

expose(gitWorker);
