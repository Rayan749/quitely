# Feed Management Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign feed management by moving Add Feed/New Folder to sidebar header, adding drag-drop, and expanding context menu.

**Architecture:** Enhance existing FeedTree component with hover menu, drag-drop support, and expanded context menu. Replace inline FeedItem in Sidebar with enhanced FeedTree.

**Tech Stack:** React 19, TypeScript, Fluent UI v9, Tauri v2, Zustand

---

## Task 1: Add Translation Keys

**Files:**
- Modify: `src/locales/en.json`
- Modify: `src/locales/zh.json`

**Step 1: Add English translations**

Edit `src/locales/en.json`, add to `feedTree` section:

```json
"feedTree": {
  "empty": "No feeds yet. Click \"Add Feed\" to get started.",
  "rename": "Rename",
  "delete": "Delete",
  "addFeed": "Add Feed",
  "newFolder": "New Folder",
  "refreshFeed": "Refresh Feed",
  "properties": "Properties",
  "markAllRead": "Mark All as Read",
  "star": "Star",
  "unstar": "Unstar"
}
```

**Step 2: Add Chinese translations**

Edit `src/locales/zh.json`, add to `feedTree` section:

```json
"feedTree": {
  "empty": "还没有订阅源。点击"添加订阅源"开始。",
  "rename": "重命名",
  "delete": "删除",
  "addFeed": "添加订阅源",
  "newFolder": "新建文件夹",
  "refreshFeed": "刷新订阅源",
  "properties": "属性",
  "markAllRead": "全部标记为已读",
  "star": "加星",
  "unstar": "取消加星"
}
```

**Step 3: Commit**

```bash
git add src/locales/en.json src/locales/zh.json
git commit -m "feat(i18n): add feed management translation keys"
```

---

## Task 2: Add Backend Commands

**Files:**
- Modify: `src-tauri/src/commands/feeds.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Add mark_feed_read command**

In `src-tauri/src/commands/feeds.rs`, add:

```rust
#[tauri::command]
pub fn mark_feed_read(id: i32, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::news::mark_feed_read(&conn, id).map_err(|e| e.to_string())
}
```

**Step 2: Add mark_feed_read to db/news.rs**

In `src-tauri/src/db/news.rs`, add:

```rust
pub fn mark_feed_read(conn: &Connection, feed_id: i32) -> Result<()> {
    conn.execute(
        "UPDATE news SET read = 1 WHERE feed_id = ?",
        params![feed_id],
    )?;
    Ok(())
}
```

**Step 3: Register command in lib.rs**

In `src-tauri/src/lib.rs`, add `commands::mark_feed_read` to `generate_handler![]`.

**Step 4: Verify Rust compiles**

```bash
cd src-tauri && cargo check
```

**Step 5: Commit**

```bash
git add src-tauri/src/commands/feeds.rs src-tauri/src/db/news.rs src-tauri/src/lib.rs
git commit -m "feat(backend): add mark_feed_read command"
```

---

## Task 3: Add Frontend API Wrappers

**Files:**
- Modify: `src/api/commands.ts`

**Step 1: Add markFeedRead function**

```typescript
export async function markFeedRead(feedId: number): Promise<void> {
  return invoke('mark_feed_read', { id: feedId });
}
```

**Step 2: Commit**

```bash
git add src/api/commands.ts
git commit -m "feat(api): add markFeedRead wrapper"
```

---

## Task 4: Update feedStore with New Actions

**Files:**
- Modify: `src/stores/feedStore.ts`

**Step 1: Add moveFeed action**

Add to `FeedState` interface:

```typescript
moveFeed: (feedId: number, newParentId: number | null) => Promise<void>;
```

Add implementation:

```typescript
moveFeed: async (feedId, newParentId) => {
  await api.updateFeed({ id: feedId, parentId: newParentId ?? undefined });
  await get().loadFeeds();
},
```

**Step 2: Add markFeedAsRead action**

Add to `FeedState` interface:

```typescript
markFeedAsRead: (feedId: number) => Promise<void>;
```

Add implementation:

```typescript
markFeedAsRead: async (feedId) => {
  await api.markFeedRead(feedId);
  // Update unread counts locally
  set((state) => ({
    feeds: state.feeds.map((feed) =>
      feed.id === feedId ? { ...feed, unreadCount: 0 } : feed
    ),
  }));
},
```

**Step 3: Commit**

```bash
git add src/stores/feedStore.ts
git commit -m "feat(store): add moveFeed and markFeedAsRead actions"
```

---

## Task 5: Add Hover Menu to FeedTree Header

**Files:**
- Modify: `src/components/feeds/FeedTree.tsx`

**Step 1: Import required components**

Add to imports:

```typescript
import { ChevronDownRegular, AddRegular, FolderAddRegular } from '@fluentui/react-icons';
```

**Step 2: Add section header with hover menu**

Replace the container div with a header section that includes the hover menu:

```typescript
<div className={styles.container}>
  <Menu>
    <MenuTrigger disableButtonEnhancement>
      <div className={styles.sectionHeader}>
        <span>{t('sidebar.feeds')}</span>
        <ChevronDownRegular />
      </div>
    </MenuTrigger>
    <MenuPopover>
      <MenuList>
        <MenuItem
          icon={<AddRegular />}
          onClick={() => setShowAddDialog(true)}
        >
          {t('feedTree.addFeed')}
        </MenuItem>
        <MenuItem
          icon={<FolderAddRegular />}
          onClick={handleNewFolder}
        >
          {t('feedTree.newFolder')}
        </MenuItem>
      </MenuList>
    </MenuPopover>
  </Menu>
  {/* existing feed items */}
</div>
```

**Step 3: Add styles for section header**

```typescript
sectionHeader: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  fontSize: '11px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: tokens.colorNeutralForeground3,
  cursor: 'pointer',
  borderRadius: '4px',
  '&:hover': {
    backgroundColor: tokens.colorNeutralBackground1Hover,
  },
},
```

**Step 4: Add state for AddFeedDialog**

```typescript
const [showAddDialog, setShowAddDialog] = React.useState(false);
```

**Step 5: Integrate AddFeedDialog**

Add at the end of the component:

```typescript
<AddFeedDialog
  open={showAddDialog}
  onOpenChange={setShowAddDialog}
/>
```

**Step 6: Modify AddFeedDialog to accept controlled props**

Update `AddFeedDialog` to accept optional `open` and `onOpenChange` props for controlled mode.

**Step 7: Commit**

```bash
git add src/components/feeds/FeedTree.tsx src/components/feeds/AddFeedDialog.tsx
git commit -m "feat(feeds): add hover menu to FeedTree header"
```

---

## Task 6: Implement Drag-and-Drop

**Files:**
- Modify: `src/components/feeds/FeedTree.tsx`

**Step 1: Install drag-drop package (if needed)**

Check if `@fluentui/react-dnd` is installed. If not:

```bash
npm install @fluentui/react-dnd
```

**Step 2: Add drag-drop imports**

```typescript
import { useDraggable, useDroppable } from '@fluentui/react-dnd';
```

**Step 3: Wrap FeedItem with drag-drop logic**

Add drag handle and drop zone to each FeedItem:

```typescript
const isFolder = !feed.xmlUrl;
const { draggableProps, dragHandleProps } = useDraggable({
  enabled: !isFolder, // Only feeds can be dragged
  data: { id: feed.id, type: 'feed' },
});

const { droppableProps, isOver } = useDroppable({
  enabled: isFolder, // Only folders can receive drops
  data: { id: feed.id, type: 'folder' },
  onDrop: (data) => {
    if (data.type === 'feed') {
      onMoveFeed(data.id, feed.id);
    }
  },
});
```

**Step 4: Add onMoveFeed prop to FeedItem**

Add `onMoveFeed` callback prop and pass through the component tree.

**Step 5: Add visual feedback for drag-drop**

Update styles:

```typescript
dragging: {
  opacity: 0.5,
},
dropTarget: {
  backgroundColor: tokens.colorBrandBackground2,
},
```

**Step 6: Commit**

```bash
git add src/components/feeds/FeedTree.tsx
git commit -m "feat(feeds): add drag-drop support for organizing feeds"
```

---

## Task 7: Expand Context Menu

**Files:**
- Modify: `src/components/feeds/FeedTree.tsx`

**Step 1: Add new menu items**

Expand the MenuList in FeedItem:

```typescript
<MenuList>
  <MenuItem icon={<EditRegular />} onClick={...}>{t('feedTree.rename')}</MenuItem>
  <MenuItem icon={<DeleteRegular />} onClick={...}>{t('feedTree.delete')}</MenuItem>
  <MenuDivider />
  {feed.xmlUrl && (
    <MenuItem icon={<ArrowSyncRegular />} onClick={...}>{t('feedTree.refreshFeed')}</MenuItem>
  )}
  <MenuItem icon={<SettingsRegular />} onClick={...}>{t('feedTree.properties')}</MenuItem>
  <MenuDivider />
  <MenuItem icon={<CheckmarkRegular />} onClick={...}>{t('feedTree.markAllRead')}</MenuItem>
</MenuList>
```

**Step 2: Add callback props**

Add to FeedItem props:

```typescript
onRefresh: (id: number) => void;
onProperties: (id: number) => void;
onMarkRead: (id: number) => void;
```

**Step 3: Implement handlers in FeedTree component**

```typescript
const handleRefresh = async (id: number) => {
  await api.updateFeedArticles(id);
  loadFeeds();
};

const handleMarkRead = async (id: number) => {
  await markFeedAsRead(id);
};

const handleProperties = (id: number) => {
  // Open properties dialog (future task)
  console.log('Properties for feed', id);
};
```

**Step 4: Import required icons**

```typescript
import {
  ArrowSyncRegular,
  SettingsRegular,
  CheckmarkRegular,
} from '@fluentui/react-icons';
```

**Step 5: Commit**

```bash
git add src/components/feeds/FeedTree.tsx
git commit -m "feat(feeds): expand context menu with refresh, properties, mark read"
```

---

## Task 8: Replace Sidebar Feed Section with FeedTree

**Files:**
- Modify: `src/components/common/Sidebar.tsx`

**Step 1: Import FeedTree**

```typescript
import { FeedTree } from '../feeds';
```

**Step 2: Replace inline FeedItem with FeedTree**

Replace the feeds section with:

```typescript
<div className={styles.section}>
  <FeedTree />
</div>
```

**Step 3: Remove unused FeedItem component from Sidebar**

Remove the `FeedItem` function and related code.

**Step 4: Remove AddFeedDialog and new folder from AppToolbar**

The Add Feed and New Folder buttons are now in the FeedTree hover menu.

**Step 5: Commit**

```bash
git add src/components/common/Sidebar.tsx src/components/common/AppToolbar.tsx
git commit -m "refactor: replace sidebar feed section with enhanced FeedTree"
```

---

## Task 9: Final Verification and Testing

**Step 1: Type check frontend**

```bash
npx tsc --noEmit
```

**Step 2: Run development server**

```bash
npm run tauri dev
```

**Step 3: Manual testing checklist**

- [ ] Hover over Feeds header shows dropdown menu
- [ ] Add Feed opens dialog
- [ ] New Folder creates folder with inline rename
- [ ] Drag feed over folder highlights folder
- [ ] Drop feed into folder moves it
- [ ] Right-click feed shows all menu items
- [ ] Right-click folder shows folder-appropriate menu items
- [ ] All menu items work correctly
- [ ] Translations display correctly

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(feeds): complete feed management redesign"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-03-01-feed-management-implementation.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?