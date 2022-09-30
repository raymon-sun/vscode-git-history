import { injectable } from "inversify";

import { getLastItem } from "../views/utils/common";

import { Commit } from "./commit";

import { BatchedCommits } from "./types";

@injectable()
export class GitGraph {
	private batchedCommitsCollection: BatchedCommits[] = [];
	private postIndex = 0;
	private postHandler?: (batchedCommits: BatchedCommits) => void;

	private colorPicker = getColorPicker();

	/** record chains cross current commit */
	private curChains: IChain[] = [];

	registerHandler(postHandler: (batchedCommits: BatchedCommits) => void) {
		this.clear();
		this.postHandler = postHandler;
	}

	attachGraphAndPost(batchedCommits: BatchedCommits) {
		const { batchNumber } = batchedCommits;
		this.batchedCommitsCollection[batchNumber] = batchedCommits;

		while (this.currentBatchedCommits) {
			const lastCommit = getLastItem(
				this.batchedCommitsCollection[this.postIndex - 1]?.commits
			);

			this.setGraphToCommits(
				this.currentBatchedCommits.commits,
				lastCommit
			);
			this.postHandler?.(this.currentBatchedCommits);
			this.postIndex++;
		}
	}

	private clear() {
		this.postIndex = 0;
		this.batchedCommitsCollection = [];
		this.curChains = [];
	}

	private get currentBatchedCommits() {
		return this.batchedCommitsCollection[this.postIndex];
	}

	private setGraphToCommits(commits: Commit[], lastCommit?: Commit) {
		commits.reduce((pre, commit) => {
			commit.graph = this.getGraphSlice(commit, pre);
			return commit;
		}, lastCommit);
	}

	private getGraphSlice(commit: Commit, preCommit?: Commit) {
		const { hash, parents } = commit;
		const lines = this.getCurrentLines(preCommit);

		const [firstParent, ...forkParents] = parents;
		let commitPosition: number;
		let commitColor: string;

		const indexList = this.getIndexList(this.curChains, hash);
		if (indexList.length) {
			// not first node of a chain
			const [firstIndex, ...otherIndexList] = indexList;
			commitPosition = firstIndex;
			commitColor = this.curChains[firstIndex].color;
			this.curChains[firstIndex].hash = hash;
			this.curChains[firstIndex].parent = firstParent;

			const mergedIndexList = firstParent ? otherIndexList : indexList;
			if (mergedIndexList.length) {
				// remove merged chains
				this.curChains = this.curChains.filter(
					(_, i) => !mergedIndexList.includes(i)
				);

				let bottomIndex = 0;
				lines.forEach((line, index) => {
					if (mergedIndexList.includes(index)) {
						line.bottom = -1;
					} else {
						line.bottom = bottomIndex;
						bottomIndex++;
					}
				});
			}
		} else {
			commitColor = this.colorPicker.get();
			commitPosition = this.curChains.length;
			if (firstParent) {
				this.curChains.push({
					hash,
					parent: firstParent,
					color: commitColor,
				});
			}

			// first node of a chain
			lines.push({
				top: -1,
				bottom: firstParent ? this.curChains.length - 1 : -1,
				color: commitColor,
			});
		}

		// handle multiple parents of the node
		forkParents.forEach((parent) => {
			const hasSameParent =
				this.curChains.findIndex((chain) => chain.parent === parent) !==
				-1;
			if (hasSameParent) {
				// flow into the existed chain
				const [firstIndex] = this.getIndexList(this.curChains, parent);
				const firstChain = this.curChains[firstIndex];

				const color = firstChain.color;
				if (firstIndex !== undefined) {
					lines.push({
						top: -1,
						bottom: firstIndex,
						color,
					});
				}
			} else {
				// new chain
				commitColor = this.colorPicker.get();
				this.curChains.push({
					hash,
					parent,
					color: commitColor,
				});

				lines.push({
					top: -1,
					bottom: this.curChains.length - 1,
					color: commitColor,
				});
			}
		});

		return { commitPosition, commitColor, lines };
	}

	private getCurrentLines(preCommit?: Commit) {
		const existedBottoms: number[] = [];
		const preLines = preCommit?.graph?.lines || [];
		return preLines
			.filter(({ bottom }) => {
				if (existedBottoms.includes(bottom)) {
					return false;
				}

				existedBottoms.push(bottom);
				return bottom !== -1;
			})
			.map(({ bottom, color }) => ({
				top: bottom,
				bottom,
				color,
			}));
	}

	private getIndexList(chains: IChain[], hash: string) {
		const indexList: number[] = [];
		chains.forEach(({ parent }, index) => {
			if (parent === hash) {
				indexList.push(index);
			}
		});

		return indexList;
	}
}

function getColorPicker() {
	let index = -1;
	const colors = [
		"#06A77D",
		"#C62E65",
		"#005377",
		"#D5C67A",
		"#F1A208",
		"#D36135",
		"#D63AF9",
	];
	return {
		get() {
			if (index >= colors.length - 1) {
				index = 0;
			} else {
				index++;
			}

			return colors[index];
		},
	};
}

interface IChain {
	hash: string;
	parent: string;
	color: string;
}

export interface CommitGraphData {
	commitPosition: number;
	commitColor: string;
	lines: CommitGraphLine[];
}

export interface CommitGraphLine {
	top: number;
	bottom: number;
	color: string;
}
