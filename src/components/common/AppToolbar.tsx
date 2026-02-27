import { makeStyles, tokens, Button, Toolbar, ToolbarDivider } from '@fluentui/react-components';
import { ArrowSyncFilled, ArrowDownloadFilled, ArrowUploadFilled } from '@fluentui/react-icons';
import { AddFeedDialog } from '../feeds';
import { SettingsDialog } from '../settings';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { importOpml, exportOpml, updateAllFeeds } from '../../api/commands';
import { useFeedStore, useNewsStore } from '../../stores';
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
});

export function AppToolbar() {
  const styles = useStyles();
  const { loadFeeds, selectedFeedId } = useFeedStore();
  const { loadNews } = useNewsStore();

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

  const handleRefresh = async () => {
    try {
      const results = await updateAllFeeds();
      console.log('Updated feeds:', results);
      loadFeeds();
      if (selectedFeedId) {
        loadNews({ feedId: selectedFeedId, limit: 100 });
      }

      // Show notification for new articles
      const totalNew = results.reduce((sum, r) => sum + r.new_count, 0);
      if (totalNew > 0) {
        let permissionGranted = await isPermissionGranted();
        if (!permissionGranted) {
          const permission = await requestPermission();
          permissionGranted = permission === 'granted';
        }
        if (permissionGranted) {
          sendNotification({
            title: 'Quitely RSS',
            body: `${totalNew} new article${totalNew > 1 ? 's' : ''} found`,
          });
        }
      }
    } catch (error) {
      console.error('Failed to update feeds:', error);
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
          onClick={handleRefresh}
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