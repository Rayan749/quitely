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
