import { Commit } from "./commit";

export function getGraphPrinter() {
	const colorPicker = getColorPicker();
	/** record chains cross current commit */
	let curChains: IChain[] = [];
	return {
		print(commit: Commit, index: number, commits: Commit[]) {
			const { hash, parents } = commit;
			const lines = getCurrentLines(commits[index - 1]);

			const [firstParent, ...forkParents] = parents;
			let commitPosition: number;
			let commitColor: string;

			const indexList = getIndexList(curChains, hash);
			if (indexList.length) {
				// not first node of a chain
				const [firstIndex, ...otherIndexList] = indexList;
				commitPosition = firstIndex;
				commitColor = curChains[firstIndex].color;
				curChains[firstIndex].hash = hash;
				curChains[firstIndex].parent = firstParent;

				const mergedIndexList = firstParent
					? otherIndexList
					: indexList;
				if (mergedIndexList.length) {
					// remove merged chains
					curChains = curChains.filter(
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
				commitColor = colorPicker.get();
				curChains.push({
					hash,
					parent: firstParent,
					color: commitColor,
				});

				// first node of a chain
				commitPosition = curChains.length - 1;
				lines.push({
					top: -1,
					bottom: curChains.length - 1,
					color: commitColor,
				});
			}

			// handle multiple parents of the node
			forkParents.forEach((parent) => {
				const hasSameParent =
					curChains.findIndex((chain) => chain.parent === parent) !==
					-1;
				if (hasSameParent) {
					// flow into the existed chain
					const [firstIndex] = getIndexList(curChains, parent);
					const firstChain = curChains[firstIndex];

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
					commitColor = colorPicker.get();
					curChains.push({
						hash,
						parent,
						color: commitColor,
					});

					lines.push({
						top: -1,
						bottom: curChains.length - 1,
						color: commitColor,
					});
				}
			});

			return { commitPosition, commitColor, lines };
		},
	};
}

function getCurrentLines(preCommit?: Commit) {
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

function getIndexList(chains: IChain[], hash: string) {
	const indexList: number[] = [];
	chains.forEach(({ parent }, index) => {
		if (parent === hash) {
			indexList.push(index);
		}
	});

	return indexList;
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
