import "reflect-metadata";
import { ExtensionContext } from "vscode";
import { Container } from "inversify";

import { GitService } from "../git/service";
import { ChangeTreeDataProvider } from "../providers/changeTreeDataProvider";
import { RevisionTextDocumentContentProvider } from "../providers/revisionTextDocumentContentProvider";
import { Source } from "../views/data/source";
import { DisposableController } from "../disposables";
import { GitStatusFileDecorationProvider } from "../providers/gitStatusFileDecorationProvider";
import { LogWebviewViewProvider } from "../providers/logWebviewViewProvider";

import { TYPES } from "./types";

const container = new Container();

function initializeContainer(context: ExtensionContext) {
	container
		.bind<ExtensionContext>(TYPES.ExtensionContext)
		.toConstantValue(context);

	container.bind<Source>(Source).toSelf().inSingletonScope();
	container.bind<GitService>(GitService).toSelf().inSingletonScope();
	container
		.bind<LogWebviewViewProvider>(LogWebviewViewProvider)
		.toSelf()
		.inSingletonScope();
	container
		.bind<ChangeTreeDataProvider>(ChangeTreeDataProvider)
		.toSelf()
		.inSingletonScope();
	container
		.bind<RevisionTextDocumentContentProvider>(
			RevisionTextDocumentContentProvider
		)
		.toSelf()
		.inSingletonScope();
	container
		.bind<GitStatusFileDecorationProvider>(GitStatusFileDecorationProvider)
		.toSelf()
		.inSingletonScope();
	container
		.bind<DisposableController>(DisposableController)
		.toSelf()
		.inSingletonScope();
}

export { container, initializeContainer };
