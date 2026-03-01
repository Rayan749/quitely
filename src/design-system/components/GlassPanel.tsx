import { makeStyles, mergeClasses } from '@fluentui/react-components';
import { macosGlass } from '../theme/tokens';
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
