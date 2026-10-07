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
	command?: string;
	submenu?: string;
	when?: string;
	group?: string;
}

const FILE_HISTORY_SUBMENU = "gitHistory.fileHistory";

/** the menu entries of a menu section, as declared in package.json */
const menuEntries = (menu: string) =>
	(packageJson.contributes?.menus?.[menu] || []) as IMenuContribution[];

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

/** evaluate a `resourceScheme =~ /regex/` clause the way VS Code does */
function matchesScheme(when: string, scheme: string) {
	const regexMatch = when.match(/resourceScheme\s*=~\s*\/(.+)\//);
	if (regexMatch) {
		return new RegExp(regexMatch[1].replace(/\\\//g, "/")).test(scheme);
	}

	const equality = when.match(/resourceScheme\s*==\s*(\S+?)(?:\s|$)/);
	return equality ? equality[1] === scheme : false;
}

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
		.map((entry) => entry.command!)
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
			"git-history.showFileHistory",
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

		const menuCommands = [
			...new Set(
				Object.values(
					(packageJson.contributes?.menus || {}) as Record<
						string,
						IMenuContribution[]
					>
				)
					.flat()
					.map(({ command }) => command)
					// a submenu entry has no command of its own
					.filter((command): command is string => !!command)
			),
		];

		ok(menuCommands.length > 0);
		menuCommands.forEach((command) =>
			ok(
				declared.includes(command),
				`${command} is used by a menu but not declared`
			)
		);
	});

	test("should group file and selection history under a Git History submenu", () => {
		["explorer/context", "editor/title/context", "editor/context"].forEach(
			(menu) => {
				const entry = menuEntries(menu).find(
					({ submenu }) => submenu === FILE_HISTORY_SUBMENU
				);

				ok(
					entry,
					`${menu} should offer the ${FILE_HISTORY_SUBMENU} submenu`
				);
				ok(
					entry?.when &&
						["file", "git"].every((scheme) =>
							matchesScheme(entry.when!, scheme)
						),
					`${menu} should offer the submenu for working tree and revision documents`
				);
				ok(
					entry?.when && !matchesScheme(entry.when, "untitled"),
					`${menu} should not offer the submenu for unrelated schemes`
				);
			}
		);

		deepStrictEqual(
			menuEntries(FILE_HISTORY_SUBMENU).map(({ command }) => command),
			["git-history.showFileHistory", "git-history.selectionHistory"]
		);

		const selectionEntry = menuEntries(FILE_HISTORY_SUBMENU).find(
			({ command }) => command === "git-history.selectionHistory"
		);
		ok(
			selectionEntry?.when?.includes("editorHasSelection"),
			"selection history should require a selection"
		);
	});

	test("should declare every referenced submenu", () => {
		const submenus = (packageJson.contributes?.submenus || []) as {
			id: string;
			label: string;
		}[];

		const referenced = [
			...new Set(
				Object.values(
					(packageJson.contributes?.menus || {}) as Record<
						string,
						IMenuContribution[]
					>
				)
					.flat()
					.map(({ submenu }) => submenu)
					.filter((id): id is string => !!id)
			),
		];

		ok(referenced.length > 0);
		referenced.forEach((id) =>
			ok(
				submenus.some((submenu) => submenu.id === id),
				`submenu ${id} is referenced but not declared`
			)
		);

		// the label is what tells the user the feature comes from this extension
		const [submenu] = submenus.filter(
			({ id }) => id === FILE_HISTORY_SUBMENU
		);
		deepStrictEqual(submenu?.label, "Git History");
	});
});
