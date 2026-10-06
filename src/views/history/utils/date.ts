import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

/**
 * Formats a timestamp relative to now, e.g. "3 days ago", following the
 * moment.js thresholds that most UIs (GitHub included) use.
 */
export function formatRelativeTime(timestamp: number, now: number) {
	return dayjs(now).to(timestamp);
}

export function formatFullTime(timestamp: number) {
	return new Date(timestamp).toLocaleString();
}
