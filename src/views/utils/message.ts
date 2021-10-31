declare const acquireVsCodeApi: () => any;

const vscode = acquireVsCodeApi();
export interface IMessage {
	id: number;
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

window.addEventListener("message", (event: MessageEvent<{ id: number }>) => {
	const { id } = event.data;
	responseHandles[id](event.data);
	delete responseHandles[id];
});

export async function sendMessage<T extends IMessage>(
	message: any,
	timeout = 5000
) {
	return new Promise<T>((resolve, reject) => {
		const id = messageId++;
		vscode.postMessage({ id, ...message });

		let isReSolved = false;
		responseHandles[id] = (res) => {
			isReSolved = true;
			resolve(res);
		};

		setTimeout(() => {
			if (!isReSolved) {
				reject();
			}
		}, timeout);
	});
}

export async function request<T>(what: string, ...params: any) {
	const response = await sendMessage<IResponseMessage<T>>({ what, params });
	return response.result;
}
