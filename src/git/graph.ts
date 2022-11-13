import { injectable } from "inversify";

// import { attach_graph } from "./pkg/git_graph";

import { IRoughCommit } from "./commit";

import { BatchedCommits, IBatchedCommits } from "./types";
import { removeItemsByIndexList } from "./utils";

interface IChain {
	hash: string;
	parent: string;
	color: string;
}

type ILines = (number | string)[];

@injectable()
export class GitGraph {
	private batchedCommitsCollection: BatchedCommits[] = [];
	private postIndex = 0;
	private postHandler?: (batchedCommits: IBatchedCommits) => void;

	private colorPicker = getColorPicker();

	/** record chains cross current commit */
	private curChains: IChain[] = [];
	/**  */
	private curLines: ILines = [];

	registerHandler(postHandler: (batchedCommits: IBatchedCommits) => void) {
		this.clear();
		this.postHandler = postHandler;
	}

	attachGraphAndPost(batchedCommits: BatchedCommits) {
		const { batchNumber } = batchedCommits;
		this.batchedCommitsCollection[batchNumber] = batchedCommits;

		while (this.currentBatchedCommits) {
			const { batchNumber, totalCount, options } =
				this.currentBatchedCommits;

			const graphicCommits = this.setGraphToCommits(
				this.currentBatchedCommits.commits,
				!(options.authors || options.keyword)
			);

			this.postHandler?.([
				totalCount,
				batchNumber,
				options.ref ?? "",
				JSON.stringify(options.authors),
				options.keyword ?? "",
				options.maxLength ?? 0,
				...graphicCommits,
			]);

			this.postIndex++;
		}
	}

	private clear() {
		this.postIndex = 0;
		this.batchedCommitsCollection = [];
		this.curChains = [];
		this.curLines = [];
		this.colorPicker.reset();
	}

	private get currentBatchedCommits() {
		return this.batchedCommitsCollection[this.postIndex];
	}

	private setGraphToCommits(commits: IRoughCommit[], setGraph = true) {
		return commits.map(
			([hash, parents, commitData]) =>
				`${commitData}${
					setGraph
						? this.getGraphSlice(hash, parents)
						: `0\n#000\n${JSON.stringify([])}`
				}`
		);
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

	private getGraphSlice(hash: string, parents: string[]) {
		const lines = [...this.curLines];

		const [firstParent, ...forkParents] = parents;
		let commitPosition: number;
		let commitColor: string;

		// TODO: optimize to map
		const indexList = this.getIndexList(this.curChains, hash);
		if (indexList.length) {
			// not first node of a chain
			const [firstIndex, ...otherIndexList] = indexList;
			commitPosition = firstIndex;
			commitColor = this.curChains[firstIndex].color;
			this.curChains[firstIndex].hash = hash;
			this.curChains[firstIndex].parent = firstParent;

			const mergedIndexList = firstParent ? otherIndexList : indexList;
			// TODO: use func #removeItemsByIndexList
			if (mergedIndexList.length) {
				// remove merged chains
				removeItemsByIndexList(this.curChains, mergedIndexList);
				this.collapseMergedLines(lines, this.curLines, mergedIndexList);
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
			const bottom = firstParent ? this.curChains.length - 1 : -1;
			lines.push(-1, bottom, commitColor);
			this.curLines.push(bottom, bottom, commitColor);
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
					lines.push(-1, firstIndex, color);
				}
			} else {
				// new chain
				commitColor = this.colorPicker.get();
				this.curChains.push({
					hash,
					parent,
					color: commitColor,
				});

				const bottom = this.curChains.length - 1;
				lines.push(-1, bottom, commitColor);
				this.curLines.push(bottom, bottom, commitColor);
			}
		});

		return `${commitPosition}\n${commitColor}\n${JSON.stringify(lines)}`;
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

	private collapseMergedLines(
		lines: ILines,
		nextInitialLines: ILines,
		mergedIndexList: number[]
	) {
		const firstMergedIndex = mergedIndexList[0];
		let collapsedCount = 0;
		for (let i = firstMergedIndex * 3; i < lines.length; i += 3) {
			if (mergedIndexList.includes(i / 3)) {
				// line bottom = -1
				lines[i + 1] = -1;
				nextInitialLines.splice(i - collapsedCount * 3, 3);
				collapsedCount++;
			} else {
				// line bottom sub collapsed count
				const lineBottomIndex = i + 1;
				const bottom =
					(lines[lineBottomIndex] as number) - collapsedCount;
				lines[lineBottomIndex] = bottom;

				const nextInitialLineTopIndex = i - collapsedCount * 3;
				const nextInitialLineBottomIndex = nextInitialLineTopIndex + 1;

				nextInitialLines[nextInitialLineTopIndex] = bottom;
				nextInitialLines[nextInitialLineBottomIndex] = bottom;
			}
		}
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
