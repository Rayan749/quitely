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
