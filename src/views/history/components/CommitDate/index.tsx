import { useContext } from "react";
import type { FC } from "react";

import { DateFormatContext } from "../../data/dateFormat";
import { formatFullTime, formatRelativeTime } from "../../utils/date";

interface Props {
	timestamp: number;
}

const CommitDate: FC<Props> = ({ timestamp }) => {
	const { format, now } = useContext(DateFormatContext)!;

	if (format === "absolute") {
		return <span>{formatFullTime(timestamp)}</span>;
	}

	return (
		<span title={formatFullTime(timestamp)}>
			{formatRelativeTime(timestamp, now)}
		</span>
	);
};

export default CommitDate;
