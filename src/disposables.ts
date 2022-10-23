import { window } from "vscode";
import { injectable } from "inversify";

import { GitStatusFileDecorationProvider } from "./views/changes/GitStatusFileDecorationProvider";
import { EXTENSION_SCHEME } from "./constants";
import { HistoryWebviewViewProvider } from "./views/history/HistoryViewProvider";
import { getCommandDisposables } from "./commands";
import { ChangeTreeView } from "./views/changes/ChangeTreeView";

@injectable()
export class DisposableController {
	constructor(
		private webviewProvider: HistoryWebviewViewProvider,
		private changeTreeView: ChangeTreeView,
		private GitStatusFileDecorationProvider: GitStatusFileDecorationProvider
	) {}

	createDisposables() {
		return [
			...getCommandDisposables(),
			window.registerWebviewViewProvider(
				`${EXTENSION_SCHEME}.history`,
				this.webviewProvider,
				{ webviewOptions: { retainContextWhenHidden: true } }
			),
			window.registerFileDecorationProvider(
				this.GitStatusFileDecorationProvider
			),
		];
	}
}
