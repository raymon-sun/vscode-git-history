import { commands, QuickPickItem, window } from "vscode";

import { container } from "../container/inversify.config";
import { GitService } from "../git/service";
import { Source } from "../views/history/data/source";
import state from "../views/history/data/state";

export const RESET_COMMAND = "git-history.history.reset";
export const REFRESH_COMMAND = "git-history.history.refresh";
export const SWITCH_REPO_COMMAND = "git-history.history.switch.repo";
export const SWITCH_BRANCH_COMMAND = "git-history.history.switch.branch";

const REF_TYPE_DETAIL_MAP: Record<
	string,
	{ icon: string; descriptionPrefix: string }
> = {
	heads: {
		icon: "git-branch",
		descriptionPrefix: "",
	},
	remotes: { icon: "git-branch", descriptionPrefix: "Remote branch at " },
	tags: { icon: "tag", descriptionPrefix: "Tag at " },
};

type QuickPickRefItem = { ref: string } & QuickPickItem;

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
			quickPick.canSelectMany = true; // 启用多选

			const items =
				gitService
					.getRepositories()
					.sort()
					.map((repo) => ({
						label: repo,
					})) || [];
			quickPick.title = "Switch Repository";
			quickPick.placeholder = "Search repo by path";
			quickPick.items = items;

			// 设置 activeItems 和 selectedItems，确保之前选中的仓库显示为选中状态
			const selectedRepos = state.logOptions.repo || [];
			quickPick.activeItems = items.filter(({ label }) =>
				selectedRepos.includes(label)
			);
			quickPick.selectedItems = items.filter(({ label }) =>
				selectedRepos.includes(label)
			);

			quickPick.onDidAccept(() => {
				const selection = quickPick.selectedItems; // 获取选中的项目
				const repo = selection.map((item) => item.label); // 提取所有选中的仓库路径
				const switchSubscriber = source.getSwitchSubscriber();
				if (!switchSubscriber) {
					return;
				}

				state.logOptions = { repo }; // 将选中的仓库存储为数组
				source.getCommits(switchSubscriber, state.logOptions); // 传递选中的仓库
				quickPick.dispose();
			});

			quickPick.show();
		}),
		commands.registerCommand(SWITCH_BRANCH_COMMAND, async () => {
			const quickPick = window.createQuickPick<QuickPickRefItem>();

			quickPick.title = "Select Reference";
			quickPick.placeholder = "Search ref by name or hash";
			quickPick.busy = true;

			quickPick.show();

			const refs = (await gitService.getRefs(state.logOptions)) || [];
			const localBranchRefs: typeof refs = [];
			const remoteBranchRefs: typeof refs = [];
			const otherRefs = refs.filter((ref) => {
				if (ref.type === "heads") {
					localBranchRefs.push(ref);
					return false;
				}

				if (ref.type === "remotes") {
					remoteBranchRefs.push(ref);
					return false;
				}

				return true;
			});
			const branchItems: QuickPickRefItem[] = [
				...localBranchRefs,
				...remoteBranchRefs,
				...otherRefs,
			].map(({ type, name, hash }) => ({
				label: `$(${REF_TYPE_DETAIL_MAP[type]?.icon}) ${name}`,
				description: `${
					REF_TYPE_DETAIL_MAP[type]?.descriptionPrefix
				}${hash.substring(0, 8)}`,
				ref: name,
			}));

			// first item to select all branches
			branchItems.unshift({
				label: "$(check-all) All branches",
				ref: "",
			});

			quickPick.items = branchItems;
			quickPick.activeItems = branchItems.filter(
				({ ref }) => ref === (state.logOptions.ref || "")
			);

			quickPick.onDidChangeSelection((selection) => {
				const [item] = selection;
				const { ref } = item;
				const switchSubscriber = source.getSwitchSubscriber();
				if (!switchSubscriber) {
					return;
				}

				// retain repo
				const { repo } = state.logOptions;
				state.logOptions = { repo, ref };
				source.getCommits(switchSubscriber, state.logOptions);
				quickPick.dispose();
			});

			quickPick.busy = false;
		}),
	];
}
