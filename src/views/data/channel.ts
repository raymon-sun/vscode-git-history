import { request } from "../utils/message";
import type { Source } from "./source";
import { createContext } from "react";

type FuncName = keyof Source;
type Func = Source[FuncName];

export async function initializeChannel() {
	const funcNames = await request<FuncName[]>("initialize");

	const channel: Partial<Source> = {};
	funcNames.forEach(
		(funcName) =>
			(channel[funcName] = async (...params: Parameters<Func>) =>
				await request(funcName, ...params))
	);
	return channel as Source;
}

export const ChannelContext = createContext<Source | undefined>(undefined);
