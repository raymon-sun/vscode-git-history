import { EVENT_MESSAGE_TYPE } from "../data/events";

declare const acquireVsCodeApi: () => any;

const vscode = acquireVsCodeApi();

export type IMessageType = "promise" | "subscription";
export interface IMessage {
	id: number;
	type: IMessageType;
}

interface IIncomingMessage {
	id?: number;
	type: IMessageType | typeof EVENT_MESSAGE_TYPE;
	event?: string;
}

export interface IRequestMessage<T = any> extends IMessage {
	what: string;
	params: T;
}

export interface IResponseMessage<T = any> extends IMessage {
	result: T;
}

/** auto-increment id */
let messageId = 0;

const responseHandles: { [id: number]: (res: any) => void } = {};
const eventHandlers: { [eventName: string]: (() => void)[] } = {};

window.addEventListener("message", (event: MessageEvent<IIncomingMessage>) => {
	const { id, type, event: eventName } = event.data;

	if (type === EVENT_MESSAGE_TYPE && eventName) {
		eventHandlers[eventName]?.forEach((handler) => handler());
		return;
	}

	if (id !== undefined && responseHandles[id]) {
		responseHandles[id](event.data);
		type === "promise" && delete responseHandles[id];
	}
});

export function onEvent(eventName: string, handler: () => void) {
	if (!eventHandlers[eventName]) {
		eventHandlers[eventName] = [];
	}
	eventHandlers[eventName].push(handler);

	return () => {
		const handlers = eventHandlers[eventName];
		if (!handlers) {
			return;
		}

		const index = handlers.indexOf(handler);
		if (index !== -1) {
			handlers.splice(index, 1);
		}
	};
}

export async function sendMessage<T extends IMessage>(
	message: any,
	timeout?: number
) {
	return new Promise<T>((resolve, reject) => {
		const id = messageId++;
		vscode.postMessage({ id, ...message, type: "promise" });

		let isReSolved = false;
		responseHandles[id] = (res) => {
			isReSolved = true;
			resolve(res);
		};

		if (timeout) {
			setTimeout(() => {
				if (!isReSolved) {
					reject();
				}
			}, timeout);
		}
	});
}

export function subscribe(
	eventName: string,
	params: any,
	handler: (res: any) => void
) {
	const id = messageId++;
	vscode.postMessage({
		id,
		what: eventName,
		params,
		type: "subscription",
	});

	responseHandles[id] = (res: IResponseMessage) => {
		handler(res.result);
	};
}

export async function request<T>(what: string, ...params: any) {
	const response = await sendMessage<IResponseMessage<T>>({ what, params });
	return response.result;
}
