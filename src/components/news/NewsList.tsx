import * as React from 'react';
import { makeStyles, tokens, Table, TableHeader, TableBody, TableRow, TableCell, TableCellLayout, Button, Badge } from '@fluentui/react-components';
import { StarFilled, StarRegular, DeleteRegular, GlobeRegular } from '@fluentui/react-icons';
import { useNewsStore } from '../../stores';
import type { News } from '../../types';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  title: {
    fontWeight: '600',
    fontSize: '14px',
  },
  list: {
    flex: 1,
    overflow: 'auto',
  },
  row: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  selectedRow: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
  },
  unread: {
    fontWeight: '600',
  },
  read: {
    color: tokens.colorNeutralForeground2,
  },
  titleCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: tokens.colorNeutralForeground2,
    padding: '24px',
    textAlign: 'center',
  },
});

interface NewsListProps {
  feedId?: number;
  onNewsSelect?: (news: News) => void;
}

export function NewsList({ feedId, onNewsSelect }: NewsListProps) {
  const styles = useStyles();
  const { news, selectedNewsId, loading, selectNews, loadNews, markStarred, deleteNews } = useNewsStore();

  // Load news when feedId changes
  React.useEffect(() => {
    if (feedId !== undefined) {
      loadNews({ feedId, limit: 100 });
    }
  }, [feedId, loadNews]);

  const handleRowClick = (item: News) => {
    selectNews(item.id);
    onNewsSelect?.(item);
  };

  const handleStarClick = (e: React.MouseEvent, item: News) => {
    e.stopPropagation();
    markStarred([item.id], !item.isStarred);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: News) => {
    e.stopPropagation();
    deleteNews([item.id]);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.title}>News</span>
        </div>
        <div className={styles.empty}>
          <GlobeRegular style={{ fontSize: '48px', marginBottom: '16px' }} />
          <p>No articles yet</p>
          <p style={{ fontSize: '12px' }}>Select a feed to view articles</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>{news.length} articles</span>
      </div>
      <div className={styles.list}>
        <Table size="small">
          <TableHeader>
            <TableRow>
              <TableCell style={{ width: '40px' }}></TableCell>
              <TableCell style={{ width: '50%' }}>Title</TableCell>
              <TableCell style={{ width: '15%' }}>Author</TableCell>
              <TableCell style={{ width: '20%' }}>Date</TableCell>
              <TableCell style={{ width: '15%' }}>Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news.map((item) => (
              <TableRow
                key={item.id}
                className={`${styles.row} ${selectedNewsId === item.id ? styles.selectedRow : ''}`}
                onClick={() => handleRowClick(item)}
              >
                <TableCell>
                  {item.isStarred ? (
                    <StarFilled style={{ color: '#e6a23c' }} />
                  ) : (
                    !item.isRead && <Badge appearance="filled" color="danger" size="tiny" />
                  )}
                </TableCell>
                <TableCell>
                  <TableCellLayout
                    className={`${styles.titleCell} ${item.isRead ? styles.read : styles.unread}`}
                  >
                    <span title={item.title || ''}>
                      {item.title || 'Untitled'}
                    </span>
                  </TableCellLayout>
                </TableCell>
                <TableCell className={styles.read}>
                  {item.author || '-'}
                </TableCell>
                <TableCell className={styles.read}>
                  {formatDate(item.publishedAt)}
                </TableCell>
                <TableCell>
                  <div className={styles.meta}>
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={item.isStarred ? <StarFilled /> : <StarRegular />}
                      onClick={(e) => handleStarClick(e, item)}
                      title={item.isStarred ? 'Unstar' : 'Star'}
                    />
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<DeleteRegular />}
                      onClick={(e) => handleDeleteClick(e, item)}
                      title="Delete"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}