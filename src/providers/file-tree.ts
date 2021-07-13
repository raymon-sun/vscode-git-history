import {
	TreeDataProvider,
	TreeItem,
	ThemeIcon,
	ExtensionContext,
	TreeItemCollapsibleState,
	Uri,
} from "vscode";
import { inject, injectable } from "inversify";
import { TYPES } from "../container/types";
import { FileNode, FolderNode, PathCollection, PathType } from "../git/utils";

@injectable()
export class FileTreeProvider implements TreeDataProvider<TreeItem> {
	private treeData =
		this.context.globalState.get<PathCollection>("changedFileTree")!;
	private _treeData: PathCollection = {
		src: {
			type: PathType.FOLDER,
			path: "",
			children: {
				actions: {
					type: PathType.FOLDER,
					path: "",
					children: {
						["throw.ts"]: {
							type: PathType.FILE,
							status: 3,
							uri: {
								path: "/projects/public/sword-practice/src/actions/throw.ts",
							} as Uri,
						},
					},
				},
				["hands-up.ts"]: {
					type: PathType.FILE,
					status: 5,
					uri: {
						path: "/projects/public/sword-practice/src/hands-up.ts",
					} as Uri,
				},
			},
		},
		assets: {
			type: PathType.FOLDER,
			path: "",
			children: {
				beans: {
					type: PathType.FILE,
					status: 2,
					uri: {
						path: "/projects/public/sword-practice/assets/beans",
					} as Uri,
				},
			},
		},
		["README.md"]: {
			type: PathType.FILE,
			status: 1,
			uri: {
				path: "/projects/public/sword-practice/README.md",
			} as Uri,
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
			Object.entries(
				element ? (element.children as PathCollection)! : this._treeData
			).map(([name, props]) => {
				if (props.type === PathType.FILE) {
					return new Path(
						name,
						TreeItemCollapsibleState.None,
						PathType.FILE,
						props
					);
				}

				return new Path(
					name,
					TreeItemCollapsibleState.Expanded,
					PathType.FOLDER,
					props
				);
			})
		);
	}
}

class Path extends TreeItem {
	children?: PathCollection = (this.props as FolderNode).children;
	iconPath = ThemeIcon[this.pathType];
	resourceUri = this.getResourceUri(this.pathType);

	constructor(
		public label: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public pathType: PathType,
		public props: FolderNode | FileNode
	) {
		super(label);
	}

	private getResourceUri(pathType: PathType) {
		const MAP = {
			[PathType.FOLDER]: () => Uri.file(this.label),
			[PathType.FILE]: () => Uri.file((this.props as FileNode).uri.path),
		};

		return MAP[pathType]();
	}
}
