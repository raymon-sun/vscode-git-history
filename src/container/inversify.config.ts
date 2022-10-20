import "reflect-metadata";
import { ExtensionContext } from "vscode";
import { Container } from "inversify";

import { GitService } from "../git/service";
import { GitGraph } from "../git/graph";
import { ChangeTreeDataProvider } from "../providers/changeTreeData";
import { RevisionTextDocumentContentProvider } from "../providers/revisionTextDocumentContent";
import { Source } from "../views/history/data/source";
import { DisposableController } from "../disposables";
import { GitStatusFileDecorationProvider } from "../providers/gitStatusFileDecoration";
import { LogWebviewViewProvider } from "../providers/logWebviewView";

import { TYPES } from "./types";

const container = new Container();

function initializeContainer(context: ExtensionContext) {
	container
		.bind<ExtensionContext>(TYPES.ExtensionContext)
		.toConstantValue(context);

	container.bind<Source>(Source).toSelf().inSingletonScope();
	container.bind<GitService>(GitService).toSelf().inSingletonScope();
	container.bind<GitGraph>(GitGraph).toSelf().inSingletonScope();
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
