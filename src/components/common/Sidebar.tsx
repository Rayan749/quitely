import { makeStyles, tokens, mergeClasses, Badge } from '@fluentui/react-components';
import { MailUnreadFilled, StarFilled, DeleteFilled } from '@fluentui/react-icons';
import { useUIStore, useLabelsStore } from '../../stores';

const useStyles = makeStyles({
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    width: '200px',
    minWidth: '200px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  categoriesPanel: {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  },
  categoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  selected: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground3,
    padding: '12px 12px 4px',
    textTransform: 'uppercase' as const,
  },
});

export function Sidebar() {
  const styles = useStyles();
  const { categoriesPanelVisible, selectedCategory, selectCategory, selectedLabelId, selectLabel } = useUIStore();
  const { labels } = useLabelsStore();

  if (!categoriesPanelVisible) {
    return null;
  }

  const handleCategoryClick = (category: 'unread' | 'starred' | 'deleted') => {
    selectCategory(selectedCategory === category ? null : category);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.categoriesPanel}>
        <div className={styles.sectionTitle}>Categories</div>
        <div
          className={mergeClasses(styles.categoryItem, selectedCategory === 'unread' ? styles.selected : '')}
          onClick={() => handleCategoryClick('unread')}
        >
          <MailUnreadFilled />
          <span>Unread</span>
        </div>
        <div
          className={mergeClasses(styles.categoryItem, selectedCategory === 'starred' ? styles.selected : '')}
          onClick={() => handleCategoryClick('starred')}
        >
          <StarFilled />
          <span>Starred</span>
        </div>
        <div
          className={mergeClasses(styles.categoryItem, selectedCategory === 'deleted' ? styles.selected : '')}
          onClick={() => handleCategoryClick('deleted')}
        >
          <DeleteFilled />
          <span>Deleted</span>
        </div>

        <div className={styles.sectionTitle}>Labels</div>
        {labels.map(label => (
          <div
            key={label.id}
            className={mergeClasses(styles.categoryItem, selectedLabelId === label.id ? styles.selected : '')}
            onClick={() => selectLabel(selectedLabelId === label.id ? null : label.id)}
          >
            <Badge
              size="tiny"
              appearance="filled"
              style={{ backgroundColor: label.color || '#0078d4' }}
            >
              &nbsp;
            </Badge>
            <span>{label.name}</span>
          </div>
        ))}
        {labels.length === 0 && (
          <div style={{ padding: '4px 12px', fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
            No labels yet
          </div>
        )}
      </div>
    </aside>
  );
}
