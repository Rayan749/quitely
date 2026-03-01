# Sidebar Selection Indicator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Fluent UI-style pill background + sliding left bar selection indicators to the Sidebar, with Framer Motion `layoutId` for smooth transitions between items within each section.

**Architecture:** Each section (categories, feeds, labels) gets its own `layoutId` namespace. Selected items render an absolutely-positioned pill background and left bar via `motion.div` with shared `layoutId`, so Framer Motion automatically animates the indicator sliding between items. Cross-section switches use `AnimatePresence` for fade transitions. The `PageTransition` component is updated to use Fluent UI motion curves.

**Tech Stack:** Framer Motion (`layoutId`, `AnimatePresence`), Fluent UI v9 tokens, existing design-system

---

### Task 1: Add Fluent UI Spring Preset to Transitions

**Files:**
- Modify: `src/design-system/motion/transitions.ts:1-75`

**Step 1: Add the Fluent UI spring preset**

Add after line 8 (after the `bouncy` entry in the `springs` object):

```typescript
  fluent: { type: 'spring' as const, stiffness: 500, damping: 35 },
```

So the springs object becomes:

```typescript
export const springs = {
  snappy: { type: 'spring' as const, stiffness: 300, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
  smooth: { type: 'spring' as const, stiffness: 150, damping: 20 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 15 },
  fluent: { type: 'spring' as const, stiffness: 500, damping: 35 },
} satisfies Record<string, Transition>;
```

**Step 2: Add Fluent UI page transition variants**

Add at the end of the file (after line 75):

```typescript
// Fluent UI page transition (subtle vertical slide + fade)
export const fluentPageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fluentPageTransition: Transition = {
  duration: 0.25,
  ease: [0.33, 0, 0, 1], // Fluent UI deceleration curve
};
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/design-system/motion/transitions.ts
git commit -m "feat(design-system): add Fluent UI spring preset and page transition variants"
```

---

### Task 2: Update PageTransition to Fluent UI Motion

**Files:**
- Modify: `src/design-system/motion/PageTransition.tsx:1-32`

**Step 1: Update imports and transition parameters**

Replace the entire file with:

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import { fluentPageVariants, fluentPageTransition } from './transitions';
import { useReducedMotion } from './useReducedMotion';

interface PageTransitionProps {
  children: React.ReactNode;
  transitionKey: string;
}

export function PageTransition({ children, transitionKey }: PageTransitionProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        variants={fluentPageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={fluentPageTransition}
        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Step 2: Update barrel export if needed**

Check `src/design-system/index.ts` — `PageTransition` is already exported (line 7). Also add the new exports. Add to line 6:

```typescript
export { springs, pageVariants, fluentPageVariants, fluentPageTransition, panelVariants, listItemVariants, dialogVariants, overlayVariants, springScaleVariants, contentFadeVariants, staggerContainer } from './motion/transitions';
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Verify the Settings page transition still works**

Run: `npm run tauri dev`
Expected: Clicking Settings in sidebar shows page with subtle vertical slide-up + fade-in animation. Closing returns with slide-up + fade-out.

**Step 5: Commit**

```bash
git add src/design-system/motion/PageTransition.tsx src/design-system/index.ts
git commit -m "feat: update PageTransition to Fluent UI motion curves"
```

---

### Task 3: Rewrite Sidebar with Pill + Bar Indicators

This is the main task. The Sidebar currently uses `GlassPanel`, `motion.div` with `macosColors`, and `SpringScale`. We'll replace the category selection rendering with `layoutId`-based pill + bar indicators using Fluent UI tokens.

**Files:**
- Modify: `src/components/common/Sidebar.tsx:1-171`

**Step 1: Rewrite the complete Sidebar component**

Replace the entire contents of `Sidebar.tsx` with:

```tsx
import { makeStyles, tokens, Divider, Button } from '@fluentui/react-components';
import { MailUnreadFilled, StarFilled, DeleteFilled, SettingsRegular } from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { useUIStore, useLabelsStore, useFeedStore } from '../../stores';
import { LabelDialog } from '../settings';
import { FeedTree } from '../feeds';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { springs } from '../../design-system/motion/transitions';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  footer: {
    padding: '8px',
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  section: {
    padding: '8px 0',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: tokens.colorNeutralForeground3,
    padding: '8px 16px 4px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    position: 'relative',
    borderRadius: '6px',
    margin: '1px 8px',
    transition: 'background-color 0.1s',
    ':hover': {
      backgroundColor: tokens.colorSubtleBackgroundHover,
    },
  },
  labelBadge: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
});

/**
 * Animated selection indicator with pill background + left bar.
 * Uses layoutId so Framer Motion animates it sliding between items in the same group.
 */
function SelectionIndicator({ groupId }: { groupId: string }) {
  return (
    <>
      {/* Pill background */}
      <motion.div
        layoutId={`${groupId}-pill`}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '6px',
          backgroundColor: tokens.colorSubtleBackgroundSelected,
          zIndex: 0,
        }}
        transition={springs.fluent}
      />
      {/* Left bar */}
      <motion.div
        layoutId={`${groupId}-bar`}
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          width: '3px',
          height: '16px',
          marginTop: '-8px',
          borderRadius: '0 2px 2px 0',
          backgroundColor: tokens.colorBrandForeground1,
          zIndex: 1,
        }}
        transition={springs.fluent}
      />
    </>
  );
}

export function Sidebar() {
  const styles = useStyles();
  const {
    selectedCategory,
    selectCategory,
    selectedLabelId,
    selectLabel,
    setSettingsPageOpen,
  } = useUIStore();
  const { labels } = useLabelsStore();
  const { selectedFeedId, selectFeed } = useFeedStore();
  const { t } = useTranslation();

  const handleCategoryClick = (category: 'unread' | 'starred' | 'deleted') => {
    selectCategory(selectedCategory === category ? null : category);
    selectFeed(null);
    selectLabel(null);
  };

  const handleLabelClick = (labelId: number) => {
    selectLabel(selectedLabelId === labelId ? null : labelId);
    selectFeed(null);
    selectCategory(null);
  };

  // Determine which section is active (for cross-section AnimatePresence)
  const activeSectionHasCategory = selectedCategory !== null;
  const activeSectionHasFeed = selectedFeedId !== null;
  const activeSectionHasLabel = selectedLabelId !== null;

  return (
    <nav className={styles.root} style={{ width: '20%', minWidth: '180px', maxWidth: '300px' }}>
      <div className={styles.content}>
        {/* Categories Section */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            {t('sidebar.categories')}
          </div>
          <LayoutGroup id="categories">
            <AnimatePresence>
              {(['unread', 'starred', 'deleted'] as const).map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <div
                    key={category}
                    className={styles.item}
                    onClick={() => handleCategoryClick(category)}
                    style={{ fontWeight: isSelected ? 600 : 400 }}
                  >
                    {isSelected && <SelectionIndicator groupId="category" />}
                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {category === 'unread' && <MailUnreadFilled />}
                      {category === 'starred' && <StarFilled />}
                      {category === 'deleted' && <DeleteFilled />}
                      <span>{t(`sidebar.${category}`)}</span>
                    </span>
                  </div>
                );
              })}
            </AnimatePresence>
          </LayoutGroup>
        </div>

        <Divider />

        {/* Feeds Section */}
        <div className={styles.section}>
          <FeedTree />
        </div>

        <Divider />

        {/* Labels Section */}
        <div className={styles.section}>
          <div className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '8px' }}>
            <span>{t('sidebar.labels')}</span>
            <LabelDialog />
          </div>
          <LayoutGroup id="labels">
            <AnimatePresence>
              {labels.map((label) => {
                const isSelected = selectedLabelId === label.id;
                return (
                  <div
                    key={label.id}
                    className={styles.item}
                    onClick={() => handleLabelClick(label.id)}
                    style={{ fontWeight: isSelected ? 600 : 400 }}
                  >
                    {isSelected && <SelectionIndicator groupId="label" />}
                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        className={styles.labelBadge}
                        style={{ backgroundColor: label.color || '#0078d4' }}
                      />
                      <span>{label.name}</span>
                    </span>
                  </div>
                );
              })}
            </AnimatePresence>
          </LayoutGroup>
          {labels.length === 0 && (
            <div style={{ padding: '8px 16px', fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
              {t('sidebar.noLabels')}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button
            appearance="subtle"
            icon={<SettingsRegular />}
            onClick={() => setSettingsPageOpen(true)}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            {t('sidebar.settings')}
          </Button>
        </div>
      </div>
    </nav>
  );
}
```

Key changes from current code:
- Removed `GlassPanel` wrapper — back to standard `<nav>` with Fluent UI `colorNeutralBackground2`
- Removed `SpringScale` from Settings button
- Removed `motion.div` with `macosColors` from categories
- Added `SelectionIndicator` component with `layoutId` for pill + bar
- Added `LayoutGroup` wrappers for categories and labels sections
- Items use `position: relative` so the absolutely-positioned indicator sits behind the content
- Content uses `position: relative; zIndex: 1` to sit above the indicator

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Verify sidebar renders correctly**

Run: `npm run tauri dev`

Test the following:
- Click "Unread" → pill background + left blue bar appears
- Click "Starred" → indicator slides smoothly from Unread to Starred position
- Click "Deleted" → indicator slides to Deleted
- Click same item again → indicator disappears (deselect)
- Click a label → label gets its own indicator (separate from categories)
- Click a category while a label is selected → label indicator disappears, category indicator appears
- Hover over unselected items → subtle hover background
- Dark mode → indicator colors adapt via Fluent UI tokens

**Step 4: Commit**

```bash
git add src/components/common/Sidebar.tsx
git commit -m "feat: add Fluent UI pill + bar selection indicators to Sidebar"
```

---

### Task 4: Add Selection Indicator to FeedTree

The FeedTree currently uses a static CSS class for selection (`styles.selected`). We'll add the same `SelectionIndicator` pattern with its own `layoutId` group so the indicator slides between feed items.

**Files:**
- Modify: `src/components/feeds/FeedTree.tsx:1-405`

**Step 1: Add the SelectionIndicator and LayoutGroup imports**

At the top of `FeedTree.tsx`, ensure these imports:

```typescript
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { springs } from '../../design-system/motion/transitions';
```

These imports already exist (lines 9-10), just add `LayoutGroup` to the framer-motion import.

**Step 2: Add SelectionIndicator component inside FeedTree.tsx**

Add before the `FeedItem` function (around line 70, after the `useStyles` block):

```typescript
function FeedSelectionIndicator() {
  return (
    <>
      <motion.div
        layoutId="feed-pill"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '4px',
          backgroundColor: tokens.colorSubtleBackgroundSelected,
          zIndex: 0,
        }}
        transition={springs.fluent}
      />
      <motion.div
        layoutId="feed-bar"
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          width: '3px',
          height: '16px',
          marginTop: '-8px',
          borderRadius: '0 2px 2px 0',
          backgroundColor: tokens.colorBrandForeground1,
          zIndex: 1,
        }}
        transition={springs.fluent}
      />
    </>
  );
}
```

**Step 3: Update the FeedItem `feedItem` style to support positioning**

In `useStyles`, update the `feedItem` class to add `position: 'relative'`:

```typescript
  feedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    cursor: 'pointer',
    borderRadius: '4px',
    position: 'relative',
    transition: 'background-color 0.1s',
    '&:hover': {
      backgroundColor: tokens.colorSubtleBackgroundHover,
    },
  },
```

And update `selected` to remove the background since the indicator handles it:

```typescript
  selected: {
    fontWeight: '600',
  },
```

**Step 4: Update FeedItem rendering to use the indicator**

In the `FeedItem` component, inside the inner `<div>` that has `className={...feedItem...}` (around line 183-224), add the `FeedSelectionIndicator` when selected and wrap the content in a relative-positioned span:

Replace the inner div content from line 194 onwards:

```tsx
<div
  className={`${styles.feedItem} ${isSelected ? styles.selected : ''} ${isDropTarget ? styles.dropTarget : ''}`}
  style={{ paddingLeft: `${8 + level * 16}px` }}
  onClick={() => onSelect(feed.id)}
  onContextMenu={(e) => e.preventDefault()}
  draggable={!isFolder}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
>
  {isSelected && <FeedSelectionIndicator />}
  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
    {isFolder && hasChildren ? (
      <motion.span
        animate={{ rotate: isExpanded ? 0 : -90 }}
        transition={springs.snappy}
        style={{ display: 'inline-flex', cursor: 'pointer' }}
        onClick={handleToggleExpand}
      >
        <ChevronDownRegular />
      </motion.span>
    ) : null}
    {isFolder && !hasChildren ? <FolderFilled /> : !isFolder ? <DocumentTextFilled /> : null}
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
  </span>
</div>
```

**Step 5: Wrap the FeedTree root with LayoutGroup**

In the `FeedTree` component (line 345+), wrap the feed items in a `LayoutGroup`:

```tsx
return (
  <div className={styles.container}>
    <Menu>
      {/* ... existing menu trigger and popover ... */}
    </Menu>
    <LayoutGroup id="feeds">
      {rootFeeds.map(feed => (
        <FeedItem
          key={feed.id}
          {/* ... all existing props ... */}
        />
      ))}
    </LayoutGroup>
    {feeds.length === 0 && (
      <div style={{ padding: '16px', color: tokens.colorNeutralForeground3 }}>
        {t('feedTree.empty')}
      </div>
    )}
    <AddFeedDialog
      open={showAddDialog}
      onOpenChange={setShowAddDialog}
    />
  </div>
);
```

**Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Verify feed selection indicator works**

Run: `npm run tauri dev`

Test:
- Click a feed → pill + bar indicator appears
- Click another feed → indicator slides to the new feed
- Click a feed in a different folder → indicator slides
- Expand/collapse folders → indicator stays on selected feed
- Select a category in sidebar → feed indicator disappears
- Select a feed again → indicator reappears

**Step 8: Commit**

```bash
git add src/components/feeds/FeedTree.tsx
git commit -m "feat: add sliding selection indicator to FeedTree"
```

---

### Task 5: Final TypeScript Check and Visual Verification

**Files:**
- No new files

**Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Run the app and verify all animations**

Run: `npm run tauri dev`

Verify each behavior:
- [ ] Categories: pill + left bar slides between Unread/Starred/Deleted
- [ ] Categories: deselect (click same) removes indicator
- [ ] Feeds: pill + left bar slides between feed items
- [ ] Labels: pill + left bar slides between label items
- [ ] Cross-section: selecting a feed deselects category indicator, and vice versa
- [ ] Settings page: opens with subtle vertical slide + fade
- [ ] Settings page: closes with reverse animation
- [ ] Dark mode: all indicators use correct Fluent UI dark tokens
- [ ] Hover: unselected items show subtle hover background
- [ ] No visual glitches during rapid clicking between items

**Step 3: Commit any fixes if needed**

```bash
git add -A
git commit -m "fix: polish sidebar indicator animations"
```
