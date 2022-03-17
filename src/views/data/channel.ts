import { createContext } from "react";

import { IMessageType, request, subscribe } from "../utils/message";

import type { Source } from "./source";

type FuncName = keyof Source;
type Func = Source[FuncName];

export async function initializeChannel() {
	const linkedFuncs = await request<{ name: FuncName; type: IMessageType }[]>(
		"initialize"
	);

	// TODO: pick decorated properties
	return Object.fromEntries<any>(
		linkedFuncs.map(({ name, type }) => {
			return [name, buildFunc(name, type)];
		})
	) as Source;
}

function buildFunc(name: string, type: IMessageType) {
	switch (type) {
		case "promise":
			return async (...params: Parameters<Func>) =>
				await request(name, ...params);
		case "subscription":
			return (handler: (e: any) => void, params: any) =>
				subscribe(name, params, handler);
	}
}

export const ChannelContext = createContext<Source | undefined>(undefined);
