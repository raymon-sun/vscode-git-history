import { IMessageType } from "../utils/message";

import type { Source } from "./source";

interface ILinkMetaData {
	name: string;
	type: IMessageType;
}

export const linksMap = new WeakMap<Source, ILinkMetaData[]>();

export function link(type: IMessageType) {
	return (target: Source, propertyKey: keyof Source) => {
		const links = linksMap.get(target) || [];
		links?.push({ name: propertyKey, type });
		linksMap.set(target, links);
	};
}
