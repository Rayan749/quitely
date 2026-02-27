import { makeStyles, tokens, Button, Toolbar, ToolbarDivider } from '@fluentui/react-components';
import { ArrowSyncFilled, SettingsFilled, AddFilled } from '@fluentui/react-icons';
import { AddFeedDialog } from '../feeds';

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
});

interface AppToolbarProps {
  onRefresh?: () => void;
  onSettings?: () => void;
}

export function AppToolbar({ onRefresh, onSettings }: AppToolbarProps) {
  const styles = useStyles();

  return (
    <div className={styles.toolbar}>
      <Toolbar>
        <AddFeedDialog />

        <ToolbarDivider />

        <Button
          appearance="subtle"
          icon={<ArrowSyncFilled />}
          onClick={onRefresh}
          title="Refresh all feeds"
        >
          Refresh
        </Button>

        <ToolbarDivider />

        <Button
          appearance="subtle"
          icon={<SettingsFilled />}
          onClick={onSettings}
          title="Settings"
        >
          Settings
        </Button>
      </Toolbar>
    </div>
  );
}