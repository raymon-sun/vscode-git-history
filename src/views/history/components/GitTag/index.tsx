import type { FC } from "react";

import style from "./index.module.scss";

interface Props {
	refName: string;
	color: string;
}

const TAG_PREFIX = "tag: ";

const GitTag: FC<Props> = ({ refName, color }) => {
	const isTag = refName.startsWith(TAG_PREFIX);
	const label = isTag ? refName.slice(TAG_PREFIX.length) : refName;

	return (
		<div
			className={style["tag-container"]}
			// lets the commit row detect a right click on a tag
			data-tag-name={isTag ? label : undefined}
			style={{
				backgroundColor: `color-mix(in srgb, ${color} 44%, transparent)`,
			}}
		>
			<span
				className={`codicon codicon-${isTag ? "tag" : "git-branch"} ${
					style.icon
				}`}
			/>
			{label}
		</div>
	);
};

export default GitTag;
