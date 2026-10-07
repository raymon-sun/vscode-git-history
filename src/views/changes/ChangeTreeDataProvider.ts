import path from "path";

import {
	TreeDataProvider,
	TreeItem,
	ThemeIcon,
	ExtensionContext,
	TreeItemCollapsibleState,
	Uri,
	EventEmitter,
	Command,
	workspace,
} from "vscode";
import { inject, injectable } from "inversify";

import { TYPES } from "../../container/types";
import {
	compareFileTreeNode,
	getDiffUriPair,
	rebuildUri,
} from "../../git/utils";
import { EXTENSION_SCHEME } from "../../constants";
import {
	collectFileNodes,
	FileNode,
	FolderNode,
	filterPathCollection,
	PathCollection,
	PathType,
} from "../../git/changes/tree";
import { Status } from "../../git/changes/status";

import { getChangeItemContextValue } from "./contextValues";

const CHANGED_FILE_TREE_STATE_KEY = "changedFileTree";
const FLAT_MODE_STATE_KEY = "changesFlatMode";

const pathCollator = new Intl.Collator(undefined, { numeric: true });

function toRelativePath(fsPath: string) {
	const root = workspace.workspaceFolders?.[0]?.uri.fsPath;
	return root && fsPath.startsWith(root)
		? path.relative(root, fsPath)
		: fsPath;
}

@injectable()
export class ChangeTreeDataProvider implements TreeDataProvider<TreeItem> {
	private _onDidChangeTreeData = new EventEmitter<void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	constructor(
		@inject(TYPES.ExtensionContext) private context: ExtensionContext
	) {}

	private filter = "";

	getTreeItem(element: Path) {
		return element;
	}

	getChildren(element?: Path) {
		const tree = rebuildUri(
			this.context.globalState.get<PathCollection>(
				CHANGED_FILE_TREE_STATE_KEY
			)
		);

		if (!tree) {
			return Promise.resolve([]);
		}

		if (this.flatMode) {
			// flat mode has a single level, so nested calls return nothing
			return Promise.resolve(element ? [] : this.getFlatPaths(tree));
		}

		const collection = element
			? (element.children as PathCollection)
			: filterPathCollection(tree, (node) => this.matches(node));

		return Promise.resolve(this.toPaths(collection));
	}

	get flatMode() {
		return this.context.globalState.get<boolean>(
			FLAT_MODE_STATE_KEY,
			false
		);
	}

	async setFlatMode(flat: boolean) {
		await this.context.globalState.update(FLAT_MODE_STATE_KEY, flat);
		this.refresh();
	}

	getFilter() {
		return this.filter;
	}

	setFilter(filter: string) {
		this.filter = filter;
		this.refresh();
	}

	refresh() {
		this._onDidChangeTreeData.fire();
	}

	private getFlatPaths(tree: PathCollection) {
		return collectFileNodes(tree)
			.filter((node) => this.matches(node))
			.map(
				(node) =>
					[toRelativePath(node.uri.fsPath), node] as [
						string,
						FileNode
					]
			)
			.sort(([left], [right]) => pathCollator.compare(left, right))
			.map(([relativePath, node]) => {
				const dirname = path.dirname(relativePath);
				const item = new Path(
					path.basename(relativePath),
					node,
					dirname === "." ? undefined : dirname
				);

				// file names are not unique in flat mode, so keep the id per file
				item.id = node.uri.toString();

				return item;
			});
	}

	private toPaths(collection?: PathCollection) {
		if (!collection) {
			return [];
		}

		return Object.entries(collection)
			.sort(compareFileTreeNode)
			.map(([name, props]) => new Path(name, props));
	}

	private matches(node: FileNode) {
		if (!this.filter) {
			return true;
		}

		return toRelativePath(node.uri.fsPath)
			.toLowerCase()
			.includes(this.filter.toLowerCase());
	}
}

export class Path extends TreeItem {
	children?: PathCollection = (this.props as FolderNode).children;
	iconPath = ThemeIcon[this.props.type];
	resourceUri = this.getResourceUri();
	collapsibleState = this.getCollapsibleState();
	contextValue = this.getContextValue();
	readonly command?: Command = this.getCommand();

	constructor(
		public label: string,
		public props: FolderNode | FileNode,
		public description?: string
	) {
		super(label);
	}

	private getContextValue() {
		const { props } = this;

		if (props.type === PathType.FOLDER) {
			return getChangeItemContextValue({
				isFolder: true,
				isDeleted: false,
			});
		}

		return getChangeItemContextValue({
			isFolder: false,
			isDeleted: props.status === Status.DELETED,
		});
	}

	private getResourceUri() {
		if (this.props.type === PathType.FILE) {
			const { uri } = this.props;
			return uri.with({
				scheme: EXTENSION_SCHEME,
				query: JSON.stringify({ status: this.props.status }),
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
			const diffUris = getDiffUriPair(this.props);

			if (diffUris.length === 1) {
				return {
					title: "Open",
					command: "vscode.open",
					arguments: [diffUris[0]],
				};
			} else if (diffUris.length === 2) {
				return {
					title: "diff",
					command: "vscode.diff",
					arguments: getDiffUriPair(this.props),
				};
			}
		}
	}
}
