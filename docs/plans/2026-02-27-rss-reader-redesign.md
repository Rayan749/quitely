# QuiteRSS 重构设计文档

## 项目概述

将 QuiteRSS (Qt/C++ RSS 阅读器) 重构为使用 Tauri + React + TypeScript + Fluent UI 的现代化桌面应用。

### 目标

- 完全保留原有功能和界面布局
- 使用 Tauri 替代 Qt 框架
- 使用 Fluent UI 替代 Qt Widgets
- 跨平台支持: macOS, Windows, Linux

### 技术栈

| 层级 | 技术 | 用途 |
|-----|------|-----|
| 前端 | React 19 + TypeScript | UI 组件 |
| UI 框架 | Fluent UI v9 | Microsoft 设计系统 |
| 状态管理 | Zustand | 应用状态 |
| 后端 | Tauri v2 | 桌面框架 |
| 数据库 | SQLite + rusqlite | 数据持久化 |
| Feed 解析 | feed-rs crate | RSS/Atom 解析 |
| HTTP | reqwest crate | Feed 获取 |

---

## 架构设计

### 高层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    React + Fluent UI Frontend                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Feed Tree  │  │  News List  │  │   Content Viewer    │  │
│  │  Component  │  │  Component  │  │    (WebView)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                         │                                    │
│                    Zustand Store                             │
│                         │                                    │
│                   Tauri IPC (invoke)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                    Rust Backend (Tauri)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Commands   │  │ Feed Worker │  │   SQLite Database   │  │
│  │  (IPC API)  │──│ (Scheduler) │──│     (rusqlite)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                          │                                   │
│                   Feed Parser (feed-rs)                      │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

1. **用户操作** → React 组件触发 Zustand action
2. **状态更新** → Zustand 调用 Tauri 命令 via `invoke()`
3. **Rust 处理** → 命令执行，查询 SQLite，获取 Feed
4. **响应** → 数据返回前端，Zustand store 更新
5. **UI 更新** → React 重新渲染

---

## 项目结构

### 后端结构 (src-tauri/)

```
src-tauri/src/
├── lib.rs              # 入口点，Tauri 构建配置
├── commands/           # Tauri IPC 命令处理
│   ├── mod.rs
│   ├── feeds.rs        # Feed 增删改查
│   ├── news.rs         # News 操作
│   ├── labels.rs       # 标签管理
│   ├── filters.rs      # 过滤器增删改查和执行
│   ├── settings.rs     # 设置读写
│   └── import_export.rs # OPML 导入导出
├── db/                 # 数据库层
│   ├── mod.rs
│   ├── connection.rs   # SQLite 连接管理
│   ├── schema.rs       # 表定义
│   ├── feeds.rs        # Feed 查询
│   ├── news.rs         # News 查询
│   ├── labels.rs       # Label 查询
│   └── filters.rs      # Filter 查询
├── feed/               # Feed 获取和解析
│   ├── mod.rs
│   ├── fetcher.rs      # HTTP 客户端，并发控制
│   ├── parser.rs       # RSS/Atom 解析
│   └── favicon.rs      # Favicon 下载
├── worker/             # 后台任务
│   ├── mod.rs
│   ├── scheduler.rs    # Feed 更新调度器
│   └── cleanup.rs      # 自动清理任务
└── models/             # 数据结构
    ├── mod.rs
    ├── feed.rs
    ├── news.rs
    ├── label.rs
    └── filter.rs
```

### 前端结构 (src/)

```
src/
├── components/
│   ├── feeds/          # Feed 树组件
│   │   ├── FeedTree.tsx
│   │   ├── FeedItem.tsx
│   │   └── AddFeedDialog.tsx
│   ├── news/           # News 列表组件
│   │   ├── NewsList.tsx
│   │   ├── NewsItem.tsx
│   │   └── NewsFilter.tsx
│   ├── content/        # 内容查看器
│   │   ├── ContentViewer.tsx
│   │   └── NewspaperView.tsx
│   ├── categories/     # 分类面板
│   │   └── CategoriesPanel.tsx
│   ├── tabs/           # 标签页
│   │   └── TabBar.tsx
│   ├── settings/       # 设置对话框
│   │   └── SettingsDialog.tsx
│   └── common/         # 通用组件
│       ├── Layout.tsx
│       └── Toolbar.tsx
├── stores/             # Zustand stores
│   ├── feedStore.ts
│   ├── newsStore.ts
│   ├── settingsStore.ts
│   └── uiStore.ts
├── hooks/              # 自定义 hooks
│   ├── useTauriEvents.ts
│   ├── useFeeds.ts
│   └── useNews.ts
├── types/              # TypeScript 类型定义
│   ├── feed.ts
│   ├── news.ts
│   ├── label.ts
│   └── filter.ts
├── api/                # Tauri 命令封装
│   └── commands.ts
└── utils/              # 工具函数
    └── treeBuilder.ts
```

---

## 数据模型

### 数据库 Schema

```sql
-- Feeds 表 (树形结构)
CREATE TABLE feeds (
    id INTEGER PRIMARY KEY,
    parent_id INTEGER DEFAULT 0,
    text TEXT,
    title TEXT,
    description TEXT,
    xml_url TEXT,
    html_url TEXT,
    language TEXT,
    image_data BLOB,
    unread_count INTEGER DEFAULT 0,
    new_count INTEGER DEFAULT 0,

    -- 更新设置
    update_interval INTEGER DEFAULT 30,
    update_on_startup INTEGER DEFAULT 1,
    auto_update INTEGER DEFAULT 1,
    disabled INTEGER DEFAULT 0,

    -- 显示设置
    layout TEXT DEFAULT 'list',
    filter TEXT,
    sort_column TEXT,
    sort_order TEXT,

    -- 最后更新信息
    last_updated TEXT,
    status TEXT,
    error_message TEXT,

    created_at TEXT,
    updated_at TEXT
);

-- News/Articles 表
CREATE TABLE news (
    id INTEGER PRIMARY KEY,
    feed_id INTEGER NOT NULL,
    guid TEXT,
    title TEXT,
    author TEXT,
    author_email TEXT,
    link TEXT,
    description TEXT,
    content TEXT,
    published_at TEXT,
    received_at TEXT,

    -- 状态标记
    is_read INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 1,
    is_starred INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,

    -- 元数据
    category TEXT,
    labels TEXT,
    enclosure_url TEXT,
    enclosure_type TEXT,

    FOREIGN KEY (feed_id) REFERENCES feeds(id)
);

-- Labels 表
CREATE TABLE labels (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon_data BLOB,
    sort_order INTEGER
);

-- Filters 表
CREATE TABLE filters (
    id INTEGER PRIMARY KEY,
    name TEXT,
    enabled INTEGER DEFAULT 1,
    feed_ids TEXT,
    match_type TEXT,
    sort_order INTEGER
);

CREATE TABLE filter_conditions (
    id INTEGER PRIMARY KEY,
    filter_id INTEGER,
    field TEXT,
    operator TEXT,
    value TEXT,
    FOREIGN KEY (filter_id) REFERENCES filters(id)
);

CREATE TABLE filter_actions (
    id INTEGER PRIMARY KEY,
    filter_id INTEGER,
    action TEXT,
    params TEXT,
    FOREIGN KEY (filter_id) REFERENCES filters(id)
);

-- Settings 表
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
);
```

### TypeScript 类型定义

```typescript
interface Feed {
  id: number;
  parentId: number;
  text: string;
  title: string;
  xmlUrl: string;
  htmlUrl: string;
  unreadCount: number;
  newCount: number;
  updateInterval: number;
  autoUpdate: boolean;
  disabled: boolean;
  layout: 'list' | 'newspaper';
  lastUpdated: string;
  status: 'ok' | 'error' | 'updating';
}

interface News {
  id: number;
  feedId: number;
  guid: string;
  title: string;
  author: string;
  link: string;
  description: string;
  content: string;
  publishedAt: string;
  isRead: boolean;
  isNew: boolean;
  isStarred: boolean;
  isDeleted: boolean;
  labels: number[];
}

interface Label {
  id: number;
  name: string;
  color: string;
}

interface Filter {
  id: number;
  name: string;
  enabled: boolean;
  conditions: FilterCondition[];
  actions: FilterAction[];
}

interface FilterCondition {
  field: string;
  operator: 'contains' | 'equals' | 'matches_regex' | 'not_contains';
  value: string;
}

interface FilterAction {
  action: 'mark_read' | 'star' | 'label' | 'delete';
  params?: Record<string, unknown>;
}
```

---

## UI 布局设计

### 主窗口布局

```
┌─────────────────────────────────────────────────────────────────────┐
│  菜单栏   │  工具栏 (可自定义)                                        │
├────────────┬───────────────┬────────────────────────────────────────┤
│ 分类面板   │               │                                        │
│            │   Feed 树     │          News 列表面板                 │
│ ┌────────┐ │    面板       │  ┌────────────────────────────────────┐ │
│ │未读    │ │               │  │ 标题 │ 日期 │ 作者 │ Feed │ ...   │ │
│ │收藏    │ │  ┌─────────┐  │  ├────────────────────────────────────┤ │
│ │标签    │ │  │📁 新闻  │  │  │ ...新闻行...                      │ │
│ │已删除  │ │  │📁 科技  │  │  │                                    │ │
│ │下载    │ │  │ └📰BBC  │  │  │                                    │ │
│ └────────┘ │  │ └📰CNN  │  │  │                                    │ │
│            │  │📁 开发  │  │  │                                    │ │
│            │  └─────────┘  │  └────────────────────────────────────┘ │
│            │               │─────────────────────────────────────────│
│            │               │          内容查看器                     │
│            │               │          (WebView / 报纸视图)           │
│            │               │                                        │
├────────────┴───────────────┴────────────────────────────────────────┤
│  标签栏:  [Feed 1] [Feed 2] [网页] [+]                               │
├──────────────────────────────────────────────────────────────────────┤
│  状态栏:  42 未读  │  最后更新: 10:30  │  缩放: 100%                 │
└──────────────────────────────────────────────────────────────────────┘
```

### 核心组件

| 组件 | Fluent UI 元素 | 用途 |
|-----|---------------|-----|
| Feed 树 | `Tree` + `TreeItem` | 层级 Feed 显示 |
| News 列表 | `DataGrid` + `DataGridRow` | 虚拟化新闻表格 |
| 分类导航 | `Nav` + `NavGroup` | 侧边导航 |
| 标签页 | `Tabs` + `Tab` | 打开的 Feed/页面 |
| 工具栏 | `Toolbar` + `ToolbarButton` | 操作按钮 |
| 对话框 | `Dialog` + `DialogContent` | 设置、向导 |
| 通知 | `Toast` | 桌面通知 |

### 设置对话框结构

```
设置对话框
├── 常规
│   ├── 显示启动画面
│   ├── 启动时重新打开 Feed
│   ├── 在当前标签旁打开新标签
│   └── 打开标签时隐藏 Feed 列表
├── 系统托盘
│   ├── 显示托盘图标
│   ├── 最小化到托盘
│   ├── 关闭到托盘
│   └── 托盘图标样式
├── 网络
│   ├── 代理设置
│   ├── 请求超时
│   └── 并发请求数
├── 浏览器
│   ├── 内嵌/外部浏览器
│   ├── 外部浏览器路径
│   ├── 自动加载图片
│   ├── 启用 JavaScript
│   ├── 磁盘缓存
│   └── Cookie 管理
├── Feed
│   ├── 启动时更新
│   ├── 自动更新间隔
│   ├── 标记已读行为
│   ├── 日期/时间格式
│   └── 清理设置
├── 标签
│   └── 标签列表管理
├── 通知
│   ├── 声音通知
│   ├── 弹窗设置
│   ├── 屏幕位置
│   └── Feed 选择
├── 字体和颜色
│   ├── 字体设置
│   └── 颜色主题
├── 快捷键
│   └── 键盘快捷键自定义
└── 语言
    └── 语言选择
```

---

## 状态管理

### Store 结构

```typescript
interface AppState {
  // Feed 状态
  feeds: Feed[];
  selectedFeedId: number | null;
  feedsLoading: boolean;

  // News 状态
  news: News[];
  selectedNewsId: number | null;
  newsLoading: boolean;
  newsFilter: 'all' | 'unread' | 'starred' | 'deleted';
  newsSort: { column: string; order: 'asc' | 'desc' };

  // 标签状态
  labels: Label[];

  // 标签页状态
  tabs: Tab[];
  activeTabId: string | null;

  // UI 状态
  categoriesPanelVisible: boolean;
  feedTreeWidth: number;
  newsListHeight: number;
  contentLayout: 'list' | 'newspaper';

  // 设置
  settings: AppSettings;
}
```

### 关键 Hooks

```typescript
// Tauri 事件监听
function useTauriEvents() {
  useEffect(() => {
    const unlisten = listen('feed:update-complete', (event) => {
      updateFeedCounts(event.payload);
    });
    return () => { unlisten.then(f => f()); };
  }, []);
}

// Feed 列表
function useFeeds() {
  const { feeds, loadFeeds } = useStore();
  useEffect(() => { loadFeeds(); }, []);
  return { feeds };
}

// News 列表
function useNews(feedId: number) {
  const { news, loadNews, loading } = useStore();
  useEffect(() => { loadNews(feedId); }, [feedId]);
  return { news, loading };
}
```

---

## Tauri 命令 API

### Feed 命令

```rust
#[tauri::command]
async fn get_feeds() -> Result<Vec<Feed>, String>;

#[tauri::command]
async fn add_feed(url: String, folder_id: Option<i64>) -> Result<Feed, String>;

#[tauri::command]
async fn update_feed(feed_id: i64) -> Result<FeedUpdateResult, String>;

#[tauri::command]
async fn update_all_feeds() -> Result<(), String>;

#[tauri::command]
async fn delete_feed(feed_id: i64) -> Result<(), String>;

#[tauri::command]
async fn get_feed_counts() -> Result<Vec<FeedCount>, String>;
```

### News 命令

```rust
#[tauri::command]
async fn get_news(feed_id: i64, filter: NewsFilter) -> Result<Vec<News>, String>;

#[tauri::command]
async fn mark_read(news_ids: Vec<i64>) -> Result<(), String>;

#[tauri::command]
async fn mark_starred(news_ids: Vec<i64>, starred: bool) -> Result<(), String>;

#[tauri::command]
async fn delete_news(news_ids: Vec<i64>) -> Result<(), String>;

#[tauri::command]
async fn restore_news(news_ids: Vec<i64>) -> Result<(), String>;
```

### 导入导出

```rust
#[tauri::command]
async fn import_opml(file_path: String) -> Result<ImportResult, String>;

#[tauri::command]
async fn export_opml(file_path: String) -> Result<(), String>;
```

### 后端事件

```
// 发送到前端的事件
- "feed:update-started" { feed_id }
- "feed:update-complete" { feed_id, new_count }
- "feed:update-error" { feed_id, error }
- "feeds:counts-changed" { feeds: [{ id, unread, new }] }
```

---

## 系统托盘

### 托盘菜单

```
┌─────────────────┐
│ 显示主窗口      │
│ 隐藏主窗口      │
├─────────────────┤
│ 更新所有 Feed   │
│ 全部标记已读    │
├─────────────────┤
│ 添加 Feed...    │
├─────────────────┤
│ 退出            │
└─────────────────┘
```

### 托盘设置

```typescript
interface TraySettings {
  showTrayIcon: boolean;
  minimizeToTray: boolean;
  closeToTray: boolean;
  startMinimized: boolean;
  singleClickAction: 'show' | 'update' | 'none';
  iconStyle: 'static' | 'unread_count' | 'new_count';
}
```

---

## 通知系统

### 通知配置

```rust
pub struct NotificationConfig {
    pub enabled: bool,
    pub sound_path: Option<String>,
    pub show_on_new: bool,
    pub position: NotificationPosition,
    pub display_duration: u32,
    pub max_news_count: u8,
    pub show_feed_icon: bool,
    pub show_title_only: bool,
}
```

### 通知弹窗布局

```
┌──────────────────────────────────────────┐
│ 📰 BBC News                    [✕] [↓]  │
├──────────────────────────────────────────┤
│ • Breaking: Major tech announcement      │
│ • New article published today            │
│ • Weekly roundup: Top stories            │
├──────────────────────────────────────────┤
│ [全部标记已读]  [打开应用]  [关闭]       │
└──────────────────────────────────────────┘
```

---

## 错误处理

### 前端错误处理

```typescript
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

async function invokeCommand<T>(cmd: string, args?: object): Promise<T> {
  try {
    return await invoke<T>(cmd, args);
  } catch (error) {
    showErrorToast(`命令执行失败: ${cmd}`);
    throw new AppError('COMMAND_ERROR', cmd, error);
  }
}
```

### 后端错误处理

```rust
#[derive(Debug)]
pub enum AppError {
    Database(String),
    Network(String),
    Parse(String),
    NotFound(String),
    InvalidInput(String),
}

#[tauri::command]
async fn update_feed(feed_id: i64) -> Result<FeedUpdateResult, String> {
    let feed = db::feeds::get_by_id(feed_id)
        .map_err(|e| format!("获取 Feed 失败: {}", e))?;

    let content = fetcher::fetch(&feed.xml_url)
        .await
        .map_err(|e| format!("下载失败: {}", e))?;

    Ok(FeedUpdateResult { feed_id, new_count })
}
```

---

## 实现阶段

### 阶段 1: 基础框架
- [ ] Tauri 项目配置 + React + TypeScript
- [ ] SQLite 数据库初始化
- [ ] Fluent UI 基础布局
- [ ] Feed 增删改查 API
- [ ] News 列表显示

### 阶段 2: Feed 管理
- [ ] Feed 树组件
- [ ] 添加 Feed 向导
- [ ] RSS/Atom 解析器
- [ ] Feed 更新调度器
- [ ] OPML 导入导出

### 阶段 3: News 管理
- [ ] News 列表组件
- [ ] 阅读/收藏/删除
- [ ] 内容查看器
- [ ] 过滤器系统
- [ ] 标签系统

### 阶段 4: 系统功能
- [ ] 系统托盘
- [ ] 桌面通知
- [ ] 清理向导
- [ ] 设置对话框
- [ ] 键盘快捷键

### 阶段 5: 完善功能
- [ ] 浏览器集成
- [ ] 数据同步选项
- [ ] 国际化支持
- [ ] 性能优化
- [ ] 测试覆盖

---

## 依赖清单

### Rust 依赖 (Cargo.toml)

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.31", features = ["bundled"] }
feed-rs = "1.4"
reqwest = { version = "0.12", features = ["json"] }
tokio = { version = "1", features = ["full"] }
chrono = "0.4"
uuid = { version = "1", features = ["v4"] }
thiserror = "1"
```

### NPM 依赖 (package.json)

```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@fluentui/react-components": "^9.54.0",
    "@fluentui/react-icons": "^2.0.0",
    "@tauri-apps/api": "^2",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "typescript": "~5.8.0",
    "vite": "^7.0.0",
    "@vitejs/plugin-react": "^4.6.0"
  }
}
```

---

## 参考资源

- [QuiteRSS 原项目](https://github.com/QuiteRSS/quiterss)
- [Tauri v2 文档](https://v2.tauri.app/)
- [Fluent UI React 文档](https://react.fluentui.dev/)
- [feed-rs 文档](https://docs.rs/feed-rs/)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)