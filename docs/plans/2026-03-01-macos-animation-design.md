# macOS Animation & Visual Design System

**Date:** 2026-03-01
**Status:** Approved

## Overview

Full macOS-style animation and visual redesign for Quitely RSS reader. Adds a design system layer with macOS theme tokens, Framer Motion animation primitives, and wrapped Fluent UI component variants.

## Approach

**Method:** Design System Layer (Option C) — dedicated `src/design-system/` directory containing theme, motion primitives, and macOS-styled component wrappers. Existing components import from the design system instead of using raw Fluent UI.

**Animation Library:** Framer Motion
**UI Library:** Fluent UI v9 (retained, themed via custom tokens)
**Scope:** Frontend only — stores, backend, and i18n unchanged.

## Design System Structure

```
src/design-system/
├── theme/
│   ├── macosTheme.ts          # Fluent UI custom theme token overrides
│   ├── tokens.ts              # macOS design token constants
│   └── fonts.ts               # SF Pro / Inter font configuration
├── motion/
│   ├── transitions.ts         # Spring configs and transition presets
│   ├── PageTransition.tsx     # Page-level slide + fade animation
│   ├── PanelTransition.tsx    # Panel expand/collapse animation
│   ├── ListItemTransition.tsx # List item stagger + selection animation
│   └── SpringScale.tsx        # Elastic scale wrapper (buttons, icons)
├── components/
│   ├── GlassPanel.tsx         # Frosted glass effect panel
│   ├── MacButton.tsx          # macOS-styled button (wraps Fluent Button)
│   ├── MacToolbar.tsx         # macOS-styled toolbar
│   ├── MacSidebar.tsx         # macOS-styled sidebar (translucent bg)
│   └── MacDialog.tsx          # macOS-styled dialog (spring popup)
└── index.ts                   # Unified exports
```

## Visual Theme

### Colors

| Token | Light | Dark |
|-------|-------|------|
| Background (main) | `rgba(255, 255, 255, 0.8)` + blur | `rgba(30, 30, 30, 0.85)` + blur |
| Sidebar bg | `rgba(246, 246, 246, 0.7)` | `rgba(40, 40, 40, 0.7)` |
| Accent (selection) | `#007AFF` | `#0A84FF` |
| Text primary | `#1D1D1F` | `#F5F5F7` |
| Text secondary | `#86868B` | `#8E8E93` |

### Border Radius

- Small (buttons, inputs): `6px`
- Medium (cards, panels): `10px`
- Large (dialogs): `12px`

### Shadows

- Hover: `0 2px 8px rgba(0,0,0,0.08)`
- Dialog: `0 20px 60px rgba(0,0,0,0.15)`

### Fonts

- Primary: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', sans-serif`
- Base size: `13px`

### Frosted Glass (GlassPanel)

```css
background: rgba(255, 255, 255, 0.7);
backdrop-filter: saturate(180%) blur(20px);
border: 1px solid rgba(255, 255, 255, 0.3);
```

## Animation System

### Spring Configurations

| Preset | Stiffness | Damping | Use Case |
|--------|-----------|---------|----------|
| snappy | 300 | 30 | Button press feedback |
| gentle | 200 | 25 | Panel expand/collapse |
| smooth | 150 | 20 | Page transitions |
| bouncy | 400 | 15 | Dialog popup |

### Page Transitions (PageTransition.tsx)

- **Enter:** Slide in from right (translateX: 100% -> 0) + fade in, spring `smooth`
- **Exit:** Slide out to left (translateX: 0 -> -30%) + fade out
- Uses `AnimatePresence` for exit animations
- Applied to: Settings page open/close, layout mode switch

### Panel Transitions (PanelTransition.tsx)

- **Expand:** Width animates from 0 to target, spring `gentle`
- **Collapse:** Content fades out first (opacity), then width animates to 0
- Drag resize follows finger, snaps to nearest stop point on release
- Applied to: Sidebar toggle, NewsList panel

### List Item Animations (ListItemTransition.tsx)

- **Enter:** Stagger animation, 30ms delay per item, slide up 8px + fade in
- **Selection:** Background color spring transition
- **Hover:** Subtle scale(1.01) + shadow increase
- Max stagger: 20 items, rest appear instantly

### Spring Scale (SpringScale.tsx)

- **Press:** scale(0.95), spring `snappy`
- **Release:** scale(1.0) spring back
- **Hover:** scale(1.05), very subtle
- Applied to: Toolbar buttons, settings button, all interactive icons

### Dialog Animation (MacDialog.tsx)

- **Open:** scale(0.9 -> 1.0) + fade in, spring `bouncy`
- **Close:** scale(1.0 -> 0.95) + fade out, duration 150ms
- Backdrop overlay: fade in 200ms

## Component Modifications

### Layout.tsx
- FluentProvider theme → `macosTheme` (light/dark)
- Root font family → SF Pro system stack

### Sidebar.tsx
- Wrap with `MacSidebar` → translucent bg + frosted glass
- Width from `uiStore.feedTreeWidth`, draggable resize
- `PanelTransition` for expand/collapse
- Category buttons: macOS blue selection + spring transition
- Settings button: `SpringScale`

### AppToolbar.tsx
- Wrap with `MacToolbar` → macOS title bar style
- Add `data-tauri-drag-region` for window drag
- Left padding ~70px for traffic lights
- Buttons: `SpringScale` press feedback
- SearchBox: 8px border-radius, macOS style

### App.tsx (Content Routing)
- Settings/main toggle: `PageTransition` + `AnimatePresence`
- List/Newspaper switch: `PageTransition`
- Draggable splitter between NewsList and ContentViewer

### NewsList.tsx
- Article items: `ListItemTransition`
- Stagger load animation
- Selection/hover spring transitions

### ContentViewer.tsx
- Content switch: fade + subtle slide up
- Loading state: skeleton fade-in

### AddFeedDialog.tsx & Other Dialogs
- Replace Fluent Dialog with `MacDialog` → spring popup/close

### FeedTree.tsx
- Folder expand/collapse: height animation
- Drag visual feedback: shadow + scale enhancement

## Tauri Configuration

### Window Transparency

In `tauri.conf.json`:
```json
{
  "app": {
    "windows": [{
      "transparent": true,
      "decorations": false
    }]
  }
}
```

Root HTML/body background set to transparent; React components draw their own backgrounds.

### Custom Title Bar

- Window `decorations: false` to hide native title bar
- Toolbar area gets `data-tauri-drag-region` for window dragging
- Left side reserves ~70px for macOS traffic light buttons (close/minimize/maximize)

## Performance & Accessibility

### Performance

- `backdrop-filter: blur()` may cause jank on low-end hardware → provide `reduceMotion` setting to disable
- Avoid Framer Motion `layout` animation on large lists → only animate visible items
- Stagger animation capped at 20 items; excess items appear instantly

### Accessibility

- Respect system `prefers-reduced-motion` → auto-downgrade to fade or no animation
- All ARIA attributes preserved through animation wrappers
- Focus management unaffected by transitions

## Unchanged

- Zustand store logic
- Tauri Rust backend
- i18n translations
- API/command layer
- Database schema
