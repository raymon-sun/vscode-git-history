import { commands, ExtensionContext, TreeView, window } from "vscode";
import { inject, injectable } from "inversify";

import { TYPES } from "../../container/types";

import { CHANGES_VIEW_MODE_CONTEXT, EXTENSION_SCHEME } from "../../constants";

import { ChangeTreeDataProvider } from "./ChangeTreeDataProvider";
import {
	COMPARE_STATE_KEY,
	formatCompareDescription,
	ICompareState,
} from "./compareState";

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
				// allow acting on several changed files at once
				canSelectMany: true,
			}
		);

		this.changeTreeDataProvider.onDidChangeTreeData(() =>
			this.updateViewState()
		);
		this.updateViewState();
	}

	updateViewState() {
		const { flatMode } = this.changeTreeDataProvider;
		commands.executeCommand(
			"setContext",
			CHANGES_VIEW_MODE_CONTEXT,
			flatMode ? "flat" : "tree"
		);

		const filter = this.changeTreeDataProvider.getFilter();
		this.changesViewer.message = filter ? `Filter: ${filter}` : undefined;

		// tell a comparison apart from the changes of the selected commits
		this.changesViewer.description = formatCompareDescription(
			this.context.globalState.get<ICompareState>(COMPARE_STATE_KEY)
		);
	}
}
