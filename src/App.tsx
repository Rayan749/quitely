import { Layout, AppToolbar } from './components/common';
import { FeedTree } from './components/feeds';
import { NewsList } from './components/news';
import { ContentViewer } from './components/content';
import { useFeedStore, useNewsStore } from './stores';
import { useKeyboardShortcuts, useTrayEvents } from './hooks';
import { useEffect } from 'react';

function App() {
  const { loadFeeds, selectedFeedId } = useFeedStore();
  const { clearNews } = useNewsStore();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Initialize tray event listeners
  useTrayEvents();

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  // Clear news when feed selection changes
  useEffect(() => {
    if (selectedFeedId === null) {
      clearNews();
    }
  }, [selectedFeedId, clearNews]);

  const handleRefresh = () => {
    loadFeeds();
  };

  return (
    <Layout>
      <AppToolbar onRefresh={handleRefresh} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Feed Tree Panel */}
        <div style={{ width: '250px', minWidth: '250px', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
          <FeedTree />
        </div>

        {/* News List Panel */}
        <div style={{ width: '350px', minWidth: '300px', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
          <NewsList feedId={selectedFeedId ?? undefined} />
        </div>

        {/* Content Viewer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ContentViewer />
        </div>
      </div>
    </Layout>
  );
}

export default App;