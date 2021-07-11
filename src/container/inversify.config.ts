import "reflect-metadata";
import { ExtensionContext } from "vscode";
import { Container } from "inversify";

import { GitService } from "../git/service";
import { VersionedFileProvider } from "../providers/versioned-file";
import { ViewController } from "../views/controller";
import { TYPES } from "./types";

const container = new Container();

function initializeContainer(context: ExtensionContext) {
	container
		.bind<ExtensionContext>(TYPES.ExtensionContext)
		.toConstantValue(context);

	container.bind<ViewController>(ViewController).toSelf();
	container.bind<GitService>(GitService).toSelf();
	container.bind<VersionedFileProvider>(VersionedFileProvider).toSelf();
}

export { container, initializeContainer };
