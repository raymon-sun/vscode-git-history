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
		const lines: CommitGraphLine[] =
			commits[index - 1]?.graph?.lines
				.filter(({ bottom }) => bottom !== -1)
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

			const [firstIndex, ...otherIndexList] = indexList.sort();
			commitPosition = firstIndex;
			if (otherIndexList.length) {
				// remove merged branch
				currentBranches = currentBranches.filter(
					(_, i) => !otherIndexList.includes(i)
				);

				lines.forEach(
					(line, index) =>
						otherIndexList.includes(index) && (line.bottom = -1)
				);
			}
		} else {
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

		forkParents.forEach((parent) => {
			const chains = nodeChainMap[parent];
			if (chains) {
				chains;
				// TODO: how to handle
			} else {
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
