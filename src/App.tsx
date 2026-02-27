import { Layout, AppToolbar } from './components/common';
import { FeedTree } from './components/feeds';
import { NewsList, NewspaperView } from './components/news';
import { ContentViewer } from './components/content';
import { useFeedStore, useNewsStore, useUIStore } from './stores';
import { useKeyboardShortcuts, useTrayEvents } from './hooks';
import { useEffect } from 'react';

function App() {
  const { loadFeeds, selectedFeedId, selectFeed } = useFeedStore();
  const { clearNews, loadNews } = useNewsStore();
  const { selectedCategory, selectCategory, contentLayout } = useUIStore();

  useKeyboardShortcuts();
  useTrayEvents();

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

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
