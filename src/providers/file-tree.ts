import {
	TreeDataProvider,
	TreeItem,
	ThemeIcon,
	ExtensionContext,
	TreeItemCollapsibleState,
} from "vscode";
import { inject, injectable } from "inversify";
import { TYPES } from "../container/types";
import { PathNode } from "../git/utils";

@injectable()
export class FileTreeProvider implements TreeDataProvider<TreeItem> {
	private treeData =
		this.context.globalState.get<PathNode>("changedFileTree")!;
	private _treeData = {
		assets: { beans: { status: 1, checkIsFile: () => true } },
		src: {
			actions: {
				["throw.ts"]: {
					status: 1,
					checkIsFile: () => true,
				},
			},
		},
	};

	constructor(
		@inject(TYPES.ExtensionContext) private context: ExtensionContext
	) {}

	getTreeItem(element: Path): Path {
		return element;
	}

	getChildren(element?: Path): Thenable<Path[]> {
		return Promise.resolve(
			Object.entries(element ? element.children! : this._treeData).map(
				([path, children]) => {
					if (
						isFunction(children.checkIsFile) &&
						children.checkIsFile()
					) {
						return new Path(path, TreeItemCollapsibleState.None);
					}

					return new Path(
						path,
						TreeItemCollapsibleState.Expanded,
						children as PathNode
					);
				}
			)
		);
	}
}

class Path extends TreeItem {
	constructor(
		public label: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public children?: PathNode
	) {
		super(label);
	}

	iconPath = ThemeIcon.File;
}

function isFunction(functionToCheck: unknown) {
	return (
		functionToCheck &&
		{}.toString.call(functionToCheck) === "[object Function]"
	);
}
