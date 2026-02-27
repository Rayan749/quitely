import { Layout, AppToolbar } from './components/common';
import { FeedTree } from './components/feeds';
import { useFeedStore } from './stores';
import { useEffect } from 'react';

function App() {
  const { loadFeeds } = useFeedStore();

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

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

        {/* News List Panel - Phase 3 */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ flex: '0 0 300px', borderBottom: '1px solid #e0e0e0', padding: '8px' }}>
            <h3>News List</h3>
            <p>Select a feed to view news</p>
          </div>

          {/* Content Viewer - Phase 3 */}
          <div style={{ flex: 1, padding: '8px', overflow: 'auto' }}>
            <h3>Content</h3>
            <p>Select a news item to view content</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;