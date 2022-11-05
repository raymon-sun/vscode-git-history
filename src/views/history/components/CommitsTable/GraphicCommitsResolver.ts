export interface IGraphicCommit {
	hash: string;
	data: string;
	graphSlice: ICommitGraphSlice;

	readonly refNames?: string[];
	readonly message?: string;
	readonly parents?: string[];
	readonly commitDate?: string;
	readonly authorEmail?: string;
	readonly authorName?: string;
	readonly authorDate?: string;
}

export interface IChain {
	hash: string;
	parent: string;
	color: string;
}

export interface ICommitGraphSlice {
	commitPosition: number;
	commitColor: string;
	lines: ICommitGraphSliceLine[];
}

export interface ICommitGraphSliceLine {
	top: number;
	bottom: number;
	color: string;
}

export class GraphicCommitsResolver {
	private curChains: IChain[] = [];
	private curLines: ICommitGraphSliceLine[] = [];
	private colorPicker = getColorPicker();

	resolveLog(log: string) {
		const commitRegex =
			/([0-9a-f]{40})\n.*\n.*\n.*\n.*\n.*\n(.*)(?:\n([^]*?))?(?:\x00)/gm;
		let graphicCommits: IGraphicCommit[] = [];

		let data: string;
		let ref: string;
		let parents: string;
		let match;

		do {
			match = commitRegex.exec(log);
			if (match === null) {
				break;
			}

			[data, ref, parents] = match;

			const hash = ` ${ref}`.substr(1);

			// Stop excessive memory usage by using substr -- https://bugs.chromium.org/p/v8/issues/detail?id=2869
			const commit: IGraphicCommit = {
				hash,
				data,
				graphSlice: this.getGraphSlice(
					hash,
					parents ? parents.split(" ") : [],
					this.curLines
				),
			};

			this.curLines = commit.graphSlice.lines;
			graphicCommits.push(commit);
		} while (true);

		return graphicCommits;
	}

	reset() {
		this.curChains = [];
		this.curLines = [];
		this.colorPicker.reset();
	}

	private getGraphSlice(
		hash: string,
		parents: string[],
		lastLines: ICommitGraphSliceLine[]
	) {
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

	private getCurrentLines(preLines: ICommitGraphSliceLine[]) {
		const existedBottoms: number[] = [];
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
		reset() {
			index = -1;
		},
	};
}
