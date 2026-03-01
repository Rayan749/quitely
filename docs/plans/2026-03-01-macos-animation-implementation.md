# macOS Animation & Visual Design System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a complete macOS-style design system with Framer Motion animations and custom Fluent UI theming to the Quitely RSS reader.

**Architecture:** Create `src/design-system/` with three layers — theme tokens (Fluent UI overrides), motion primitives (Framer Motion components), and macOS-styled wrapper components. Existing components import from the design system. Tauri window configured for transparency and custom title bar.

**Tech Stack:** Framer Motion, Fluent UI v9 custom themes, CSS `backdrop-filter`, Tauri v2 transparent windows

---

### Task 1: Install Framer Motion

**Files:**
- Modify: `package.json`

**Step 1: Install the dependency**

Run: `npm install framer-motion`

**Step 2: Verify installation**

Run: `npm ls framer-motion`
Expected: `framer-motion@` version listed without errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add framer-motion dependency"
```

---

### Task 2: Create Design Token Constants

**Files:**
- Create: `src/design-system/theme/tokens.ts`

**Step 1: Create the tokens file**

```typescript
// macOS-inspired design tokens

export const macosColors = {
  light: {
    background: 'rgba(255, 255, 255, 0.8)',
    backgroundSolid: '#FFFFFF',
    sidebarBackground: 'rgba(246, 246, 246, 0.7)',
    sidebarBackgroundSolid: '#F6F6F6',
    accent: '#007AFF',
    accentHover: '#0066D6',
    accentPressed: '#004EA2',
    textPrimary: '#1D1D1F',
    textSecondary: '#86868B',
    textTertiary: '#AEAEB2',
    separator: 'rgba(0, 0, 0, 0.1)',
    surfaceOverlay: 'rgba(255, 255, 255, 0.3)',
    hoverBackground: 'rgba(0, 0, 0, 0.04)',
    selectedBackground: 'rgba(0, 122, 255, 0.12)',
  },
  dark: {
    background: 'rgba(30, 30, 30, 0.85)',
    backgroundSolid: '#1E1E1E',
    sidebarBackground: 'rgba(40, 40, 40, 0.7)',
    sidebarBackgroundSolid: '#282828',
    accent: '#0A84FF',
    accentHover: '#409CFF',
    accentPressed: '#0071E3',
    textPrimary: '#F5F5F7',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',
    separator: 'rgba(255, 255, 255, 0.1)',
    surfaceOverlay: 'rgba(255, 255, 255, 0.08)',
    hoverBackground: 'rgba(255, 255, 255, 0.06)',
    selectedBackground: 'rgba(10, 132, 255, 0.2)',
  },
} as const;

export const macosRadii = {
  small: '6px',    // buttons, inputs
  medium: '10px',  // cards, panels
  large: '12px',   // dialogs
} as const;

export const macosShadows = {
  subtle: '0 1px 3px rgba(0, 0, 0, 0.06)',
  hover: '0 2px 8px rgba(0, 0, 0, 0.08)',
  elevated: '0 8px 24px rgba(0, 0, 0, 0.12)',
  dialog: '0 20px 60px rgba(0, 0, 0, 0.15)',
} as const;

export const macosFonts = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', sans-serif",
  fontFamilyMono: "'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  baseFontSize: '13px',
} as const;

export const macosGlass = {
  background: 'rgba(255, 255, 255, 0.7)',
  backgroundDark: 'rgba(40, 40, 40, 0.65)',
  backdropFilter: 'saturate(180%) blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderDark: '1px solid rgba(255, 255, 255, 0.08)',
} as const;
```

**Step 2: Commit**

```bash
git add src/design-system/theme/tokens.ts
git commit -m "feat(design-system): add macOS design token constants"
```

---

### Task 3: Create Fluent UI macOS Theme

**Files:**
- Create: `src/design-system/theme/macosTheme.ts`

**Step 1: Create the custom theme file**

This creates light and dark Fluent UI themes by spreading the default themes and overriding specific tokens with macOS values.

```typescript
import { createLightTheme, createDarkTheme, type BrandVariants } from '@fluentui/react-components';
import { macosColors, macosRadii, macosShadows, macosFonts } from './tokens';

// macOS blue brand ramp for Fluent UI
const macosBrand: BrandVariants = {
  10: '#001B3F',
  20: '#002D6B',
  30: '#003F97',
  40: '#0050BD',
  50: '#0062E3',
  60: '#0071F5',
  70: '#007AFF',  // macOS accent
  80: '#3395FF',
  90: '#66B0FF',
  100: '#99CBFF',
  110: '#B3D9FF',
  120: '#CCE6FF',
  130: '#E0EFFF',
  140: '#EFF6FF',
  150: '#F7FBFF',
  160: '#FFFFFF',
};

const baseLightTheme = createLightTheme(macosBrand);
const baseDarkTheme = createDarkTheme(macosBrand);

export const macosLightTheme = {
  ...baseLightTheme,
  fontFamilyBase: macosFonts.fontFamily,
  fontFamilyMonospace: macosFonts.fontFamilyMono,
  borderRadiusSmall: macosRadii.small,
  borderRadiusMedium: macosRadii.small,
  borderRadiusLarge: macosRadii.medium,
  borderRadiusXLarge: macosRadii.large,
  shadow2: macosShadows.subtle,
  shadow4: macosShadows.hover,
  shadow8: macosShadows.elevated,
  shadow16: macosShadows.elevated,
  shadow28: macosShadows.dialog,
  shadow64: macosShadows.dialog,
  colorNeutralForeground1: macosColors.light.textPrimary,
  colorNeutralForeground2: macosColors.light.textSecondary,
  colorNeutralForeground3: macosColors.light.textTertiary,
  colorNeutralBackground1: macosColors.light.backgroundSolid,
  colorNeutralBackground1Hover: macosColors.light.hoverBackground,
  colorNeutralBackground1Selected: macosColors.light.selectedBackground,
  colorBrandForeground1: macosColors.light.accent,
  colorBrandBackground: macosColors.light.accent,
  colorBrandBackgroundHover: macosColors.light.accentHover,
  colorBrandBackgroundPressed: macosColors.light.accentPressed,
  colorNeutralStroke1: macosColors.light.separator,
};

export const macosDarkTheme = {
  ...baseDarkTheme,
  fontFamilyBase: macosFonts.fontFamily,
  fontFamilyMonospace: macosFonts.fontFamilyMono,
  borderRadiusSmall: macosRadii.small,
  borderRadiusMedium: macosRadii.small,
  borderRadiusLarge: macosRadii.medium,
  borderRadiusXLarge: macosRadii.large,
  shadow2: macosShadows.subtle,
  shadow4: macosShadows.hover,
  shadow8: macosShadows.elevated,
  shadow16: macosShadows.elevated,
  shadow28: macosShadows.dialog,
  shadow64: macosShadows.dialog,
  colorNeutralForeground1: macosColors.dark.textPrimary,
  colorNeutralForeground2: macosColors.dark.textSecondary,
  colorNeutralForeground3: macosColors.dark.textTertiary,
  colorNeutralBackground1: macosColors.dark.backgroundSolid,
  colorNeutralBackground1Hover: macosColors.dark.hoverBackground,
  colorNeutralBackground1Selected: macosColors.dark.selectedBackground,
  colorBrandForeground1: macosColors.dark.accent,
  colorBrandBackground: macosColors.dark.accent,
  colorBrandBackgroundHover: macosColors.dark.accentHover,
  colorBrandBackgroundPressed: macosColors.dark.accentPressed,
  colorNeutralStroke1: macosColors.dark.separator,
};
```

**Step 2: Commit**

```bash
git add src/design-system/theme/macosTheme.ts
git commit -m "feat(design-system): add Fluent UI macOS light/dark themes"
```

---

### Task 4: Create Motion Presets

**Files:**
- Create: `src/design-system/motion/transitions.ts`

**Step 1: Create spring configs and transition presets**

```typescript
import type { Transition, Variants } from 'framer-motion';

// macOS-style spring configurations
export const springs = {
  snappy: { type: 'spring' as const, stiffness: 300, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
  smooth: { type: 'spring' as const, stiffness: 150, damping: 20 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 15 },
} satisfies Record<string, Transition>;

// Page transition variants (slide right-to-left)
export const pageVariants: Variants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

// Panel expand/collapse variants
export const panelVariants: Variants = {
  collapsed: { width: 0, opacity: 0 },
  expanded: (width: number) => ({
    width,
    opacity: 1,
  }),
};

// List item stagger variants
export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

// Dialog scale variants
export const dialogVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
};

// Backdrop overlay variants
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Spring scale for buttons (press effect)
export const springScaleVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.04 },
  tap: { scale: 0.95 },
};

// Content fade for article switching
export const contentFadeVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};

// Stagger container config
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
};

// Reduced motion fallback: instant transitions
export const reducedMotionTransition: Transition = {
  duration: 0,
};
```

**Step 2: Commit**

```bash
git add src/design-system/motion/transitions.ts
git commit -m "feat(design-system): add Framer Motion spring presets and variants"
```

---

### Task 5: Create PageTransition Component

**Files:**
- Create: `src/design-system/motion/PageTransition.tsx`

**Step 1: Create the component**

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import { pageVariants, springs } from './transitions';
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
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={springs.smooth}
        style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Step 2: Create the useReducedMotion hook**

Create: `src/design-system/motion/useReducedMotion.ts`

```typescript
import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}
```

**Step 3: Commit**

```bash
git add src/design-system/motion/PageTransition.tsx src/design-system/motion/useReducedMotion.ts
git commit -m "feat(design-system): add PageTransition component and useReducedMotion hook"
```

---

### Task 6: Create PanelTransition Component

**Files:**
- Create: `src/design-system/motion/PanelTransition.tsx`

**Step 1: Create the component**

```tsx
import { motion } from 'framer-motion';
import { springs } from './transitions';
import { useReducedMotion } from './useReducedMotion';

interface PanelTransitionProps {
  children: React.ReactNode;
  width: number;
  visible: boolean;
  style?: React.CSSProperties;
}

export function PanelTransition({ children, width, visible, style }: PanelTransitionProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return visible ? (
      <div style={{ width, overflow: 'hidden', ...style }}>{children}</div>
    ) : null;
  }

  return (
    <motion.div
      animate={{
        width: visible ? width : 0,
        opacity: visible ? 1 : 0,
      }}
      transition={springs.gentle}
      style={{ overflow: 'hidden', flexShrink: 0, ...style }}
    >
      {children}
    </motion.div>
  );
}
```

**Step 2: Commit**

```bash
git add src/design-system/motion/PanelTransition.tsx
git commit -m "feat(design-system): add PanelTransition component"
```

---

### Task 7: Create ListItemTransition Component

**Files:**
- Create: `src/design-system/motion/ListItemTransition.tsx`

**Step 1: Create the component**

```tsx
import { motion } from 'framer-motion';
import { listItemVariants, springs } from './transitions';
import { useReducedMotion } from './useReducedMotion';

interface ListItemTransitionProps {
  children: React.ReactNode;
  index: number;
  maxStagger?: number;
}

export function ListItemTransition({ children, index, maxStagger = 20 }: ListItemTransitionProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion || index >= maxStagger) {
    return <>{children}</>;
  }

  return (
    <motion.div
      variants={listItemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{
        ...springs.snappy,
        delay: index * 0.03,
      }}
    >
      {children}
    </motion.div>
  );
}
```

**Step 2: Commit**

```bash
git add src/design-system/motion/ListItemTransition.tsx
git commit -m "feat(design-system): add ListItemTransition component"
```

---

### Task 8: Create SpringScale Component

**Files:**
- Create: `src/design-system/motion/SpringScale.tsx`

**Step 1: Create the component**

```tsx
import { motion } from 'framer-motion';
import { springScaleVariants, springs } from './transitions';
import { useReducedMotion } from './useReducedMotion';

interface SpringScaleProps {
  children: React.ReactNode;
  as?: 'div' | 'span' | 'button';
  style?: React.CSSProperties;
  className?: string;
}

export function SpringScale({ children, as = 'div', style, className }: SpringScaleProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    const Tag = as;
    return <Tag style={style} className={className}>{children}</Tag>;
  }

  const Component = motion.create(as);

  return (
    <Component
      variants={springScaleVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      transition={springs.snappy}
      style={style}
      className={className}
    >
      {children}
    </Component>
  );
}
```

**Step 2: Commit**

```bash
git add src/design-system/motion/SpringScale.tsx
git commit -m "feat(design-system): add SpringScale component"
```

---

### Task 9: Create GlassPanel Component

**Files:**
- Create: `src/design-system/components/GlassPanel.tsx`

**Step 1: Create the component**

```tsx
import { makeStyles, mergeClasses } from '@fluentui/react-components';
import { macosGlass, macosColors } from '../theme/tokens';
import { useSettingsStore } from '../../stores';

const useStyles = makeStyles({
  glass: {
    backdropFilter: macosGlass.backdropFilter,
    WebkitBackdropFilter: macosGlass.backdropFilter,
  },
  light: {
    backgroundColor: macosGlass.background,
    borderRight: macosGlass.border,
  },
  dark: {
    backgroundColor: macosGlass.backgroundDark,
    borderRight: macosGlass.borderDark,
  },
});

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassPanel({ children, className, style }: GlassPanelProps) {
  const theme = useSettingsStore((s) => s.settings.theme);
  const styles = useStyles();

  // Determine effective theme
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div
      className={mergeClasses(styles.glass, isDark ? styles.dark : styles.light, className)}
      style={style}
    >
      {children}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/design-system/components/GlassPanel.tsx
git commit -m "feat(design-system): add GlassPanel frosted glass component"
```

---

### Task 10: Create MacDialog Component

**Files:**
- Create: `src/design-system/components/MacDialog.tsx`

**Step 1: Create the component**

This wraps Fluent UI Dialog with Framer Motion spring animations.

```tsx
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  type DialogProps,
} from '@fluentui/react-components';
import { motion, AnimatePresence } from 'framer-motion';
import { dialogVariants, overlayVariants, springs } from '../motion/transitions';
import { useReducedMotion } from '../motion/useReducedMotion';
import { macosShadows, macosRadii } from '../theme/tokens';

interface MacDialogProps extends DialogProps {
  children: React.ReactNode;
}

const MotionDialogSurface = motion.create(DialogSurface);

export function MacDialog({ children, open, ...props }: MacDialogProps) {
  const reducedMotion = useReducedMotion();

  return (
    <Dialog open={open} {...props}>
      <AnimatePresence>
        {open && (
          <MotionDialogSurface
            variants={reducedMotion ? undefined : dialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={reducedMotion ? { duration: 0 } : springs.bouncy}
            style={{
              borderRadius: macosRadii.large,
              boxShadow: macosShadows.dialog,
            }}
          >
            {children}
          </MotionDialogSurface>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

// Re-export Dialog sub-components for convenience
export { DialogBody, DialogTitle, DialogContent, DialogActions };
```

**Step 2: Commit**

```bash
git add src/design-system/components/MacDialog.tsx
git commit -m "feat(design-system): add MacDialog with spring animation"
```

---

### Task 11: Create Design System Index

**Files:**
- Create: `src/design-system/index.ts`

**Step 1: Create the barrel export**

```typescript
// Theme
export { macosLightTheme, macosDarkTheme } from './theme/macosTheme';
export { macosColors, macosRadii, macosShadows, macosFonts, macosGlass } from './theme/tokens';

// Motion
export { springs, pageVariants, panelVariants, listItemVariants, dialogVariants, overlayVariants, springScaleVariants, contentFadeVariants, staggerContainer } from './motion/transitions';
export { PageTransition } from './motion/PageTransition';
export { PanelTransition } from './motion/PanelTransition';
export { ListItemTransition } from './motion/ListItemTransition';
export { SpringScale } from './motion/SpringScale';
export { useReducedMotion } from './motion/useReducedMotion';

// Components
export { GlassPanel } from './components/GlassPanel';
export { MacDialog, DialogBody, DialogTitle, DialogContent, DialogActions } from './components/MacDialog';
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to design-system files

**Step 3: Commit**

```bash
git add src/design-system/index.ts
git commit -m "feat(design-system): add barrel export index"
```

---

### Task 12: Apply macOS Theme to Layout

**Files:**
- Modify: `src/components/common/Layout.tsx:1-61`

**Step 1: Replace Fluent theme imports with macOS theme**

In `Layout.tsx`, replace:
```typescript
import { FluentProvider, webLightTheme, webDarkTheme, makeStyles } from '@fluentui/react-components';
```
with:
```typescript
import { FluentProvider, makeStyles } from '@fluentui/react-components';
import { macosLightTheme, macosDarkTheme, macosFonts } from '../../design-system';
```

**Step 2: Update theme selection logic**

Replace all references to `webLightTheme` with `macosLightTheme` and `webDarkTheme` with `macosDarkTheme`.

In the `useMemo` that computes the theme:
```typescript
const currentTheme = useMemo(() => {
  if (theme === 'dark') return macosDarkTheme;
  if (theme === 'light') return macosLightTheme;
  return systemDark ? macosDarkTheme : macosLightTheme;
}, [theme, systemDark]);
```

**Step 3: Update the inline font to use macOS font as fallback**

Where the root div sets `fontFamily`:
```typescript
style={{
  fontFamily: settings.fontFamily || macosFonts.fontFamily,
  fontSize: settings.fontSize ? `${settings.fontSize}px` : macosFonts.baseFontSize,
}}
```

**Step 4: Verify the app still renders**

Run: `npm run dev`
Expected: App renders with new macOS blue accent and updated typography

**Step 5: Commit**

```bash
git add src/components/common/Layout.tsx
git commit -m "feat: apply macOS theme to Layout FluentProvider"
```

---

### Task 13: Apply Glass Effect and Animations to Sidebar

**Files:**
- Modify: `src/components/common/Sidebar.tsx:1-165`

**Step 1: Add imports**

Add at top of `Sidebar.tsx`:
```typescript
import { GlassPanel, SpringScale, macosColors, macosRadii } from '../../design-system';
import { motion } from 'framer-motion';
import { springs } from '../../design-system/motion/transitions';
```

**Step 2: Wrap the outer `<nav>` with GlassPanel**

Replace the outer `<nav>` element with `<GlassPanel>` using a `<nav>` inside. The GlassPanel provides the frosted glass background. Keep the existing width/min/max-width inline styles on the nav.

**Step 3: Add spring transitions to category buttons**

For each category button (Unread, Starred, Deleted), wrap the click handler area with `motion.div` that animates background color on selection:

```tsx
<motion.div
  animate={{
    backgroundColor: selectedCategory === 'unread'
      ? macosColors.light.selectedBackground
      : 'transparent',
  }}
  transition={springs.snappy}
  style={{ borderRadius: macosRadii.small, padding: '4px 8px', cursor: 'pointer' }}
  onClick={() => selectCategory('unread')}
>
  {/* existing button content */}
</motion.div>
```

**Step 4: Wrap Settings button with SpringScale**

```tsx
<SpringScale as="div">
  <Button
    appearance="subtle"
    icon={<SettingsRegular />}
    onClick={() => setSettingsPageOpen(true)}
    style={{ width: '100%', justifyContent: 'flex-start' }}
  >
    {t('sidebar.settings')}
  </Button>
</SpringScale>
```

**Step 5: Verify sidebar renders with glass effect**

Run: `npm run dev`
Expected: Sidebar has translucent background with blur effect, categories animate on selection, settings button has press feedback

**Step 6: Commit**

```bash
git add src/components/common/Sidebar.tsx
git commit -m "feat: add macOS glass effect and animations to Sidebar"
```

---

### Task 14: Apply macOS Toolbar Style

**Files:**
- Modify: `src/components/common/AppToolbar.tsx:1-221`

**Step 1: Add imports**

```typescript
import { SpringScale, macosRadii } from '../../design-system';
```

**Step 2: Add `data-tauri-drag-region` to toolbar container**

On the outermost toolbar wrapper div, add:
```tsx
<div className={styles.toolbar} data-tauri-drag-region="">
```

**Step 3: Add left padding for macOS traffic lights**

In the toolbar's `makeStyles`, add:
```typescript
toolbar: {
  paddingLeft: '78px', // space for macOS traffic lights
  // ... existing styles
},
```

**Step 4: Wrap toolbar action buttons with SpringScale**

For each `<Button>` in the toolbar (New Folder, Import, Export, Refresh, Layout toggle, Theme toggle), wrap with:
```tsx
<SpringScale as="span">
  <Button ... />
</SpringScale>
```

Do NOT wrap the SearchBox or AddFeedDialog trigger.

**Step 5: Increase SearchBox border radius**

Add to SearchBox inline style or makeStyles:
```typescript
searchBox: {
  borderRadius: '8px',
},
```

**Step 6: Verify toolbar renders correctly**

Run: `npm run dev`
Expected: Toolbar has left padding for traffic lights, buttons have spring press feedback, search box has rounded corners

**Step 7: Commit**

```bash
git add src/components/common/AppToolbar.tsx
git commit -m "feat: add macOS toolbar style with spring buttons and drag region"
```

---

### Task 15: Add Page Transitions to App.tsx

**Files:**
- Modify: `src/App.tsx:1-101`

**Step 1: Add imports**

```typescript
import { PageTransition } from './design-system';
```

**Step 2: Wrap settings/main content switch with PageTransition**

Replace the conditional rendering in App.tsx:

```tsx
// Before:
{settingsPageOpen ? (
  <SettingsPage />
) : (
  <>
    <AppToolbar />
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* content */}
    </div>
  </>
)}

// After:
<PageTransition transitionKey={settingsPageOpen ? 'settings' : 'main'}>
  {settingsPageOpen ? (
    <SettingsPage />
  ) : (
    <>
      <AppToolbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {contentLayout === 'newspaper' ? (
          <NewspaperView />
        ) : (
          <>
            <div style={{ width: '25%', minWidth: 250, borderRight: '1px solid var(--colorNeutralStroke1)' }}>
              <NewsList />
            </div>
            <div style={{ flex: 1 }}>
              <ContentViewer />
            </div>
          </>
        )}
      </div>
    </>
  )}
</PageTransition>
```

**Step 3: Verify page transitions work**

Run: `npm run dev`
Expected: Opening/closing Settings page has smooth slide + fade transition

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add page transition animation to settings/main content switch"
```

---

### Task 16: Add List Item Animations to NewsList

**Files:**
- Modify: `src/components/news/NewsList.tsx:1-249`

**Step 1: Add imports**

```typescript
import { ListItemTransition, SpringScale, macosColors } from '../../design-system';
import { motion } from 'framer-motion';
import { springs } from '../../design-system/motion/transitions';
```

**Step 2: Wrap each TableRow with ListItemTransition**

In the `.map()` that renders news items, wrap each `<TableRow>` with `<ListItemTransition>`:

```tsx
{displayedNews.map((item, index) => (
  <ListItemTransition key={item.id} index={index}>
    <TableRow
      // ... existing props
    >
      {/* ... existing cells */}
    </TableRow>
  </ListItemTransition>
))}
```

**Step 3: Add hover scale effect to action buttons**

Wrap the star and delete buttons in each row with `<SpringScale as="span">`.

**Step 4: Add animated selection highlight**

Replace the static selected background in `makeStyles` with an inline `motion.div` wrapper on each row that animates `backgroundColor`:

```tsx
<motion.div
  animate={{
    backgroundColor: selectedNewsId === item.id
      ? macosColors.light.selectedBackground
      : 'transparent',
  }}
  transition={springs.snappy}
>
  <TableRow ...>
```

Note: This may require adjusting the table structure. If Fluent UI Table doesn't compose well with motion wrappers, use `motion.tr` via `motion.create('tr')` instead.

**Step 5: Verify list animations**

Run: `npm run dev`
Expected: Articles stagger in when loading, selection animates smoothly, action buttons have spring feedback

**Step 6: Commit**

```bash
git add src/components/news/NewsList.tsx
git commit -m "feat: add stagger and selection animations to NewsList"
```

---

### Task 17: Add Content Fade to ContentViewer

**Files:**
- Modify: `src/components/content/ContentViewer.tsx:1-285`

**Step 1: Add imports**

```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { contentFadeVariants, springs } from '../../design-system/motion/transitions';
import { useReducedMotion } from '../../design-system';
```

**Step 2: Wrap article content with AnimatePresence keyed on selectedNewsId**

Around the article display area (after the empty state check), wrap with:

```tsx
<AnimatePresence mode="wait">
  {selectedNews && (
    <motion.div
      key={selectedNews.id}
      variants={contentFadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={springs.smooth}
      style={{ flex: 1, overflow: 'auto' }}
    >
      {/* existing article header + content */}
    </motion.div>
  )}
</AnimatePresence>
```

**Step 3: Verify content transitions**

Run: `npm run dev`
Expected: Switching between articles has a subtle fade + slide up animation

**Step 4: Commit**

```bash
git add src/components/content/ContentViewer.tsx
git commit -m "feat: add fade transition to ContentViewer article switch"
```

---

### Task 18: Add Spring Animation to AddFeedDialog

**Files:**
- Modify: `src/components/feeds/AddFeedDialog.tsx:1-192`

**Step 1: Replace Fluent Dialog imports with MacDialog**

Replace:
```typescript
import { Dialog, DialogTrigger, DialogSurface, DialogTitle, DialogBody, DialogContent, DialogActions, ... } from '@fluentui/react-components';
```
with:
```typescript
import { DialogTrigger } from '@fluentui/react-components';
import { MacDialog, DialogBody, DialogTitle, DialogContent, DialogActions } from '../../design-system';
```

Keep `DialogTrigger` from Fluent UI as it handles the trigger button.

**Step 2: Replace `<Dialog>` and `<DialogSurface>` with `<MacDialog>`**

Replace:
```tsx
<Dialog open={open} onOpenChange={...}>
  <DialogTrigger>...</DialogTrigger>
  <DialogSurface>
    <DialogBody>...</DialogBody>
  </DialogSurface>
</Dialog>
```
with:
```tsx
<MacDialog open={open} onOpenChange={...}>
  <DialogTrigger>...</DialogTrigger>
  <DialogBody>
    {/* existing content */}
  </DialogBody>
</MacDialog>
```

Note: `MacDialog` already renders `DialogSurface` internally with animation, so remove the explicit `<DialogSurface>` wrapper.

**Step 3: Verify dialog animation**

Run: `npm run dev`
Expected: Add Feed dialog pops in with bouncy spring animation and fades out on close

**Step 4: Commit**

```bash
git add src/components/feeds/AddFeedDialog.tsx
git commit -m "feat: use MacDialog with spring animation for AddFeedDialog"
```

---

### Task 19: Add Folder Expand/Collapse Animation to FeedTree

**Files:**
- Modify: `src/components/feeds/FeedTree.tsx:1-367`

**Step 1: Add imports**

```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { springs } from '../../design-system/motion/transitions';
import { SpringScale } from '../../design-system';
```

**Step 2: Animate folder children container**

In the `FeedItem` component, where folder children are rendered (the recursive section), wrap with:

```tsx
<AnimatePresence initial={false}>
  {isExpanded && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={springs.gentle}
      style={{ overflow: 'hidden' }}
    >
      {/* existing recursive children render */}
    </motion.div>
  )}
</AnimatePresence>
```

**Step 3: Enhance drag visual feedback**

When `isDragging` is true, apply a spring scale and elevated shadow instead of just opacity:

```tsx
<motion.div
  animate={{
    scale: isDragging ? 1.02 : 1,
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.15)' : '0 0 0 rgba(0,0,0,0)',
    opacity: isDragging ? 0.9 : 1,
  }}
  transition={springs.snappy}
>
  {/* existing feed item content */}
</motion.div>
```

**Step 4: Add chevron rotation animation**

For folder expand/collapse chevron icon, animate its rotation:

```tsx
<motion.span
  animate={{ rotate: isExpanded ? 0 : -90 }}
  transition={springs.snappy}
  style={{ display: 'inline-flex' }}
>
  <ChevronDownRegular />
</motion.span>
```

**Step 5: Verify feed tree animations**

Run: `npm run dev`
Expected: Folders expand/collapse with height animation, chevrons rotate, drag feedback shows scale + shadow

**Step 6: Commit**

```bash
git add src/components/feeds/FeedTree.tsx
git commit -m "feat: add expand/collapse and drag animations to FeedTree"
```

---

### Task 20: Configure Tauri Window for Transparency

**Files:**
- Modify: `src-tauri/tauri.conf.json`

**Step 1: Add transparent and decorations options**

In the window configuration, add:
```json
{
  "app": {
    "windows": [
      {
        "title": "quitely",
        "width": 800,
        "height": 600,
        "transparent": true,
        "decorations": false
      }
    ]
  }
}
```

**Step 2: Ensure HTML root is transparent**

In `index.html` or via CSS, ensure:
```css
html, body, #root {
  background: transparent;
}
```

Add this to `src/App.css` or as an inline style in `main.tsx`.

**Step 3: Add window controls compatibility**

Tauri v2 on macOS with `decorations: false` still shows traffic light buttons. Verify this is the case. If traffic lights disappear, we need to add `titleBarStyle: "overlay"` instead of `decorations: false`:

```json
"titleBarStyle": "overlay"
```

Note: Prefer `titleBarStyle: "overlay"` over `decorations: false` if available in Tauri v2, as it keeps the native traffic lights while allowing custom title bar content.

**Step 4: Test with Tauri dev**

Run: `npm run tauri dev`
Expected: Window has transparent background, traffic lights visible, toolbar area is draggable

**Step 5: Commit**

```bash
git add src-tauri/tauri.conf.json src/App.css
git commit -m "feat: configure Tauri window for transparency and custom title bar"
```

---

### Task 21: Final TypeScript Check and Visual Verification

**Files:**
- No new files

**Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Fix any TypeScript errors**

Address any type issues from Framer Motion integration with Fluent UI components.

**Step 3: Run Tauri dev and visually verify all animations**

Run: `npm run tauri dev`

Verify each animation:
- [ ] Settings page: slide in/out with spring transition
- [ ] Layout switch (list/newspaper): animated transition
- [ ] Sidebar: frosted glass background
- [ ] Sidebar categories: animated selection highlight
- [ ] Settings button: spring press feedback
- [ ] Toolbar buttons: spring press feedback
- [ ] Toolbar: left padding for traffic lights, drag region works
- [ ] Search box: rounded corners
- [ ] NewsList: articles stagger in on load
- [ ] NewsList: animated selection highlight
- [ ] ContentViewer: fade + slide when switching articles
- [ ] AddFeedDialog: spring popup/close
- [ ] FeedTree folders: expand/collapse height animation
- [ ] FeedTree chevron: rotation animation
- [ ] FeedTree drag: scale + shadow feedback
- [ ] Window: transparent background, traffic lights visible
- [ ] Dark mode: all effects work with dark theme
- [ ] Theme: macOS blue accent color throughout

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve TypeScript errors and polish animations"
```

---

### Task 22: Final Commit with Summary

**Step 1: Review all changes**

Run: `git log --oneline` to verify commit history is clean.

**Step 2: Verify no regressions**

Run: `npm run tauri dev` one final time and test all core RSS reader functionality:
- Add/remove feeds
- Read articles
- Star/delete articles
- Settings page navigation
- Theme switching
- Search

Expected: All functionality works as before, now with macOS animations.
