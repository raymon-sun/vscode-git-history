import {
	TreeDataProvider,
	TreeItem,
	TreeItemCollapsibleState,
	window,
	ThemeIcon,
} from "vscode";
import { readFileSync, accessSync } from "fs";
import { join } from "path";

export class FileTreeProvider implements TreeDataProvider<Dependency> {
	constructor(private workspaceRoot: string) {}

	getTreeItem(element: Dependency): TreeItem {
		return element;
	}

	getChildren(element?: Dependency): Thenable<Dependency[]> {
		if (!this.workspaceRoot) {
			window.showInformationMessage("No dependency in empty workspace");
			return Promise.resolve([]);
		}

		if (element) {
			return Promise.resolve(
				this.getDepsInPackageJson(
					join(
						this.workspaceRoot,
						"node_modules",
						element.label,
						"package.json"
					)
				)
			);
		} else {
			const packageJsonPath = join(this.workspaceRoot, "package.json");
			if (this.pathExists(packageJsonPath)) {
				return Promise.resolve(
					this.getDepsInPackageJson(packageJsonPath)
				);
			} else {
				window.showInformationMessage("Workspace has no package.json");
				return Promise.resolve([]);
			}
		}
	}

	/**
	 * Given the path to package.json, read all its dependencies and devDependencies.
	 */
	private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
		if (this.pathExists(packageJsonPath)) {
			const packageJson = JSON.parse(
				readFileSync(packageJsonPath, "utf-8")
			);

			const toDep = (moduleName: string, version: string): Dependency => {
				if (
					this.pathExists(
						join(this.workspaceRoot, "node_modules", moduleName)
					)
				) {
					return new Dependency(
						moduleName,
						version,
						TreeItemCollapsibleState.Collapsed
					);
				} else {
					return new Dependency(
						moduleName,
						version,
						TreeItemCollapsibleState.None
					);
				}
			};

			const deps = packageJson.dependencies
				? Object.keys(packageJson.dependencies).map((dep) =>
						toDep(dep, packageJson.dependencies[dep])
				  )
				: [];
			const devDeps = packageJson.devDependencies
				? Object.keys(packageJson.devDependencies).map((dep) =>
						toDep(dep, packageJson.devDependencies[dep])
				  )
				: [];
			return deps.concat(devDeps);
		} else {
			return [];
		}
	}

	private pathExists(p: string): boolean {
		try {
			accessSync(p);
		} catch (err) {
			return false;
		}
		return true;
	}
}

class Dependency extends TreeItem {
	constructor(
		public readonly label: string,
		private version: string,
		public readonly collapsibleState: TreeItemCollapsibleState
	) {
		super(label, collapsibleState);
		this.tooltip = `${this.label}-${this.version}`;
		this.description = this.version;
	}

	iconPath = ThemeIcon.File;
}
