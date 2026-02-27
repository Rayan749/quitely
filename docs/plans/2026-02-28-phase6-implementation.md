# Phase 6: Core UX Polish — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Quitely feel like a complete, polished RSS reader by adding functional sidebar navigation, dark mode, folder management, layout toggle, HTML sanitization, feed error tracking, and article cleanup.

**Architecture:** All changes build on the existing Tauri v2 + React 19 + Zustand + Fluent UI v9 stack. Frontend-heavy phase — most backend pieces already exist. The sidebar becomes a real navigation control driving the newsStore filter. Theme is driven by settingsStore and applied via FluentProvider. DOMPurify sanitizes untrusted feed HTML.

**Tech Stack:** React 19, TypeScript, Fluent UI v9, Zustand, DOMPurify, Tauri v2 (Rust)

---

### Task 1: Install DOMPurify

**Files:**
- Modify: `package.json`

**Step 1: Install dompurify and types**

Run: `npm install dompurify && npm install -D @types/dompurify`

**Step 2: Verify installation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add dompurify for HTML sanitization"
```

---

### Task 2: Add Cleanup Command to Rust Backend

**Files:**
- Modify: `src-tauri/src/commands/news.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Add cleanup_deleted_news command**

In `src-tauri/src/commands/news.rs`, add at the end:

```rust
#[tauri::command]
pub fn cleanup_deleted_news(db: State<'_, DbState>, older_than_days: i64) -> Result<usize, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::news::cleanup_deleted(&conn, older_than_days)
}
```

**Step 2: Register the command in lib.rs**

In `src-tauri/src/lib.rs`, add `commands::cleanup_deleted_news` to the `generate_handler![]` macro.

**Step 3: Verify compilation**

Run: `cd src-tauri && cargo check`
Expected: Compiles cleanly

**Step 4: Commit**

```bash
git add src-tauri/src/commands/news.rs src-tauri/src/lib.rs
git commit -m "feat: add cleanup_deleted_news Tauri command"
```

---

### Task 3: Add Feed Error Status Tracking to Backend

**Files:**
- Modify: `src-tauri/src/commands/feeds.rs`

**Step 1: Update update_feed_articles to track errors**

In `src-tauri/src/commands/feeds.rs`, modify the `update_feed_articles` function. After `let fetcher = FeedFetcher::new();`, wrap the fetch+parse in a match and set status/error_message:

Replace the body of `update_feed_articles` from `let fetcher = ...` onwards with:

```rust
    let fetcher = FeedFetcher::new();
    let parsed = match fetcher.fetch_and_parse(&feed_url).await {
        Ok(p) => p,
        Err(e) => {
            // Update feed status to error
            let conn = db.0.lock().map_err(|e| e.to_string())?;
            let _ = conn.execute(
                "UPDATE feeds SET status = 'error', error_message = ?1 WHERE id = ?2",
                rusqlite::params![e, feed_id],
            );
            return Err(e);
        }
    };

    // Re-acquire lock to insert articles
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    // Reset status to ok on successful fetch
    let _ = conn.execute(
        "UPDATE feeds SET status = 'ok', error_message = NULL WHERE id = ?1",
        rusqlite::params![feed_id],
    );

    let mut new_count = 0;
```

Keep the rest of the function as-is (the for loop over entries, last_updated update, and the Ok return).

**Step 2: Update update_all_feeds error branch**

In the same file, in `update_all_feeds`, replace the `Err(e)` branch:

```rust
            Err(e) => {
                // Update feed status to error
                if let Ok(conn) = db.0.lock() {
                    let _ = conn.execute(
                        "UPDATE feeds SET status = 'error', error_message = ?1 WHERE id = ?2",
                        rusqlite::params![e.to_string(), feed.id],
                    );
                }
                eprintln!("Failed to update feed {}: {}", feed.id, e);
            }
```

Also, in the `Ok(parsed)` branch, add after `let conn = db.0.lock()...`:

```rust
                // Reset status to ok
                let _ = conn.execute(
                    "UPDATE feeds SET status = 'ok', error_message = NULL WHERE id = ?1",
                    rusqlite::params![feed.id],
                );
```

**Step 3: Verify compilation**

Run: `cd src-tauri && cargo check`
Expected: Compiles cleanly

**Step 4: Commit**

```bash
git add src-tauri/src/commands/feeds.rs
git commit -m "feat: track feed error status on fetch failures"
```

---

### Task 4: Add Frontend API for Cleanup Command

**Files:**
- Modify: `src/api/commands.ts`

**Step 1: Add cleanup function**

At the end of `src/api/commands.ts`, add:

```typescript
export async function cleanupDeletedNews(olderThanDays: number): Promise<number> {
  return invoke<number>('cleanup_deleted_news', { olderThanDays });
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/api/commands.ts
git commit -m "feat: add cleanupDeletedNews API command"
```

---

### Task 5: Add Theme and Category State to Stores

**Files:**
- Modify: `src/stores/uiStore.ts`
- Modify: `src/stores/settingsStore.ts`

**Step 1: Add selectedCategory to uiStore**

In `src/stores/uiStore.ts`, add to the `UIState` interface:

```typescript
  selectedCategory: 'unread' | 'starred' | 'deleted' | null;
  selectCategory: (category: 'unread' | 'starred' | 'deleted' | null) => void;
```

Add in the store initial state (inside the `persist` callback):

```typescript
      selectedCategory: null,
      selectCategory: (category) => set({ selectedCategory: category }),
```

**Step 2: Add theme to settingsStore**

In `src/stores/settingsStore.ts`, add to `AppSettings`:

```typescript
  // Appearance
  theme: 'light' | 'dark' | 'system';
  cleanupDays: number;
```

Add defaults in `defaultSettings`:

```typescript
  theme: 'system' as const,
  cleanupDays: 30,
```

Add to `settingKeyMap`:

```typescript
  theme: 'appearance.theme',
  cleanupDays: 'feed.cleanup_days',
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/stores/uiStore.ts src/stores/settingsStore.ts
git commit -m "feat: add category selection and theme/cleanup settings to stores"
```

---

### Task 6: Make Sidebar Functional

**Files:**
- Modify: `src/components/common/Sidebar.tsx`

**Step 1: Rewrite Sidebar with clickable categories**

Replace the entire content of `src/components/common/Sidebar.tsx` with:

```typescript
import { makeStyles, tokens, Badge, mergeClasses } from '@fluentui/react-components';
import { MailUnreadFilled, StarFilled, TagFilled, DeleteFilled } from '@fluentui/react-icons';
import { useUIStore } from '../../stores';

const useStyles = makeStyles({
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    width: '200px',
    minWidth: '200px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  categoriesPanel: {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  },
  categoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  selected: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground3,
    padding: '12px 12px 4px',
    textTransform: 'uppercase' as const,
  },
});

export function Sidebar() {
  const styles = useStyles();
  const { categoriesPanelVisible, selectedCategory, selectCategory } = useUIStore();

  if (!categoriesPanelVisible) {
    return null;
  }

  const handleCategoryClick = (category: 'unread' | 'starred' | 'deleted') => {
    selectCategory(selectedCategory === category ? null : category);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.categoriesPanel}>
        <div className={styles.sectionTitle}>Categories</div>
        <div
          className={mergeClasses(styles.categoryItem, selectedCategory === 'unread' ? styles.selected : '')}
          onClick={() => handleCategoryClick('unread')}
        >
          <MailUnreadFilled />
          <span>Unread</span>
        </div>
        <div
          className={mergeClasses(styles.categoryItem, selectedCategory === 'starred' ? styles.selected : '')}
          onClick={() => handleCategoryClick('starred')}
        >
          <StarFilled />
          <span>Starred</span>
        </div>
        <div
          className={mergeClasses(styles.categoryItem, selectedCategory === 'deleted' ? styles.selected : '')}
          onClick={() => handleCategoryClick('deleted')}
        >
          <DeleteFilled />
          <span>Deleted</span>
        </div>

        <div className={styles.sectionTitle}>Labels</div>
        <div style={{ padding: '4px 12px', fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
          No labels yet
        </div>
      </div>
    </aside>
  );
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/common/Sidebar.tsx
git commit -m "feat: make sidebar categories functional with click navigation"
```

---

### Task 7: Wire Sidebar Categories to News Loading

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/news/NewsList.tsx`

**Step 1: Update App.tsx to respond to category selection**

In `src/App.tsx`, add `useUIStore` import and wire category changes:

```typescript
import { Layout, AppToolbar } from './components/common';
import { FeedTree } from './components/feeds';
import { NewsList } from './components/news';
import { ContentViewer } from './components/content';
import { useFeedStore, useNewsStore, useUIStore } from './stores';
import { useKeyboardShortcuts, useTrayEvents } from './hooks';
import { useEffect } from 'react';

function App() {
  const { loadFeeds, selectedFeedId, selectFeed } = useFeedStore();
  const { clearNews, loadNews } = useNewsStore();
  const { selectedCategory, selectCategory } = useUIStore();

  useKeyboardShortcuts();
  useTrayEvents();

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  // When a category is selected, clear feed selection and load with filter
  useEffect(() => {
    if (selectedCategory) {
      selectFeed(null);
      loadNews({
        unreadOnly: selectedCategory === 'unread',
        starredOnly: selectedCategory === 'starred',
        deletedOnly: selectedCategory === 'deleted',
        limit: 100,
      });
    }
  }, [selectedCategory, selectFeed, loadNews]);

  // When a feed is selected, clear category and let NewsList handle loading
  useEffect(() => {
    if (selectedFeedId !== null) {
      selectCategory(null);
    } else if (!selectedCategory) {
      clearNews();
    }
  }, [selectedFeedId, selectedCategory, selectCategory, clearNews]);

  return (
    <Layout>
      <AppToolbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '250px', minWidth: '250px', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
          <FeedTree />
        </div>
        <div style={{ width: '350px', minWidth: '300px', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
          <NewsList feedId={selectedFeedId ?? undefined} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ContentViewer />
        </div>
      </div>
    </Layout>
  );
}

export default App;
```

**Step 2: Update NewsList to skip loading when category is active**

In `src/components/news/NewsList.tsx`, modify the useEffect that loads news:

```typescript
  const { selectedCategory } = useUIStore();

  // Load news when feedId changes (only if not in category mode)
  React.useEffect(() => {
    if (feedId !== undefined && !selectedCategory) {
      loadNews({ feedId, limit: 100 });
    }
  }, [feedId, selectedCategory, loadNews]);
```

Add `import { useUIStore } from '../../stores';` to the imports.

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/App.tsx src/components/news/NewsList.tsx
git commit -m "feat: wire sidebar categories to news loading"
```

---

### Task 8: Add Dark Mode Support

**Files:**
- Modify: `src/components/common/Layout.tsx`
- Modify: `src/components/common/AppToolbar.tsx`

**Step 1: Update Layout.tsx to use theme from settings**

Replace `src/components/common/Layout.tsx`:

```typescript
import { useEffect, useState, useMemo } from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  makeStyles,
} from '@fluentui/react-components';
import { Sidebar } from './Sidebar';
import { useSettingsStore } from '../../stores';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
});

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const styles = useStyles();
  const { settings } = useSettingsStore();
  const [systemDark, setSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = useMemo(() => {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    return systemDark;
  }, [settings.theme, systemDark]);

  return (
    <FluentProvider theme={isDark ? webDarkTheme : webLightTheme}>
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

**Step 2: Add theme toggle to AppToolbar**

In `src/components/common/AppToolbar.tsx`, add a theme toggle button. Add to imports:

```typescript
import { WeatherSunnyRegular, WeatherMoonRegular } from '@fluentui/react-icons';
import { useSettingsStore } from '../../stores';
```

Inside the `AppToolbar` function, add:

```typescript
  const { settings, updateSetting } = useSettingsStore();

  const handleThemeToggle = () => {
    const next = settings.theme === 'light' ? 'dark' : settings.theme === 'dark' ? 'system' : 'light';
    updateSetting('theme', next);
  };

  const themeLabel = settings.theme === 'light' ? 'Light' : settings.theme === 'dark' ? 'Dark' : 'System';
```

Add the button to the toolbar JSX (before `<SettingsDialog />`):

```tsx
        <Button
          appearance="subtle"
          icon={settings.theme === 'dark' ? <WeatherMoonRegular /> : <WeatherSunnyRegular />}
          onClick={handleThemeToggle}
          title={`Theme: ${themeLabel}`}
        >
          {themeLabel}
        </Button>

        <ToolbarDivider />
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/common/Layout.tsx src/components/common/AppToolbar.tsx
git commit -m "feat: add dark mode with light/dark/system toggle"
```

---

### Task 9: Add Feed Folder Management UI

**Files:**
- Modify: `src/components/feeds/FeedTree.tsx`
- Modify: `src/components/common/AppToolbar.tsx`

**Step 1: Add "New Folder" button to AppToolbar**

In `src/components/common/AppToolbar.tsx`, add to imports:

```typescript
import { FolderAddRegular } from '@fluentui/react-icons';
```

Add handler inside `AppToolbar`:

```typescript
  const { addFeed } = useFeedStore();

  const handleNewFolder = async () => {
    try {
      await addFeed({ xmlUrl: '', title: 'New Folder' });
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };
```

Add button after AddFeedDialog in JSX:

```tsx
        <Button
          appearance="subtle"
          icon={<FolderAddRegular />}
          onClick={handleNewFolder}
          title="New folder"
        >
          Folder
        </Button>
```

**Step 2: Add context menu to FeedTree**

In `src/components/feeds/FeedTree.tsx`, add context menu support with rename and delete. Add to imports:

```typescript
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Input,
} from '@fluentui/react-components';
import { EditRegular, DeleteRegular, FolderArrowRightRegular } from '@fluentui/react-icons';
import { useFeedStore } from '../../stores';
```

Add a state for renaming in the `FeedTree` component:

```typescript
  const [renamingId, setRenamingId] = React.useState<number | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const { updateFeed, deleteFeed: removeFeed } = useFeedStore();
```

Update the `FeedItem` component to accept and use these props — add context menu on right-click, inline editing when renaming. The FeedItem div should be wrapped in a Menu component with right-click trigger:

```tsx
function FeedItem({ feed, tree, styles, selectedFeedId, onSelect, level = 0,
                    renamingId, renameValue, setRenamingId, setRenameValue,
                    onRename, onDelete }: FeedItemProps): React.ReactElement {
  const children = tree.get(feed.id) || [];
  const hasChildren = children.length > 0;
  const isSelected = selectedFeedId === feed.id;
  const isRenaming = renamingId === feed.id;

  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
      onRename(feed.id, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <div>
      <Menu>
        <MenuTrigger>
          <div
            className={`${styles.feedItem} ${isSelected ? styles.selected : ''}`}
            style={{ paddingLeft: `${8 + level * 16}px` }}
            onClick={() => onSelect(feed.id)}
            onContextMenu={(e) => e.preventDefault()}
          >
            {hasChildren || !feed.xmlUrl ? <FolderFilled /> : <DocumentTextFilled />}
            {isRenaming ? (
              <Input
                size="small"
                value={renameValue}
                onChange={(_, data) => setRenameValue(data.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                autoFocus
              />
            ) : (
              <span>{feed.text || feed.title}</span>
            )}
            {!isRenaming && feed.unreadCount > 0 && (
              <span className={styles.unreadBadge}>{feed.unreadCount}</span>
            )}
            {feed.status === 'error' && (
              <span title={feed.errorMessage || 'Error'} style={{ color: '#d13438', fontSize: '12px' }}>⚠</span>
            )}
          </div>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem
              icon={<EditRegular />}
              onClick={() => {
                setRenamingId(feed.id);
                setRenameValue(feed.text || feed.title);
              }}
            >
              Rename
            </MenuItem>
            <MenuItem
              icon={<DeleteRegular />}
              onClick={() => onDelete(feed.id)}
            >
              Delete
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      {hasChildren && (
        <div className={styles.childContainer}>
          {children.map(child => (
            <FeedItem
              key={child.id}
              feed={child}
              tree={tree}
              styles={styles}
              selectedFeedId={selectedFeedId}
              onSelect={onSelect}
              level={level + 1}
              renamingId={renamingId}
              renameValue={renameValue}
              setRenamingId={setRenamingId}
              setRenameValue={setRenameValue}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

Update FeedItemProps interface to include the new props. Update the FeedTree component to pass these props down and implement the handlers:

```typescript
  const handleRename = async (id: number, newTitle: string) => {
    await updateFeed({ id, title: newTitle });
  };

  const handleDelete = async (id: number) => {
    await removeFeed(id);
  };
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/feeds/FeedTree.tsx src/components/common/AppToolbar.tsx
git commit -m "feat: add feed folder management (create, rename, delete)"
```

---

### Task 10: Add Content Layout Toggle

**Files:**
- Modify: `src/components/common/AppToolbar.tsx`
- Modify: `src/App.tsx`
- Create: `src/components/news/NewspaperView.tsx`

**Step 1: Add layout toggle to AppToolbar**

In `src/components/common/AppToolbar.tsx`, add to imports:

```typescript
import { TextColumnOneRegular, GridRegular } from '@fluentui/react-icons';
import { useUIStore } from '../../stores';
```

Inside the component, add:

```typescript
  const { contentLayout, setContentLayout } = useUIStore();

  const handleLayoutToggle = () => {
    setContentLayout(contentLayout === 'list' ? 'newspaper' : 'list');
  };
```

Add button before the theme toggle:

```tsx
        <Button
          appearance="subtle"
          icon={contentLayout === 'list' ? <TextColumnOneRegular /> : <GridRegular />}
          onClick={handleLayoutToggle}
          title={contentLayout === 'list' ? 'Newspaper mode' : 'List mode'}
        >
          {contentLayout === 'list' ? 'List' : 'News'}
        </Button>
```

**Step 2: Create NewspaperView component**

Create `src/components/news/NewspaperView.tsx`:

```typescript
import { makeStyles, tokens, Button } from '@fluentui/react-components';
import { StarFilled, StarRegular, DeleteRegular, OpenRegular } from '@fluentui/react-icons';
import { useNewsStore } from '../../stores';
import DOMPurify from 'dompurify';

const useStyles = makeStyles({
  container: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
  },
  article: {
    maxWidth: '800px',
    margin: '0 auto 32px',
    padding: '24px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    marginBottom: '16px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  content: {
    lineHeight: '1.6',
    '& img': { maxWidth: '100%', height: 'auto' },
    '& a': { color: tokens.colorBrandForeground1 },
    '& pre': { backgroundColor: tokens.colorNeutralBackground3, padding: '12px', borderRadius: '4px', overflow: 'auto' },
    '& code': { backgroundColor: tokens.colorNeutralBackground3, padding: '2px 6px', borderRadius: '4px', fontSize: '13px' },
    '& blockquote': { borderLeft: `4px solid ${tokens.colorBrandStroke1}`, paddingLeft: '16px', marginLeft: 0, color: tokens.colorNeutralForeground2 },
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: tokens.colorNeutralForeground2,
  },
});

export function NewspaperView() {
  const styles = useStyles();
  const { news, markStarred, deleteNews } = useNewsStore();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  if (news.length === 0) {
    return <div className={styles.empty}>No articles to display</div>;
  }

  return (
    <div className={styles.container}>
      {news.map(item => (
        <div key={item.id} className={styles.article}>
          <div className={styles.title}>{item.title || 'Untitled'}</div>
          <div className={styles.meta}>
            {item.author && <span>{item.author}</span>}
            {item.publishedAt && <span>{formatDate(item.publishedAt)}</span>}
          </div>
          <div className={styles.actions}>
            <Button size="small" appearance="subtle" icon={item.isStarred ? <StarFilled /> : <StarRegular />} onClick={() => markStarred([item.id], !item.isStarred)} />
            <Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => deleteNews([item.id])} />
            {item.link && <Button size="small" appearance="subtle" icon={<OpenRegular />} onClick={() => window.open(item.link!, '_blank')} />}
          </div>
          <div className={styles.content} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content || item.description || '') }} />
        </div>
      ))}
    </div>
  );
}
```

**Step 3: Update news/index.ts**

In `src/components/news/index.ts`, add:

```typescript
export { NewspaperView } from './NewspaperView';
```

**Step 4: Update App.tsx to use layout toggle**

In `src/App.tsx`, import and conditionally render:

```typescript
import { NewsList, NewspaperView } from './components/news';
```

Replace the news list + content viewer section of the JSX. When `contentLayout === 'newspaper'`, show `<NewspaperView />` filling the remaining space. When `list`, show the existing three-column layout:

```tsx
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '250px', minWidth: '250px', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
          <FeedTree />
        </div>
        {contentLayout === 'newspaper' ? (
          <NewspaperView />
        ) : (
          <>
            <div style={{ width: '350px', minWidth: '300px', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
              <NewsList feedId={selectedFeedId ?? undefined} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <ContentViewer />
            </div>
          </>
        )}
      </div>
```

Add `const { contentLayout } = useUIStore();` to the component body (or use the existing one).

**Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/components/news/NewspaperView.tsx src/components/news/index.ts src/components/common/AppToolbar.tsx src/App.tsx
git commit -m "feat: add content layout toggle between list and newspaper modes"
```

---

### Task 11: Add HTML Sanitization to ContentViewer

**Files:**
- Modify: `src/components/content/ContentViewer.tsx`

**Step 1: Add DOMPurify to ContentViewer**

At the top of `src/components/content/ContentViewer.tsx`, add:

```typescript
import DOMPurify from 'dompurify';
```

Replace the `dangerouslySetInnerHTML` usage (around line 207):

```tsx
          <div
            className={styles.articleContent}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                selectedNews.content || selectedNews.description || '<p>No content available</p>'
              ),
            }}
          />
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/content/ContentViewer.tsx
git commit -m "feat: sanitize article HTML with DOMPurify"
```

---

### Task 12: Add Cleanup Settings and Startup Cleanup

**Files:**
- Modify: `src/components/settings/SettingsDialog.tsx`
- Modify: `src/App.tsx`

**Step 1: Add cleanup days setting to Feed tab**

In `src/components/settings/SettingsDialog.tsx`, in the `{selectedTab === 'feed' && ...}` section, add after the "Mark read on select" setting row:

```tsx
                      <div className={styles.settingRow}>
                        <div className={styles.settingLabel}>
                          <span>Cleanup deleted articles (days)</span>
                          <span className={styles.settingDescription}>Permanently delete articles older than this many days</span>
                        </div>
                        <SpinButton
                          value={settings.cleanupDays}
                          min={1}
                          max={365}
                          step={1}
                          onChange={(_, data) => updateSetting('cleanupDays', parseInt(String(data.value), 10) || 30)}
                        />
                      </div>
```

**Step 2: Run cleanup on startup in App.tsx**

In `src/App.tsx`, add import:

```typescript
import { cleanupDeletedNews } from './api/commands';
```

Add a useEffect for startup cleanup:

```typescript
  const { settings, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    // Cleanup deleted articles on startup
    if (settings.cleanupDays > 0) {
      cleanupDeletedNews(settings.cleanupDays).catch(console.error);
    }
  }, [settings.cleanupDays]);
```

Also add `import { useSettingsStore } from './stores';` if not already imported.

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/settings/SettingsDialog.tsx src/App.tsx
git commit -m "feat: add cleanup days setting and run cleanup on startup"
```

---

### Task 13: Add Feed Error Indicator to FeedTree

**Files:**
- Modify: `src/components/feeds/FeedTree.tsx`

This was already addressed in Task 9 as part of the FeedTree rewrite — the error indicator (`⚠` with tooltip) is included in the FeedItem component when `feed.status === 'error'`.

If Task 9's implementation is already in place, verify the error indicator shows properly. No additional code changes needed.

**Step 1: Verify the error indicator code is present**

Check that the FeedItem component includes:
```tsx
{feed.status === 'error' && (
  <span title={feed.errorMessage || 'Error'} style={{ color: '#d13438', fontSize: '12px' }}>⚠</span>
)}
```

**Step 2: Commit (if any touch-ups needed)**

```bash
git add src/components/feeds/FeedTree.tsx
git commit -m "fix: ensure feed error indicator shows in FeedTree"
```

---

### Task 14: Final Verification

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

- [ ] Sidebar shows Unread/Starred/Deleted categories with icons
- [ ] Clicking a category loads the corresponding articles
- [ ] Clicking same category again deselects it
- [ ] Theme toggle cycles through Light → Dark → System
- [ ] Dark mode applies correctly
- [ ] System theme respects OS setting
- [ ] "Folder" button creates a new folder in feed tree
- [ ] Right-click on feed shows Rename/Delete context menu
- [ ] Rename works inline
- [ ] Delete removes the feed/folder
- [ ] Layout toggle switches between List and Newspaper modes
- [ ] Newspaper mode shows articles inline with sanitized HTML
- [ ] Article content in ContentViewer is sanitized (no scripts/iframes)
- [ ] Feed error indicator (⚠) shows when a feed fetch fails
- [ ] Cleanup days setting appears in Settings > Feed tab
- [ ] Deleted articles are cleaned up on startup

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: complete Phase 6 - Core UX Polish"
```
