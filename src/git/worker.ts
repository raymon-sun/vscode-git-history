import { expose } from "threads/worker";

import { parseGitCommits, parseCommits } from "./commit";
export type GitWorker = typeof gitWorker;

const gitWorker = {
	parseGitCommits,
	parseCommits,
};

expose(gitWorker);
