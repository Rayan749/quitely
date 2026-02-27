# Phase 8: Search, Pagination & Settings — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add article search, infinite-scroll pagination, proxy support, font/color customization, and i18n (English + Chinese).

**Architecture:** Search uses SQL LIKE queries (simple, adequate for local SQLite). Pagination appends articles via "load more" with offset tracking. Proxy configures reqwest client at startup. Fonts/colors use CSS variables. i18n uses i18next with JSON translation files.

**Tech Stack:** React 19, TypeScript, Fluent UI v9, Zustand, i18next, react-i18next, Tauri v2, Rust (rusqlite, reqwest)

---

### Task 1: Add Search Backend Command

**Files:**
- Modify: `src-tauri/src/db/news.rs`
- Modify: `src-tauri/src/commands/news.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Add search_news function to db/news.rs**

In `src-tauri/src/db/news.rs`, add:

```rust
pub fn search(conn: &Connection, query: &str, feed_id: Option<i64>, limit: Option<i64>, offset: Option<i64>) -> Result<Vec<News>, String> {
    let search_pattern = format!("%{}%", query);

    let mut sql = String::from(
        r#"
        SELECT id, feed_id, guid, title, author, author_email, link,
               description, content, published_at, received_at,
               is_read, is_new, is_starred, is_deleted, category,
               labels, enclosure_url, enclosure_type
        FROM news WHERE is_deleted = 0
          AND (title LIKE ?1 OR author LIKE ?1 OR content LIKE ?1 OR description LIKE ?1)
        "#
    );

    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    params_vec.push(Box::new(search_pattern));

    if let Some(fid) = feed_id {
        sql.push_str(" AND feed_id = ?");
        params_vec.push(Box::new(fid));
    }

    sql.push_str(" ORDER BY published_at DESC");

    if let Some(lim) = limit {
        sql.push_str(&format!(" LIMIT {}", lim));
    }

    if let Some(off) = offset {
        sql.push_str(&format!(" OFFSET {}", off));
    }

    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let news_list = stmt
        .query_map(params_refs.as_slice(), |row| {
            let labels_str: Option<String> = row.get(16)?;
            let labels: Vec<i64> = labels_str
                .and_then(|s| {
                    s.split(',')
                        .filter(|s| !s.is_empty())
                        .map(|s| s.parse::<i64>().ok())
                        .collect::<Option<Vec<_>>>()
                })
                .unwrap_or_default();

            Ok(News {
                id: row.get(0)?,
                feed_id: row.get(1)?,
                guid: row.get(2)?,
                title: row.get(3)?,
                author: row.get(4)?,
                author_email: row.get(5)?,
                link: row.get(6)?,
                description: row.get(7)?,
                content: row.get(8)?,
                published_at: row.get(9)?,
                received_at: row.get(10)?,
                is_read: row.get::<_, i64>(11)? != 0,
                is_new: row.get::<_, i64>(12)? != 0,
                is_starred: row.get::<_, i64>(13)? != 0,
                is_deleted: row.get::<_, i64>(14)? != 0,
                category: row.get(15)?,
                labels,
                enclosure_url: row.get(17)?,
                enclosure_type: row.get(18)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(news_list)
}

pub fn count(conn: &Connection, filter: &NewsFilter) -> Result<i64, String> {
    let mut query = String::from("SELECT COUNT(*) FROM news WHERE 1=1");
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(feed_id) = filter.feed_id {
        query.push_str(" AND feed_id = ?");
        params_vec.push(Box::new(feed_id));
    }

    if filter.unread_only {
        query.push_str(" AND is_read = 0");
    }

    if filter.starred_only {
        query.push_str(" AND is_starred = 1");
    }

    if filter.deleted_only {
        query.push_str(" AND is_deleted = 1");
    } else {
        query.push_str(" AND is_deleted = 0");
    }

    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();

    conn.query_row(&query, params_refs.as_slice(), |row| row.get(0))
        .map_err(|e| e.to_string())
}
```

**Step 2: Add Tauri commands**

In `src-tauri/src/commands/news.rs`, add:

```rust
#[tauri::command]
pub fn search_news(
    db: State<'_, DbState>,
    query: String,
    feed_id: Option<i64>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<News>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::news::search(&conn, &query, feed_id, limit, offset)
}

#[tauri::command]
pub fn get_news_count(db: State<'_, DbState>, filter: NewsFilter) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::news::count(&conn, &filter)
}
```

**Step 3: Register in lib.rs**

Add to `generate_handler![]`:

```rust
            commands::search_news,
            commands::get_news_count,
```

**Step 4: Verify**

Run: `cd src-tauri && cargo check`
Expected: Compiles cleanly

**Step 5: Commit**

```bash
git add src-tauri/src/db/news.rs src-tauri/src/commands/news.rs src-tauri/src/lib.rs
git commit -m "feat: add search_news and get_news_count backend commands"
```

---

### Task 2: Add Search Frontend API

**Files:**
- Modify: `src/api/commands.ts`

**Step 1: Add search and count API functions**

In `src/api/commands.ts`, add:

```typescript
export async function searchNews(
  query: string,
  feedId?: number,
  limit?: number,
  offset?: number,
): Promise<News[]> {
  return invoke<News[]>('search_news', { query, feedId, limit, offset });
}

export async function getNewsCount(filter: NewsFilter): Promise<number> {
  return invoke<number>('get_news_count', { filter });
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/api/commands.ts
git commit -m "feat: add searchNews and getNewsCount API wrappers"
```

---

### Task 3: Add Search Bar to AppToolbar

**Files:**
- Modify: `src/components/common/AppToolbar.tsx`
- Modify: `src/stores/newsStore.ts`

**Step 1: Add search state to newsStore**

In `src/stores/newsStore.ts`, add to the interface:

```typescript
  searchQuery: string;
  searchNews: (query: string, feedId?: number) => Promise<void>;
  clearSearch: () => void;
```

Add to the store:

```typescript
  searchQuery: '',

  searchNews: async (query, feedId) => {
    set({ loading: true, error: null, searchQuery: query });
    try {
      const news = await api.searchNews(query, feedId, 100);
      set({ news, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  clearSearch: () => {
    set({ searchQuery: '' });
  },
```

Add to the imports at the top of the file:

```typescript
import * as api from '../api/commands';
```

Make sure `searchNews` is imported from api. In `src/api/commands.ts`, the function is already named `searchNews`, so in the store it should use:

```typescript
const news = await api.searchNews(query, feedId, 100);
```

**Step 2: Add SearchBox to AppToolbar**

In `src/components/common/AppToolbar.tsx`, add import:

```typescript
import { SearchBox } from '@fluentui/react-components';
```

Inside the component, add:

```typescript
  const { searchNews: doSearch, clearSearch, searchQuery } = useNewsStore();
  const [searchValue, setSearchValue] = React.useState('');
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
```

Add the import for React if not already there:

```typescript
import * as React from 'react';
```

Add a debounced search handler:

```typescript
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        doSearch(value.trim(), selectedFeedId ?? undefined);
      }, 300);
    } else {
      clearSearch();
      // Reload current feed's articles
      if (selectedFeedId) {
        loadNews({ feedId: selectedFeedId, limit: 100 });
      }
    }
  };
```

Add `SearchBox` in the toolbar JSX (before the layout toggle):

```tsx
        <SearchBox
          size="small"
          placeholder="Search articles..."
          value={searchValue}
          onChange={(_, data) => handleSearchChange(data.value)}
          dismiss={searchValue ? {
            onClick: () => {
              setSearchValue('');
              clearSearch();
              if (selectedFeedId) {
                loadNews({ feedId: selectedFeedId, limit: 100 });
              }
            }
          } : undefined}
          style={{ width: '200px' }}
        />

        <ToolbarDivider />
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/stores/newsStore.ts src/components/common/AppToolbar.tsx
git commit -m "feat: add article search with debounced SearchBox in toolbar"
```

---

### Task 4: Add Pagination (Load More)

**Files:**
- Modify: `src/stores/newsStore.ts`
- Modify: `src/components/news/NewsList.tsx`

**Step 1: Add pagination state to newsStore**

In `src/stores/newsStore.ts`, add to the interface:

```typescript
  totalCount: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
```

Update `loadNews` to track pagination:

```typescript
  loadNews: async (filter: NewsFilter) => {
    set({ loading: true, error: null, filter: { ...filter, offset: 0 } });
    try {
      const [news, totalCount] = await Promise.all([
        api.getNews({ ...filter, limit: filter.limit || 50, offset: 0 }),
        api.getNewsCount(filter),
      ]);
      set({
        news,
        loading: false,
        totalCount,
        hasMore: news.length < totalCount,
      });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },
```

Add `loadMore`:

```typescript
  totalCount: 0,
  hasMore: false,

  loadMore: async () => {
    const state = get();
    if (state.loading || !state.hasMore) return;

    set({ loading: true });
    try {
      const offset = state.news.length;
      const moreNews = await api.getNews({
        ...state.filter,
        limit: state.filter.limit || 50,
        offset,
      });
      set(s => ({
        news: [...s.news, ...moreNews],
        loading: false,
        hasMore: s.news.length + moreNews.length < s.totalCount,
      }));
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },
```

Update default filter limit from 100 to 50:

```typescript
  filter: {
    feedId: undefined,
    unreadOnly: false,
    starredOnly: false,
    deletedOnly: false,
    limit: 50,
    offset: 0,
  },
```

Also update `clearNews` to reset pagination:

```typescript
  clearNews: () => {
    set({ news: [], selectedNewsId: null, totalCount: 0, hasMore: false });
  },
```

**Step 2: Add "Load more" button to NewsList**

In `src/components/news/NewsList.tsx`, add:

```typescript
  const { hasMore, loadMore, totalCount } = useNewsStore();
```

After the `</Table>` closing tag (inside the `list` div), add:

```tsx
        {hasMore && (
          <div style={{ padding: '12px', textAlign: 'center' }}>
            <Button
              appearance="subtle"
              onClick={loadMore}
              disabled={loading}
            >
              Load more ({news.length} of {totalCount})
            </Button>
          </div>
        )}
```

Update the header to show total count:

```tsx
        <span className={styles.title}>
          {totalCount > 0 ? `${news.length} of ${totalCount} articles` : `${news.length} articles`}
        </span>
```

**Step 3: Update all `loadNews` calls across codebase**

Search for `loadNews({ feedId` and `loadNews({` to make sure limit is consistent. Update any hardcoded `limit: 100` to `limit: 50` (or remove it to use the store default).

In `src/App.tsx`, update any `loadNews` calls to not pass limit (it will use the store default of 50).

In `src/hooks/useTrayEvents.ts` and `src/components/common/AppToolbar.tsx`, update accordingly.

**Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/stores/newsStore.ts src/components/news/NewsList.tsx src/App.tsx src/components/common/AppToolbar.tsx
git commit -m "feat: add pagination with load-more button and article count"
```

---

### Task 5: Add Proxy Support to Backend

**Files:**
- Modify: `src-tauri/src/feed/fetcher.rs`
- Modify: `src-tauri/src/commands/feeds.rs`
- Modify: `src-tauri/src/commands/settings.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Add proxy configuration to FeedFetcher**

In `src-tauri/src/feed/fetcher.rs`, modify `FeedFetcher::new()` to accept optional proxy:

```rust
impl FeedFetcher {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(30))
                .user_agent("QuitelyRSS/0.1.0")
                .build()
                .expect("Failed to build HTTP client"),
        }
    }

    pub fn with_proxy(proxy_url: &str) -> Result<Self, String> {
        let proxy = reqwest::Proxy::all(proxy_url).map_err(|e| e.to_string())?;
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .user_agent("QuitelyRSS/0.1.0")
            .proxy(proxy)
            .build()
            .map_err(|e| e.to_string())?;
        Ok(Self { client })
    }
}
```

**Step 2: Add test_proxy command**

In `src-tauri/src/commands/settings.rs`, add:

```rust
#[tauri::command]
pub async fn test_proxy(proxy_url: String) -> Result<String, String> {
    let proxy = reqwest::Proxy::all(&proxy_url).map_err(|e| e.to_string())?;
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .proxy(proxy)
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get("https://httpbin.org/ip")
        .send()
        .await
        .map_err(|e| format!("Connection failed: {}", e))?;

    let status = response.status();
    if status.is_success() {
        Ok(format!("Proxy working (status: {})", status))
    } else {
        Err(format!("Proxy returned status: {}", status))
    }
}
```

**Step 3: Register in lib.rs**

Add `commands::test_proxy` to `generate_handler![]`.

**Step 4: Add proxy settings to settingsStore**

In `src/stores/settingsStore.ts`, add to `AppSettings`:

```typescript
  // Network
  proxyUrl: string;
```

Add to defaults:

```typescript
  proxyUrl: '',
```

Add to `settingKeyMap`:

```typescript
  proxyUrl: 'network.proxy_url',
```

**Step 5: Add proxy URL field to Settings Network tab**

In `src/components/settings/SettingsDialog.tsx`, in the network tab, add:

```tsx
                      <div className={styles.settingRow}>
                        <div className={styles.settingLabel}>
                          <span>Proxy URL</span>
                          <span className={styles.settingDescription}>HTTP/HTTPS/SOCKS5 proxy (e.g., socks5://127.0.0.1:1080)</span>
                        </div>
                        <Input
                          size="small"
                          value={settings.proxyUrl}
                          placeholder="Leave empty for direct connection"
                          onChange={(_, data) => updateSetting('proxyUrl', data.value)}
                          style={{ width: '250px' }}
                        />
                      </div>
```

**Step 6: Add testProxy to api/commands.ts**

```typescript
export async function testProxy(proxyUrl: string): Promise<string> {
  return invoke<string>('test_proxy', { proxyUrl });
}
```

**Step 7: Verify**

Run: `cd src-tauri && cargo check`
Run: `npx tsc --noEmit`
Expected: Both clean

**Step 8: Commit**

```bash
git add src-tauri/src/feed/fetcher.rs src-tauri/src/commands/settings.rs src-tauri/src/lib.rs src/stores/settingsStore.ts src/components/settings/SettingsDialog.tsx src/api/commands.ts
git commit -m "feat: add proxy support with test command and settings UI"
```

---

### Task 6: Add Fonts & Colors Settings

**Files:**
- Modify: `src/stores/settingsStore.ts`
- Modify: `src/components/settings/SettingsDialog.tsx`
- Modify: `src/components/content/ContentViewer.tsx`

**Step 1: Add font settings to settingsStore**

In `src/stores/settingsStore.ts`, add to `AppSettings`:

```typescript
  // Appearance
  fontFamily: string;
  fontSize: number;
  contentFontSize: number;
```

Add to defaults:

```typescript
  fontFamily: 'system-ui',
  fontSize: 14,
  contentFontSize: 16,
```

Add to `settingKeyMap`:

```typescript
  fontFamily: 'appearance.font_family',
  fontSize: 'appearance.font_size',
  contentFontSize: 'appearance.content_font_size',
```

**Step 2: Add Appearance tab to Settings**

In `src/components/settings/SettingsDialog.tsx`, add a new tab:

```tsx
                  <Tab value="appearance" id="appearance">
                    Appearance
                  </Tab>
```

Add appearance tab content:

```tsx
                  {selectedTab === 'appearance' && (
                    <div className={styles.section}>
                      <div className={styles.sectionTitle}>Font Settings</div>
                      <div className={styles.settingRow}>
                        <div className={styles.settingLabel}>
                          <span>Font family</span>
                          <span className={styles.settingDescription}>Font used throughout the app</span>
                        </div>
                        <Dropdown
                          size="small"
                          value={settings.fontFamily}
                          onOptionSelect={(_, data) => updateSetting('fontFamily', data.optionValue || 'system-ui')}
                        >
                          <Option value="system-ui">System Default</Option>
                          <Option value="'Segoe UI', sans-serif">Segoe UI</Option>
                          <Option value="'SF Pro', sans-serif">SF Pro</Option>
                          <Option value="'Noto Sans SC', sans-serif">Noto Sans SC</Option>
                          <Option value="monospace">Monospace</Option>
                        </Dropdown>
                      </div>
                      <div className={styles.settingRow}>
                        <div className={styles.settingLabel}>
                          <span>UI font size</span>
                          <span className={styles.settingDescription}>Font size for UI elements</span>
                        </div>
                        <SpinButton
                          value={settings.fontSize}
                          min={10}
                          max={24}
                          step={1}
                          onChange={(_, data) => updateSetting('fontSize', parseInt(String(data.value), 10) || 14)}
                        />
                      </div>
                      <div className={styles.settingRow}>
                        <div className={styles.settingLabel}>
                          <span>Content font size</span>
                          <span className={styles.settingDescription}>Font size for article content</span>
                        </div>
                        <SpinButton
                          value={settings.contentFontSize}
                          min={12}
                          max={32}
                          step={1}
                          onChange={(_, data) => updateSetting('contentFontSize', parseInt(String(data.value), 10) || 16)}
                        />
                      </div>
                    </div>
                  )}
```

Add `Dropdown` and `Option` to the Fluent UI imports if not already imported.

**Step 3: Apply font settings to ContentViewer**

In `src/components/content/ContentViewer.tsx`, add:

```typescript
import { useSettingsStore } from '../../stores';
```

Inside the component:

```typescript
  const { settings } = useSettingsStore();
```

Apply the settings to the content div:

```tsx
      <div className={styles.content} style={{ fontFamily: settings.fontFamily, fontSize: `${settings.contentFontSize}px` }}>
```

**Step 4: Apply global font via Layout**

In `src/components/common/Layout.tsx`, apply font settings:

```typescript
  const { settings } = useSettingsStore();
```

Add to the root div:

```tsx
      <div className={styles.root} style={{ fontFamily: settings.fontFamily, fontSize: `${settings.fontSize}px` }}>
```

**Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/stores/settingsStore.ts src/components/settings/SettingsDialog.tsx src/components/content/ContentViewer.tsx src/components/common/Layout.tsx
git commit -m "feat: add font family and size settings with live preview"
```

---

### Task 7: Add i18n Support

**Files:**
- Create: `src/locales/en.json`
- Create: `src/locales/zh.json`
- Create: `src/i18n.ts`
- Modify: `src/main.tsx`
- Modify: `src/stores/settingsStore.ts`
- Modify: `src/components/settings/SettingsDialog.tsx`

**Step 1: Install i18next**

Run: `npm install i18next react-i18next`

**Step 2: Create English translation file**

Create `src/locales/en.json`:

```json
{
  "sidebar": {
    "categories": "Categories",
    "unread": "Unread",
    "starred": "Starred",
    "deleted": "Deleted",
    "labels": "Labels",
    "noLabels": "No labels yet"
  },
  "toolbar": {
    "import": "Import",
    "export": "Export",
    "refresh": "Refresh",
    "settings": "Settings",
    "folder": "Folder",
    "search": "Search articles...",
    "list": "List",
    "newspaper": "News"
  },
  "feedTree": {
    "empty": "No feeds yet. Click \"Add Feed\" to get started.",
    "rename": "Rename",
    "delete": "Delete"
  },
  "newsList": {
    "articles": "articles",
    "of": "of",
    "loadMore": "Load more",
    "noArticles": "No articles yet",
    "selectFeed": "Select a feed to view articles",
    "loading": "Loading..."
  },
  "contentViewer": {
    "selectArticle": "Select an article to read",
    "star": "Star",
    "starred": "Starred",
    "delete": "Delete",
    "open": "Open",
    "labels": "Labels",
    "noContent": "No content available"
  },
  "addFeed": {
    "title": "Add Feed",
    "urlPlaceholder": "Enter feed URL",
    "preview": "Preview",
    "add": "Add",
    "cancel": "Cancel"
  },
  "settings": {
    "title": "Settings",
    "close": "Close",
    "general": "General",
    "tray": "System Tray",
    "network": "Network",
    "feed": "Feed",
    "browser": "Browser",
    "notifications": "Notifications",
    "labels": "Labels",
    "filters": "Filters",
    "appearance": "Appearance",
    "language": "Language"
  }
}
```

**Step 3: Create Chinese translation file**

Create `src/locales/zh.json`:

```json
{
  "sidebar": {
    "categories": "分类",
    "unread": "未读",
    "starred": "收藏",
    "deleted": "已删除",
    "labels": "标签",
    "noLabels": "暂无标签"
  },
  "toolbar": {
    "import": "导入",
    "export": "导出",
    "refresh": "刷新",
    "settings": "设置",
    "folder": "文件夹",
    "search": "搜索文章...",
    "list": "列表",
    "newspaper": "报纸"
  },
  "feedTree": {
    "empty": "暂无订阅源，点击「添加订阅」开始。",
    "rename": "重命名",
    "delete": "删除"
  },
  "newsList": {
    "articles": "篇文章",
    "of": "/",
    "loadMore": "加载更多",
    "noArticles": "暂无文章",
    "selectFeed": "选择一个订阅源来查看文章",
    "loading": "加载中..."
  },
  "contentViewer": {
    "selectArticle": "选择一篇文章阅读",
    "star": "收藏",
    "starred": "已收藏",
    "delete": "删除",
    "open": "打开",
    "labels": "标签",
    "noContent": "暂无内容"
  },
  "addFeed": {
    "title": "添加订阅",
    "urlPlaceholder": "输入订阅源URL",
    "preview": "预览",
    "add": "添加",
    "cancel": "取消"
  },
  "settings": {
    "title": "设置",
    "close": "关闭",
    "general": "通用",
    "tray": "系统托盘",
    "network": "网络",
    "feed": "订阅",
    "browser": "浏览器",
    "notifications": "通知",
    "labels": "标签",
    "filters": "过滤器",
    "appearance": "外观",
    "language": "语言"
  }
}
```

**Step 4: Create i18n configuration**

Create `src/i18n.ts`:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

**Step 5: Initialize i18n in main.tsx**

In `src/main.tsx`, add before the render:

```typescript
import './i18n';
```

**Step 6: Add language setting to settingsStore**

In `src/stores/settingsStore.ts`, add to `AppSettings`:

```typescript
  language: string;
```

Add to defaults:

```typescript
  language: 'en',
```

Add to `settingKeyMap`:

```typescript
  language: 'general.language',
```

**Step 7: Add Language selector to Settings General tab**

In `src/components/settings/SettingsDialog.tsx`, add import:

```typescript
import { useTranslation } from 'react-i18next';
```

Inside the component:

```typescript
  const { i18n } = useTranslation();
```

In the General tab, add:

```tsx
                      <div className={styles.settingRow}>
                        <div className={styles.settingLabel}>
                          <span>Language</span>
                          <span className={styles.settingDescription}>Application language</span>
                        </div>
                        <Dropdown
                          size="small"
                          value={settings.language === 'zh' ? '中文' : 'English'}
                          onOptionSelect={(_, data) => {
                            const lang = data.optionValue || 'en';
                            updateSetting('language', lang);
                            i18n.changeLanguage(lang);
                          }}
                        >
                          <Option value="en">English</Option>
                          <Option value="zh">中文</Option>
                        </Dropdown>
                      </div>
```

**Step 8: Apply saved language on startup**

In `src/App.tsx`, add:

```typescript
import { useTranslation } from 'react-i18next';
```

Inside the component:

```typescript
  const { i18n } = useTranslation();
```

Add a useEffect to set language from settings:

```typescript
  useEffect(() => {
    if (settings.language && settings.language !== i18n.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language, i18n]);
```

**Step 9: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 10: Commit**

```bash
git add src/locales/en.json src/locales/zh.json src/i18n.ts src/main.tsx src/stores/settingsStore.ts src/components/settings/SettingsDialog.tsx src/App.tsx package.json package-lock.json
git commit -m "feat: add i18n support with English and Chinese translations"
```

---

### Task 8: Apply Translations to UI Components

**Files:**
- Modify: `src/components/common/Sidebar.tsx`
- Modify: `src/components/common/AppToolbar.tsx`
- Modify: `src/components/feeds/FeedTree.tsx`
- Modify: `src/components/news/NewsList.tsx`
- Modify: `src/components/content/ContentViewer.tsx`

**Step 1: Apply translations**

In each component, add `import { useTranslation } from 'react-i18next';` and inside the component call `const { t } = useTranslation();`.

Replace hardcoded strings with `t()` calls. For example:

**Sidebar.tsx:**
- `"Categories"` → `{t('sidebar.categories')}`
- `"Unread"` → `{t('sidebar.unread')}`
- `"Starred"` → `{t('sidebar.starred')}`
- `"Deleted"` → `{t('sidebar.deleted')}`
- `"Labels"` → `{t('sidebar.labels')}`
- `"No labels yet"` → `{t('sidebar.noLabels')}`

**AppToolbar.tsx:**
- `"Import"` → `{t('toolbar.import')}`
- `"Export"` → `{t('toolbar.export')}`
- `"Refresh"` → `{t('toolbar.refresh')}`
- `"Search articles..."` → `t('toolbar.search')` (as placeholder attribute)
- `"Folder"` → `{t('toolbar.folder')}`

**FeedTree.tsx:**
- `"No feeds yet..."` → `{t('feedTree.empty')}`
- `"Rename"` → `{t('feedTree.rename')}`
- `"Delete"` → `{t('feedTree.delete')}`

**NewsList.tsx:**
- `"articles"` → `{t('newsList.articles')}`
- `"No articles yet"` → `{t('newsList.noArticles')}`
- `"Select a feed to view articles"` → `{t('newsList.selectFeed')}`
- `"Loading..."` → `{t('newsList.loading')}`
- `"Load more"` → `{t('newsList.loadMore')}`

**ContentViewer.tsx:**
- `"Select an article to read"` → `{t('contentViewer.selectArticle')}`
- `"Star"` / `"Starred"` → `{t('contentViewer.star')}` / `{t('contentViewer.starred')}`
- `"Delete"` → `{t('contentViewer.delete')}`
- `"Open"` → `{t('contentViewer.open')}`

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/common/Sidebar.tsx src/components/common/AppToolbar.tsx src/components/feeds/FeedTree.tsx src/components/news/NewsList.tsx src/components/content/ContentViewer.tsx
git commit -m "feat: apply i18n translations to all UI components"
```

---

### Task 9: Final Verification

**Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Rust check**

Run: `cd src-tauri && cargo check`
Expected: Compiles cleanly

**Step 3: Run the app**

Run: `npm run tauri dev`
Expected: App launches successfully

**Step 4: Manual verification checklist**

- [ ] Search box appears in toolbar
- [ ] Typing in search box filters articles after 300ms debounce
- [ ] Clear button resets search
- [ ] "Load more" button shows when there are more articles
- [ ] Clicking "Load more" appends articles
- [ ] Article count shows "X of Y articles"
- [ ] Proxy URL field in Settings > Network
- [ ] Settings > Appearance tab with font family, UI font size, content font size
- [ ] Font changes apply in real-time
- [ ] Settings > General has language selector
- [ ] Switching to 中文 translates all UI strings
- [ ] Switching back to English works
- [ ] Language preference persists across app restarts

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: complete Phase 8 - Search, Pagination & Settings"
```
