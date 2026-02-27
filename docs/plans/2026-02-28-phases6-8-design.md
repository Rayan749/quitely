# Phases 6-8: Remaining Features Design

**Date:** 2026-02-28
**Status:** Approved

## Overview

This document covers all unimplemented features from the original design, organized into three phases:

- **Phase 6:** Core UX Polish
- **Phase 7:** Labels & Filters
- **Phase 8:** Search, Pagination & Settings

---

## Phase 6: Core UX Polish

### 6.1 Functional Sidebar Categories

Make the sidebar (未读/收藏/标签/已删除) functional navigation.

- **未读 (Unread)** — Show all unread articles (`NewsFilter.unreadOnly=true`, no feedId)
- **收藏 (Starred)** — Show starred articles (`NewsFilter.starredOnly=true`)
- **已删除 (Deleted)** — Show deleted articles (`NewsFilter.deletedOnly=true`)
- **标签 (Labels)** — Expandable section for labels (placeholder until Phase 7)

**Changes:**
- Add `selectedCategory: 'all' | 'unread' | 'starred' | 'deleted' | null` to `uiStore`
- When category selected: clear `selectedFeedId`, load news with filter
- Sidebar items become clickable with active state indicator
- Show counts next to each category (unread count, starred count)

### 6.2 Dark Mode / Theme Switching

- Add `theme: 'light' | 'dark' | 'system'` to `settingsStore`
- Persist to DB via settings commands
- `Layout.tsx`: Use `webDarkTheme` / `webLightTheme` based on setting
- AppToolbar: Theme toggle button (sun/moon icon)
- System mode: `window.matchMedia('(prefers-color-scheme: dark)')` listener

### 6.3 Feed Folder Management

UI for creating, renaming, and deleting folders in FeedTree.

- **Create folder:** Button in toolbar. Folder = feed entry with no `xmlUrl`
- **Rename:** Right-click context menu or inline edit on FeedTree items
- **Delete folder:** Right-click > Delete. Cascade deletes child feeds
- **Move feed:** Right-click > "Move to" submenu with folder list

Backend already supports this via existing `create_feed`, `update_feed`, `delete_feed`.

### 6.4 Content Layout Toggle

- Toggle button in AppToolbar: list vs newspaper mode
- **List mode** (current): Three-column with NewsList + ContentViewer
- **Newspaper mode:** Two-column, articles rendered inline (title + content stacked)
- Uses existing `contentLayout` from `uiStore`

### 6.5 HTML Sanitization

- Install `dompurify` package
- Sanitize article HTML in `ContentViewer` before `dangerouslySetInnerHTML`
- Strip: scripts, event handlers, iframes, object/embed tags

### 6.6 Feed Error Status Tracking

- In `update_feed_articles` / `update_all_feeds`: catch errors, update feed `status` and `error_message` in DB
- FeedTree: Show error indicator (red icon/tooltip) for feeds with `status='error'`
- Reset status to `'ok'` on successful update

### 6.7 Deleted Article Cleanup

- Call `cleanup_deleted(days)` on app startup and via scheduler
- Add "cleanup days" setting in Feed settings tab (default: 30)
- Wire setting to cleanup logic

---

## Phase 7: Labels & Filters

### 7.1 Labels System

**Backend:**
- New file: `src-tauri/src/db/labels.rs` — CRUD for labels table
- New file: `src-tauri/src/commands/labels.rs`
- Commands: `get_labels`, `create_label`, `update_label`, `delete_label`
- Command: `set_article_labels(news_ids, label_ids)` — update labels on articles
- Register all in `lib.rs`

**Frontend:**
- `src/stores/labelsStore.ts` — Zustand store for labels
- `src/types/label.ts` — Label type definition
- Settings > "Labels" tab — create, rename, color picker, delete
- NewsList: Label chips on articles
- Sidebar: Expandable labels section under 标签, click to filter
- ContentViewer: Label picker for assigning labels
- API commands wrapper in `commands.ts`

### 7.2 Filters System

**Backend:**
- New file: `src-tauri/src/db/filters.rs` — CRUD for filters/conditions/actions tables
- New file: `src-tauri/src/commands/filters.rs`
- Commands: `get_filters`, `create_filter`, `update_filter`, `delete_filter`
- Command: `execute_filters(news_ids)` — run enabled filters on articles
- Auto-execute filters in `update_feed_articles` after inserting new articles

**Filter schema:**
- Condition fields: title, author, category, content
- Operators: contains, not_contains, equals, starts_with, regex
- Actions: mark_read, mark_starred, add_label, delete

**Frontend:**
- `src/stores/filtersStore.ts` — Zustand store
- `src/types/filter.ts` — Filter, FilterCondition, FilterAction types
- Settings > "Filters" tab — filter builder with conditions + actions
- Filter enable/disable toggle

---

## Phase 8: Search, Pagination & Settings

### 8.1 Article Search

**Backend:**
- New command: `search_news(query, filter)` — LIKE-based search across title, author, content, description
- Optional: SQLite FTS5 for better performance (future optimization)
- Scoped by optional feed_id

**Frontend:**
- SearchBox in AppToolbar (Fluent UI)
- Results in NewsList (same component)
- Debounced input (300ms)
- Clear button to reset search

### 8.2 Article Pagination

- New command: `get_news_count(filter)` — returns total article count
- Remove hardcoded `limit=100`
- Pagination state in newsStore: `page`, `pageSize` (default 50), `totalCount`
- "Load more" button at bottom of NewsList
- Append articles on load more

### 8.3 Proxy Settings

- Configure `reqwest::Client` with proxy from settings on startup
- New command: `test_proxy(proxy_url)` — verify connectivity
- Wire Settings > Network tab proxy fields to backend
- Support: HTTP, HTTPS, SOCKS5

### 8.4 Fonts & Colors

- Settings > "Appearance" tab (or extend existing)
- Settings: `fontFamily`, `fontSize`, `contentFontSize`
- Apply via CSS variables in ContentViewer
- Accent color picker using Fluent UI `createCustomTheme`

### 8.5 Language Selection (i18n)

- Install `i18next` + `react-i18next`
- Extract UI strings to `/src/locales/{en,zh}.json`
- Languages: English, 中文
- Settings > General: Language selector dropdown
- Persist to settings DB

---

## Implementation Priority

Phase 6 → Phase 7 → Phase 8 (sequential, each builds on previous)

Within each phase, tasks can be parallelized where there are no dependencies.
