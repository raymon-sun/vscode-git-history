import { injectable } from "inversify";

// import { attach_graph } from "./pkg/git_graph";

import { IRoughCommit } from "./commit";

import { BatchedCommits, IBatchedCommits } from "./types";

interface IChainRecord {
	indexList: number[];
	colorList: string[];
}

type ILines = (number | string)[];

@injectable()
export class GitGraph {
	private batchedCommitsCollection: BatchedCommits[] = [];
	private postIndex = 0;
	private postHandler?: (batchedCommits: IBatchedCommits) => void;

	private colorPicker = getColorPicker();

	/** record chains cross current commit */
	private curChainMap: Record<string, IChainRecord> = {};
	private curChainLength = 0;
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
			const graphicCommits = this.setGraphToCommits(
				this.currentBatchedCommits.commits
			);

			const { batchNumber, totalCount, options } =
				this.currentBatchedCommits;

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
		this.curChainMap = {};
		this.curChainLength = 0;
		this.colorPicker.reset();
	}

	private get currentBatchedCommits() {
		return this.batchedCommitsCollection[this.postIndex];
	}

	private setGraphToCommits(commits: IRoughCommit[]) {
		return commits.map(
			([hash, parents, commitData]) =>
				`${commitData}${this.getGraphSlice(hash, parents)}`
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

		const chainRecord = this.curChainMap[hash];
		const indexList = chainRecord?.indexList || [];
		if (indexList.length) {
			// not first node of a chain
			const [firstIndex, ...otherIndexList] = indexList;
			const [firstColor] = chainRecord.colorList;
			commitPosition = firstIndex;
			commitColor = firstColor;

			this.addChainRecord(firstParent, commitPosition, commitColor);

			const mergedIndexList = firstParent ? otherIndexList : indexList;
			if (mergedIndexList.length) {
				// remove merged chains
				this.curChainLength =
					this.curChainLength - mergedIndexList.length;

				this.collapseMergedLines(lines, this.curLines, mergedIndexList);
			}
		} else {
			commitColor = this.colorPicker.get();
			commitPosition = this.curChainLength;
			if (firstParent) {
				this.addChainRecord(
					firstParent,
					this.curChainLength,
					commitColor
				);
				this.curChainLength++;
			}

			// first node of a chain
			// TODO: merge first parent condition
			const bottom = firstParent ? this.curChainLength - 1 : -1;
			lines.push(-1, bottom, commitColor);
			this.curLines.push(bottom, bottom, commitColor);
		}

		// handle multiple parents of the node
		forkParents.forEach((parent) => {
			const parentRecord = this.curChainMap[parent];
			if (parentRecord) {
				// flow into the existed chain
				const [firstIndex] = parentRecord.indexList;
				const [firstColor] = parentRecord.colorList;

				if (firstIndex !== undefined) {
					lines.push(-1, firstIndex, firstColor);
				}
			} else {
				// new chain
				commitColor = this.colorPicker.get();

				this.addChainRecord(parent, this.curChainLength, commitColor);

				const bottom = this.curChainLength - 1;
				lines.push(-1, bottom, commitColor);
				this.curLines.push(bottom, bottom, commitColor);
			}
		});

		delete this.curChainMap[hash];

		return `${commitPosition}\n${commitColor}\n${JSON.stringify(lines)}`;
	}

	private addChainRecord(hash: string, index: number, color: string) {
		if (this.curChainMap[hash]) {
			this.curChainMap[hash].indexList.push(index);
			this.curChainMap[hash].colorList.push(color);
		} else {
			this.curChainMap[hash] = {
				indexList: [index],
				colorList: [color],
			};
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
