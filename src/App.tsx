import { Layout, AppToolbar } from './components/common';
import { FeedTree } from './components/feeds';
import { NewsList, NewspaperView } from './components/news';
import { ContentViewer } from './components/content';
import { useFeedStore, useNewsStore, useUIStore, useSettingsStore } from './stores';
import { useKeyboardShortcuts, useTrayEvents } from './hooks';
import { cleanupDeletedNews } from './api/commands';
import { useEffect } from 'react';

function App() {
  const { loadFeeds, selectedFeedId, selectFeed } = useFeedStore();
  const { clearNews, loadNews } = useNewsStore();
  const { selectedCategory, selectCategory, contentLayout } = useUIStore();
  const { settings, loadSettings } = useSettingsStore();

  useKeyboardShortcuts();
  useTrayEvents();

  useEffect(() => {
    loadFeeds();
    loadSettings();
  }, [loadFeeds, loadSettings]);

  useEffect(() => {
    // Cleanup deleted articles on startup
    if (settings.cleanupDays > 0) {
      cleanupDeletedNews(settings.cleanupDays).catch(console.error);
    }
  }, [settings.cleanupDays]);

  // When a category is selected, clear feed selection and load with filter
  useEffect(() => {
    if (selectedCategory) {
      selectFeed(null);
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
