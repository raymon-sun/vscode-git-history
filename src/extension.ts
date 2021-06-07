// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext } from "vscode";
import { createDisposables } from "./disposables";
import { ViewController } from "./views/controller";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "git-view" is now active!');

	const { extensionPath, extensionUri, subscriptions } = context;
	const viewController = new ViewController(extensionPath, extensionUri);
	const disposables = createDisposables(viewController);
	subscriptions.push(...disposables);
}

// this method is called when your extension is deactivated
export function deactivate() {}
