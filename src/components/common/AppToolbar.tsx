import { makeStyles, tokens, Button, Toolbar, ToolbarDivider } from '@fluentui/react-components';
import { ArrowSyncFilled, ArrowDownloadFilled, ArrowUploadFilled } from '@fluentui/react-icons';
import { AddFeedDialog } from '../feeds';
import { SettingsDialog } from '../settings';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { importOpml, exportOpml } from '../../api/commands';
import { useFeedStore } from '../../stores';

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
}

export function AppToolbar({ onRefresh }: AppToolbarProps) {
  const styles = useStyles();
  const { loadFeeds } = useFeedStore();

  const handleImportOpml = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'OPML', extensions: ['opml', 'xml'] }],
      });

      if (selected) {
        const content = await readFile(selected as string);
        const text = new TextDecoder().decode(content);
        const count = await importOpml(text);
        console.log(`Imported ${count} feeds`);
        loadFeeds();
      }
    } catch (error) {
      console.error('Failed to import OPML:', error);
    }
  };

  const handleExportOpml = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: true,
      });

      if (selected) {
        const opmlContent = await exportOpml();
        const filePath = `${selected}/quitely-feeds.opml`;
        await writeFile(filePath, new TextEncoder().encode(opmlContent));
        console.log('Exported feeds to:', filePath);
      }
    } catch (error) {
      console.error('Failed to export OPML:', error);
    }
  };

  return (
    <div className={styles.toolbar}>
      <Toolbar>
        <AddFeedDialog />

        <ToolbarDivider />

        <Button
          appearance="subtle"
          icon={<ArrowUploadFilled />}
          onClick={handleImportOpml}
          title="Import OPML"
        >
          Import
        </Button>

        <Button
          appearance="subtle"
          icon={<ArrowDownloadFilled />}
          onClick={handleExportOpml}
          title="Export OPML"
        >
          Export
        </Button>

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

        <SettingsDialog />
      </Toolbar>
    </div>
  );
}