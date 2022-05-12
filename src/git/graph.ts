import { Commit } from "./commit";

// TODO: merge to #getCommits()
export function attachGraph(commits: Commit[]) {
	const colorPicker = getColorPicker();

	/** record chains cross current commit */
	let currentChains: IChainNode[][] = [];
	/** record commit hash with chains chain */
	const nodeChainsMap: Record<string, IChainNode[][]> = {};
	commits.forEach((commit, index) => {
		const { hash, parents } = commit;
		const lines = getCurrentLines(commits[index - 1]);

		const existedChains = nodeChainsMap[hash];

		const [firstParent, ...forkParents] = parents;
		let commitPosition: number;
		let commitColor: string;
		if (existedChains) {
			// not first node of a chain
			const sortedIndexList = getSortedIndexListForCurrentChains(
				existedChains,
				currentChains,
				(chain) =>
					chain.push({
						hash,
						position: index,
						color: chain[chain.length - 1].color,
					})
			);
			const [firstIndex, ...otherIndexList] = sortedIndexList;
			commitPosition = firstIndex;
			commitColor = getChainColor(currentChains[firstIndex]);

			pushChains(nodeChainsMap, firstParent, existedChains);

			const collapseIndexList = firstParent
				? otherIndexList
				: sortedIndexList;
			if (collapseIndexList.length) {
				// remove merged chains
				currentChains = currentChains.filter(
					(_, i) => !collapseIndexList.includes(i)
				);

				let bottomIndex = 0;
				lines.forEach((line, index) => {
					if (collapseIndexList.includes(index)) {
						line.bottom = -1;
					} else {
						line.bottom = bottomIndex;
						bottomIndex++;
					}
				});
			}
		} else {
			commitColor = colorPicker.get();
			// first node of a chain
			const newChain: IChainNode[] = [
				{ hash, position: index, color: commitColor },
			];
			pushChains(nodeChainsMap, firstParent, [newChain]);

			currentChains.push(newChain);
			commitPosition = currentChains.length - 1;
			lines.push({
				top: -1,
				bottom: currentChains.length - 1,
				color: commitColor,
			});
		}

		// handle multiple parents of the node
		forkParents.forEach((parent) => {
			const chains = nodeChainsMap[parent];
			if (chains) {
				// flow into the existed chain
				const sortedIndexList = getSortedIndexListForCurrentChains(
					chains,
					currentChains
				);
				const [firstIndex] = sortedIndexList;
				const firstChains = currentChains[firstIndex];

				const color = firstChains[firstChains.length - 1].color;
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
				const otherChain = [
					{ hash, position: index, color: commitColor },
				];
				pushChains(nodeChainsMap, parent, [otherChain]);
				currentChains.push(otherChain);
				lines.push({
					top: -1,
					bottom: currentChains.length - 1,
					color: commitColor,
				});
			}
		});

		commit.graph = { commitPosition, commitColor, lines };
	});
}

function pushChains(
	nodeChainsMap: Record<string, IChainNode[][]>,
	hash: string,
	chain: IChainNode[][]
) {
	nodeChainsMap[hash] = [...(nodeChainsMap[hash] || []), ...chain];
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

function getSortedIndexListForCurrentChains(
	chains: IChainNode[][],
	currentChains: IChainNode[][],
	iterationCallback?: (chain: IChainNode[]) => void
) {
	const indexList: number[] = [];
	chains.forEach((chain) => {
		const index = currentChains.indexOf(chain);
		index >= 0 && indexList.push(index);

		iterationCallback?.(chain);
	});

	return indexList.sort();
}

function getColorPicker() {
	let index = -1;
	const colors = [
		"#C62E65",
		"#005377",
		"#06A77D",
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

function getChainColor(chain: IChainNode[]) {
	return chain[chain.length - 1].color;
}

interface IChainNode {
	hash: string;
	position: number;
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
