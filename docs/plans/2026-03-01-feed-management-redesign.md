# Feed Management Redesign

**Date:** 2026-03-01
**Status:** Approved

## Overview

Redesign the feed management structure by moving Add Feed and New Folder operations to the sidebar's Feeds section header, adding drag-and-drop support for organizing feeds into folders, and expanding the right-click context menu.

## Goals

1. Move Add Feed and New Folder buttons from toolbar to Feeds section header
2. Enable drag-and-drop for moving feeds into folders
3. Expand right-click context menu with additional operations

## Component Architecture

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/feeds/FeedTree.tsx` | Major enhancement: add drag-drop, expand context menu |
| `src/components/common/Sidebar.tsx` | Replace inline FeedItem with enhanced FeedTree |
| `src/stores/feedStore.ts` | Add `moveFeed`, `markAllAsRead`, `refreshFeed` actions |
| `src/api/commands.ts` | Add API wrappers for new backend commands |
| `src-tauri/src/commands/feeds.rs` | Add `mark_feed_read`, `update_feed_by_id` commands |
| `src/locales/en.json` | Add new translation keys |
| `src/locales/zh.json` | Add new translation keys |

### New Components

None - we enhance the existing `FeedTree` component rather than creating new ones.

## Feature Details

### 1. Hover Menu on Feeds Header

**Behavior:**
- The "Feeds" section title in the sidebar has a hover-sensitive area
- When the user hovers over the header, a dropdown menu appears
- Menu options:
  - **Add Feed** - Opens the existing `AddFeedDialog`
  - **New Folder** - Creates a new folder inline with text input for naming

**Visual:**
```
[Feeds ▾]  ← hover reveals dropdown
    └─ Add Feed     → Opens AddFeedDialog
    └─ New Folder   → Creates folder with inline rename
```

**Implementation:**
- Use Fluent UI `Menu` component with `MenuTrigger` and `MenuPopover`
- Dropdown indicator: small chevron icon
- Menu icons: `DocumentTextAddRegular` for Add Feed, `FolderAddRegular` for New Folder

### 2. Drag-and-Drop for Feeds

**Behavior:**
- Feeds (items with `xmlUrl`) can be dragged into folders (items without `xmlUrl`)
- When dragging a feed over a folder, the folder becomes highlighted
- Dropping the feed on the folder moves it (updates `parentId`)
- Folders cannot be dragged into other folders

**Implementation:**
- Use Fluent UI's `useDraggable` and `useDroppable` hooks from `@fluentui/react-dnd`
- Visual feedback:
  - Dragging feed: feed item becomes semi-transparent
  - Hovering over folder: folder background changes to accent color
  - Invalid drop target: cursor shows "not allowed"

**Edge cases:**
- Dropping a feed on itself: no action
- Dropping a folder into a feed: no action (feeds can't contain children)
- Dropping a feed on the root area: sets `parentId` to null/0

### 3. Right-Click Context Menu Expansion

**Feed context menu (has xmlUrl):**
```
┌─────────────────────────────────────────────┐
│  ✏️ Rename                                  │
│  🗑️ Delete                                  │
│  ─────────────────                          │
│  🔄 Refresh Feed                            │
│  ⚙️ Properties                              │
│  ─────────────────                          │
│  ✅ Mark All as Read                        │
│  ⭐ Star/Unstar                             │
└─────────────────────────────────────────────┘
```

**Folder context menu (no xmlUrl):**
```
┌─────────────────────────────────────────────┐
│  ✏️ Rename                                  │
│  🗑️ Delete                                  │
│  ─────────────────                          │
│  ⚙️ Properties                              │
│  ─────────────────                          │
│  ✅ Mark All as Read                        │
└─────────────────────────────────────────────┘
```

**Operations:**
- **Rename** - Inline text input (existing)
- **Delete** - Remove feed/folder (existing)
- **Refresh Feed** - Call `updateFeed` API for just this feed (feeds only)
- **Properties** - Open dialog with feed settings
- **Mark All as Read** - Mark all articles in this feed/folder as read
- **Star/Unstar** - Toggle star status

## Data Flow

### New feedStore Actions

```typescript
// Move feed to a new parent folder
moveFeed: (feedId: number, newParentId: number | null) => Promise<void>

// Mark all articles in feed/folder as read
markAllAsRead: (feedId: number) => Promise<void>

// Refresh a single feed
refreshFeed: (feedId: number) => Promise<void>
```

### Drag-Drop Flow

```
User drags feed → onDrop handler →
feedStore.moveFeed(feedId, folderId) →
api.updateFeed({ id, parentId }) →
loadFeeds() to refresh
```

### Context Menu Operations Flow

```
Mark All Read → feedStore.markAllAsRead(id) → api.markFeedRead(id)
Refresh Feed → feedStore.refreshFeed(id) → api.updateFeedById(id)
Properties → Open dialog → User edits → feedStore.updateFeed()
```

### Backend Commands Needed

1. `mark_feed_read(feed_id: i32)` - Mark all articles in a feed as read
2. `update_feed_by_id(feed_id: i32)` - Refresh a single feed

## Error Handling

- Failed operations show toast notification with error message
- Optimistic updates are reverted on failure

## Scope Excluded

- Dragging folders into other folders
- Reordering feeds via drag-drop between items
- Detailed Properties dialog UI design

## Translation Keys

```json
{
  "feedTree": {
    "addFeed": "Add Feed",
    "newFolder": "New Folder",
    "refreshFeed": "Refresh Feed",
    "properties": "Properties",
    "markAllRead": "Mark All as Read",
    "star": "Star",
    "unstar": "Unstar"
  }
}
```