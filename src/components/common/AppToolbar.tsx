import { makeStyles, tokens, Button, Toolbar, ToolbarDivider, SearchBox } from '@fluentui/react-components';
import { ArrowSyncFilled, ArrowDownloadFilled, ArrowUploadFilled, WeatherSunnyRegular, WeatherMoonRegular, FolderAddRegular, TextColumnOneRegular, GridRegular } from '@fluentui/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { AddFeedDialog } from '../feeds';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { importOpml, exportOpml, updateAllFeeds } from '../../api/commands';
import { useFeedStore, useNewsStore, useSettingsStore, useUIStore } from '../../stores';
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
import { SpringScale } from '../../design-system';

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '78px', // space for macOS traffic lights
    paddingRight: '8px',
    paddingTop: '4px',
    paddingBottom: '4px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  searchBox: {
    borderRadius: '8px',
  },
});

export function AppToolbar() {
  const styles = useStyles();
  const { loadFeeds, selectedFeedId, addFeed } = useFeedStore();
  const { loadNews, searchNews: doSearch, clearSearch } = useNewsStore();
  const { settings, updateSetting } = useSettingsStore();
  const { contentLayout, setContentLayout } = useUIStore();
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = React.useState('');
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleLayoutToggle = () => {
    setContentLayout(contentLayout === 'list' ? 'newspaper' : 'list');
  };

  const handleThemeToggle = () => {
    const next = settings.theme === 'light' ? 'dark' : settings.theme === 'dark' ? 'system' : 'light';
    updateSetting('theme', next);
  };

  const themeLabel = settings.theme === 'light' ? t('toolbar.light') : settings.theme === 'dark' ? t('toolbar.dark') : t('toolbar.system');

  const handleNewFolder = async () => {
    try {
      await addFeed({ xmlUrl: '', title: 'New Folder' });
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

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
        loadNews({ feedId: selectedFeedId, limit: 50 });
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
            body: t('toolbar.newArticlesFound', { count: totalNew }),
          });
        }
      }
    } catch (error) {
      console.error('Failed to update feeds:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        doSearch(value.trim(), selectedFeedId ?? undefined);
      }, 300);
    } else {
      clearSearch();
      // Reload current feed's articles
      if (selectedFeedId) {
        loadNews({ feedId: selectedFeedId, limit: 50 });
      }
    }
  };

  return (
    <div className={styles.toolbar} data-tauri-drag-region="">
      <Toolbar>
        <AddFeedDialog />

        <SpringScale as="span">
          <Button
            appearance="subtle"
            icon={<FolderAddRegular />}
            onClick={handleNewFolder}
            title={t('toolbar.newFolder')}
          >
            {t('toolbar.folder')}
          </Button>
        </SpringScale>

        <ToolbarDivider />

        <SpringScale as="span">
          <Button
            appearance="subtle"
            icon={<ArrowUploadFilled />}
            onClick={handleImportOpml}
            title="Import OPML"
          >
            {t('toolbar.import')}
          </Button>
        </SpringScale>

        <SpringScale as="span">
          <Button
            appearance="subtle"
            icon={<ArrowDownloadFilled />}
            onClick={handleExportOpml}
            title="Export OPML"
          >
            {t('toolbar.export')}
          </Button>
        </SpringScale>

        <ToolbarDivider />

        <SpringScale as="span">
          <Button
            appearance="subtle"
            icon={<ArrowSyncFilled />}
            onClick={handleRefresh}
            title="Refresh all feeds"
          >
            {t('toolbar.refresh')}
          </Button>
        </SpringScale>

        <ToolbarDivider />

        <SearchBox
          size="small"
          placeholder={t('toolbar.search')}
          value={searchValue}
          onChange={(_, data) => handleSearchChange(data.value)}
          dismiss={searchValue ? {
            onClick: () => {
              setSearchValue('');
              clearSearch();
              if (selectedFeedId) {
                loadNews({ feedId: selectedFeedId, limit: 50 });
              }
            }
          } : undefined}
          className={styles.searchBox}
          style={{ width: '200px' }}
        />

        <ToolbarDivider />

        <SpringScale as="span">
          <Button
            appearance="subtle"
            icon={contentLayout === 'list' ? <TextColumnOneRegular /> : <GridRegular />}
            onClick={handleLayoutToggle}
            title={contentLayout === 'list' ? 'Newspaper mode' : 'List mode'}
          >
            {contentLayout === 'list' ? t('toolbar.list') : t('toolbar.newspaper')}
          </Button>
        </SpringScale>

        <SpringScale as="span">
          <Button
            appearance="subtle"
            icon={settings.theme === 'dark' ? <WeatherMoonRegular /> : <WeatherSunnyRegular />}
            onClick={handleThemeToggle}
            title={`Theme: ${themeLabel}`}
          >
            {themeLabel}
          </Button>
        </SpringScale>
      </Toolbar>
    </div>
  );
}