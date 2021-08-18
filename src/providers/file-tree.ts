import {
	TreeDataProvider,
	TreeItem,
	ThemeIcon,
	ExtensionContext,
	TreeItemCollapsibleState,
	Uri,
	EventEmitter,
	Command,
} from "vscode";
import { inject, injectable } from "inversify";
import { TYPES } from "../container/types";
import {
	compareFileTreeNode,
	FileNode,
	FolderNode,
	getDiffUris,
	PathCollection,
	PathType,
} from "../git/utils";
import { EXTENSION_SCHEME } from "../constants";

@injectable()
export class FileTreeProvider implements TreeDataProvider<TreeItem> {
	private _onDidChangeTreeData = new EventEmitter<void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	constructor(
		@inject(TYPES.ExtensionContext) private context: ExtensionContext
	) {}

	getTreeItem(element: Path): Path {
		return element;
	}

	getChildren(element?: Path): Thenable<Path[]> {
		const treeData =
			this.context.globalState.get<PathCollection>("changedFileTree")!;
		// TODO: order by type and name
		return Promise.resolve(
			Object.entries(
				element ? (element.children as PathCollection)! : treeData
			)
				.sort(compareFileTreeNode)
				.map(([name, props]) => {
					return new Path(name, props);
				})
		);
	}

	refresh() {
		this._onDidChangeTreeData.fire();
	}
}

class Path extends TreeItem {
	children?: PathCollection = (this.props as FolderNode).children;
	iconPath = ThemeIcon[this.props.type];
	resourceUri = this.getResourceUri();
	collapsibleState = this.getCollapsibleState();
	readonly command?: Command = this.getCommand();

	constructor(public label: string, public props: FolderNode | FileNode) {
		super(label);
	}

	private getResourceUri() {
		if (this.props.type === PathType.FILE) {
			return this.props.change.uri.with({
				scheme: EXTENSION_SCHEME,
				query: JSON.stringify({ status: this.props.change.status }),
			});
		}

		if (this.props.type === PathType.FOLDER) {
			return Uri.file(this.label);
		}
	}

	private getCollapsibleState() {
		const { type } = this.props;
		const STATE_MAP = {
			[PathType.FOLDER]: TreeItemCollapsibleState.Expanded,
			[PathType.FILE]: TreeItemCollapsibleState.None,
		};

		return STATE_MAP[type];
	}

	private getCommand() {
		if (this.props.type === PathType.FILE) {
			const { refs, change } = this.props;
			return {
				title: "diff",
				command: "vscode.diff",
				arguments: getDiffUris(refs!, change),
			};
		}
	}
}
