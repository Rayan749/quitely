import { Layout, AppToolbar } from './components/common';
import { FeedTree } from './components/feeds';
import { NewsList, NewspaperView } from './components/news';
import { ContentViewer } from './components/content';
import { useFeedStore, useNewsStore, useUIStore, useSettingsStore, useLabelsStore } from './stores';
import { useKeyboardShortcuts, useTrayEvents } from './hooks';
import { cleanupDeletedNews } from './api/commands';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function App() {
  const { loadFeeds, selectedFeedId, selectFeed } = useFeedStore();
  const { clearNews, loadNews } = useNewsStore();
  const { selectedCategory, selectCategory, selectedLabelId, selectLabel, contentLayout } = useUIStore();
  const { settings, loadSettings } = useSettingsStore();
  const { loadLabels } = useLabelsStore();
  const { i18n } = useTranslation();

  useKeyboardShortcuts();
  useTrayEvents();

  useEffect(() => {
    loadFeeds();
    loadSettings();
    loadLabels();
  }, [loadFeeds, loadSettings, loadLabels]);

  useEffect(() => {
    // Cleanup deleted articles on startup
    if (settings.cleanupDays > 0) {
      cleanupDeletedNews(settings.cleanupDays).catch(console.error);
    }
  }, [settings.cleanupDays]);

  useEffect(() => {
    if (settings.language && settings.language !== i18n.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language, i18n]);

  // When a label is selected, load all articles and filter by label
  useEffect(() => {
    if (selectedLabelId !== null) {
      selectFeed(null);
      selectCategory(null);
      loadNews({ limit: 500 });
    }
  }, [selectedLabelId, selectFeed, selectCategory, loadNews]);

  // When a category is selected, clear feed selection and load with filter
  useEffect(() => {
    if (selectedCategory) {
      selectFeed(null);
      selectLabel(null);
      loadNews({
        unreadOnly: selectedCategory === 'unread',
        starredOnly: selectedCategory === 'starred',
        deletedOnly: selectedCategory === 'deleted',
        limit: 100,
      });
    }
  }, [selectedCategory, selectFeed, loadNews]);

  // When a feed is selected, clear category and let NewsList handle loading
  useEffect(() => {
    if (selectedFeedId !== null) {
      selectCategory(null);
      selectLabel(null);
    } else if (!selectedCategory) {
      clearNews();
    }
  }, [selectedFeedId, selectedCategory, selectCategory, clearNews]);

  return (
    <Layout>
      <AppToolbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '250px', minWidth: '250px', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
          <FeedTree />
        </div>
        {contentLayout === 'newspaper' ? (
          <NewspaperView />
        ) : (
          <>
            <div style={{ width: '350px', minWidth: '300px', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
              <NewsList feedId={selectedFeedId ?? undefined} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <ContentViewer />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default App;
