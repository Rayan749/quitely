import { makeStyles, tokens, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, Input } from '@fluentui/react-components';
import { FolderFilled, DocumentTextFilled, EditRegular, DeleteRegular } from '@fluentui/react-icons';
import { useFeedStore } from '../../stores';
import type { Feed } from '../../types';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

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
  renamingId: number | null;
  renameValue: string;
  setRenamingId: (id: number | null) => void;
  setRenameValue: (value: string) => void;
  onRename: (id: number, newTitle: string) => void;
  onDelete: (id: number) => void;
}

function FeedItem({ feed, tree, styles, selectedFeedId, onSelect, level = 0,
                    renamingId, renameValue, setRenamingId, setRenameValue,
                    onRename, onDelete }: FeedItemProps): React.ReactElement {
  const children = tree.get(feed.id) || [];
  const hasChildren = children.length > 0;
  const isSelected = selectedFeedId === feed.id;
  const isRenaming = renamingId === feed.id;
  const { t } = useTranslation();

  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
      onRename(feed.id, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <div>
      <Menu>
        <MenuTrigger>
          <div
            className={`${styles.feedItem} ${isSelected ? styles.selected : ''}`}
            style={{ paddingLeft: `${8 + level * 16}px` }}
            onClick={() => onSelect(feed.id)}
            onContextMenu={(e) => e.preventDefault()}
          >
            {hasChildren || !feed.xmlUrl ? <FolderFilled /> : <DocumentTextFilled />}
            {isRenaming ? (
              <Input
                size="small"
                value={renameValue}
                onChange={(_, data) => setRenameValue(data.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                autoFocus
              />
            ) : (
              <span>{feed.text || feed.title}</span>
            )}
            {!isRenaming && feed.unreadCount > 0 && (
              <span className={styles.unreadBadge}>{feed.unreadCount}</span>
            )}
            {feed.status === 'error' && (
              <span title={feed.errorMessage || 'Error'} style={{ color: '#d13438', fontSize: '12px' }}>⚠</span>
            )}
          </div>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem
              icon={<EditRegular />}
              onClick={() => {
                setRenamingId(feed.id);
                setRenameValue(feed.text || feed.title);
              }}
            >
              {t('feedTree.rename')}
            </MenuItem>
            <MenuItem
              icon={<DeleteRegular />}
              onClick={() => onDelete(feed.id)}
            >
              {t('feedTree.delete')}
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
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
              renamingId={renamingId}
              renameValue={renameValue}
              setRenamingId={setRenamingId}
              setRenameValue={setRenameValue}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FeedTree() {
  const styles = useStyles();
  const { feeds, selectedFeedId, selectFeed, updateFeed, deleteFeed: removeFeed } = useFeedStore();
  const [renamingId, setRenamingId] = React.useState<number | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const { t } = useTranslation();

  const tree = buildFeedTree(feeds);
  const rootFeeds = tree.get(0) || [];

  const handleRename = async (id: number, newTitle: string) => {
    await updateFeed({ id, title: newTitle });
  };

  const handleDelete = async (id: number) => {
    await removeFeed(id);
  };

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
          renamingId={renamingId}
          renameValue={renameValue}
          setRenamingId={setRenamingId}
          setRenameValue={setRenameValue}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      ))}
      {feeds.length === 0 && (
        <div style={{ padding: '16px', color: tokens.colorNeutralForeground3 }}>
          {t('feedTree.empty')}
        </div>
      )}
    </div>
  );
}
