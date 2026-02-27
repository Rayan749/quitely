import { useState } from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Sidebar } from './Sidebar';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: tokens.backgroundColorDefault,
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
  const [isDarkMode] = useState(false);

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <div className={styles.root}>
        <Sidebar />
        <div className={styles.main}>
          {children}
        </div>
      </div>
    </FluentProvider>
  );
}