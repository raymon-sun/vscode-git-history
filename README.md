# Git History

English | [简体中文](./README.zh-CN.md)

The extension provides a visual git history panel to help you browse git history easily.

It brings the following main features

🗞️ Full git history

🩺 Diff batch commits

〽️ Commit chain graph

🔍 Quick search

## Usage

### Git History

![Usage](./assets/usage/scroll.gif)

- Scroll once to see all commits in git history even if the amount of commits is huge

### Commit Changes

![Usage](./assets/usage/changes.gif)

- Click a commit to check the changes
- Select multiple commits with `Ctrl`/`⌘` pressed,and then you will see the merged changes from the selected commits
- Drag through the commits to quickly select them
- Select exactly two commits (any two, they need not be related) and pick `Compare Commits` from the commit menu to see the difference between them, which is handy for comparing two release points. The Changes view then shows `Comparing abc1234 ↔ def5678` next to its title so a comparison is not mistaken for the changes of a commit
- Right click a changed file for `Open Changes`, `Open File at Commit`, `Copy Path`, `Copy Relative Path`, `Open Containing Folder` and `Open in Integrated Terminal` (`Ctrl`/`⌘`-click to select several files and copy their paths at once)

### Commit Actions

Right click a commit to act on it, right click a tag to manage it:

- Copy the commit hash or message
- Create a branch at the commit and switch to it
- Add a tag at the commit
- Cherry-pick / revert the commit
- Check out the commit in a detached HEAD
- Reset the current branch to the commit (`soft` / `mixed` / `hard`)

### File and Selection History

These actions live under `Git History` in the Explorer, editor tab and editor context menus, so it is clear which extension they come from (in the Changes view they are offered directly).

- `Show File History` narrows the History panel to the file you right clicked. The filter is shown next to the view title and cleared with the button there
- `Show Selection History` narrows the History panel to the commits that changed the lines you selected (`git log -L`), so you can pick one there to see the changes it made. The filter is shown as `src/a.ts:20-24` next to the view title and cleared with the button there. It also works inside the file-changes (diff) editor opened from the Changes view, tracing the lines from the revision that side shows

### Commit Chain Graph

![Usage](./assets/usage/graph.gif)

### Others

- Search for hash in all commits and navigate to the location
- Filter the commits by authors/message
- Switch to another branch or repo in your workspace; the current repository is shown next to the view title, your choice is remembered the next time you open the view, and resetting the filters keeps the repository on screen
- Drag the header to set a comfortable size for columns
- And more,coming soon..

## Release History

See [CHANGELOG.md](CHANGELOG.md).
