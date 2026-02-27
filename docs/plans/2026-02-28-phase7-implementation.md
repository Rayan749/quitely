# Phase 7: Labels & Filters — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full labels system (create, assign to articles, filter by label) and an automatic filters system (conditions + actions that run on new articles).

**Architecture:** Labels and filters tables already exist in SQLite schema. New Rust DB modules + commands for CRUD. Frontend gets new Zustand stores, types, API wrappers, and UI components. Filters auto-execute in the `update_feed_articles` command after inserting new articles. Labels are stored as comma-separated IDs in the news.labels column (existing pattern).

**Tech Stack:** Rust (rusqlite), React 19, TypeScript, Fluent UI v9, Zustand, Tauri v2

---

### Task 1: Create Label Models

**Files:**
- Create: `src/types/label.ts`
- Modify: `src/types/index.ts`
- Create: `src-tauri/src/models/label.rs`
- Modify: `src-tauri/src/models/mod.rs`

**Step 1: Create Rust Label model**

Create `src-tauri/src/models/label.rs`:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Label {
    pub id: i64,
    pub name: String,
    pub color: Option<String>,
    pub sort_order: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateLabel {
    pub name: String,
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateLabel {
    pub id: i64,
    pub name: Option<String>,
    pub color: Option<String>,
    pub sort_order: Option<i64>,
}
```

**Step 2: Export from models/mod.rs**

In `src-tauri/src/models/mod.rs`, add:

```rust
pub mod label;
pub use label::*;
```

**Step 3: Create TypeScript Label type**

Create `src/types/label.ts`:

```typescript
export interface Label {
  id: number;
  name: string;
  color?: string;
  sortOrder: number;
}

export interface CreateLabel {
  name: string;
  color?: string;
}

export interface UpdateLabel {
  id: number;
  name?: string;
  color?: string;
  sortOrder?: number;
}
```

**Step 4: Export from types/index.ts**

In `src/types/index.ts`, add:

```typescript
export * from './label';
```

**Step 5: Verify**

Run: `cd src-tauri && cargo check`
Run: `npx tsc --noEmit`
Expected: Both compile cleanly

**Step 6: Commit**

```bash
git add src-tauri/src/models/label.rs src-tauri/src/models/mod.rs src/types/label.ts src/types/index.ts
git commit -m "feat: add Label data models (Rust + TypeScript)"
```

---

### Task 2: Create Label Database Operations

**Files:**
- Create: `src-tauri/src/db/labels.rs`
- Modify: `src-tauri/src/db/mod.rs`

**Step 1: Create db/labels.rs**

Create `src-tauri/src/db/labels.rs`:

```rust
use rusqlite::{Connection, params, OptionalExtension};
use crate::models::{Label, CreateLabel, UpdateLabel};

pub fn get_all(conn: &Connection) -> Result<Vec<Label>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, color, sort_order FROM labels ORDER BY sort_order, name")
        .map_err(|e| e.to_string())?;

    let labels = stmt
        .query_map([], |row| {
            Ok(Label {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                sort_order: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(labels)
}

pub fn get_by_id(conn: &Connection, id: i64) -> Result<Option<Label>, String> {
    let result = conn
        .query_row(
            "SELECT id, name, color, sort_order FROM labels WHERE id = ?",
            params![id],
            |row| {
                Ok(Label {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    color: row.get(2)?,
                    sort_order: row.get(3)?,
                })
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;

    Ok(result)
}

pub fn create(conn: &Connection, label: &CreateLabel) -> Result<i64, String> {
    conn.execute(
        "INSERT INTO labels (name, color) VALUES (?1, ?2)",
        params![label.name, label.color],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

pub fn update(conn: &Connection, label: &UpdateLabel) -> Result<(), String> {
    if let Some(ref name) = label.name {
        conn.execute(
            "UPDATE labels SET name = ?1 WHERE id = ?2",
            params![name, label.id],
        )
        .map_err(|e| e.to_string())?;
    }

    if let Some(ref color) = label.color {
        conn.execute(
            "UPDATE labels SET color = ?1 WHERE id = ?2",
            params![color, label.id],
        )
        .map_err(|e| e.to_string())?;
    }

    if let Some(sort_order) = label.sort_order {
        conn.execute(
            "UPDATE labels SET sort_order = ?1 WHERE id = ?2",
            params![sort_order, label.id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

pub fn delete(conn: &Connection, id: i64) -> Result<(), String> {
    conn.execute("DELETE FROM labels WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

**Step 2: Export from db/mod.rs**

In `src-tauri/src/db/mod.rs`, add:

```rust
pub mod labels;
```

**Step 3: Verify**

Run: `cd src-tauri && cargo check`
Expected: Compiles cleanly

**Step 4: Commit**

```bash
git add src-tauri/src/db/labels.rs src-tauri/src/db/mod.rs
git commit -m "feat: add label database CRUD operations"
```

---

### Task 3: Create Label Tauri Commands

**Files:**
- Create: `src-tauri/src/commands/labels.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Create commands/labels.rs**

Create `src-tauri/src/commands/labels.rs`:

```rust
use tauri::State;
use crate::db::DbState;
use crate::models::{Label, CreateLabel, UpdateLabel};

#[tauri::command]
pub fn get_labels(db: State<'_, DbState>) -> Result<Vec<Label>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::labels::get_all(&conn)
}

#[tauri::command]
pub fn create_label(db: State<'_, DbState>, label: CreateLabel) -> Result<i64, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::labels::create(&conn, &label)
}

#[tauri::command]
pub fn update_label(db: State<'_, DbState>, label: UpdateLabel) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::labels::update(&conn, &label)
}

#[tauri::command]
pub fn delete_label(db: State<'_, DbState>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::labels::delete(&conn, id)
}

#[tauri::command]
pub fn set_article_labels(
    db: State<'_, DbState>,
    news_ids: Vec<i64>,
    label_ids: Vec<i64>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let labels_str = if label_ids.is_empty() {
        None
    } else {
        Some(label_ids.iter().map(|l| l.to_string()).collect::<Vec<_>>().join(","))
    };

    let placeholders: Vec<String> = news_ids.iter().map(|_| "?".to_string()).collect();
    let placeholders_str = placeholders.join(",");

    let query = format!(
        "UPDATE news SET labels = ?1 WHERE id IN ({})",
        placeholders_str
    );

    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    params_vec.push(Box::new(labels_str));
    for id in &news_ids {
        params_vec.push(Box::new(*id));
    }

    let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();

    conn.execute(&query, params_refs.as_slice())
        .map_err(|e| e.to_string())?;

    Ok(())
}
```

**Step 2: Export from commands/mod.rs**

In `src-tauri/src/commands/mod.rs`, add:

```rust
pub mod labels;
```

And add to the `pub use` statements:

```rust
pub use labels::*;
```

**Step 3: Register in lib.rs**

In `src-tauri/src/lib.rs`, add to the `generate_handler![]` macro:

```rust
            commands::get_labels,
            commands::create_label,
            commands::update_label,
            commands::delete_label,
            commands::set_article_labels,
```

**Step 4: Verify**

Run: `cd src-tauri && cargo check`
Expected: Compiles cleanly

**Step 5: Commit**

```bash
git add src-tauri/src/commands/labels.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs
git commit -m "feat: add label Tauri commands (CRUD + article assignment)"
```

---

### Task 4: Create Label Frontend API and Store

**Files:**
- Modify: `src/api/commands.ts`
- Create: `src/stores/labelsStore.ts`
- Modify: `src/stores/index.ts`

**Step 1: Add label API commands**

In `src/api/commands.ts`, add:

```typescript
// Label commands
export async function getLabels(): Promise<Label[]> {
  return invoke<Label[]>('get_labels');
}

export async function createLabel(label: CreateLabel): Promise<number> {
  return invoke<number>('create_label', { label });
}

export async function updateLabel(label: UpdateLabel): Promise<void> {
  return invoke('update_label', { label });
}

export async function deleteLabel(id: number): Promise<void> {
  return invoke('delete_label', { id });
}

export async function setArticleLabels(newsIds: number[], labelIds: number[]): Promise<void> {
  return invoke('set_article_labels', { newsIds, labelIds });
}
```

Add the Label imports at the top:

```typescript
import type { Feed, CreateFeed, UpdateFeed, FeedCount, News, NewsFilter, NewsUpdate, Label, CreateLabel, UpdateLabel } from '../types';
```

**Step 2: Create labelsStore.ts**

Create `src/stores/labelsStore.ts`:

```typescript
import { create } from 'zustand';
import type { Label, CreateLabel, UpdateLabel } from '../types';
import * as api from '../api/commands';

interface LabelsState {
  labels: Label[];
  loading: boolean;
  error: string | null;

  loadLabels: () => Promise<void>;
  addLabel: (label: CreateLabel) => Promise<number>;
  updateLabel: (label: UpdateLabel) => Promise<void>;
  removeLabel: (id: number) => Promise<void>;
  setArticleLabels: (newsIds: number[], labelIds: number[]) => Promise<void>;
}

export const useLabelsStore = create<LabelsState>((set, get) => ({
  labels: [],
  loading: false,
  error: null,

  loadLabels: async () => {
    set({ loading: true, error: null });
    try {
      const labels = await api.getLabels();
      set({ labels, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  addLabel: async (label) => {
    const id = await api.createLabel(label);
    await get().loadLabels();
    return id;
  },

  updateLabel: async (label) => {
    await api.updateLabel(label);
    await get().loadLabels();
  },

  removeLabel: async (id) => {
    await api.deleteLabel(id);
    set(state => ({
      labels: state.labels.filter(l => l.id !== id),
    }));
  },

  setArticleLabels: async (newsIds, labelIds) => {
    await api.setArticleLabels(newsIds, labelIds);
  },
}));
```

**Step 3: Export from stores/index.ts**

In `src/stores/index.ts`, add:

```typescript
export { useLabelsStore } from './labelsStore';
```

**Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/api/commands.ts src/stores/labelsStore.ts src/stores/index.ts
git commit -m "feat: add label API commands and Zustand store"
```

---

### Task 5: Add Labels Tab to Settings Dialog

**Files:**
- Modify: `src/components/settings/SettingsDialog.tsx`

**Step 1: Add Labels tab**

In `src/components/settings/SettingsDialog.tsx`, add imports:

```typescript
import { Input, Badge } from '@fluentui/react-components';
import { AddRegular, DeleteRegular } from '@fluentui/react-icons';
import { useLabelsStore } from '../../stores';
```

Inside the `SettingsDialog` function, add:

```typescript
  const { labels, loadLabels, addLabel, updateLabel: modifyLabel, removeLabel } = useLabelsStore();
  const [newLabelName, setNewLabelName] = React.useState('');
  const [newLabelColor, setNewLabelColor] = React.useState('#0078d4');
```

Update the `useEffect` to also load labels:

```typescript
  React.useEffect(() => {
    if (open) {
      loadSettings();
      loadLabels();
    }
  }, [open, loadSettings, loadLabels]);
```

Add a new `<Tab>` after the Notifications tab:

```tsx
                  <Tab value="labels" id="labels">
                    Labels
                  </Tab>
```

Add the labels tab content after the notifications section:

```tsx
                  {selectedTab === 'labels' && (
                    <div className={styles.section}>
                      <div className={styles.sectionTitle}>Manage Labels</div>

                      {/* Add new label */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Input
                          size="small"
                          placeholder="Label name"
                          value={newLabelName}
                          onChange={(_, data) => setNewLabelName(data.value)}
                        />
                        <input
                          type="color"
                          value={newLabelColor}
                          onChange={(e) => setNewLabelColor(e.target.value)}
                          style={{ width: '32px', height: '32px', border: 'none', cursor: 'pointer' }}
                        />
                        <Button
                          size="small"
                          icon={<AddRegular />}
                          onClick={async () => {
                            if (newLabelName.trim()) {
                              await addLabel({ name: newLabelName.trim(), color: newLabelColor });
                              setNewLabelName('');
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>

                      {/* Label list */}
                      {labels.map(label => (
                        <div key={label.id} className={styles.settingRow}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Badge
                              size="small"
                              appearance="filled"
                              style={{ backgroundColor: label.color || '#0078d4' }}
                            >
                              {label.name}
                            </Badge>
                          </div>
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<DeleteRegular />}
                            onClick={() => removeLabel(label.id)}
                          />
                        </div>
                      ))}

                      {labels.length === 0 && (
                        <div style={{ color: tokens.colorNeutralForeground3, fontSize: '13px' }}>
                          No labels created yet
                        </div>
                      )}
                    </div>
                  )}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/settings/SettingsDialog.tsx
git commit -m "feat: add Labels management tab in Settings dialog"
```

---

### Task 6: Add Label Chips to NewsList and Label Filter in Sidebar

**Files:**
- Modify: `src/components/news/NewsList.tsx`
- Modify: `src/components/common/Sidebar.tsx`
- Modify: `src/stores/uiStore.ts`
- Modify: `src/App.tsx`

**Step 1: Add selectedLabelId to uiStore**

In `src/stores/uiStore.ts`, add to the interface:

```typescript
  selectedLabelId: number | null;
  selectLabel: (id: number | null) => void;
```

Add to the store:

```typescript
      selectedLabelId: null,
      selectLabel: (id) => set({ selectedLabelId: id }),
```

**Step 2: Show label chips in NewsList**

In `src/components/news/NewsList.tsx`, add imports:

```typescript
import { Badge } from '@fluentui/react-components';
import { useLabelsStore } from '../../stores';
```

Inside the component:

```typescript
  const { labels } = useLabelsStore();
```

In the title TableCell for each news item, after the title span, add label chips:

```tsx
                    {item.labels.length > 0 && (
                      <span style={{ display: 'inline-flex', gap: '4px', marginLeft: '8px' }}>
                        {item.labels.map(labelId => {
                          const label = labels.find(l => l.id === labelId);
                          return label ? (
                            <Badge
                              key={labelId}
                              size="tiny"
                              appearance="filled"
                              style={{ backgroundColor: label.color || '#0078d4', fontSize: '10px' }}
                            >
                              {label.name}
                            </Badge>
                          ) : null;
                        })}
                      </span>
                    )}
```

**Step 3: Add label filter to Sidebar**

In `src/components/common/Sidebar.tsx`, add imports:

```typescript
import { useLabelsStore } from '../../stores';
import { Badge } from '@fluentui/react-components';
```

Inside the component:

```typescript
  const { labels } = useLabelsStore();
  const { selectedLabelId, selectLabel } = useUIStore();
```

Replace the "No labels yet" placeholder with:

```tsx
        <div className={styles.sectionTitle}>Labels</div>
        {labels.map(label => (
          <div
            key={label.id}
            className={mergeClasses(styles.categoryItem, selectedLabelId === label.id ? styles.selected : '')}
            onClick={() => selectLabel(selectedLabelId === label.id ? null : label.id)}
          >
            <Badge
              size="tiny"
              appearance="filled"
              style={{ backgroundColor: label.color || '#0078d4' }}
            >
              &nbsp;
            </Badge>
            <span>{label.name}</span>
          </div>
        ))}
        {labels.length === 0 && (
          <div style={{ padding: '4px 12px', fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
            No labels yet
          </div>
        )}
```

**Step 4: Wire label filter in App.tsx**

In `src/App.tsx`, add label filtering logic. When `selectedLabelId` is set, load all news and filter client-side by label (since the backend doesn't have a label filter query):

```typescript
  const { selectedLabelId, selectLabel: setSelectedLabel } = useUIStore();
```

Add a useEffect:

```typescript
  // When a label is selected, load all articles and filter by label
  useEffect(() => {
    if (selectedLabelId !== null) {
      selectFeed(null);
      selectCategory(null);
      // Load all articles, then the NewsList will filter client-side
      loadNews({ limit: 500 });
    }
  }, [selectedLabelId, selectFeed, loadNews]);
```

In `NewsList.tsx`, add client-side label filtering. After the `news` destructuring from `useNewsStore`, add:

```typescript
  const { selectedLabelId } = useUIStore();

  const filteredNews = selectedLabelId
    ? news.filter(n => n.labels.includes(selectedLabelId))
    : news;
```

Then use `filteredNews` instead of `news` in the render (the `.map()` and `.length` checks).

**Step 5: Load labels on startup in App.tsx**

Add to the existing startup useEffect:

```typescript
  const { loadLabels } = useLabelsStore();

  useEffect(() => {
    loadFeeds();
    loadLabels();
  }, [loadFeeds, loadLabels]);
```

**Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add src/components/news/NewsList.tsx src/components/common/Sidebar.tsx src/stores/uiStore.ts src/App.tsx
git commit -m "feat: add label chips in news list and label filter in sidebar"
```

---

### Task 7: Add Label Picker in ContentViewer

**Files:**
- Modify: `src/components/content/ContentViewer.tsx`

**Step 1: Add label assignment UI**

In `src/components/content/ContentViewer.tsx`, add imports:

```typescript
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Badge,
} from '@fluentui/react-components';
import { TagRegular } from '@fluentui/react-icons';
import { useLabelsStore } from '../../stores';
```

Inside the component:

```typescript
  const { labels } = useLabelsStore();
  const { setArticleLabels } = useLabelsStore();
```

Add a label toggle handler:

```typescript
  const handleLabelToggle = async (labelId: number) => {
    if (!selectedNews) return;
    const currentLabels = selectedNews.labels;
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter(l => l !== labelId)
      : [...currentLabels, labelId];
    await setArticleLabels([selectedNews.id], newLabels);
    // Update local state
    const { loadNews, filter } = useNewsStore.getState();
    loadNews(filter);
  };
```

Add a label button in the actions area (after the Star/Delete/Open buttons):

```tsx
          {labels.length > 0 && (
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button
                  appearance="subtle"
                  icon={<TagRegular />}
                  title="Labels"
                >
                  Labels
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {labels.map(label => (
                    <MenuItem
                      key={label.id}
                      onClick={() => handleLabelToggle(label.id)}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge
                          size="tiny"
                          appearance="filled"
                          style={{ backgroundColor: label.color || '#0078d4' }}
                        >
                          &nbsp;
                        </Badge>
                        {label.name}
                        {selectedNews?.labels.includes(label.id) ? ' ✓' : ''}
                      </span>
                    </MenuItem>
                  ))}
                </MenuList>
              </MenuPopover>
            </Menu>
          )}
```

Also display current labels below the meta section:

```tsx
      {selectedNews.labels.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', padding: '4px 16px' }}>
          {selectedNews.labels.map(labelId => {
            const label = labels.find(l => l.id === labelId);
            return label ? (
              <Badge
                key={labelId}
                size="small"
                appearance="filled"
                style={{ backgroundColor: label.color || '#0078d4' }}
              >
                {label.name}
              </Badge>
            ) : null;
          })}
        </div>
      )}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/content/ContentViewer.tsx
git commit -m "feat: add label picker and display in ContentViewer"
```

---

### Task 8: Create Filter Models

**Files:**
- Create: `src/types/filter.ts`
- Modify: `src/types/index.ts`
- Create: `src-tauri/src/models/filter.rs`
- Modify: `src-tauri/src/models/mod.rs`

**Step 1: Create Rust Filter models**

Create `src-tauri/src/models/filter.rs`:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Filter {
    pub id: i64,
    pub name: String,
    pub enabled: bool,
    pub feed_ids: Vec<i64>,
    pub match_type: String, // "any" or "all"
    pub sort_order: i64,
    pub conditions: Vec<FilterCondition>,
    pub actions: Vec<FilterAction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterCondition {
    pub id: i64,
    pub filter_id: i64,
    pub field: String,    // "title", "author", "category", "content"
    pub operator: String, // "contains", "not_contains", "equals", "starts_with", "regex"
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterAction {
    pub id: i64,
    pub filter_id: i64,
    pub action: String, // "mark_read", "mark_starred", "add_label", "delete"
    pub params: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFilter {
    pub name: String,
    pub feed_ids: Vec<i64>,
    pub match_type: String,
    pub conditions: Vec<CreateFilterCondition>,
    pub actions: Vec<CreateFilterAction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFilterCondition {
    pub field: String,
    pub operator: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateFilterAction {
    pub action: String,
    pub params: Option<String>,
}
```

**Step 2: Export from models/mod.rs**

Add:

```rust
pub mod filter;
pub use filter::*;
```

**Step 3: Create TypeScript Filter types**

Create `src/types/filter.ts`:

```typescript
export interface Filter {
  id: number;
  name: string;
  enabled: boolean;
  feedIds: number[];
  matchType: 'any' | 'all';
  sortOrder: number;
  conditions: FilterCondition[];
  actions: FilterAction[];
}

export interface FilterCondition {
  id: number;
  filterId: number;
  field: 'title' | 'author' | 'category' | 'content';
  operator: 'contains' | 'not_contains' | 'equals' | 'starts_with' | 'regex';
  value: string;
}

export interface FilterAction {
  id: number;
  filterId: number;
  action: 'mark_read' | 'mark_starred' | 'add_label' | 'delete';
  params?: string;
}

export interface CreateFilter {
  name: string;
  feedIds: number[];
  matchType: 'any' | 'all';
  conditions: { field: string; operator: string; value: string }[];
  actions: { action: string; params?: string }[];
}
```

**Step 4: Export from types/index.ts**

Add:

```typescript
export * from './filter';
```

**Step 5: Verify**

Run: `cd src-tauri && cargo check`
Run: `npx tsc --noEmit`
Expected: Both clean

**Step 6: Commit**

```bash
git add src-tauri/src/models/filter.rs src-tauri/src/models/mod.rs src/types/filter.ts src/types/index.ts
git commit -m "feat: add Filter data models (Rust + TypeScript)"
```

---

### Task 9: Create Filter Database Operations

**Files:**
- Create: `src-tauri/src/db/filters.rs`
- Modify: `src-tauri/src/db/mod.rs`

**Step 1: Create db/filters.rs**

Create `src-tauri/src/db/filters.rs`:

```rust
use rusqlite::{Connection, params};
use crate::models::{Filter, FilterCondition, FilterAction, CreateFilter};

pub fn get_all(conn: &Connection) -> Result<Vec<Filter>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, enabled, feed_ids, match_type, sort_order FROM filters ORDER BY sort_order")
        .map_err(|e| e.to_string())?;

    let filters: Vec<Filter> = stmt
        .query_map([], |row| {
            let feed_ids_str: Option<String> = row.get(3)?;
            let feed_ids: Vec<i64> = feed_ids_str
                .and_then(|s| {
                    s.split(',')
                        .filter(|s| !s.is_empty())
                        .map(|s| s.parse::<i64>().ok())
                        .collect::<Option<Vec<_>>>()
                })
                .unwrap_or_default();

            Ok(Filter {
                id: row.get(0)?,
                name: row.get::<_, Option<String>>(1)?.unwrap_or_default(),
                enabled: row.get::<_, i64>(2)? != 0,
                feed_ids,
                match_type: row.get::<_, Option<String>>(4)?.unwrap_or_else(|| "any".to_string()),
                sort_order: row.get(5)?,
                conditions: vec![],
                actions: vec![],
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    // Load conditions and actions for each filter
    let mut result = Vec::new();
    for mut filter in filters {
        filter.conditions = get_conditions(conn, filter.id)?;
        filter.actions = get_actions(conn, filter.id)?;
        result.push(filter);
    }

    Ok(result)
}

fn get_conditions(conn: &Connection, filter_id: i64) -> Result<Vec<FilterCondition>, String> {
    let mut stmt = conn
        .prepare("SELECT id, filter_id, field, operator, value FROM filter_conditions WHERE filter_id = ?")
        .map_err(|e| e.to_string())?;

    let conditions = stmt
        .query_map(params![filter_id], |row| {
            Ok(FilterCondition {
                id: row.get(0)?,
                filter_id: row.get(1)?,
                field: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                operator: row.get::<_, Option<String>>(3)?.unwrap_or_default(),
                value: row.get::<_, Option<String>>(4)?.unwrap_or_default(),
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(conditions)
}

fn get_actions(conn: &Connection, filter_id: i64) -> Result<Vec<FilterAction>, String> {
    let mut stmt = conn
        .prepare("SELECT id, filter_id, action, params FROM filter_actions WHERE filter_id = ?")
        .map_err(|e| e.to_string())?;

    let actions = stmt
        .query_map(params![filter_id], |row| {
            Ok(FilterAction {
                id: row.get(0)?,
                filter_id: row.get(1)?,
                action: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                params: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(actions)
}

pub fn create(conn: &mut Connection, filter: &CreateFilter) -> Result<i64, String> {
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let feed_ids_str = if filter.feed_ids.is_empty() {
        None
    } else {
        Some(filter.feed_ids.iter().map(|id| id.to_string()).collect::<Vec<_>>().join(","))
    };

    tx.execute(
        "INSERT INTO filters (name, feed_ids, match_type) VALUES (?1, ?2, ?3)",
        params![filter.name, feed_ids_str, filter.match_type],
    )
    .map_err(|e| e.to_string())?;

    let filter_id = tx.last_insert_rowid();

    for cond in &filter.conditions {
        tx.execute(
            "INSERT INTO filter_conditions (filter_id, field, operator, value) VALUES (?1, ?2, ?3, ?4)",
            params![filter_id, cond.field, cond.operator, cond.value],
        )
        .map_err(|e| e.to_string())?;
    }

    for action in &filter.actions {
        tx.execute(
            "INSERT INTO filter_actions (filter_id, action, params) VALUES (?1, ?2, ?3)",
            params![filter_id, action.action, action.params],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(filter_id)
}

pub fn delete(conn: &Connection, id: i64) -> Result<(), String> {
    // CASCADE will handle conditions and actions
    conn.execute("DELETE FROM filters WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn set_enabled(conn: &Connection, id: i64, enabled: bool) -> Result<(), String> {
    conn.execute(
        "UPDATE filters SET enabled = ? WHERE id = ?",
        params![enabled as i64, id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Execute all enabled filters against the given news IDs.
/// Returns the number of articles affected.
pub fn execute_filters(conn: &Connection, news_ids: &[i64]) -> Result<usize, String> {
    if news_ids.is_empty() {
        return Ok(0);
    }

    let filters = get_all(conn)?;
    let enabled_filters: Vec<&Filter> = filters.iter().filter(|f| f.enabled).collect();

    if enabled_filters.is_empty() {
        return Ok(0);
    }

    let mut affected = 0;

    // Load the articles we need to check
    for &news_id in news_ids {
        let article = conn.query_row(
            "SELECT title, author, category, content, description FROM news WHERE id = ?",
            params![news_id],
            |row| {
                Ok((
                    row.get::<_, Option<String>>(0)?.unwrap_or_default(),
                    row.get::<_, Option<String>>(1)?.unwrap_or_default(),
                    row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                    row.get::<_, Option<String>>(3)?.unwrap_or_default(),
                    row.get::<_, Option<String>>(4)?.unwrap_or_default(),
                ))
            },
        ).map_err(|e| e.to_string())?;

        let (title, author, category, content, description) = article;
        let full_content = format!("{} {}", content, description);

        for filter in &enabled_filters {
            let matches = check_filter_conditions(filter, &title, &author, &category, &full_content);

            if matches {
                apply_filter_actions(conn, filter, news_id)?;
                affected += 1;
            }
        }
    }

    Ok(affected)
}

fn check_filter_conditions(filter: &Filter, title: &str, author: &str, category: &str, content: &str) -> bool {
    let results: Vec<bool> = filter.conditions.iter().map(|cond| {
        let field_value = match cond.field.as_str() {
            "title" => title,
            "author" => author,
            "category" => category,
            "content" => content,
            _ => "",
        };

        match cond.operator.as_str() {
            "contains" => field_value.to_lowercase().contains(&cond.value.to_lowercase()),
            "not_contains" => !field_value.to_lowercase().contains(&cond.value.to_lowercase()),
            "equals" => field_value.eq_ignore_ascii_case(&cond.value),
            "starts_with" => field_value.to_lowercase().starts_with(&cond.value.to_lowercase()),
            "regex" => {
                regex::Regex::new(&cond.value)
                    .map(|re| re.is_match(field_value))
                    .unwrap_or(false)
            }
            _ => false,
        }
    }).collect();

    if results.is_empty() {
        return false;
    }

    match filter.match_type.as_str() {
        "all" => results.iter().all(|&r| r),
        _ => results.iter().any(|&r| r), // "any" is default
    }
}

fn apply_filter_actions(conn: &Connection, filter: &Filter, news_id: i64) -> Result<(), String> {
    for action in &filter.actions {
        match action.action.as_str() {
            "mark_read" => {
                conn.execute("UPDATE news SET is_read = 1 WHERE id = ?", params![news_id])
                    .map_err(|e| e.to_string())?;
            }
            "mark_starred" => {
                conn.execute("UPDATE news SET is_starred = 1 WHERE id = ?", params![news_id])
                    .map_err(|e| e.to_string())?;
            }
            "add_label" => {
                if let Some(ref label_id_str) = action.params {
                    // Append label to existing labels
                    let current: Option<String> = conn.query_row(
                        "SELECT labels FROM news WHERE id = ?",
                        params![news_id],
                        |row| row.get(0),
                    ).map_err(|e| e.to_string())?;

                    let mut label_set: Vec<String> = current
                        .unwrap_or_default()
                        .split(',')
                        .filter(|s| !s.is_empty())
                        .map(|s| s.to_string())
                        .collect();

                    if !label_set.contains(label_id_str) {
                        label_set.push(label_id_str.clone());
                    }

                    let new_labels = label_set.join(",");
                    conn.execute(
                        "UPDATE news SET labels = ? WHERE id = ?",
                        params![new_labels, news_id],
                    )
                    .map_err(|e| e.to_string())?;
                }
            }
            "delete" => {
                conn.execute("UPDATE news SET is_deleted = 1 WHERE id = ?", params![news_id])
                    .map_err(|e| e.to_string())?;
            }
            _ => {}
        }
    }
    Ok(())
}
```

**Step 2: Add regex dependency to Cargo.toml**

In `src-tauri/Cargo.toml`, add under `[dependencies]`:

```toml
regex = "1"
```

**Step 3: Export from db/mod.rs**

Add:

```rust
pub mod filters;
```

**Step 4: Verify**

Run: `cd src-tauri && cargo check`
Expected: Compiles cleanly

**Step 5: Commit**

```bash
git add src-tauri/src/db/filters.rs src-tauri/src/db/mod.rs src-tauri/Cargo.toml
git commit -m "feat: add filter database operations with condition matching and action execution"
```

---

### Task 10: Create Filter Tauri Commands

**Files:**
- Create: `src-tauri/src/commands/filters.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Create commands/filters.rs**

Create `src-tauri/src/commands/filters.rs`:

```rust
use tauri::State;
use crate::db::DbState;
use crate::models::{Filter, CreateFilter};

#[tauri::command]
pub fn get_filters(db: State<'_, DbState>) -> Result<Vec<Filter>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::filters::get_all(&conn)
}

#[tauri::command]
pub fn create_filter(db: State<'_, DbState>, filter: CreateFilter) -> Result<i64, String> {
    let mut conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::filters::create(&mut conn, &filter)
}

#[tauri::command]
pub fn delete_filter(db: State<'_, DbState>, id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::filters::delete(&conn, id)
}

#[tauri::command]
pub fn set_filter_enabled(db: State<'_, DbState>, id: i64, enabled: bool) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    crate::db::filters::set_enabled(&conn, id, enabled)
}
```

**Step 2: Export from commands/mod.rs**

Add:

```rust
pub mod filters;
pub use filters::*;
```

**Step 3: Register in lib.rs**

Add to `generate_handler![]`:

```rust
            commands::get_filters,
            commands::create_filter,
            commands::delete_filter,
            commands::set_filter_enabled,
```

**Step 4: Verify**

Run: `cd src-tauri && cargo check`
Expected: Compiles cleanly

**Step 5: Commit**

```bash
git add src-tauri/src/commands/filters.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs
git commit -m "feat: add filter Tauri commands"
```

---

### Task 11: Auto-Execute Filters on New Articles

**Files:**
- Modify: `src-tauri/src/commands/feeds.rs`

**Step 1: Execute filters after inserting new articles**

In `src-tauri/src/commands/feeds.rs`, in the `update_feed_articles` function, after the for loop that inserts articles and before the `last_updated` update, add:

```rust
    // Collect IDs of newly inserted articles
    let new_article_ids: Vec<i64> = /* need to track these during insertion */;
```

To track new article IDs, modify the article insertion loop. Change:

```rust
            if crate::db::news::create(&conn, &news).is_ok() {
                new_count += 1;
            }
```

To:

```rust
            if let Ok(article_id) = crate::db::news::create(&conn, &news) {
                new_count += 1;
                new_article_ids.push(article_id);
            }
```

Add `let mut new_article_ids: Vec<i64> = Vec::new();` before the for loop (alongside `let mut new_count = 0;`).

Then after the loop, before the last_updated update:

```rust
    // Execute filters on new articles
    if !new_article_ids.is_empty() {
        let _ = crate::db::filters::execute_filters(&conn, &new_article_ids);
    }
```

Do the same for `update_all_feeds` — track `new_article_ids` in the inner loop and call `execute_filters` after.

**Step 2: Verify**

Run: `cd src-tauri && cargo check`
Expected: Compiles cleanly

**Step 3: Commit**

```bash
git add src-tauri/src/commands/feeds.rs
git commit -m "feat: auto-execute filters on newly fetched articles"
```

---

### Task 12: Create Filter Frontend API and Store

**Files:**
- Modify: `src/api/commands.ts`
- Create: `src/stores/filtersStore.ts`
- Modify: `src/stores/index.ts`

**Step 1: Add filter API commands**

In `src/api/commands.ts`, add:

```typescript
import type { ..., Filter, CreateFilter } from '../types';

// Filter commands
export async function getFilters(): Promise<Filter[]> {
  return invoke<Filter[]>('get_filters');
}

export async function createFilter(filter: CreateFilter): Promise<number> {
  return invoke<number>('create_filter', { filter });
}

export async function deleteFilter(id: number): Promise<void> {
  return invoke('delete_filter', { id });
}

export async function setFilterEnabled(id: number, enabled: boolean): Promise<void> {
  return invoke('set_filter_enabled', { id, enabled });
}
```

**Step 2: Create filtersStore.ts**

Create `src/stores/filtersStore.ts`:

```typescript
import { create } from 'zustand';
import type { Filter, CreateFilter } from '../types';
import * as api from '../api/commands';

interface FiltersState {
  filters: Filter[];
  loading: boolean;
  error: string | null;

  loadFilters: () => Promise<void>;
  addFilter: (filter: CreateFilter) => Promise<number>;
  removeFilter: (id: number) => Promise<void>;
  toggleFilter: (id: number, enabled: boolean) => Promise<void>;
}

export const useFiltersStore = create<FiltersState>((set, get) => ({
  filters: [],
  loading: false,
  error: null,

  loadFilters: async () => {
    set({ loading: true, error: null });
    try {
      const filters = await api.getFilters();
      set({ filters, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  addFilter: async (filter) => {
    const id = await api.createFilter(filter);
    await get().loadFilters();
    return id;
  },

  removeFilter: async (id) => {
    await api.deleteFilter(id);
    set(state => ({
      filters: state.filters.filter(f => f.id !== id),
    }));
  },

  toggleFilter: async (id, enabled) => {
    await api.setFilterEnabled(id, enabled);
    set(state => ({
      filters: state.filters.map(f =>
        f.id === id ? { ...f, enabled } : f
      ),
    }));
  },
}));
```

**Step 3: Export from stores/index.ts**

Add:

```typescript
export { useFiltersStore } from './filtersStore';
```

**Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/api/commands.ts src/stores/filtersStore.ts src/stores/index.ts
git commit -m "feat: add filter API commands and Zustand store"
```

---

### Task 13: Add Filters Tab to Settings Dialog

**Files:**
- Modify: `src/components/settings/SettingsDialog.tsx`

**Step 1: Add Filters tab**

Add imports:

```typescript
import { useFiltersStore } from '../../stores';
import { Dropdown, Option } from '@fluentui/react-components';
```

Inside the component, add:

```typescript
  const { filters, loadFilters, addFilter, removeFilter, toggleFilter } = useFiltersStore();
  const [filterName, setFilterName] = React.useState('');
  const [filterField, setFilterField] = React.useState('title');
  const [filterOperator, setFilterOperator] = React.useState('contains');
  const [filterValue, setFilterValue] = React.useState('');
  const [filterAction, setFilterAction] = React.useState('mark_read');
```

Update the open useEffect to also load filters:

```typescript
      loadFilters();
```

Add a `<Tab>` after Labels:

```tsx
                  <Tab value="filters" id="filters">
                    Filters
                  </Tab>
```

Add the filters tab content:

```tsx
                  {selectedTab === 'filters' && (
                    <div className={styles.section}>
                      <div className={styles.sectionTitle}>Create Filter</div>

                      <Input
                        size="small"
                        placeholder="Filter name"
                        value={filterName}
                        onChange={(_, data) => setFilterName(data.value)}
                      />

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px' }}>When</span>
                        <Dropdown
                          size="small"
                          value={filterField}
                          onOptionSelect={(_, data) => setFilterField(data.optionValue || 'title')}
                        >
                          <Option value="title">Title</Option>
                          <Option value="author">Author</Option>
                          <Option value="category">Category</Option>
                          <Option value="content">Content</Option>
                        </Dropdown>
                        <Dropdown
                          size="small"
                          value={filterOperator}
                          onOptionSelect={(_, data) => setFilterOperator(data.optionValue || 'contains')}
                        >
                          <Option value="contains">contains</Option>
                          <Option value="not_contains">does not contain</Option>
                          <Option value="equals">equals</Option>
                          <Option value="starts_with">starts with</Option>
                          <Option value="regex">matches regex</Option>
                        </Dropdown>
                        <Input
                          size="small"
                          placeholder="Value"
                          value={filterValue}
                          onChange={(_, data) => setFilterValue(data.value)}
                          style={{ flex: 1, minWidth: '120px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px' }}>Then</span>
                        <Dropdown
                          size="small"
                          value={filterAction}
                          onOptionSelect={(_, data) => setFilterAction(data.optionValue || 'mark_read')}
                        >
                          <Option value="mark_read">Mark as read</Option>
                          <Option value="mark_starred">Star</Option>
                          <Option value="delete">Delete</Option>
                        </Dropdown>
                        <Button
                          size="small"
                          icon={<AddRegular />}
                          onClick={async () => {
                            if (filterName.trim() && filterValue.trim()) {
                              await addFilter({
                                name: filterName.trim(),
                                feedIds: [],
                                matchType: 'any',
                                conditions: [{ field: filterField, operator: filterOperator, value: filterValue }],
                                actions: [{ action: filterAction }],
                              });
                              setFilterName('');
                              setFilterValue('');
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>

                      <div className={styles.sectionTitle} style={{ marginTop: '16px' }}>Active Filters</div>

                      {filters.map(filter => (
                        <div key={filter.id} className={styles.settingRow}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: filter.enabled ? '600' : '400' }}>{filter.name}</span>
                            <span className={styles.settingDescription}>
                              {filter.conditions.map(c => `${c.field} ${c.operator} "${c.value}"`).join(', ')}
                              {' → '}
                              {filter.actions.map(a => a.action.replace('_', ' ')).join(', ')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <Switch
                              checked={filter.enabled}
                              onChange={() => toggleFilter(filter.id, !filter.enabled)}
                            />
                            <Button
                              size="small"
                              appearance="subtle"
                              icon={<DeleteRegular />}
                              onClick={() => removeFilter(filter.id)}
                            />
                          </div>
                        </div>
                      ))}

                      {filters.length === 0 && (
                        <div style={{ color: tokens.colorNeutralForeground3, fontSize: '13px' }}>
                          No filters created yet
                        </div>
                      )}
                    </div>
                  )}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/settings/SettingsDialog.tsx
git commit -m "feat: add Filters management tab in Settings dialog"
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

- [ ] Settings > Labels tab shows label management UI
- [ ] Can create a label with name and color
- [ ] Can delete a label
- [ ] Labels appear in sidebar under "Labels" section
- [ ] Clicking a label filters articles by that label
- [ ] Label chips show on articles in NewsList
- [ ] ContentViewer shows current labels on selected article
- [ ] Can assign/remove labels via Labels button in ContentViewer
- [ ] Settings > Filters tab shows filter builder
- [ ] Can create a filter with condition + action
- [ ] Can toggle filter enabled/disabled
- [ ] Can delete a filter
- [ ] When new articles are fetched, enabled filters auto-execute
- [ ] Filter "mark_read" action marks matching articles as read
- [ ] Filter "mark_starred" action stars matching articles
- [ ] Filter "delete" action soft-deletes matching articles

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: complete Phase 7 - Labels & Filters"
```
