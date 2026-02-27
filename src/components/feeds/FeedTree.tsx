import { makeStyles, tokens } from '@fluentui/react-components';
import { FolderFilled, DocumentTextFilled } from '@fluentui/react-icons';
import { useFeedStore } from '../../stores';
import type { Feed } from '../../types';
import React from 'react';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
    padding: '8px',
  },
  feedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 8px',
    cursor: 'pointer',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  selected: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
  },
  unreadBadge: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '10px',
    marginLeft: 'auto',
  },
  childContainer: {
    marginLeft: '16px',
  },
});

function buildFeedTree(feeds: Feed[]): Map<number, Feed[]> {
  const tree = new Map<number, Feed[]>();
  tree.set(0, []);

  for (const feed of feeds) {
    const parentId = feed.parentId || 0;
    if (!tree.has(parentId)) {
      tree.set(parentId, []);
    }
    tree.get(parentId)!.push(feed);
  }

  return tree;
}

interface FeedItemProps {
  feed: Feed;
  tree: Map<number, Feed[]>;
  styles: ReturnType<typeof useStyles>;
  selectedFeedId: number | null;
  onSelect: (id: number) => void;
  level?: number;
}

function FeedItem({ feed, tree, styles, selectedFeedId, onSelect, level = 0 }: FeedItemProps): React.ReactElement {
  const children = tree.get(feed.id) || [];
  const hasChildren = children.length > 0;
  const isSelected = selectedFeedId === feed.id;

  return (
    <div>
      <div
        className={`${styles.feedItem} ${isSelected ? styles.selected : ''}`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => onSelect(feed.id)}
      >
        {hasChildren ? <FolderFilled /> : <DocumentTextFilled />}
        <span>{feed.text || feed.title}</span>
        {feed.unreadCount > 0 && (
          <span className={styles.unreadBadge}>{feed.unreadCount}</span>
        )}
      </div>
      {hasChildren && (
        <div className={styles.childContainer}>
          {children.map(child => (
            <FeedItem
              key={child.id}
              feed={child}
              tree={tree}
              styles={styles}
              selectedFeedId={selectedFeedId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FeedTree() {
  const styles = useStyles();
  const { feeds, selectedFeedId, selectFeed } = useFeedStore();
  const tree = buildFeedTree(feeds);
  const rootFeeds = tree.get(0) || [];

  return (
    <div className={styles.container}>
      {rootFeeds.map(feed => (
        <FeedItem
          key={feed.id}
          feed={feed}
          tree={tree}
          styles={styles}
          selectedFeedId={selectedFeedId}
          onSelect={selectFeed}
        />
      ))}
      {feeds.length === 0 && (
        <div style={{ padding: '16px', color: tokens.colorNeutralForeground3 }}>
          No feeds yet. Click "Add Feed" to get started.
        </div>
      )}
    </div>
  );
}