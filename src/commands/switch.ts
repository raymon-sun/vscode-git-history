import { commands, window } from "vscode";

import { container } from "../container/inversify.config";
import { GitService } from "../git/service";
import { Source } from "../views/data/source";
import state from "../views/data/state";

export const RESET_COMMAND = "git-log.log.reset";
export const REFRESH_COMMAND = "git-log.log.refresh";
export const SWITCH_REPO_COMMAND = "git-log.log.switch.repo";
export const SWITCH_BRANCH_COMMAND = "git-log.log.switch.branch";

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
			const quickPick = window.createQuickPick();

			const items =
				gitService
					.getRepositories()
					.sort()
					.map((repo) => ({
						label: repo,
					})) || [];
			quickPick.title = "Repository Select";
			quickPick.placeholder = "Input repo name here";
			quickPick.items = items;
			quickPick.activeItems = items.filter(
				({ label }) => label === state.logOptions.repo
			);

			quickPick.onDidChangeSelection((selection) => {
				const [item] = selection;
				const { label: repo } = item;
				const switchSubscriber = source.getSwitchSubscriber();
				if (!switchSubscriber) {
					return;
				}

				state.logOptions = { repo };
				source.getCommits(switchSubscriber, state.logOptions);
				quickPick.dispose();
			});

			quickPick.show();
		}),
		commands.registerCommand(SWITCH_BRANCH_COMMAND, async () => {
			const quickPick = window.createQuickPick();

			quickPick.title = "Branch Select";
			quickPick.placeholder = "Input reference here";
			quickPick.busy = true;

			quickPick.show();

			const branchItems =
				((await gitService.getBranches({})) || [])
					.sort()
					.map((branch) => ({
						label: branch,
					})) || [];

			quickPick.items = branchItems;
			quickPick.activeItems = branchItems.filter(
				({ label }) => label === state.logOptions.ref
			);

			quickPick.onDidChangeSelection((selection) => {
				const [item] = selection;
				const { label: ref } = item;
				const switchSubscriber = source.getSwitchSubscriber();
				if (!switchSubscriber) {
					return;
				}

				state.logOptions = { ref };
				source.getCommits(switchSubscriber, state.logOptions);
				quickPick.dispose();
			});

			quickPick.busy = false;
		}),
	];
}
