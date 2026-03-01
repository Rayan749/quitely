# Sidebar Selection Indicator & Transition Design

**Date:** 2026-03-01
**Status:** Approved

## Overview

Add Fluent UI-style selection indicators and smooth transition animations to the Sidebar. Selected items show a pill background + left bar indicator. Switching between items within the same section triggers a sliding animation (Framer Motion `layoutId`). Also adjust the Settings page transition to match Fluent UI motion principles.

## Selection Indicator Visual Design

### Selected Item Composition

Each selected item has two overlaid animated elements:

1. **Pill background** — rounded rectangle (`borderRadius: 6px`), using Fluent UI `colorSubtleBackgroundSelected` token. Uses `layoutId` for smooth position animation between items.
2. **Left bar** — 3px wide, 16px tall rounded vertical bar in Fluent UI `colorBrandForeground1` (brand blue). Slides alongside the pill.

### Per-Section layoutId Strategy

- **Categories section**: `layoutId="category-pill"` + `layoutId="category-bar"` — slides between Unread/Starred/Deleted
- **Feeds section**: `layoutId="feed-pill"` — slides between feed items in FeedTree
- **Labels section**: `layoutId="label-pill"` — slides between label items
- **Cross-section**: When switching from categories to feeds (or vice versa), the old section's indicator fades out via `AnimatePresence`, and the new section's indicator fades in

### Unselected Items

- Normal: no background, standard text color
- Hover: `colorSubtleBackgroundHover` (CSS transition, 100ms)
- No left bar

## Animation Parameters

### Sidebar Indicator

- **Pill + bar slide**: `type: "spring", stiffness: 500, damping: 35` — fast, no bounce, Fluent-appropriate
- **Cross-section fade**: `opacity` transition `duration: 0.15s`
- **Hover**: CSS `transition: background-color 0.1s`

### Settings Page Transition

Adjust existing `PageTransition` component to Fluent UI motion:

- **Enter**: `opacity: 0 → 1, y: 20 → 0` (subtle slide up + fade in)
- **Exit**: `opacity: 1 → 0, y: 0 → -10` (subtle slide up + fade out)
- **Timing**: `duration: 0.25s, ease: [0.33, 0, 0, 1]` (Fluent UI deceleration curve)

## Files to Modify

1. `src/components/common/Sidebar.tsx` — Rewrite selection state rendering with pill/bar indicators and `layoutId`
2. `src/design-system/motion/transitions.ts` — Add Fluent UI spring preset
3. `src/design-system/motion/PageTransition.tsx` — Adjust to Fluent UI animation curves

## Unchanged

- `uiStore` selection logic
- `FeedTree` internal selection behavior
- `Layout.tsx`
- `AppToolbar.tsx`
- Backend / i18n / stores
