import { injectable } from "inversify";

// import { attach_graph } from "./pkg/git_graph";

import { IRoughCommit } from "./commit";

import { BatchedCommits, IBatchedCommits } from "./types";

type ILines = (number | string)[];

@injectable()
export class GitGraph {
	private batchedCommitsCollection: BatchedCommits[] = [];
	private postIndex = 0;
	private postHandler?: (batchedCommits: IBatchedCommits) => void;

	private colorPicker = getColorPicker();

	/** record chains cross current commit */
	private hashChains: string[] = [];
	private colorChains: string[] = [];
	/**  */
	private curLines: ILines = [];
	/**  */
	private curParents: string[] = [];

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
		this.hashChains = [];
		this.colorChains = [];
		this.curParents = [];
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
						: this.getSingleLineGraphSlice(hash, parents)
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

	private getSingleLineGraphSlice(hash: string, parents: string[]) {
		const commitColor = "#06A77D";

		const lines = [];
		if (this.curParents.includes(hash)) {
			lines.push(-2, -1, commitColor);
		}

		this.curParents = [...parents];

		return `0\n${commitColor}\n${JSON.stringify(lines)}`;
	}

	private getGraphSlice(hash: string, parents: string[]) {
		const lines = [...this.curLines];

		const [firstParent, ...forkParents] = parents;
		let commitPosition: number;
		let commitColor: string;

		const firstIndex = this.hashChains.indexOf(hash);
		if (firstIndex !== -1) {
			// not first node of a chain
			const otherIndexes = this.getAllIndexes(
				this.hashChains,
				hash,
				firstIndex
			);
			commitPosition = firstIndex;
			commitColor = this.colorChains[firstIndex];
			this.hashChains[firstIndex] = firstParent;

			const mergedIndexes = firstParent
				? otherIndexes
				: [firstIndex, ...otherIndexes];
			if (mergedIndexes.length) {
				// remove merged chains
				// TODO: iterate into #getAllIndexes
				this.updateChainsByMergedIndexes(
					this.hashChains,
					this.colorChains,
					mergedIndexes
				);
				this.collapseMergedLines(lines, this.curLines, mergedIndexes);
			}
		} else {
			commitColor = this.colorPicker.get();
			commitPosition = this.hashChains.length;
			if (firstParent) {
				this.hashChains.push(firstParent);
				this.colorChains.push(commitColor);
			}

			// first node of a chain
			const bottom = firstParent ? this.hashChains.length - 1 : -1;
			lines.push(-1, bottom, commitColor);
			this.curLines.push(bottom, bottom, commitColor);
		}

		// handle multiple parents of the node
		forkParents.forEach((parent) => {
			const firstParentIndex = this.hashChains.indexOf(parent);
			if (firstParentIndex !== -1) {
				// flow into the existed chain
				const color = this.colorChains[firstParentIndex];
				if (firstParentIndex !== undefined) {
					lines.push(-1, firstParentIndex, color);
				}
			} else {
				// new chain
				commitColor = this.colorPicker.get();
				this.hashChains.push(parent);
				this.colorChains.push(commitColor);

				const bottom = this.hashChains.length - 1;
				lines.push(-1, bottom, commitColor);
				this.curLines.push(bottom, bottom, commitColor);
			}
		});

		return `${commitPosition}\n${commitColor}\n${JSON.stringify(lines)}`;
	}

	private getAllIndexes(list: string[], hash: string, start = -1) {
		const indexes = [];
		let i = start;
		while ((i = list.indexOf(hash, i + 1)) !== -1) {
			indexes.push(i);
		}
		return indexes;
	}

	private updateChainsByMergedIndexes(
		hashChains: string[],
		colorChains: string[],
		indexes: number[]
	) {
		for (var i = indexes.length - 1; i >= 0; i--) {
			hashChains.splice(indexes[i], 1);
			colorChains.splice(indexes[i], 1);
		}
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
