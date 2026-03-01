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
