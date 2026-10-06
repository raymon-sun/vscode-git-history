import { createContext } from "react";

export type DateFormat = "relative" | "absolute";

export const DEFAULT_DATE_FORMAT: DateFormat = "relative";

export const DATE_FORMAT_STATE_KEY = "dateFormat";

export interface IDateFormatContext {
	format: DateFormat;
	/** timestamp of the latest refresh, so relative times do not go stale */
	now: number;
}

export const DateFormatContext = createContext<IDateFormatContext | undefined>(
	undefined
);
