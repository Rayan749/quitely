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
