import "reflect-metadata";
import { Uri } from "vscode";
import { Container } from "inversify";

import { GitService } from "../git/service";
import { VersionedFileProvider } from "../providers/versioned-file";
import { ViewController } from "../views/controller";

const container = new Container();

function initializeContainer(extensionPath: string, extensionUri: Uri) {
	container.bind<string>("extensionPath").toConstantValue(extensionPath);
	container.bind<Uri>("extensionUri").toConstantValue(extensionUri);

	container.bind<ViewController>(ViewController).toSelf();
	container.bind<GitService>(GitService).toSelf();
	container.bind<VersionedFileProvider>(VersionedFileProvider).toSelf();
}

export { container, initializeContainer };
