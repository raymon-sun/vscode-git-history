# Change Log

All notable changes to the "git-history" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## Unreleased

- Compare Commits: with exactly two commits selected, the commit menu offers to diff them against each other (works for unrelated commits and branch tips)
- Label the Changes view with `Comparing abc1234 ↔ def5678` while it shows a comparison, so it is not mistaken for the changes of a commit
- Show File History: right click a file (Explorer, editor tab, editor, or the Changes view) to filter the History panel to that file, with the filter shown next to the view title and a button to clear it
- Show Selection History: select one or more lines in the editor to list the commits that changed them (`git log -L`) and open the changes of the selected one
- Group both actions under a `Git History` submenu in the Explorer and editor context menus, so their origin is obvious
- Offer both actions in the file-changes (diff) editor opened from the Changes view too, and trace the selected lines from the revision that side shows
- Show the current repository next to the view title, list repositories by name (disambiguating duplicate folder names) in the repository picker, and remember the selected repository across reloads
- Keep the repository that is on screen when the filters are reset, and open on the remembered repository right away, so a multi-repository workspace no longer switches to another repository on reset
- Right click a commit for Git actions: copy hash/message, create a branch at the commit, add a tag, cherry-pick, revert, checkout (detached HEAD) and reset the current branch to it
- Right click a tag chip to copy its name or delete the tag
- Right click a changed file in the Changes view for Open Changes, Open File at Commit, Copy Path, Copy Relative Path, Open Containing Folder and Open in Integrated Terminal
- Allow selecting several changed files at once in the Changes view
- Column resizing now flexes the Description column first, so the columns next to a divider keep their width and simply move out of the way
- Let the Hash and Date/Time columns start a little wider than their minimum width, so they can also be dragged narrower

## 0.3.1

- Show commit dates as relative time by default, with a header button to switch to the full date/time (the Date/Time column width follows the format)
- Show only the file name in flat mode of the Changes view, with the folder path as a dimmed description

## 0.3.0

- Require VS Code 1.140 or newer
- Ignore capitalization when searching commit descriptions
- Show changes in merge commits
- Toggle commit column visibility
- Filter and flat/list mode for the Changes view
- Live filtering for the commit message filter
- Align the graph and list styling with VS Code's theme

## 0.2.5

- Fix issues

## 0.2.2

- improve performance

## 0.2.0

- display bread crumbs in diff editor
- compatible with other extension in diff editor
- add description at view title

## 0.1.14

- Pin yourself in authors selector
- Precise filter for selected author and email

## 0.1.12

- Support auto refresh log

## 0.1.8

- Fix issues

## 0.1.2

- Optimize filter interaction experience

## 0.1.1

- Fix issues

## 0.1.0

- Support for commit graphics

## 0.0.5

- Log and changes views are moved to panel by default

## 0.0.1

- You can view the merged changes of multiple commits by dragging
