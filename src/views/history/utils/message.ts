declare const acquireVsCodeApi: () => any;

const vscode = acquireVsCodeApi();

export type IMessageType = "promise" | "subscription";
export interface IMessage {
	id: number;
	type: IMessageType;
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
const eventHandlers: { [eventType: string]: (() => void)[] } = {};

window.addEventListener(
	"message",
	(event: MessageEvent<{ id?: number; type: IMessageType | string }>) => {
		const { id, type } = event.data;

		// Handle special event messages
		if (type === "columnsChanged") {
			const handlers = eventHandlers["columnsChanged"] || [];
			handlers.forEach((handler) => handler());
			return;
		}

		// Handle normal request/response messages
		if (id !== undefined && responseHandles[id]) {
			responseHandles[id](event.data);
			type === "promise" && delete responseHandles[id];
		}
	}
);

export function onEvent(eventType: string, handler: () => void) {
	if (!eventHandlers[eventType]) {
		eventHandlers[eventType] = [];
	}
	eventHandlers[eventType].push(handler);
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
