import { deepStrictEqual, ok } from "assert";
import { readFileSync } from "fs";
import path from "path";

import {
	CHANGED_FILE_CONTEXT,
	CHANGED_FOLDER_CONTEXT,
	DELETED_FILE_CONTEXT,
	getChangeItemContextValue,
} from "./contextValues";

interface IMenuContribution {
	command: string;
	when?: string;
	group?: string;
}

const packageJson = JSON.parse(
	readFileSync(path.resolve(__dirname, "../../../package.json"), "utf8")
);

const ITEM_MENUS: IMenuContribution[] = (packageJson.contributes?.menus?.[
	"view/item/context"
] || []) as IMenuContribution[];

const CHANGES_VIEW_ID = "git-history.changes";

/** the view ids declared in package.json, flattened over the containers */
const declaredViewIds: string[] = Object.values(
	packageJson.contributes?.views || {}
)
	.flat()
	.map((view: any) => view.id);

/** evaluate a `viewItem =~ /regex/` clause the way VS Code does */
function matchesViewItem(when: string, contextValue: string) {
	const match = when.match(/viewItem\s*==\s*(\S+)/);
	if (match) {
		return match[1] === contextValue;
	}

	const regexMatch = when.match(/viewItem\s*=~\s*\/(.+)\//);
	if (regexMatch) {
		return new RegExp(regexMatch[1]).test(contextValue);
	}

	return false;
}

const commandsFor = (contextValue: string) =>
	ITEM_MENUS.filter(
		(entry) =>
			entry.when?.includes(`view == ${CHANGES_VIEW_ID}`) &&
			matchesViewItem(entry.when, contextValue)
	)
		.map((entry) => entry.command)
		.sort();

suite("Changes view context values", () => {
	test("should attach the menu to a declared view", () => {
		ok(
			declaredViewIds.includes(CHANGES_VIEW_ID),
			`${CHANGES_VIEW_ID} is not a declared view id`
		);
		ok(ITEM_MENUS.length > 0);
	});

	test("should mark folders, files and deleted files distinctly", () => {
		deepStrictEqual(
			getChangeItemContextValue({ isFolder: true, isDeleted: false }),
			CHANGED_FOLDER_CONTEXT
		);
		deepStrictEqual(
			getChangeItemContextValue({ isFolder: false, isDeleted: false }),
			CHANGED_FILE_CONTEXT
		);
		deepStrictEqual(
			getChangeItemContextValue({ isFolder: false, isDeleted: true }),
			DELETED_FILE_CONTEXT
		);
	});

	test("should offer the open and file actions for a changed file", () => {
		deepStrictEqual(commandsFor(CHANGED_FILE_CONTEXT), [
			"git-history.changes.copyPath",
			"git-history.changes.copyRelativePath",
			"git-history.changes.openChanges",
			"git-history.changes.openFile",
			"git-history.changes.openInTerminal",
			"git-history.changes.revealInOS",
		]);
	});

	test("should not offer to open a file that is deleted at the revision", () => {
		const commands = commandsFor(DELETED_FILE_CONTEXT);

		ok(!commands.includes("git-history.changes.openFile"));
		// the diff still makes sense: it shows the deletion
		ok(commands.includes("git-history.changes.openChanges"));
	});

	test("should offer only path and reveal actions for a folder", () => {
		const commands = commandsFor(CHANGED_FOLDER_CONTEXT);

		deepStrictEqual(commands, [
			"git-history.changes.copyPath",
			"git-history.changes.copyRelativePath",
			"git-history.changes.openInTerminal",
			"git-history.changes.revealInOS",
		]);
	});

	test("should declare every context menu command in package.json", () => {
		const declared: string[] = (
			packageJson.contributes?.commands || []
		).map(({ command }: { command: string }) => command);

		ITEM_MENUS.forEach(({ command }) =>
			ok(
				declared.includes(command),
				`${command} is used by a menu but not declared`
			)
		);
	});
});
