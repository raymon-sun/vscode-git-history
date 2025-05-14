import { commands } from "vscode";

import { container } from "../container/inversify.config";
import { Source } from "../views/history/data/source";
import state from "../views/history/data/state";
import { ViewMode } from "../git/types";

export const TOGGLE_VIEW_MODE_COMMAND = "git-history.history.toggle.viewMode";

export function getToggleCommandsDisposable() {
    const source = container.get(Source);

    return [
        commands.registerCommand(TOGGLE_VIEW_MODE_COMMAND, async () => {
            const newMode = state.logOptions.mode === ViewMode.COMMIT_DIFF
                ? ViewMode.NORMAL
                : ViewMode.COMMIT_DIFF;

            state.logOptions.mode = newMode;

            // Notify the UI about the mode change
            source.notifyViewModeChanged(newMode);
        }),
    ];
}