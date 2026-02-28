import { makeStyles, tokens, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, MenuDivider, Input } from '@fluentui/react-components';
import { FolderFilled, DocumentTextFilled, EditRegular, DeleteRegular, ArrowSyncRegular, CheckmarkRegular, ChevronDownRegular, AddRegular, FolderAddRegular } from '@fluentui/react-icons';
import { useFeedStore } from '../../stores';
import type { Feed } from '../../types';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as api from '../../api/commands';
import { AddFeedDialog } from './AddFeedDialog';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
    padding: '8px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
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
  dropTarget: {
    backgroundColor: tokens.colorBrandBackground2,
    outline: `2px dashed ${tokens.colorBrandStroke1}`,
  },
  dragging: {
    opacity: 0.5,
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
  onRefresh: (id: number) => void;
  onMarkRead: (id: number) => void;
  onMoveFeed: (feedId: number, newParentId: number) => void;
  draggedFeedId: number | null;
  setDraggedFeedId: (id: number | null) => void;
  dropTargetId: number | null;
  setDropTargetId: (id: number | null) => void;
}

function FeedItem({ feed, tree, styles, selectedFeedId, onSelect, level = 0,
                    renamingId, renameValue, setRenamingId, setRenameValue,
                    onRename, onDelete, onRefresh, onMarkRead, onMoveFeed,
                    draggedFeedId, setDraggedFeedId, dropTargetId, setDropTargetId }: FeedItemProps): React.ReactElement {
  const children = tree.get(feed.id) || [];
  const hasChildren = children.length > 0;
  const isSelected = selectedFeedId === feed.id;
  const isRenaming = renamingId === feed.id;
  const isFolder = !feed.xmlUrl;
  const isDragging = draggedFeedId === feed.id;
  const isDropTarget = dropTargetId === feed.id;
  const { t } = useTranslation();

  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
      onRename(feed.id, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (isFolder) return; // Only feeds can be dragged
    e.dataTransfer.setData('text/plain', String(feed.id));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedFeedId(feed.id);
  };

  const handleDragEnd = () => {
    setDraggedFeedId(null);
    setDropTargetId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isFolder) return; // Only folders can receive drops
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetId(feed.id);
  };

  const handleDragLeave = () => {
    if (dropTargetId === feed.id) {
      setDropTargetId(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isFolder) return;
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (draggedId && draggedId !== feed.id) {
      onMoveFeed(draggedId, feed.id);
    }
    setDropTargetId(null);
    setDraggedFeedId(null);
  };

  return (
    <div>
      <Menu>
        <MenuTrigger>
          <div
            className={`${styles.feedItem} ${isSelected ? styles.selected : ''} ${isDragging ? styles.dragging : ''} ${isDropTarget ? styles.dropTarget : ''}`}
            style={{ paddingLeft: `${8 + level * 16}px` }}
            onClick={() => onSelect(feed.id)}
            onContextMenu={(e) => e.preventDefault()}
            draggable={!isFolder}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {hasChildren || isFolder ? <FolderFilled /> : <DocumentTextFilled />}
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
            <MenuDivider />
            {feed.xmlUrl && (
              <MenuItem
                icon={<ArrowSyncRegular />}
                onClick={() => onRefresh(feed.id)}
              >
                {t('feedTree.refreshFeed')}
              </MenuItem>
            )}
            <MenuItem
              icon={<CheckmarkRegular />}
              onClick={() => onMarkRead(feed.id)}
            >
              {t('feedTree.markAllRead')}
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
              onRefresh={onRefresh}
              onMarkRead={onMarkRead}
              onMoveFeed={onMoveFeed}
              draggedFeedId={draggedFeedId}
              setDraggedFeedId={setDraggedFeedId}
              dropTargetId={dropTargetId}
              setDropTargetId={setDropTargetId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FeedTree() {
  const styles = useStyles();
  const { feeds, selectedFeedId, selectFeed, updateFeed, deleteFeed: removeFeed, moveFeed, markFeedAsRead, loadFeeds } = useFeedStore();
  const [renamingId, setRenamingId] = React.useState<number | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [draggedFeedId, setDraggedFeedId] = React.useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = React.useState<number | null>(null);
  const { t } = useTranslation();

  const tree = buildFeedTree(feeds);
  const rootFeeds = tree.get(0) || [];

  const handleRename = async (id: number, newTitle: string) => {
    await updateFeed({ id, title: newTitle });
  };

  const handleDelete = async (id: number) => {
    await removeFeed(id);
  };

  const handleRefresh = async (id: number) => {
    await api.updateFeedArticles(id);
    await loadFeeds();
  };

  const handleMarkRead = async (id: number) => {
    await markFeedAsRead(id);
  };

  const handleNewFolder = async () => {
    // Create a new folder (feed without xmlUrl)
    const folderName = t('feedTree.newFolder');
    await api.createFeed({ xmlUrl: '', title: folderName });
    await loadFeeds();
  };

  const handleMoveFeed = async (feedId: number, newParentId: number) => {
    await moveFeed(feedId, newParentId);
  };

  return (
    <div className={styles.container}>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <div className={styles.sectionHeader}>
            <span>{t('sidebar.feeds')}</span>
            <ChevronDownRegular />
          </div>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem
              icon={<AddRegular />}
              onClick={() => setShowAddDialog(true)}
            >
              {t('feedTree.addFeed')}
            </MenuItem>
            <MenuItem
              icon={<FolderAddRegular />}
              onClick={handleNewFolder}
            >
              {t('feedTree.newFolder')}
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
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
          onRefresh={handleRefresh}
          onMarkRead={handleMarkRead}
          onMoveFeed={handleMoveFeed}
          draggedFeedId={draggedFeedId}
          setDraggedFeedId={setDraggedFeedId}
          dropTargetId={dropTargetId}
          setDropTargetId={setDropTargetId}
        />
      ))}
      {feeds.length === 0 && (
        <div style={{ padding: '16px', color: tokens.colorNeutralForeground3 }}>
          {t('feedTree.empty')}
        </div>
      )}
      <AddFeedDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
