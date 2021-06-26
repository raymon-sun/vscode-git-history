declare const acquireVsCodeApi: () => any;

const vscode = acquireVsCodeApi();

/** auto-increment id */
let messageId = 0;

const responseHandles: { [id: number]: (res: any) => void } = {};

window.addEventListener("message", (event: MessageEvent<{ id: number }>) => {
	const { id } = event.data;
	responseHandles[id](event.data);
	delete responseHandles[id];
});

export async function send(message: any, timeout = 5000) {
	return new Promise((resolve, reject) => {
		const id = messageId++;
		vscode.postMessage({ id, content: message });

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

export async function request(what: string, params?: any) {
	const backMessage = await send({ what, params });
	return (backMessage as any).result;
}
