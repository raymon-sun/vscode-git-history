import { ExtensionContext, TreeView, window, commands } from "vscode";
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

		commands.registerCommand(
			`${EXTENSION_SCHEME}.changes.view.toggle`,
			this.viewToggle.bind(this)
		);

		commands.registerCommand(
			`${EXTENSION_SCHEME}.changes.view.tree`,
			this.viewTree.bind(this)
		);

		commands.registerCommand(
			`${EXTENSION_SCHEME}.changes.view.flat`,
			this.viewFlat.bind(this)
		);

		this.updateView();
	}

	private viewToggle(): void {
		this.changeTreeDataProvider.setViewMode('toggle');
		this.updateView();
	}

	private viewTree(): void {
		this.changeTreeDataProvider.setViewMode('tree');
		this.updateView();
	}

	private viewFlat(): void {
		this.changeTreeDataProvider.setViewMode('flat');
		this.updateView();
	}

	private updateView(): void {
		const isTreeView = this.changeTreeDataProvider.isTreeView;
		this.changesViewer.description = isTreeView ? "Tree View" : "Flat List View";
		commands.executeCommand('setContext', 'gitHistory:changesViewIsTree', isTreeView);
	}
}
