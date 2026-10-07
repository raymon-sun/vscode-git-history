export interface IComparePair {
	/** the older revision, i.e. the "before" side of the diff */
	from: string;
	/** the newer revision, i.e. the "after" side */
	to: string;
}

/**
 * Order two selected commits so the diff between them reads oldest to newest.
 * The commit list is newest first, so the position in `commits` decides which
 * one is the newer one.
 *
 * @returns the ordered pair, or `undefined` when the two hashes are not a
 * usable pair of commits from the list
 */
export function getComparePair(
	hashes: string[],
	commits: string[]
): IComparePair | undefined {
	if (hashes.length !== 2) {
		return undefined;
	}

	const positionOf = (hash: string) =>
		commits.findIndex((commit) => commit.startsWith(hash));

	const [first, second] = hashes;
	const firstPosition = positionOf(first);
	const secondPosition = positionOf(second);

	if (
		firstPosition === -1 ||
		secondPosition === -1 ||
		firstPosition === secondPosition
	) {
		return undefined;
	}

	return firstPosition < secondPosition
		? { from: second, to: first }
		: { from: first, to: second };
}
