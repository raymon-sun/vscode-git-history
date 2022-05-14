import "reflect-metadata";
import { ExtensionContext } from "vscode";
import { Container } from "inversify";

import { GitService } from "../git/service";
import { FileTreeProvider } from "../providers/file-tree";
import { VersionedFileProvider } from "../providers/versioned-file";
import { Source } from "../views/data/source";
import { DisposableController } from "../disposables";
import { GitStatusDecorationProvider } from "../providers/decoration";
import { WebviewProvider } from "../providers/view";

import { TYPES } from "./types";

const container = new Container();

function initializeContainer(context: ExtensionContext) {
	container
		.bind<ExtensionContext>(TYPES.ExtensionContext)
		.toConstantValue(context);

	container.bind<Source>(Source).toSelf().inSingletonScope();
	container.bind<GitService>(GitService).toSelf().inSingletonScope();
	container
		.bind<WebviewProvider>(WebviewProvider)
		.toSelf()
		.inSingletonScope();
	container
		.bind<FileTreeProvider>(FileTreeProvider)
		.toSelf()
		.inSingletonScope();
	container
		.bind<VersionedFileProvider>(VersionedFileProvider)
		.toSelf()
		.inSingletonScope();
	container
		.bind<GitStatusDecorationProvider>(GitStatusDecorationProvider)
		.toSelf()
		.inSingletonScope();
	container
		.bind<DisposableController>(DisposableController)
		.toSelf()
		.inSingletonScope();
}

export { container, initializeContainer };
