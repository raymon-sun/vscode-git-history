import "reflect-metadata";
import { ExtensionContext } from "vscode";
import { Container } from "inversify";

import { GitService } from "../git/service";
import { FileTreeProvider } from "../providers/file-tree";
import { VersionedFileProvider } from "../providers/versioned-file";
import { ViewController } from "../views/controller";
import { TYPES } from "./types";
import { DisposableController } from "../disposables";
import { GitStatusDecorationProvider } from "../providers/decoration";

const container = new Container();

function initializeContainer(context: ExtensionContext) {
	container
		.bind<ExtensionContext>(TYPES.ExtensionContext)
		.toConstantValue(context);

	container.bind<ViewController>(ViewController).toSelf().inSingletonScope();
	container.bind<GitService>(GitService).toSelf().inSingletonScope();
	container.bind<FileTreeProvider>(FileTreeProvider).toSelf().inSingletonScope();
	container.bind<VersionedFileProvider>(VersionedFileProvider).toSelf().inSingletonScope();
	container.bind<GitStatusDecorationProvider>(GitStatusDecorationProvider).toSelf().inSingletonScope();
	container.bind<DisposableController>(DisposableController).toSelf().inSingletonScope();
}

export { container, initializeContainer };
