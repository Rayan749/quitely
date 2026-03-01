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
import { dialogVariants, springs } from '../motion/transitions';
import { useReducedMotion } from '../motion/useReducedMotion';
import { macosShadows, macosRadii } from '../theme/tokens';

interface MacDialogProps extends Omit<DialogProps, 'children'> {
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
