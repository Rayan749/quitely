# RSS Reader 阶段 1: 基础框架 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 搭建 Tauri + React + Fluent UI 项目基础，实现 SQLite 数据库初始化和 Feed 增删改查 API。

**Architecture:** Tauri v2 后端处理数据库和 Feed 操作，React + Fluent UI 前端通过 IPC 调用后端命令，Zustand 管理状态。

**Tech Stack:** Tauri v2, React 19, TypeScript, Fluent UI v9, Zustand, SQLite (rusqlite), feed-rs

---

## Task 1: 安装前端依赖

**Files:**
- Modify: `package.json`

**Step 1: 安装 Fluent UI 和 Zustand**

```bash
npm install @fluentui/react-components @fluentui/react-icons zustand
```

**Step 2: 验证安装**

```bash
npm list @fluentui/react-components zustand
```

Expected: 显示已安装的版本

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add Fluent UI and Zustand dependencies"
```

---

## Task 2: 安装 Rust 依赖

**Files:**
- Modify: `src-tauri/Cargo.toml`

**Step 1: 添加依赖到 Cargo.toml**

在 `[dependencies]` 部分添加:

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.31", features = ["bundled"] }
tokio = { version = "1", features = ["full"] }
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1", features = ["v4"] }
thiserror = "1"
```

**Step 2: 构建验证**

```bash
cd src-tauri && cargo check
```

Expected: 编译成功，无错误

**Step 3: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/Cargo.lock
git commit -m "chore: add Rust dependencies for database and async"
```

---

## Task 3: 创建数据库模块

**Files:**
- Create: `src-tauri/src/db/mod.rs`
- Create: `src-tauri/src/db/connection.rs`
- Create: `src-tauri/src/db/schema.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: 创建 db/mod.rs**

```rust
pub mod connection;
pub mod schema;

pub use connection::*;
pub use schema::*;
```

**Step 2: 创建 db/connection.rs**

```rust
use std::path::PathBuf;
use std::sync::Mutex;
use rusqlite::Connection;
use tauri::Manager;

pub struct DbState(pub Mutex<Connection>);

pub fn init_db(app_handle: &tauri::AppHandle) -> Result<DbState, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    std::fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;

    let db_path = PathBuf::from(&app_dir).join("quitely.db");

    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    // Enable foreign keys
    conn.execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|e| format!("Failed to enable foreign keys: {}", e))?;

    // Create tables
    schema::create_tables(&conn)?;

    Ok(DbState(Mutex::new(conn)))
}
```

**Step 3: 创建 db/schema.rs**

```rust
use rusqlite::Connection;

pub fn create_tables(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS feeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parent_id INTEGER DEFAULT 0,
            text TEXT,
            title TEXT,
            description TEXT,
            xml_url TEXT NOT NULL,
            html_url TEXT,
            language TEXT,
            image_data BLOB,
            unread_count INTEGER DEFAULT 0,
            new_count INTEGER DEFAULT 0,
            update_interval INTEGER DEFAULT 30,
            update_on_startup INTEGER DEFAULT 1,
            auto_update INTEGER DEFAULT 1,
            disabled INTEGER DEFAULT 0,
            layout TEXT DEFAULT 'list',
            last_updated TEXT,
            status TEXT DEFAULT 'ok',
            error_message TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feed_id INTEGER NOT NULL,
            guid TEXT,
            title TEXT,
            author TEXT,
            author_email TEXT,
            link TEXT,
            description TEXT,
            content TEXT,
            published_at TEXT,
            received_at TEXT DEFAULT CURRENT_TIMESTAMP,
            is_read INTEGER DEFAULT 0,
            is_new INTEGER DEFAULT 1,
            is_starred INTEGER DEFAULT 0,
            is_deleted INTEGER DEFAULT 0,
            category TEXT,
            labels TEXT,
            enclosure_url TEXT,
            enclosure_type TEXT,
            FOREIGN KEY (feed_id) REFERENCES feeds(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS labels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT,
            icon_data BLOB,
            sort_order INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS filters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            enabled INTEGER DEFAULT 1,
            feed_ids TEXT,
            match_type TEXT DEFAULT 'any',
            sort_order INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS filter_conditions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filter_id INTEGER NOT NULL,
            field TEXT,
            operator TEXT,
            value TEXT,
            FOREIGN KEY (filter_id) REFERENCES filters(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS filter_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filter_id INTEGER NOT NULL,
            action TEXT,
            params TEXT,
            FOREIGN KEY (filter_id) REFERENCES filters(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_news_feed_id ON news(feed_id);
        CREATE INDEX IF NOT EXISTS idx_news_is_read ON news(is_read);
        CREATE INDEX IF NOT EXISTS idx_news_is_starred ON news(is_starred);
        CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at);
        CREATE INDEX IF NOT EXISTS idx_feeds_parent_id ON feeds(parent_id);
        "#,
    )
    .map_err(|e| format!("Failed to create tables: {}", e))?;

    Ok(())
}
```

**Step 4: 修改 src-tauri/src/lib.rs**

```rust
mod db;

use db::DbState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db_state = db::init_db(&app.handle())?;
            app.manage(db_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 5: 验证编译**

```bash
cd src-tauri && cargo check
```

Expected: 编译成功

**Step 6: Commit**

```bash
git add src-tauri/src/db/ src-tauri/src/lib.rs
git commit -m "feat(db): add SQLite database initialization with schema"
```

---

## Task 4: 创建数据模型

**Files:**
- Create: `src-tauri/src/models/mod.rs`
- Create: `src-tauri/src/models/feed.rs`
- Create: `src-tauri/src/models/news.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: 创建 models/mod.rs**

```rust
pub mod feed;
pub mod news;

pub use feed::*;
pub use news::*;
```

**Step 2: 创建 models/feed.rs**

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Feed {
    pub id: i64,
    pub parent_id: i64,
    pub text: String,
    pub title: String,
    pub description: Option<String>,
    pub xml_url: String,
    pub html_url: Option<String>,
    pub language: Option<String>,
    pub unread_count: i64,
    pub new_count: i64,
    pub update_interval: i64,
    pub auto_update: bool,
    pub disabled: bool,
    pub layout: String,
    pub last_updated: Option<String>,
    pub status: String,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFeed {
    pub xml_url: String,
    pub parent_id: Option<i64>,
    pub title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateFeed {
    pub id: i64,
    pub title: Option<String>,
    pub parent_id: Option<i64>,
    pub update_interval: Option<i64>,
    pub auto_update: Option<bool>,
    pub disabled: Option<bool>,
    pub layout: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeedCount {
    pub id: i64,
    pub unread_count: i64,
    pub new_count: i64,
}
```

**Step 3: 创建 models/news.rs**

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct News {
    pub id: i64,
    pub feed_id: i64,
    pub guid: Option<String>,
    pub title: Option<String>,
    pub author: Option<String>,
    pub author_email: Option<String>,
    pub link: Option<String>,
    pub description: Option<String>,
    pub content: Option<String>,
    pub published_at: Option<String>,
    pub received_at: String,
    pub is_read: bool,
    pub is_new: bool,
    pub is_starred: bool,
    pub is_deleted: bool,
    pub category: Option<String>,
    pub labels: Vec<i64>,
    pub enclosure_url: Option<String>,
    pub enclosure_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewsFilter {
    pub feed_id: Option<i64>,
    pub unread_only: bool,
    pub starred_only: bool,
    pub deleted_only: bool,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewsUpdate {
    pub ids: Vec<i64>,
    pub is_read: Option<bool>,
    pub is_starred: Option<bool>,
    pub is_deleted: Option<bool>,
}
```

**Step 4: 修改 lib.rs 添加 models 模块**

```rust
mod db;
mod models;

use db::DbState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // ... rest unchanged
}
```

**Step 5: 验证编译**

```bash
cd src-tauri && cargo check
```

**Step 6: Commit**

```bash
git add src-tauri/src/models/
git commit -m "feat(models): add Feed and News data models"
```

---

## Task 5: 创建 Feed 数据库操作

**Files:**
- Create: `src-tauri/src/db/feeds.rs`
- Modify: `src-tauri/src/db/mod.rs`

**Step 1: 创建 db/feeds.rs**

```rust
use rusqlite::{Connection, params};
use crate::models::{Feed, CreateFeed, UpdateFeed, FeedCount};

pub fn get_all(conn: &Connection) -> Result<Vec<Feed>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, parent_id, text, title, description, xml_url, html_url,
                   language, unread_count, new_count, update_interval, auto_update,
                   disabled, layout, last_updated, status, error_message
            FROM feeds
            ORDER BY parent_id, text
            "#,
        )
        .map_err(|e| e.to_string())?;

    let feeds = stmt
        .query_map([], |row| {
            Ok(Feed {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                text: row.get(2)?,
                title: row.get(3)?,
                description: row.get(4)?,
                xml_url: row.get(5)?,
                html_url: row.get(6)?,
                language: row.get(7)?,
                unread_count: row.get(8)?,
                new_count: row.get(9)?,
                update_interval: row.get(10)?,
                auto_update: row.get::<_, i64>(11)? != 0,
                disabled: row.get::<_, i64>(12)? != 0,
                layout: row.get(13)?,
                last_updated: row.get(14)?,
                status: row.get(15)?,
                error_message: row.get(16)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(feeds)
}

pub fn get_by_id(conn: &Connection, id: i64) -> Result<Option<Feed>, String> {
    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, parent_id, text, title, description, xml_url, html_url,
                   language, unread_count, new_count, update_interval, auto_update,
                   disabled, layout, last_updated, status, error_message
            FROM feeds WHERE id = ?
            "#,
        )
        .map_err(|e| e.to_string())?;

    let result = stmt
        .query_row(params![id], |row| {
            Ok(Feed {
                id: row.get(0)?,
                parent_id: row.get(1)?,
                text: row.get(2)?,
                title: row.get(3)?,
                description: row.get(4)?,
                xml_url: row.get(5)?,
                html_url: row.get(6)?,
                language: row.get(7)?,
                unread_count: row.get(8)?,
                new_count: row.get(9)?,
                update_interval: row.get(10)?,
                auto_update: row.get::<_, i64>(11)? != 0,
                disabled: row.get::<_, i64>(12)? != 0,
                layout: row.get(13)?,
                last_updated: row.get(14)?,
                status: row.get(15)?,
                error_message: row.get(16)?,
            })
        })
        .optional()
        .map_err(|e| e.to_string())?;

    Ok(result)
}

pub fn create(conn: &Connection, feed: &CreateFeed) -> Result<i64, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let parent_id = feed.parent_id.unwrap_or(0);
    let title = feed.title.clone().unwrap_or_else(|| feed.xml_url.clone());

    conn.execute(
        r#"
        INSERT INTO feeds (xml_url, parent_id, text, title, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?5)
        "#,
        params![feed.xml_url, parent_id, &title, &title, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

pub fn update(conn: &Connection, feed: &UpdateFeed) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();

    if let Some(title) = &feed.title {
        conn.execute(
            "UPDATE feeds SET title = ?1, text = ?1, updated_at = ?2 WHERE id = ?3",
            params![title, now, feed.id],
        )
        .map_err(|e| e.to_string())?;
    }

    if let Some(parent_id) = feed.parent_id {
        conn.execute(
            "UPDATE feeds SET parent_id = ?1, updated_at = ?2 WHERE id = ?3",
            params![parent_id, now, feed.id],
        )
        .map_err(|e| e.to_string())?;
    }

    if let Some(update_interval) = feed.update_interval {
        conn.execute(
            "UPDATE feeds SET update_interval = ?1, updated_at = ?2 WHERE id = ?3",
            params![update_interval, now, feed.id],
        )
        .map_err(|e| e.to_string())?;
    }

    if let Some(auto_update) = feed.auto_update {
        let val = if auto_update { 1i64 } else { 0i64 };
        conn.execute(
            "UPDATE feeds SET auto_update = ?1, updated_at = ?2 WHERE id = ?3",
            params![val, now, feed.id],
        )
        .map_err(|e| e.to_string())?;
    }

    if let Some(disabled) = feed.disabled {
        let val = if disabled { 1i64 } else { 0i64 };
        conn.execute(
            "UPDATE feeds SET disabled = ?1, updated_at = ?2 WHERE id = ?3",
            params![val, now, feed.id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

pub fn delete(conn: &Connection, id: i64) -> Result<(), String> {
    conn.execute("DELETE FROM feeds WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn update_counts(conn: &Connection, counts: &[FeedCount]) -> Result<(), String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    for count in counts {
        tx.execute(
            "UPDATE feeds SET unread_count = ?1, new_count = ?2 WHERE id = ?3",
            params![count.unread_count, count.new_count, count.id],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
```

**Step 2: 修改 db/mod.rs**

```rust
pub mod connection;
pub mod schema;
pub mod feeds;

pub use connection::*;
pub use schema::*;
```

**Step 3: 验证编译**

```bash
cd src-tauri && cargo check
```

**Step 4: Commit**

```bash
git add src-tauri/src/db/
git commit -m "feat(db): add Feed CRUD database operations"
```

---

## Task 6: 创建 Feed Tauri 命令

**Files:**
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/commands/feeds.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: 创建 commands/mod.rs**

```rust
pub mod feeds;

pub use feeds::*;
```

**Step 2: 创建 commands/feeds.rs**

```rust
use tauri::State;
use crate::db::DbState;
use crate::models::{Feed, CreateFeed, UpdateFeed, FeedCount};

#[tauri::command]
pub fn get_feeds(db: State<'_, DbState>) -> Result<Vec<Feed>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::get_all(&conn)
}

#[tauri::command]
pub fn get_feed(db: State<'_, DbState>, id: i64) -> Result<Option<Feed>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::get_by_id(&conn, id)
}

#[tauri::command]
pub fn create_feed(db: State<'_, DbState>, feed: CreateFeed) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::create(&conn, &feed)
}

#[tauri::command]
pub fn update_feed(db: State<'_, DbState>, feed: UpdateFeed) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::update(&conn, &feed)
}

#[tauri::command]
pub fn delete_feed(db: State<'_, DbState>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::delete(&conn, id)
}

#[tauri::command]
pub fn update_feed_counts(db: State<'_, DbState>, counts: Vec<FeedCount>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::feeds::update_counts(&conn, &counts)
}
```

**Step 3: 修改 lib.rs**

```rust
mod commands;
mod db;
mod models;

use db::DbState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db_state = db::init_db(&app.handle())?;
            app.manage(db_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_feeds,
            commands::get_feed,
            commands::create_feed,
            commands::update_feed,
            commands::delete_feed,
            commands::update_feed_counts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 4: 验证编译**

```bash
cd src-tauri && cargo check
```

**Step 5: Commit**

```bash
git add src-tauri/src/commands/ src-tauri/src/lib.rs
git commit -m "feat(commands): add Feed Tauri commands"
```

---

## Task 7: 创建前端类型定义

**Files:**
- Create: `src/types/feed.ts`
- Create: `src/types/news.ts`
- Create: `src/types/index.ts`

**Step 1: 创建 src/types/feed.ts**

```typescript
export interface Feed {
  id: number;
  parentId: number;
  text: string;
  title: string;
  description?: string;
  xmlUrl: string;
  htmlUrl?: string;
  language?: string;
  unreadCount: number;
  newCount: number;
  updateInterval: number;
  autoUpdate: boolean;
  disabled: boolean;
  layout: 'list' | 'newspaper';
  lastUpdated?: string;
  status: 'ok' | 'error' | 'updating';
  errorMessage?: string;
}

export interface CreateFeed {
  xmlUrl: string;
  parentId?: number;
  title?: string;
}

export interface UpdateFeed {
  id: number;
  title?: string;
  parentId?: number;
  updateInterval?: number;
  autoUpdate?: boolean;
  disabled?: boolean;
  layout?: 'list' | 'newspaper';
}

export interface FeedCount {
  id: number;
  unreadCount: number;
  newCount: number;
}
```

**Step 2: 创建 src/types/news.ts**

```typescript
export interface News {
  id: number;
  feedId: number;
  guid?: string;
  title?: string;
  author?: string;
  authorEmail?: string;
  link?: string;
  description?: string;
  content?: string;
  publishedAt?: string;
  receivedAt: string;
  isRead: boolean;
  isNew: boolean;
  isStarred: boolean;
  isDeleted: boolean;
  category?: string;
  labels: number[];
  enclosureUrl?: string;
  enclosureType?: string;
}

export interface NewsFilter {
  feedId?: number;
  unreadOnly?: boolean;
  starredOnly?: boolean;
  deletedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface NewsUpdate {
  ids: number[];
  isRead?: boolean;
  isStarred?: boolean;
  isDeleted?: boolean;
}
```

**Step 3: 创建 src/types/index.ts**

```typescript
export * from './feed';
export * from './news';
```

**Step 4: Commit**

```bash
git add src/types/
git commit -m "feat(types): add TypeScript type definitions"
```

---

## Task 8: 创建 Tauri API 封装

**Files:**
- Create: `src/api/commands.ts`

**Step 1: 创建 src/api/commands.ts**

```typescript
import { invoke } from '@tauri-apps/api/core';
import type { Feed, CreateFeed, UpdateFeed, FeedCount, News, NewsFilter, NewsUpdate } from '../types';

// Feed commands
export async function getFeeds(): Promise<Feed[]> {
  return invoke<Feed[]>('get_feeds');
}

export async function getFeed(id: number): Promise<Feed | null> {
  return invoke<Feed | null>('get_feed', { id });
}

export async function createFeed(feed: CreateFeed): Promise<number> {
  return invoke<number>('create_feed', { feed });
}

export async function updateFeed(feed: UpdateFeed): Promise<void> {
  return invoke('update_feed', { feed });
}

export async function deleteFeed(id: number): Promise<void> {
  return invoke('delete_feed', { id });
}

export async function updateFeedCounts(counts: FeedCount[]): Promise<void> {
  return invoke('update_feed_counts', { counts });
}

// News commands (placeholder for Phase 3)
export async function getNews(filter: NewsFilter): Promise<News[]> {
  return invoke<News[]>('get_news', { filter });
}

export async function updateNews(update: NewsUpdate): Promise<void> {
  return invoke('update_news', { update });
}
```

**Step 2: Commit**

```bash
git add src/api/
git commit -m "feat(api): add Tauri command wrappers"
```

---

## Task 9: 创建 Zustand Store

**Files:**
- Create: `src/stores/feedStore.ts`
- Create: `src/stores/uiStore.ts`
- Create: `src/stores/index.ts`

**Step 1: 创建 src/stores/feedStore.ts**

```typescript
import { create } from 'zustand';
import type { Feed, CreateFeed, UpdateFeed, FeedCount } from '../types';
import * as api from '../api/commands';

interface FeedState {
  feeds: Feed[];
  selectedFeedId: number | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadFeeds: () => Promise<void>;
  selectFeed: (id: number | null) => void;
  addFeed: (feed: CreateFeed) => Promise<number>;
  updateFeed: (feed: UpdateFeed) => Promise<void>;
  deleteFeed: (id: number) => Promise<void>;
  updateCounts: (counts: FeedCount[]) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  feeds: [],
  selectedFeedId: null,
  loading: false,
  error: null,

  loadFeeds: async () => {
    set({ loading: true, error: null });
    try {
      const feeds = await api.getFeeds();
      set({ feeds, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  selectFeed: (id) => {
    set({ selectedFeedId: id });
  },

  addFeed: async (feed) => {
    const id = await api.createFeed(feed);
    await get().loadFeeds();
    return id;
  },

  updateFeed: async (feed) => {
    await api.updateFeed(feed);
    await get().loadFeeds();
  },

  deleteFeed: async (id) => {
    await api.deleteFeed(id);
    set((state) => ({
      feeds: state.feeds.filter((f) => f.id !== id),
      selectedFeedId: state.selectedFeedId === id ? null : state.selectedFeedId,
    }));
  },

  updateCounts: (counts) => {
    set((state) => ({
      feeds: state.feeds.map((feed) => {
        const count = counts.find((c) => c.id === feed.id);
        if (count) {
          return { ...feed, unreadCount: count.unreadCount, newCount: count.newCount };
        }
        return feed;
      }),
    }));
  },
}));
```

**Step 2: 创建 src/stores/uiStore.ts**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Panel visibility
  categoriesPanelVisible: boolean;
  feedTreeWidth: number;
  newsListHeight: number;

  // Content view
  contentLayout: 'list' | 'newspaper';

  // Actions
  toggleCategoriesPanel: () => void;
  setFeedTreeWidth: (width: number) => void;
  setNewsListHeight: (height: number) => void;
  setContentLayout: (layout: 'list' | 'newspaper') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      categoriesPanelVisible: true,
      feedTreeWidth: 250,
      newsListHeight: 300,
      contentLayout: 'list',

      toggleCategoriesPanel: () =>
        set((state) => ({ categoriesPanelVisible: !state.categoriesPanelVisible })),

      setFeedTreeWidth: (width) => set({ feedTreeWidth: width }),

      setNewsListHeight: (height) => set({ newsListHeight: height }),

      setContentLayout: (layout) => set({ contentLayout: layout }),
    }),
    {
      name: 'quitely-ui-settings',
    }
  )
);
```

**Step 3: 创建 src/stores/index.ts**

```typescript
export { useFeedStore } from './feedStore';
export { useUIStore } from './uiStore';
```

**Step 4: Commit**

```bash
git add src/stores/
git commit -m "feat(stores): add Zustand stores for feeds and UI state"
```

---

## Task 10: 创建基础布局组件

**Files:**
- Create: `src/components/common/Layout.tsx`
- Create: `src/components/common/Sidebar.tsx`
- Create: `src/components/common/index.ts`

**Step 1: 安装 zustand middleware（如需要）**

Zustand persist 已包含在核心包中，无需额外安装。

**Step 2: 创建 src/components/common/Layout.tsx**

```tsx
import { useState } from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  Divider,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Sidebar } from './Sidebar';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: tokens.backgroundColorDefault,
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
});

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const styles = useStyles();
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <div className={styles.root}>
        <Sidebar />
        <div className={styles.main}>
          {children}
        </div>
      </div>
    </FluentProvider>
  );
}
```

**Step 3: 创建 src/components/common/Sidebar.tsx**

```tsx
import { makeStyles, tokens } from '@fluentui/react-components';
import { useUIStore } from '../../stores';

const useStyles = makeStyles({
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    width: '200px',
    minWidth: '200px',
    backgroundColor: tokens.fillStyleNeutralBackground1,
    borderRight: `1px solid ${tokens.strokeColorNeutral1}`,
  },
  categoriesPanel: {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  },
});

export function Sidebar() {
  const styles = useStyles();
  const { categoriesPanelVisible } = useUIStore();

  if (!categoriesPanelVisible) {
    return null;
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.categoriesPanel}>
        {/* Categories will be added in Phase 4 */}
        <div style={{ padding: '16px 8px', color: tokens.colorNeutralForeground3 }}>
          未读
          <br />
          收藏
          <br />
          标签
          <br />
          已删除
        </div>
      </div>
    </aside>
  );
}
```

**Step 4: 创建 src/components/common/index.ts**

```tsx
export { Layout } from './Layout';
export { Sidebar } from './Sidebar';
```

**Step 5: Commit**

```bash
git add src/components/common/
git commit -m "feat(components): add basic Layout and Sidebar components"
```

---

## Task 11: 更新主应用入口

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

**Step 1: 更新 src/App.tsx**

```tsx
import { Layout } from './components/common';
import { useFeedStore } from './stores';
import { useEffect } from 'react';

function App() {
  const { loadFeeds } = useFeedStore();

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  return (
    <Layout>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Feed Tree Panel - Phase 2 */}
        <div style={{ width: '250px', borderRight: '1px solid #e0e0e0', padding: '8px' }}>
          <h3>Feeds</h3>
          <p>Loading feeds...</p>
        </div>

        {/* News List Panel - Phase 3 */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ flex: '0 0 300px', borderBottom: '1px solid #e0e0e0', padding: '8px' }}>
            <h3>News List</h3>
            <p>Select a feed to view news</p>
          </div>

          {/* Content Viewer - Phase 3 */}
          <div style={{ flex: 1, padding: '8px', overflow: 'auto' }}>
            <h3>Content</h3>
            <p>Select a news item to view content</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;
```

**Step 2: 更新 src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 3: 验证编译**

```bash
npm run build
```

Expected: 编译成功

**Step 4: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat(app): update main App with Layout and feed loading"
```

---

## Task 12: 运行并测试应用

**Step 1: 启动开发服务器**

```bash
npm run tauri dev
```

Expected: 应用启动，显示基础布局

**Step 2: 验证数据库创建**

检查数据库文件是否创建：
- macOS: `~/Library/Application Support/com.rayan.quitely/quitely.db`

**Step 3: 最终 Commit**

```bash
git add -A
git commit -m "feat: complete Phase 1 - basic framework setup

- Tauri + React + TypeScript project configured
- SQLite database initialized with schema
- Feed CRUD API implemented
- Fluent UI layout components created
- Zustand stores for state management"
```

---

## 阶段 1 完成检查清单

- [ ] Fluent UI 和 Zustand 依赖已安装
- [ ] Rust 依赖已配置 (rusqlite, tokio, chrono, etc.)
- [ ] SQLite 数据库模块已创建
- [ ] Feed 和 News 数据模型已定义
- [ ] Feed 数据库操作已实现
- [ ] Feed Tauri 命令已创建
- [ ] 前端类型定义已完成
- [ ] Tauri API 封装已创建
- [ ] Zustand Store 已实现
- [ ] 基础布局组件已创建
- [ ] 应用可以启动并显示 UI
- [ ] 数据库文件已正确创建