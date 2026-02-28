import { makeStyles, tokens, Divider } from '@fluentui/react-components';
import { MailUnreadFilled, StarFilled, DeleteFilled } from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { useUIStore, useLabelsStore, useFeedStore } from '../../stores';
import type { Feed } from '../../types';
import React, { useMemo } from 'react';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  section: {
    padding: '8px 0',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: tokens.colorNeutralForeground3,
    padding: '8px 16px 4px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  itemSelected: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
    fontWeight: '600',
  },
  labelBadge: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  unreadBadge: {
    marginLeft: 'auto',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: '11px',
    padding: '1px 6px',
    borderRadius: '10px',
  },
  feedItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  feedChild: {
    paddingLeft: '32px',
  },
});

interface FeedItemProps {
  feed: Feed;
  tree: Map<number, Feed[]>;
  selectedFeedId: number | null;
  onSelect: (id: number) => void;
  level: number;
}

function FeedItem({ feed, tree, selectedFeedId, onSelect, level }: FeedItemProps): React.ReactElement {
  const styles = useStyles();
  const children = tree.get(feed.id) || [];
  const hasChildren = children.length > 0;
  const isSelected = selectedFeedId === feed.id;

  return (
    <div>
      <div
        className={`${styles.feedItem} ${isSelected ? styles.itemSelected : ''}`}
        style={{ paddingLeft: `${16 + level * 16}px` }}
        onClick={() => onSelect(feed.id)}
      >
        <span style={{ color: tokens.colorNeutralForeground3 }}>
          {hasChildren ? '📁' : '📰'}
        </span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {feed.title || feed.text}
        </span>
        {feed.unreadCount > 0 && (
          <span className={styles.unreadBadge}>{feed.unreadCount}</span>
        )}
      </div>
      {hasChildren && children.map((child) => (
        <FeedItem
          key={child.id}
          feed={child}
          tree={tree}
          selectedFeedId={selectedFeedId}
          onSelect={onSelect}
          level={level + 1}
        />
      ))}
    </div>
  );
}

export function Sidebar() {
  const styles = useStyles();
  const {
    selectedCategory,
    selectCategory,
    selectedLabelId,
    selectLabel,
  } = useUIStore();
  const { labels } = useLabelsStore();
  const { feeds, selectedFeedId, selectFeed } = useFeedStore();
  const { t } = useTranslation();

  // Build feed tree
  const feedTree = useMemo(() => {
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
  }, [feeds]);

  const rootFeeds = feedTree.get(0) || [];

  const handleCategoryClick = (category: 'unread' | 'starred' | 'deleted') => {
    selectCategory(selectedCategory === category ? null : category);
    selectFeed(null);
    selectLabel(null);
  };

  const handleLabelClick = (labelId: number) => {
    selectLabel(selectedLabelId === labelId ? null : labelId);
    selectFeed(null);
    selectCategory(null);
  };

  const handleFeedSelect = (feedId: number) => {
    selectFeed(feedId);
    selectCategory(null);
    selectLabel(null);
  };

  return (
    <nav className={styles.root} style={{ width: '260px', minWidth: '200px' }}>
      <div className={styles.content}>
        {/* Categories Section */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            {t('sidebar.categories', '分类')}
          </div>
          <div
            className={`${styles.item} ${selectedCategory === 'unread' ? styles.itemSelected : ''}`}
            onClick={() => handleCategoryClick('unread')}
          >
            <MailUnreadFilled />
            <span>{t('sidebar.unread', '未读')}</span>
          </div>
          <div
            className={`${styles.item} ${selectedCategory === 'starred' ? styles.itemSelected : ''}`}
            onClick={() => handleCategoryClick('starred')}
          >
            <StarFilled />
            <span>{t('sidebar.starred', '收藏')}</span>
          </div>
          <div
            className={`${styles.item} ${selectedCategory === 'deleted' ? styles.itemSelected : ''}`}
            onClick={() => handleCategoryClick('deleted')}
          >
            <DeleteFilled />
            <span>{t('sidebar.deleted', '已删除')}</span>
          </div>
        </div>

        <Divider />

        {/* Feeds Section */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            {t('sidebar.feeds', '订阅源')}
          </div>
          {rootFeeds.map((feed) => (
            <FeedItem
              key={feed.id}
              feed={feed}
              tree={feedTree}
              selectedFeedId={selectedFeedId}
              onSelect={handleFeedSelect}
              level={0}
            />
          ))}
          {feeds.length === 0 && (
            <div style={{ padding: '16px', fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
              {t('sidebar.noFeeds', '暂无订阅源')}
            </div>
          )}
        </div>

        <Divider />

        {/* Labels Section */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            {t('sidebar.labels', '标签')}
          </div>
          {labels.map((label) => (
            <div
              key={label.id}
              className={`${styles.item} ${selectedLabelId === label.id ? styles.itemSelected : ''}`}
              onClick={() => handleLabelClick(label.id)}
            >
              <span
                className={styles.labelBadge}
                style={{ backgroundColor: label.color || '#0078d4' }}
              />
              <span>{label.name}</span>
            </div>
          ))}
          {labels.length === 0 && (
            <div style={{ padding: '8px 16px', fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
              {t('sidebar.noLabels', '暂无标签')}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}