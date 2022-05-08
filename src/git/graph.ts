import { Commit } from "./commit";

export function generateBranches(commits: Commit[]) {
	const branches: IBranchNode[][] = [];
	let currentBranches: IBranchNode[][] = [];
	/**
	 * record commit hash to its branch chain
	 */
	const nodeChainMap: Record<string, IBranchNode[][]> = {};
	commits.forEach(({ hash, parents }, index) => {
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
			nodeChainMap[firstParent] = existedChains;

			const [, ...otherIndexList] = indexList.sort();
			if (otherIndexList.length) {
				// remove merged branch
				currentBranches = currentBranches.filter(
					(_, i) => !otherIndexList.includes(i)
				);
			}
		} else {
			const newChain = [node];
			nodeChainMap[firstParent] = [newChain];

			branches.push(newChain);
			currentBranches.push(newChain);
		}

		forkParents.forEach((parent) => {
			const chains = nodeChainMap[parent];
			if (chains) {
				chains;
				// TODO: how to handle
			} else {
				const otherChain = [{ ...node }];
				nodeChainMap[parent] = [otherChain];
				branches.push(otherChain);
			}
		});
	});

	return branches;
}

interface IBranchNode {
	hash: string;
	position: number;
}

export interface CommitGraphData {
	commitPosition: number;
	lines: { top: number; bottom: number; color: string }[];
}
