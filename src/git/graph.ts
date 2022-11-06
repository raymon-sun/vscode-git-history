import { injectable } from "inversify";

import { getLastItem } from "../views/history/utils/common";

// import { attach_graph } from "./pkg/git_graph";

import { ICommit, CommitIndex } from "./commit";

import {
	BatchedCommits,
	CommitGraphSliceIndex,
	ICommitGraphLine,
	ICommitGraphSlice,
} from "./types";

interface IChain {
	hash: string;
	parent: string;
	color: string;
}

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
			const lastLines =
				getLastItem(
					this.batchedCommitsCollection[this.postIndex - 1]?.commits
				)?.[CommitIndex.GRAPH_SLICE]?.[CommitGraphSliceIndex.LINES] ||
				[];

			this.setGraphToCommits(
				this.currentBatchedCommits.commits,
				lastLines
			);
			this.postHandler?.(this.currentBatchedCommits);
			this.postIndex++;
		}
	}

	private clear() {
		this.postIndex = 0;
		this.batchedCommitsCollection = [];
		this.curChains = [];
		this.colorPicker.reset();
	}

	private get currentBatchedCommits() {
		return this.batchedCommitsCollection[this.postIndex];
	}

	private setGraphToCommits(
		commits: ICommit[],
		lastLines: ICommitGraphLine[]
	) {
		commits.reduce((pre, commit) => {
			const graphSlice = this.getGraphSlice(commit, pre);
			commit.push(graphSlice);
			return graphSlice[CommitGraphSliceIndex.LINES];
		}, lastLines);
	}

	// private setGraphToCommitsByWasm(
	// 	commits: Commit[],
	// 	lastLines: CommitGraphLine[]
	// ) {
	// 	const { graphicCommits, chains } = attach_graph(
	// 		commits,
	// 		lastLines,
	// 		this.curChains
	// 	);
	// 	this.currentBatchedCommits.commits = graphicCommits;
	// 	this.curChains = chains;
	// }

	private getGraphSlice(
		commit: ICommit,
		lastLines: ICommitGraphLine[]
	): ICommitGraphSlice {
		const [hash, , , parents] = commit;
		const lines = this.getCurrentLines(lastLines);

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
						line[1] = -1;
					} else {
						line[1] = bottomIndex;
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
			lines.push([
				-1,
				firstParent ? this.curChains.length - 1 : -1,
				commitColor,
			]);
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
					lines.push([-1, firstIndex, color]);
				}
			} else {
				// new chain
				commitColor = this.colorPicker.get();
				this.curChains.push({
					hash,
					parent,
					color: commitColor,
				});

				lines.push([-1, this.curChains.length - 1, commitColor]);
			}
		});

		return [commitPosition, commitColor, lines];
	}

	private getCurrentLines(preLines: ICommitGraphLine[]) {
		const existedBottoms: Record<number, true> = {};
		const lines: ICommitGraphLine[] = [];
		preLines.forEach(([, bottom, color]) => {
			if (existedBottoms[bottom]) {
				return;
			}

			existedBottoms[bottom] = true;
			if (bottom !== -1) {
				lines.push([bottom, bottom, color]);
			}
		});

		return lines;
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
		reset() {
			index = -1;
		},
	};
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
