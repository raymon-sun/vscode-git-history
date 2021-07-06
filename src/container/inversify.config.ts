import "reflect-metadata";
import { Container } from "inversify";

import { GitService } from "../git/service";
import { VersionedFileProvider } from "../providers/versioned-file";

const container = new Container();

container.bind<GitService>(GitService).toSelf();
container.bind<VersionedFileProvider>(VersionedFileProvider).toSelf();

export { container };
