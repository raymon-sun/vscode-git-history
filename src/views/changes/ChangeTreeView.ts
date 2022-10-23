import { ExtensionContext, TreeView, window } from "vscode";
import { inject, injectable } from "inversify";

import { TYPES } from "../../container/types";

import { EXTENSION_SCHEME } from "../../constants";

import { ChangeTreeDataProvider } from "./ChangeTreeDataProvider";

@injectable()
export class ChangeTreeView {
	private changesViewer: TreeView<any>;

	constructor(
		@inject(TYPES.ExtensionContext) private context: ExtensionContext,
		private changeTreeDataProvider: ChangeTreeDataProvider
	) {
		this.changesViewer = window.createTreeView(
			`${EXTENSION_SCHEME}.changes`,
			{
				treeDataProvider: this.changeTreeDataProvider,
			}
		);
	}
}
