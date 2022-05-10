import { Commit } from "./commit";

export function attachGraph(commits: Commit[]) {
	const branches: IBranchNode[][] = [];
	let currentBranches: IBranchNode[][] = [];
	/**
	 * record commit hash to its branch chain
	 */
	const nodeChainMap: Record<string, IBranchNode[][]> = {};
	commits.forEach((commit, index) => {
		const { hash, parents } = commit;
		let commitPosition: number;
		const existedBottoms: number[] = [];
		const lines: CommitGraphLine[] =
			commits[index - 1]?.graph?.lines
				.filter(({ bottom }) => {
					if (existedBottoms.includes(bottom)) {
						return false;
					}

					existedBottoms.push(bottom);

					if (bottom !== -1) {
						return true;
					}
				})
				.map(({ bottom, color }) => ({
					top: bottom,
					bottom,
					color,
				})) || [];

		const node = { hash, position: index };
		const existedChains = nodeChainMap[hash];

		const [firstParent, ...forkParents] = parents;
		if (existedChains) {
			const indexList: number[] = [];
			existedChains.forEach((existedChain) => {
				existedChain.push(node);
				const index = currentBranches.indexOf(existedChain);
				if (index < 0) {
					return;
				}

				indexList.push(index);
			});

			nodeChainMap[firstParent] = [
				...(nodeChainMap[firstParent] || []),
				...existedChains,
			];

			const sortedIndexList = indexList.sort();
			const [firstIndex, ...otherIndexList] = sortedIndexList;
			commitPosition = firstIndex;

			const collapseIndexList = firstParent
				? otherIndexList
				: sortedIndexList;
			if (collapseIndexList.length) {
				// remove merged branch
				currentBranches = currentBranches.filter(
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
			// first node of a branch
			const newChain = [node];
			nodeChainMap[firstParent] = [
				...(nodeChainMap[firstParent] || []),
				newChain,
			];

			branches.push(newChain);
			currentBranches.push(newChain);
			commitPosition = currentBranches.length - 1;
			lines.push({
				top: -1,
				bottom: currentBranches.length - 1,
				color: "red",
			});
		}

		// handle multiple parents of the node
		forkParents.forEach((parent) => {
			const chains = nodeChainMap[parent];
			if (chains) {
				// flow into the existed branch
				const indexList: number[] = [];
				chains.forEach((chain) => {
					const index = currentBranches.indexOf(chain);
					if (index < 0) {
						return;
					}

					indexList.push(index);
				});

				const sortedIndexList = indexList.sort();
				const [firstIndex] = sortedIndexList;
				if (firstIndex !== undefined) {
					lines.push({
						top: -1,
						bottom: firstIndex,
						color: "red",
					});
				}
			} else {
				// new branch
				const otherChain = [{ ...node }];
				nodeChainMap[parent] = [
					...(nodeChainMap[parent] || []),
					otherChain,
				];
				currentBranches.push(otherChain);
				branches.push(otherChain);
				lines.push({
					top: -1,
					bottom: currentBranches.length - 1,
					color: "red",
				});
			}
		});

		commit.graph = { commitPosition, lines };
	});
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
