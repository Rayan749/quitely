# RSS Reader 阶段 3: News 管理 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现 News (文章) 的数据库操作、Tauri 命令、前端组件和状态管理，完成文章列表和内容查看功能。

**Architecture:** Rust 后端处理 News CRUD 操作，React + Fluent UI 前端显示文章列表和内容，Zustand 管理状态。

**Tech Stack:** Tauri v2, React 19, TypeScript, Fluent UI v9, Zustand, SQLite (rusqlite)

---

## Task 1: 创建 News 数据库操作

**Files:**
- Create: `src-tauri/src/db/news.rs`
- Modify: `src-tauri/src/db/mod.rs`

创建 News CRUD 数据库操作函数。

---

## Task 2: 创建 News Tauri 命令

**Files:**
- Create: `src-tauri/src/commands/news.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`

创建 Tauri IPC 命令用于前端调用。

---

## Task 3: 创建 News 列表组件

**Files:**
- Create: `src/components/news/NewsList.tsx`
- Create: `src/components/news/index.ts`

使用 Fluent UI Table 显示文章列表。

---

## Task 4: 创建内容查看器组件

**Files:**
- Create: `src/components/content/ContentViewer.tsx`
- Create: `src/components/content/index.ts`

显示选中文章的完整内容。

---

## Task 5: 创建 News Store

**Files:**
- Create: `src/stores/newsStore.ts`
- Modify: `src/stores/index.ts`

Zustand store 管理 News 状态。

---

## Task 6: 集成 News 列表到 App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/api/commands.ts`

三栏布局集成。

---

## 阶段 3 完成检查清单

- [ ] News 数据库操作已实现
- [ ] News Tauri 命令已创建
- [ ] News 列表组件已创建
- [ ] 内容查看器组件已创建
- [ ] News Store 已实现
- [ ] 已集成到主应用