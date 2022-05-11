import { Commit } from "./commit";

// TODO: merge to #getCommits()
export function attachGraph(commits: Commit[]) {
	/** record chains cross current commit */
	let currentChains: IBranchNode[][] = [];
	/** record commit hash with chains chain */
	const nodeChainsMap: Record<string, IBranchNode[][]> = {};
	commits.forEach((commit, index) => {
		const { hash, parents } = commit;
		const lines = getCurrentLines(commits[index - 1]);

		const node = { hash, position: index };
		const existedChains = nodeChainsMap[hash];

		const [firstParent, ...forkParents] = parents;
		let commitPosition: number;
		if (existedChains) {
			// not first node of a chain
			const sortedIndexList = getSortedIndexListForCurrentChains(
				existedChains,
				currentChains,
				(chain) => chain.push(node)
			);
			const [firstIndex, ...otherIndexList] = sortedIndexList;
			commitPosition = firstIndex;

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
			// first node of a chain
			const newChain = [node];
			pushChains(nodeChainsMap, firstParent, [newChain]);

			currentChains.push(newChain);
			commitPosition = currentChains.length - 1;
			lines.push({
				top: -1,
				bottom: currentChains.length - 1,
				color: "red",
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
				if (firstIndex !== undefined) {
					lines.push({
						top: -1,
						bottom: firstIndex,
						color: "red",
					});
				}
			} else {
				// new chain
				const otherChain = [{ ...node }];
				pushChains(nodeChainsMap, parent, [otherChain]);
				currentChains.push(otherChain);
				lines.push({
					top: -1,
					bottom: currentChains.length - 1,
					color: "red",
				});
			}
		});

		commit.graph = { commitPosition, lines };
	});
}

function pushChains(
	nodeChainsMap: Record<string, IBranchNode[][]>,
	hash: string,
	chain: IBranchNode[][]
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
	chains: IBranchNode[][],
	currentChains: IBranchNode[][],
	iterationCallback?: (chain: IBranchNode[]) => void
) {
	const indexList: number[] = [];
	chains.forEach((chain) => {
		const index = currentChains.indexOf(chain);
		index >= 0 && indexList.push(index);

		iterationCallback?.(chain);
	});

	return indexList.sort();
}

interface IBranchNode {
	hash: string;
	position: number;
}

export interface CommitGraphData {
	commitPosition: number;
	lines: CommitGraphLine[];
}

export interface CommitGraphLine {
	top: number;
	bottom: number;
	color: string;
}
