# Complete i18n Fix Design

## Problem

When the user selects Chinese in Quitely, many UI strings remain in English. The i18n infrastructure (i18next + react-i18next) is in place, but most components either don't use `t()` at all or only partially use it. Additionally, there are several related bugs.

## Scope

Full i18n fix: ensure all visible text in the app respects the selected language (English and Simplified Chinese).

## Changes

### 1. Locale Files (`src/locales/en.json`, `src/locales/zh.json`)

Add missing translation keys for all namespaces:

| Namespace | New keys |
|-----------|----------|
| `sidebar` | `feeds`, `noFeeds`, `settings` |
| `toolbar` | `newFolder`, `importOpml`, `exportOpml`, `refreshAll`, `newspaperMode`, `listMode`, `light`, `dark`, `system`, `newArticlesFound` |
| `newsList` | `news`, `title`, `author`, `date`, `actions`, `untitled`, `unstar`, `star`, `deleteTip` |
| `contentViewer` | `untitled`, `unstar`, `openInBrowser`, `by`, `source` |
| `labelDialog` | `addLabel`, `name`, `labelName`, `color`, `cancel`, `add` |
| `newspaperView` | `noArticles`, `untitled` |
| `settings` | ~40+ keys for all section titles, labels, descriptions, and option texts |

### 2. Components to Modify

| Component | Change |
|-----------|--------|
| `SettingsPage.tsx` | Replace all hardcoded English strings with `t()` calls |
| `FeedTree.tsx` | Add `useTranslation`, use existing `feedTree.*` keys |
| `AddFeedDialog.tsx` | Add `useTranslation`, use existing `addFeed.*` keys |
| `LabelDialog.tsx` | Add `useTranslation`, use new `labelDialog.*` keys |
| `NewspaperView.tsx` | Add `useTranslation`, use new `newspaperView.*` keys |
| `NewsList.tsx` | Add missing `t()` calls for table headers, tooltips, title |
| `ContentViewer.tsx` | Add missing `t()` calls for "By:", "Source", tooltips |
| `AppToolbar.tsx` | Add missing `t()` calls for theme labels, tooltips, notification text |
| `Sidebar.tsx` | Add missing keys to locale files (keys are already referenced via `t()`) |

### 3. Date Formatting Fix

Create a utility function that returns the appropriate locale string based on current i18n language:

```typescript
// src/utils/i18n.ts
import i18n from '../i18n';

export function getDateLocale(): string {
  return i18n.language === 'zh' ? 'zh-CN' : 'en-US';
}
```

Update `NewsList.tsx`, `ContentViewer.tsx`, and `NewspaperView.tsx` to use `getDateLocale()` instead of hardcoded `'zh-CN'`.

### 4. i18n Initialization Fix

Modify `src/i18n.ts` to read the persisted language setting from Tauri before initializing i18next, so the app doesn't flash English on startup when the user has saved Chinese.

Approach: Use `invoke('get_setting')` to fetch the language before calling `i18n.init()`, and pass the result as `lng`.

### 5. Cleanup

- Delete `src/components/settings/SettingsDialog.tsx` (duplicate of SettingsPage)
- Remove all imports/references to `SettingsDialog` from other files

## Non-goals

- Adding new languages beyond en/zh
- Traditional Chinese (zh-TW) support
- Fluent UI component-level localization (e.g., DatePicker aria labels)
- Lazy loading of translation files
