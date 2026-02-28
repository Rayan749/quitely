# Complete i18n Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure all visible text in Quitely respects the selected language (English and Simplified Chinese).

**Architecture:** Add missing translation keys to both locale files, then update each component to use `t()` from react-i18next. Fix date formatting to use the active locale. Fix i18n initialization to read persisted language. Delete the unused SettingsDialog component.

**Tech Stack:** i18next, react-i18next, TypeScript, Tauri invoke API

---

### Task 1: Update locale files with all missing keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/zh.json`

**Step 1: Replace en.json with complete translations**

```json
{
  "sidebar": {
    "categories": "Categories",
    "unread": "Unread",
    "starred": "Starred",
    "deleted": "Deleted",
    "labels": "Labels",
    "noLabels": "No labels yet",
    "feeds": "Feeds",
    "noFeeds": "No feeds yet",
    "settings": "Settings"
  },
  "toolbar": {
    "import": "Import",
    "export": "Export",
    "refresh": "Refresh",
    "settings": "Settings",
    "folder": "Folder",
    "search": "Search articles...",
    "list": "List",
    "newspaper": "News",
    "newFolder": "New folder",
    "importOpml": "Import OPML",
    "exportOpml": "Export OPML",
    "refreshAll": "Refresh all feeds",
    "newspaperMode": "Newspaper mode",
    "listMode": "List mode",
    "light": "Light",
    "dark": "Dark",
    "system": "System",
    "newArticlesFound": "{{count}} new article found",
    "newArticlesFound_other": "{{count}} new articles found"
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
    "loading": "Loading...",
    "news": "News",
    "title": "Title",
    "author": "Author",
    "date": "Date",
    "actions": "Actions",
    "untitled": "Untitled",
    "unstar": "Unstar",
    "star": "Star",
    "deleteTip": "Delete"
  },
  "contentViewer": {
    "selectArticle": "Select an article to read",
    "star": "Star",
    "starred": "Starred",
    "delete": "Delete",
    "open": "Open",
    "labels": "Labels",
    "noContent": "No content available",
    "untitled": "Untitled",
    "unstar": "Unstar",
    "openInBrowser": "Open in browser",
    "by": "By:",
    "source": "Source"
  },
  "addFeed": {
    "title": "Add Feed",
    "urlPlaceholder": "Enter feed URL",
    "urlLabel": "Feed URL",
    "preview": "Preview",
    "add": "Add",
    "cancel": "Cancel"
  },
  "labelDialog": {
    "addLabel": "Add Label",
    "addLabelTip": "Add label",
    "name": "Name",
    "labelName": "Label name",
    "color": "Color",
    "cancel": "Cancel",
    "add": "Add"
  },
  "newspaperView": {
    "noArticles": "No articles to display",
    "untitled": "Untitled"
  },
  "settings": {
    "title": "Settings",
    "close": "Close",
    "back": "Back",
    "general": "General",
    "tray": "System Tray",
    "network": "Network",
    "feed": "Feed",
    "browser": "Browser",
    "notifications": "Notifications",
    "labels": "Labels",
    "filters": "Filters",
    "appearance": "Appearance",
    "language": "Language",
    "loading": "Loading...",
    "generalSettings": "General Settings",
    "showSplash": "Show splash screen",
    "showSplashDesc": "Display splash screen on startup",
    "reopenFeeds": "Reopen feeds on startup",
    "reopenFeedsDesc": "Restore previously open feeds",
    "openTabsNext": "Open tabs next to current",
    "openTabsNextDesc": "New tabs open next to the current tab",
    "languageLabel": "Language",
    "languageDesc": "Application language",
    "showTrayIcon": "Show tray icon",
    "showTrayIconDesc": "Display icon in system tray",
    "minimizeToTray": "Minimize to tray",
    "minimizeToTrayDesc": "Minimize window to tray instead of taskbar",
    "closeToTray": "Close to tray",
    "closeToTrayDesc": "Close window to tray instead of quitting",
    "networkSettings": "Network Settings",
    "requestTimeout": "Request timeout (seconds)",
    "requestTimeoutDesc": "Timeout for feed requests",
    "concurrentRequests": "Concurrent requests",
    "concurrentRequestsDesc": "Maximum concurrent feed updates",
    "proxyUrl": "Proxy URL",
    "proxyUrlDesc": "HTTP/HTTPS/SOCKS5 proxy",
    "proxyPlaceholder": "Leave empty for direct connection",
    "feedSettings": "Feed Settings",
    "updateOnStartup": "Update on startup",
    "updateOnStartupDesc": "Automatically update feeds on startup",
    "autoUpdateInterval": "Auto update interval (minutes)",
    "autoUpdateIntervalDesc": "Interval for automatic feed updates",
    "markReadOnSelect": "Mark read on select",
    "markReadOnSelectDesc": "Automatically mark articles as read when selected",
    "cleanupDays": "Cleanup deleted articles (days)",
    "cleanupDaysDesc": "Permanently delete articles older than this many days",
    "browserSettings": "Browser Settings",
    "useEmbeddedBrowser": "Use embedded browser",
    "useEmbeddedBrowserDesc": "Open links in embedded browser instead of external",
    "autoLoadImages": "Auto load images",
    "autoLoadImagesDesc": "Automatically load images in articles",
    "enableJavaScript": "Enable JavaScript",
    "enableJavaScriptDesc": "Enable JavaScript in embedded browser",
    "notificationSettings": "Notification Settings",
    "enableNotifications": "Enable notifications",
    "enableNotificationsDesc": "Show desktop notifications for new articles",
    "playSound": "Play sound",
    "playSoundDesc": "Play sound when new articles arrive",
    "manageLabels": "Manage Labels",
    "noLabelsCreated": "No labels created yet",
    "createFilter": "Create Filter",
    "filterName": "Filter name",
    "when": "When",
    "filterTitle": "Title",
    "filterAuthor": "Author",
    "filterCategory": "Category",
    "filterContent": "Content",
    "contains": "contains",
    "notContains": "does not contain",
    "equals": "equals",
    "startsWith": "starts with",
    "matchesRegex": "matches regex",
    "filterValue": "Value",
    "then": "Then",
    "markAsRead": "Mark as read",
    "starAction": "Star",
    "deleteAction": "Delete",
    "addFilter": "Add",
    "activeFilters": "Active Filters",
    "noFiltersCreated": "No filters created yet",
    "appearanceTitle": "Appearance",
    "theme": "Theme",
    "themeDesc": "Application theme",
    "themeSystem": "System",
    "themeLight": "Light",
    "themeDark": "Dark",
    "fontSettings": "Font Settings",
    "fontFamily": "Font family",
    "fontFamilyDesc": "Font used throughout the app",
    "fontSystemDefault": "System Default",
    "uiFontSize": "UI font size",
    "uiFontSizeDesc": "Font size for UI elements",
    "contentFontSize": "Content font size",
    "contentFontSizeDesc": "Font size for article content"
  }
}
```

**Step 2: Replace zh.json with complete translations**

```json
{
  "sidebar": {
    "categories": "分类",
    "unread": "未读",
    "starred": "收藏",
    "deleted": "已删除",
    "labels": "标签",
    "noLabels": "暂无标签",
    "feeds": "订阅源",
    "noFeeds": "暂无订阅源",
    "settings": "设置"
  },
  "toolbar": {
    "import": "导入",
    "export": "导出",
    "refresh": "刷新",
    "settings": "设置",
    "folder": "文件夹",
    "search": "搜索文章...",
    "list": "列表",
    "newspaper": "报纸",
    "newFolder": "新建文件夹",
    "importOpml": "导入 OPML",
    "exportOpml": "导出 OPML",
    "refreshAll": "刷新所有订阅",
    "newspaperMode": "报纸模式",
    "listMode": "列表模式",
    "light": "浅色",
    "dark": "深色",
    "system": "跟随系统",
    "newArticlesFound": "发现 {{count}} 篇新文章",
    "newArticlesFound_other": "发现 {{count}} 篇新文章"
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
    "loading": "加载中...",
    "news": "新闻",
    "title": "标题",
    "author": "作者",
    "date": "日期",
    "actions": "操作",
    "untitled": "无标题",
    "unstar": "取消收藏",
    "star": "收藏",
    "deleteTip": "删除"
  },
  "contentViewer": {
    "selectArticle": "选择一篇文章阅读",
    "star": "收藏",
    "starred": "已收藏",
    "delete": "删除",
    "open": "打开",
    "labels": "标签",
    "noContent": "暂无内容",
    "untitled": "无标题",
    "unstar": "取消收藏",
    "openInBrowser": "在浏览器中打开",
    "by": "作者：",
    "source": "来源"
  },
  "addFeed": {
    "title": "添加订阅",
    "urlPlaceholder": "输入订阅源URL",
    "urlLabel": "订阅源 URL",
    "preview": "预览",
    "add": "添加",
    "cancel": "取消"
  },
  "labelDialog": {
    "addLabel": "添加标签",
    "addLabelTip": "添加标签",
    "name": "名称",
    "labelName": "标签名称",
    "color": "颜色",
    "cancel": "取消",
    "add": "添加"
  },
  "newspaperView": {
    "noArticles": "暂无文章可显示",
    "untitled": "无标题"
  },
  "settings": {
    "title": "设置",
    "close": "关闭",
    "back": "返回",
    "general": "通用",
    "tray": "系统托盘",
    "network": "网络",
    "feed": "订阅",
    "browser": "浏览器",
    "notifications": "通知",
    "labels": "标签",
    "filters": "过滤器",
    "appearance": "外观",
    "language": "语言",
    "loading": "加载中...",
    "generalSettings": "通用设置",
    "showSplash": "显示启动画面",
    "showSplashDesc": "启动时显示启动画面",
    "reopenFeeds": "启动时重新打开订阅",
    "reopenFeedsDesc": "恢复之前打开的订阅",
    "openTabsNext": "在当前标签旁打开新标签",
    "openTabsNextDesc": "新标签在当前标签旁打开",
    "languageLabel": "语言",
    "languageDesc": "应用程序语言",
    "showTrayIcon": "显示托盘图标",
    "showTrayIconDesc": "在系统托盘中显示图标",
    "minimizeToTray": "最小化到托盘",
    "minimizeToTrayDesc": "最小化窗口到托盘而不是任务栏",
    "closeToTray": "关闭到托盘",
    "closeToTrayDesc": "关闭窗口到托盘而不是退出",
    "networkSettings": "网络设置",
    "requestTimeout": "请求超时（秒）",
    "requestTimeoutDesc": "订阅请求的超时时间",
    "concurrentRequests": "并发请求数",
    "concurrentRequestsDesc": "最大并发订阅更新数",
    "proxyUrl": "代理 URL",
    "proxyUrlDesc": "HTTP/HTTPS/SOCKS5 代理",
    "proxyPlaceholder": "留空表示直接连接",
    "feedSettings": "订阅设置",
    "updateOnStartup": "启动时更新",
    "updateOnStartupDesc": "启动时自动更新订阅",
    "autoUpdateInterval": "自动更新间隔（分钟）",
    "autoUpdateIntervalDesc": "自动更新订阅的间隔时间",
    "markReadOnSelect": "选中即标记已读",
    "markReadOnSelectDesc": "选中文章时自动标记为已读",
    "cleanupDays": "清理已删除文章（天）",
    "cleanupDaysDesc": "永久删除超过此天数的文章",
    "browserSettings": "浏览器设置",
    "useEmbeddedBrowser": "使用内置浏览器",
    "useEmbeddedBrowserDesc": "在内置浏览器中打开链接而不是外部浏览器",
    "autoLoadImages": "自动加载图片",
    "autoLoadImagesDesc": "自动加载文章中的图片",
    "enableJavaScript": "启用 JavaScript",
    "enableJavaScriptDesc": "在内置浏览器中启用 JavaScript",
    "notificationSettings": "通知设置",
    "enableNotifications": "启用通知",
    "enableNotificationsDesc": "有新文章时显示桌面通知",
    "playSound": "播放声音",
    "playSoundDesc": "有新文章到达时播放声音",
    "manageLabels": "管理标签",
    "noLabelsCreated": "暂无标签",
    "createFilter": "创建过滤器",
    "filterName": "过滤器名称",
    "when": "当",
    "filterTitle": "标题",
    "filterAuthor": "作者",
    "filterCategory": "分类",
    "filterContent": "内容",
    "contains": "包含",
    "notContains": "不包含",
    "equals": "等于",
    "startsWith": "开头是",
    "matchesRegex": "匹配正则",
    "filterValue": "值",
    "then": "则",
    "markAsRead": "标记为已读",
    "starAction": "收藏",
    "deleteAction": "删除",
    "addFilter": "添加",
    "activeFilters": "已激活的过滤器",
    "noFiltersCreated": "暂无过滤器",
    "appearanceTitle": "外观",
    "theme": "主题",
    "themeDesc": "应用程序主题",
    "themeSystem": "跟随系统",
    "themeLight": "浅色",
    "themeDark": "深色",
    "fontSettings": "字体设置",
    "fontFamily": "字体",
    "fontFamilyDesc": "应用程序使用的字体",
    "fontSystemDefault": "系统默认",
    "uiFontSize": "界面字号",
    "uiFontSizeDesc": "界面元素的字体大小",
    "contentFontSize": "内容字号",
    "contentFontSizeDesc": "文章内容的字体大小"
  }
}
```

**Step 3: Verify the JSON files are valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/locales/en.json','utf8')); JSON.parse(require('fs').readFileSync('src/locales/zh.json','utf8')); console.log('OK')"`
Expected: `OK`

**Step 4: Commit**

```bash
git add src/locales/en.json src/locales/zh.json
git commit -m "feat(i18n): add complete translation keys for en and zh"
```

---

### Task 2: Create date locale utility

**Files:**
- Create: `src/utils/i18nDate.ts`

**Step 1: Create the utility file**

```typescript
import i18n from '../i18n';

export function getDateLocale(): string {
  return i18n.language === 'zh' ? 'zh-CN' : 'en-US';
}
```

**Step 2: Commit**

```bash
git add src/utils/i18nDate.ts
git commit -m "feat(i18n): add date locale utility function"
```

---

### Task 3: Fix i18n initialization to read persisted language

**Files:**
- Modify: `src/i18n.ts`

**Step 1: Update i18n.ts to read persisted language before init**

Replace the entire file content with:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import en from './locales/en.json';
import zh from './locales/zh.json';

async function getPersistedLanguage(): Promise<string> {
  try {
    const lang = await invoke<string | null>('get_setting', { key: 'general.language' });
    return lang || 'en';
  } catch {
    return 'en';
  }
}

const initPromise = getPersistedLanguage().then((lng) => {
  return i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        zh: { translation: zh },
      },
      lng,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
});

export { initPromise };
export default i18n;
```

**Step 2: Update main.tsx to await i18n init**

In `src/main.tsx`, wrap the render in the initPromise:

Find the current render call and change it. The current file likely does:
```typescript
import './i18n';
```
Change to:
```typescript
import { initPromise } from './i18n';
```

And wrap the `ReactDOM.createRoot(...).render(...)` call inside `initPromise.then(() => { ... })`.

**Step 3: Verify the app still starts**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/i18n.ts src/main.tsx
git commit -m "fix(i18n): read persisted language on init to prevent English flash"
```

---

### Task 4: Update Sidebar.tsx — fix missing locale keys

**Files:**
- Modify: `src/components/common/Sidebar.tsx`

**Step 1: Remove fallback Chinese strings from t() calls**

The Sidebar already uses `t()` but passes Chinese fallbacks like `t('sidebar.feeds', '订阅源')`. Since we added all the missing keys in Task 1, remove the fallback arguments.

Replace all `t('sidebar.xxx', '中文fallback')` with `t('sidebar.xxx')`.

Lines to change:
- Line 185: `t('sidebar.categories', '分类')` → `t('sidebar.categories')`
- Line 192: `t('sidebar.unread', '未读')` → `t('sidebar.unread')`
- Line 199: `t('sidebar.starred', '收藏')` → `t('sidebar.starred')`
- Line 204: `t('sidebar.deleted', '已删除')` → `t('sidebar.deleted')`
- Line 215: `t('sidebar.feeds', '订阅源')` → `t('sidebar.feeds')`
- Line 229: `t('sidebar.noFeeds', '暂无订阅源')` → `t('sidebar.noFeeds')`
- Line 239: `t('sidebar.labels', '标签')` → `t('sidebar.labels')`
- Line 257: `t('sidebar.noLabels', '暂无标签')` → `t('sidebar.noLabels')`
- Line 269: `t('sidebar.settings', '设置')` → `t('sidebar.settings')`

**Step 2: Commit**

```bash
git add src/components/common/Sidebar.tsx
git commit -m "fix(i18n): remove hardcoded Chinese fallbacks from Sidebar t() calls"
```

---

### Task 5: Update FeedTree.tsx — add i18n

**Files:**
- Modify: `src/components/feeds/FeedTree.tsx`

**Step 1: Add useTranslation import and usage**

Add at line 1 area:
```typescript
import { useTranslation } from 'react-i18next';
```

In the `FeedItem` component, add `t` as a prop (passed from `FeedTree`). Or simpler: add `useTranslation` inside `FeedTree` and pass `t` down, or call `useTranslation()` in `FeedItem` directly.

Simplest approach — use `useTranslation` in `FeedItem`:

In the `FeedItem` function body, add:
```typescript
const { t } = useTranslation();
```

Replace line 127 `Rename` with `{t('feedTree.rename')}`
Replace line 133 `Delete` with `{t('feedTree.delete')}`

In the `FeedTree` function body, add:
```typescript
const { t } = useTranslation();
```

Replace line 200 hardcoded text with `{t('feedTree.empty')}`

**Step 2: Commit**

```bash
git add src/components/feeds/FeedTree.tsx
git commit -m "feat(i18n): add translations to FeedTree component"
```

---

### Task 6: Update AddFeedDialog.tsx — add i18n

**Files:**
- Modify: `src/components/feeds/AddFeedDialog.tsx`

**Step 1: Add useTranslation**

Add import:
```typescript
import { useTranslation } from 'react-i18next';
```

In the function body, add:
```typescript
const { t } = useTranslation();
```

Replace hardcoded strings:
- Line 101 `Add Feed` (button text) → `{t('addFeed.title')}`
- Line 105 `Add Feed` (dialog title) → `{t('addFeed.title')}`
- Line 110 `Feed URL` (label) → `{t('addFeed.urlLabel')}`
- Line 121 `'Preview'` → `{t('addFeed.preview')}`
- Line 139 `Cancel` → `{t('addFeed.cancel')}`
- Line 147 `'Add'` → `{t('addFeed.add')}`

**Step 2: Commit**

```bash
git add src/components/feeds/AddFeedDialog.tsx
git commit -m "feat(i18n): add translations to AddFeedDialog component"
```

---

### Task 7: Update LabelDialog.tsx — add i18n

**Files:**
- Modify: `src/components/settings/LabelDialog.tsx`

**Step 1: Add useTranslation**

Add import:
```typescript
import { useTranslation } from 'react-i18next';
```

In the function body, add:
```typescript
const { t } = useTranslation();
```

Replace hardcoded strings:
- Line 85 `title="Add label"` → `title={t('labelDialog.addLabelTip')}`
- Line 91 `Add Label` (DialogTitle) → `{t('labelDialog.addLabel')}`
- Line 97 `Name` (label text) → `{t('labelDialog.name')}`
- Line 100 `placeholder="Label name"` → `placeholder={t('labelDialog.labelName')}`
- Line 107 `Color` (label text) → `{t('labelDialog.color')}`
- Line 119 `Cancel` → `{t('labelDialog.cancel')}`
- Line 120 `Add` → `{t('labelDialog.add')}`

**Step 2: Commit**

```bash
git add src/components/settings/LabelDialog.tsx
git commit -m "feat(i18n): add translations to LabelDialog component"
```

---

### Task 8: Update NewspaperView.tsx — add i18n and fix date locale

**Files:**
- Modify: `src/components/news/NewspaperView.tsx`

**Step 1: Add imports**

```typescript
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../utils/i18nDate';
```

In the function body, add:
```typescript
const { t } = useTranslation();
```

**Step 2: Fix date locale**

Replace `'zh-CN'` in `formatDate` with `getDateLocale()`:
```typescript
return new Date(dateStr).toLocaleDateString(getDateLocale(), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
```

**Step 3: Replace hardcoded strings**

- Line 65 `No articles to display` → `{t('newspaperView.noArticles')}`
- Line 72 `'Untitled'` → `t('newspaperView.untitled')`

**Step 4: Commit**

```bash
git add src/components/news/NewspaperView.tsx
git commit -m "feat(i18n): add translations and fix date locale in NewspaperView"
```

---

### Task 9: Update NewsList.tsx — complete i18n and fix date locale

**Files:**
- Modify: `src/components/news/NewsList.tsx`

**Step 1: Add date locale import**

```typescript
import { getDateLocale } from '../../utils/i18nDate';
```

**Step 2: Fix date locale**

Replace `'zh-CN'` in `formatDate` with `getDateLocale()`.

**Step 3: Replace hardcoded strings**

- Line 137 `News` → `{t('newsList.news')}`
- Line 160 `Title` → `{t('newsList.title')}`
- Line 161 `Author` → `{t('newsList.author')}`
- Line 162 `Date` → `{t('newsList.date')}`
- Line 163 `Actions` → `{t('newsList.actions')}`
- Line 185 `'Untitled'` → `t('newsList.untitled')`
- Line 219 `title={item.isStarred ? 'Unstar' : 'Star'}` → `title={item.isStarred ? t('newsList.unstar') : t('newsList.star')}`
- Line 226 `title="Delete"` → `title={t('newsList.deleteTip')}`

**Step 4: Commit**

```bash
git add src/components/news/NewsList.tsx
git commit -m "feat(i18n): complete translations and fix date locale in NewsList"
```

---

### Task 10: Update ContentViewer.tsx — complete i18n and fix date locale

**Files:**
- Modify: `src/components/content/ContentViewer.tsx`

**Step 1: Add date locale import**

```typescript
import { getDateLocale } from '../../utils/i18nDate';
```

**Step 2: Fix date locale**

Replace `'zh-CN'` in `formatDate` with `getDateLocale()`.

**Step 3: Replace hardcoded strings**

- Line 165 `'Untitled'` → `t('contentViewer.untitled')`
- Line 171 `title={selectedNews.isStarred ? 'Unstar' : 'Star'}` → `title={selectedNews.isStarred ? t('contentViewer.unstar') : t('contentViewer.star')}`
- Line 179 `title="Delete"` → `title={t('contentViewer.delete')}`
- Line 188 `title="Open in browser"` → `title={t('contentViewer.openInBrowser')}`
- Line 199 `title="Labels"` → `title={t('contentViewer.labels')}`
- Line 234 `By: {selectedNews.author}` → `{t('contentViewer.by')} {selectedNews.author}`
- Line 249 `Source` → `{t('contentViewer.source')}`
- Line 277 `'<p>No content available</p>'` → `` `<p>${t('contentViewer.noContent')}</p>` ``

**Step 4: Commit**

```bash
git add src/components/content/ContentViewer.tsx
git commit -m "feat(i18n): complete translations and fix date locale in ContentViewer"
```

---

### Task 11: Update AppToolbar.tsx — complete i18n

**Files:**
- Modify: `src/components/common/AppToolbar.tsx`

**Step 1: Replace hardcoded strings**

- Line 41 `themeLabel` — replace with `t()` calls:
  ```typescript
  const themeLabel = settings.theme === 'light' ? t('toolbar.light') : settings.theme === 'dark' ? t('toolbar.dark') : t('toolbar.system');
  ```
- Line 108 notification body — replace with `t()`:
  ```typescript
  body: t('toolbar.newArticlesFound', { count: totalNew }),
  ```
- Line 144 `title="New folder"` → `title={t('toolbar.newFolder')}`
- Line 155 `title="Import OPML"` → `title={t('toolbar.importOpml')}`
- Line 163 `title="Export OPML"` → `title={t('toolbar.exportOpml')}`
- Line 175 `title="Refresh all feeds"` → `title={t('toolbar.refreshAll')}`
- Line 205 `title={contentLayout === 'list' ? 'Newspaper mode' : 'List mode'}` → `title={contentLayout === 'list' ? t('toolbar.newspaperMode') : t('toolbar.listMode')}`
- Line 214 `title={...}` — replace with:
  ```typescript
  title={`${t('settings.theme')}: ${themeLabel}`}
  ```

**Step 2: Commit**

```bash
git add src/components/common/AppToolbar.tsx
git commit -m "feat(i18n): complete translations in AppToolbar"
```

---

### Task 12: Update SettingsPage.tsx — full i18n

**Files:**
- Modify: `src/components/settings/SettingsPage.tsx`

**Step 1: Add `t` to the destructured useTranslation**

Change line 100 from `const { i18n } = useTranslation();` to `const { t, i18n } = useTranslation();`

**Step 2: Replace all hardcoded strings with t() calls**

Replace `tabs` array:
```typescript
const tabs = [
  { id: 'general', label: t('settings.general') },
  { id: 'tray', label: t('settings.tray') },
  { id: 'network', label: t('settings.network') },
  { id: 'feed', label: t('settings.feed') },
  { id: 'browser', label: t('settings.browser') },
  { id: 'notifications', label: t('settings.notifications') },
  { id: 'labels', label: t('settings.labels') },
  { id: 'filters', label: t('settings.filters') },
  { id: 'appearance', label: t('settings.appearance') },
];
```

Replace header:
- `Back` → `{t('settings.back')}`
- `Settings` → `{t('settings.title')}`
- `Loading...` → `{t('settings.loading')}`

Replace all section titles and setting labels/descriptions with their corresponding `t('settings.xxx')` keys per the locale file above. This is a large number of replacements — each hardcoded string maps to a settings key as defined in the en.json above.

Key mappings for the general tab:
- `General Settings` → `t('settings.generalSettings')`
- `Show splash screen` → `t('settings.showSplash')`
- `Display splash screen on startup` → `t('settings.showSplashDesc')`
- `Reopen feeds on startup` → `t('settings.reopenFeeds')`
- `Restore previously open feeds` → `t('settings.reopenFeedsDesc')`
- `Open tabs next to current` → `t('settings.openTabsNext')`
- `New tabs open next to the current tab` → `t('settings.openTabsNextDesc')`
- `Language` → `t('settings.languageLabel')`
- `Application language` → `t('settings.languageDesc')`

Tray tab:
- `System Tray` (section title) → `t('settings.tray')`
- `Show tray icon` → `t('settings.showTrayIcon')`
- `Display icon in system tray` → `t('settings.showTrayIconDesc')`
- `Minimize to tray` → `t('settings.minimizeToTray')`
- `Minimize window to tray instead of taskbar` → `t('settings.minimizeToTrayDesc')`
- `Close to tray` → `t('settings.closeToTray')`
- `Close window to tray instead of quitting` → `t('settings.closeToTrayDesc')`

Network tab:
- `Network Settings` → `t('settings.networkSettings')`
- `Request timeout (seconds)` → `t('settings.requestTimeout')`
- `Timeout for feed requests` → `t('settings.requestTimeoutDesc')`
- `Concurrent requests` → `t('settings.concurrentRequests')`
- `Maximum concurrent feed updates` → `t('settings.concurrentRequestsDesc')`
- `Proxy URL` → `t('settings.proxyUrl')`
- `HTTP/HTTPS/SOCKS5 proxy` → `t('settings.proxyUrlDesc')`
- `Leave empty for direct connection` → `t('settings.proxyPlaceholder')`

Feed tab:
- `Feed Settings` → `t('settings.feedSettings')`
- `Update on startup` → `t('settings.updateOnStartup')`
- `Automatically update feeds on startup` → `t('settings.updateOnStartupDesc')`
- `Auto update interval (minutes)` → `t('settings.autoUpdateInterval')`
- `Interval for automatic feed updates` → `t('settings.autoUpdateIntervalDesc')`
- `Mark read on select` → `t('settings.markReadOnSelect')`
- `Automatically mark articles as read when selected` → `t('settings.markReadOnSelectDesc')`
- `Cleanup deleted articles (days)` → `t('settings.cleanupDays')`
- `Permanently delete articles older than this many days` → `t('settings.cleanupDaysDesc')`

Browser tab:
- `Browser Settings` → `t('settings.browserSettings')`
- `Use embedded browser` → `t('settings.useEmbeddedBrowser')`
- `Open links in embedded browser instead of external` → `t('settings.useEmbeddedBrowserDesc')`
- `Auto load images` → `t('settings.autoLoadImages')`
- `Automatically load images in articles` → `t('settings.autoLoadImagesDesc')`
- `Enable JavaScript` → `t('settings.enableJavaScript')`
- `Enable JavaScript in embedded browser` → `t('settings.enableJavaScriptDesc')`

Notifications tab:
- `Notification Settings` → `t('settings.notificationSettings')`
- `Enable notifications` → `t('settings.enableNotifications')`
- `Show desktop notifications for new articles` → `t('settings.enableNotificationsDesc')`
- `Play sound` → `t('settings.playSound')`
- `Play sound when new articles arrive` → `t('settings.playSoundDesc')`

Labels tab:
- `Manage Labels` → `t('settings.manageLabels')`
- `No labels created yet` → `t('settings.noLabelsCreated')`

Filters tab:
- `Create Filter` → `t('settings.createFilter')`
- `Filter name` (placeholder) → `t('settings.filterName')`
- `When` → `t('settings.when')`
- `Title` option → `t('settings.filterTitle')`
- `Author` option → `t('settings.filterAuthor')`
- `Category` option → `t('settings.filterCategory')`
- `Content` option → `t('settings.filterContent')`
- `contains` option → `t('settings.contains')`
- `does not contain` option → `t('settings.notContains')`
- `equals` option → `t('settings.equals')`
- `starts with` option → `t('settings.startsWith')`
- `matches regex` option → `t('settings.matchesRegex')`
- `Value` (placeholder) → `t('settings.filterValue')`
- `Then` → `t('settings.then')`
- `Mark as read` option → `t('settings.markAsRead')`
- `Star` option → `t('settings.starAction')`
- `Delete` option → `t('settings.deleteAction')`
- `Add` (button) → `t('settings.addFilter')`
- `Active Filters` → `t('settings.activeFilters')`
- `No filters created yet` → `t('settings.noFiltersCreated')`

Appearance tab:
- `Appearance` (section title) → `t('settings.appearanceTitle')`
- `Theme` → `t('settings.theme')`
- `Application theme` → `t('settings.themeDesc')`
- `System` option → `t('settings.themeSystem')`
- `Light` option → `t('settings.themeLight')`
- `Dark` option → `t('settings.themeDark')`
- Dropdown value: `settings.theme === 'light' ? 'Light' : settings.theme === 'dark' ? 'Dark' : 'System'` → `settings.theme === 'light' ? t('settings.themeLight') : settings.theme === 'dark' ? t('settings.themeDark') : t('settings.themeSystem')`
- `Font Settings` → `t('settings.fontSettings')`
- `Font family` → `t('settings.fontFamily')`
- `Font used throughout the app` → `t('settings.fontFamilyDesc')`
- `System Default` option → `t('settings.fontSystemDefault')`
- `UI font size` → `t('settings.uiFontSize')`
- `Font size for UI elements` → `t('settings.uiFontSizeDesc')`
- `Content font size` → `t('settings.contentFontSize')`
- `Font size for article content` → `t('settings.contentFontSizeDesc')`

**Step 3: Commit**

```bash
git add src/components/settings/SettingsPage.tsx
git commit -m "feat(i18n): add complete translations to SettingsPage"
```

---

### Task 13: Delete SettingsDialog.tsx

**Files:**
- Delete: `src/components/settings/SettingsDialog.tsx`

**Step 1: Delete the file**

```bash
rm src/components/settings/SettingsDialog.tsx
```

**Step 2: Verify no imports reference it**

Run: `grep -r "SettingsDialog" src/` — should return nothing.

**Step 3: Commit**

```bash
git add -u src/components/settings/SettingsDialog.tsx
git commit -m "chore: remove unused SettingsDialog component"
```

---

### Task 14: Verify the build

**Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Test in dev mode**

Run: `npm run tauri dev`
Expected: App starts, switch language to Chinese — all text should be in Chinese. Switch to English — all text should be in English.

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(i18n): resolve any remaining type or build issues"
```
