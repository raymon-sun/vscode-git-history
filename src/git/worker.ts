import { expose } from "threads/worker";

import { parseCommits } from "./commit";
export type GitWorker = typeof gitWorker;

const gitWorker = {
	parseCommits,
};

expose(gitWorker);
