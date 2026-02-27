# RSS Reader 阶段 5: 完善功能 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完善 Feed 获取、文章存储、调度器和托盘事件等核心功能。

**Architecture:** Rust 后端定时调度更新 Feed，前端监听事件响应。

**Tech Stack:** Tauri v2, React 19, TypeScript, Fluent UI v9, SQLite, Tokio

---

## Task 1: 实现 Feed 获取和文章存储

**Files:**
- Modify: `src-tauri/src/feed/fetcher.rs`
- Create: `src-tauri/src/commands/feeds.rs` (update_feed_articles)
- Modify: `src/api/commands.ts`

**完成:** ✅
- 扩展 FeedFetcher 解析文章条目
- 添加 update_feed_articles 命令
- 检查重复文章后存储

---

## Task 2: 添加 Feed 更新调度器

**Files:**
- Create: `src-tauri/src/worker/scheduler.rs`
- Create: `src-tauri/src/worker/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**完成:** ✅
- 创建 FeedScheduler 定时触发更新
- 默认 30 分钟间隔
- 发送 scheduler:update-feeds 事件

---

## Task 3: 添加托盘事件监听

**Files:**
- Create: `src/hooks/useTrayEvents.ts`
- Modify: `src/App.tsx`

**完成:** ✅
- 监听 tray:update-feeds
- 监听 tray:mark-all-read
- 监听 scheduler:update-feeds

---

## 阶段 5 完成检查清单

- [x] Feed 获取和文章存储已实现
- [x] Feed 更新调度器已添加
- [x] 托盘事件监听已完成