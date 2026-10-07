# Git History

[English](README.md) | 简体中文

[![Version](https://vsmarketplacebadge.apphb.com/version/guodongsun.vscode-git-cruise.svg)](https://marketplace.visualstudio.com/items?itemName=guodongsun.vscode-git-cruise)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/guodongsun.vscode-git-cruise.svg)](https://marketplace.visualstudio.com/items?itemName=guodongsun.vscode-git-cruise)

一个更方便的查看Git历史的插件

具备以下主要功能

🗞️ 全量的Git历史展示

🩺 批量对比多个commit

〽️ 图形

🔍 快速搜索

## 操作指南

### Git 历史

![Usage](./assets/usage/full-history.gif)

- 一次滚动查看所有git历史

### Commit 变更

![Usage](./assets/usage/changes.gif)

- 点击commit可在变更栏查看变更
- 按住 `Ctrl`/`⌘` 可选中多个commit,你可以查看这多个commit合并后的变更
- 通过拖动来快速选择多个连续的commit
- 右键点击变更文件可以使用 `Open Changes`、`Open File at Commit`、`Copy Path`、`Copy Relative Path`、`Open Containing Folder`、`Open in Integrated Terminal`（按住 `Ctrl`/`⌘` 多选后可一次复制多个路径）

### Commit 操作

右键点击 commit 可以对它执行操作，右键点击 tag 可以管理 tag：

- 复制 commit hash 或信息
- 基于该 commit 创建分支并切换过去
- 在该 commit 上创建 tag
- Cherry-pick / revert 该 commit
- 检出该 commit（分离 HEAD）
- 将当前分支重置到该 commit（`soft` / `mixed` / `hard`）

### 文件历史 / 选区历史

这两项放在资源管理器、编辑器标签页与编辑器正文右键菜单的 `Git History` 子菜单下，便于看出它们由本扩展提供（在变更栏中则直接列出）。

- `Show File History`：把历史面板收窄到右键的那个文件；当前过滤条件会显示在视图标题旁，点击那里的按钮可清除
- `Show Selection History`：列出改动过所选行的 commit（`git log -L`），选择其中一个即可查看它对文件的改动。在变更栏打开的「文件变更」对比编辑器里同样可用，此时会以该侧所对应的版本为起点追溯行

### 图形

![Usage](./assets/usage/graph.gif)

### 其他

![Usage](./assets/usage/search.gif)

- 可以通过搜索hash来快速定位到对应的commit
- 通过作者或者信息来过滤历史
- 可查看其他分支与仓库历史；当前仓库名会显示在视图标题旁，且你选择的仓库会被记住
- 拖动表头来控制各列的可视宽度
- 更多功能开发中

## 发布历史

查看 [CHANGELOG.md](CHANGELOG.md).
