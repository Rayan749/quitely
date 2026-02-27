# RSS Reader 阶段 2: Feed 管理 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现 Feed 树组件、添加 Feed 向导、RSS/Atom 解析器、Feed 更新调度器和 OPML 导入导出。

**Architecture:** Rust 后端使用 feed-rs 解析 RSS/Atom，reqwest 获取 Feed，前端使用 Fluent UI Tree 组件显示 Feed 树。

**Tech Stack:** feed-rs, reqwest, Fluent UI Tree, Tauri events

---

## Task 1: 安装 Feed 解析依赖

**Files:**
- Modify: `src-tauri/Cargo.toml`

**Step 1: 添加 feed-rs 和 reqwest**

```toml
feed-rs = "1.4"
reqwest = { version = "0.12", features = ["json"] }
```

**Step 2: 验证编译**

```bash
cd src-tauri && cargo check
```

**Step 3: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/Cargo.lock
git commit -m "chore: add feed-rs and reqwest for RSS parsing"
```

---

## Task 2: 创建 Feed 获取模块

**Files:**
- Create: `src-tauri/src/feed/mod.rs`
- Create: `src-tauri/src/feed/fetcher.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: 创建 feed/mod.rs**

```rust
pub mod fetcher;

pub use fetcher::*;
```

**Step 2: 创建 feed/fetcher.rs**

```rust
use reqwest::Client;
use feed_rs::parser;
use crate::models::{Feed, CreateFeed};
use crate::db;

pub struct FeedFetcher {
    client: Client,
}

impl FeedFetcher {
    pub fn new() -> Self {
        Self {
            client: Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .build()
                .unwrap(),
        }
    }

    pub async fn fetch_and_parse(&self, url: &str) -> Result<ParsedFeed, String> {
        let response = self.client
            .get(url)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        let content = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response: {}", e))?;

        let parsed = parser::parse(content.as_bytes())
            .map_err(|e| format!("Failed to parse feed: {}", e))?;

        Ok(ParsedFeed {
            title: parsed.title.map(|t| t.content).unwrap_or_else(|| url.to_string()),
            description: parsed.description.map(|d| d.content),
            html_url: parsed.links.first().map(|l| l.href.clone()),
            language: parsed.language.clone(),
        })
    }
}

#[derive(Debug, Clone)]
pub struct ParsedFeed {
    pub title: String,
    pub description: Option<String>,
    pub html_url: Option<String>,
    pub language: Option<String>,
}
```

**Step 3: 修改 lib.rs 添加 feed 模块**

```rust
mod commands;
mod db;
mod feed;
mod models;
```

**Step 4: 验证编译**

```bash
cd src-tauri && cargo check
```

**Step 5: Commit**

```bash
git add src-tauri/src/feed/
git commit -m "feat(feed): add feed fetcher and parser module"
```

---

## Task 3: 添加 Feed 更新 Tauri 命令

**Files:**
- Create: `src-tauri/src/feed/commands.rs`
- Modify: `src-tauri/src/commands/feeds.rs`

**Step 1: 创建 feed/commands.rs**

```rust
use tauri::State;
use crate::db::DbState;
use crate::models::{Feed, CreateFeed};
use crate::feed::FeedFetcher;

#[tauri::command]
pub async fn fetch_feed_info(url: String) -> Result<crate::feed::ParsedFeed, String> {
    let fetcher = FeedFetcher::new();
    fetcher.fetch_and_parse(&url).await
}

#[tauri::command]
pub async fn add_feed_with_fetch(
    db: State<'_, DbState>,
    url: String,
    parent_id: Option<i64>,
) -> Result<Feed, String> {
    // Fetch feed info
    let fetcher = FeedFetcher::new();
    let info = fetcher.fetch_and_parse(&url).await?;

    // Create feed in database
    let create_feed = CreateFeed {
        xml_url: url,
        parent_id,
        title: Some(info.title),
    };

    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let id = crate::db::feeds::create(&conn, &create_feed)?;

    // Get the created feed
    crate::db::feeds::get_by_id(&conn, id)?
        .ok_or_else(|| "Failed to get created feed".to_string())
}
```

**Step 2: 更新 commands/feeds.rs 注册命令**

在 lib.rs 的 invoke_handler 中添加新命令。

**Step 3: Commit**

```bash
git add src-tauri/src/feed/ src-tauri/src/lib.rs
git commit -m "feat(commands): add fetch_feed_info and add_feed_with_fetch commands"
```

---

## Task 4: 创建 Feed 树组件

**Files:**
- Create: `src/components/feeds/FeedTree.tsx`
- Create: `src/components/feeds/index.ts`

**Step 1: 创建 FeedTree.tsx**

使用 Fluent UI 的 Tree 组件显示 Feed 层级结构。

**Step 2: 创建 index.ts**

**Step 3: Commit**

---

## Task 5: 创建添加 Feed 对话框

**Files:**
- Create: `src/components/feeds/AddFeedDialog.tsx`

**Step 1: 创建添加 Feed 对话框**

包含 URL 输入、Feed 信息预览、文件夹选择。

**Step 2: Commit**

---

## Task 6: 创建工具栏组件

**Files:**
- Create: `src/components/common/Toolbar.tsx`

**Step 1: 创建工具栏**

包含添加 Feed、刷新、设置等按钮。

**Step 2: Commit**

---

## Task 7: 更新 App.tsx 集成 Feed 树

**Files:**
- Modify: `src/App.tsx`

**Step 1: 集成 FeedTree 组件**

**Step 2: Commit**

---

## Task 8: 实现 OPML 导入导出

**Files:**
- Create: `src-tauri/src/feed/opml.rs`
- Modify: `src-tauri/src/feed/mod.rs`

**Step 1: 创建 OPML 解析器**

**Step 2: 创建 Tauri 命令**

**Step 3: Commit**

---

## 阶段 2 完成检查清单

- [ ] feed-rs 和 reqwest 依赖已安装
- [ ] Feed 获取模块已创建
- [ ] Feed 更新命令已添加
- [ ] Feed 树组件已创建
- [ ] 添加 Feed 对话框已创建
- [ ] 工具栏组件已创建
- [ ] App 已集成 Feed 树
- [ ] OPML 导入导出已实现