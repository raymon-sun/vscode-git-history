import { commands, window } from "vscode";

import { container } from "../container/inversify.config";
import { GitService } from "../git/service";
import { Source } from "../views/data/source";
import state from "../views/data/state";

export const RESET_COMMAND = "git-cruise.log.reset";
export const REFRESH_COMMAND = "git-cruise.log.refresh";
export const SWITCH_REPO_COMMAND = "git-cruise.log.switch.repo";
export const SWITCH_BRANCH_COMMAND = "git-cruise.log.switch.branch";

export function getSwitchCommandsDisposable() {
	const gitService = container.get(GitService);
	const source = container.get(Source);

	return [
		commands.registerCommand(RESET_COMMAND, async () => {
			const switchSubscriber = source.getSwitchSubscriber();
			if (!switchSubscriber) {
				return;
			}

			state.logOptions = {
				repo: await gitService.getDefaultRepository(),
			};
			source.getCommits(switchSubscriber, state.logOptions);
		}),
		commands.registerCommand(REFRESH_COMMAND, async () => {
			const switchSubscriber = source.getSwitchSubscriber();
			if (!switchSubscriber) {
				return;
			}

			source.getCommits(switchSubscriber, state.logOptions);
		}),
		commands.registerCommand(SWITCH_REPO_COMMAND, async () => {
			const repo = await window.showQuickPick(
				gitService.getRepositories() || [],
				{
					placeHolder: "Input repo name here",
					onDidSelectItem: (item) =>
						window.showInformationMessage(`Focus ${item}`),
				}
			);

			const switchSubscriber = source.getSwitchSubscriber();
			if (!switchSubscriber) {
				return;
			}

			state.logOptions = { repo };
			source.getCommits(switchSubscriber, state.logOptions);
		}),
		commands.registerCommand(SWITCH_BRANCH_COMMAND, async () => {
			const branch = await window.showQuickPick(
				(await gitService.getBranches({})) || [],
				{
					placeHolder: "Input ref here",
					onDidSelectItem: (item) =>
						window.showInformationMessage(`Focus ${item}`),
				}
			);

			const switchSubscriber = source.getSwitchSubscriber();
			if (!switchSubscriber) {
				return;
			}

			state.logOptions = { ref: branch };
			source.getCommits(switchSubscriber, state.logOptions);
		}),
	];
}
