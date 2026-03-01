import { useEffect, useState, useMemo } from 'react';
import {
  FluentProvider,
  makeStyles,
} from '@fluentui/react-components';
import { macosLightTheme, macosDarkTheme, macosFonts } from '../../design-system';
import { Sidebar } from './Sidebar';
import { useSettingsStore } from '../../stores';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
});

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const styles = useStyles();
  const { settings } = useSettingsStore();
  const [systemDark, setSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = useMemo(() => {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    return systemDark;
  }, [settings.theme, systemDark]);

  return (
    <FluentProvider theme={isDark ? macosDarkTheme : macosLightTheme}>
      <div className={styles.root} style={{ fontFamily: settings.fontFamily || macosFonts.fontFamily, fontSize: settings.fontSize ? `${settings.fontSize}px` : macosFonts.baseFontSize }}>
        <Sidebar />
        <div className={styles.main}>
          {children}
        </div>
      </div>
    </FluentProvider>
  );
}
