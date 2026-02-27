import { makeStyles } from '@fluentui/react-components';
import { useUIStore } from '../../stores';

const useStyles = makeStyles({
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    width: '200px',
    minWidth: '200px',
    backgroundColor: '#f5f5f5',
    borderRight: '1px solid #e0e0e0',
  },
  categoriesPanel: {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  },
});

export function Sidebar() {
  const styles = useStyles();
  const { categoriesPanelVisible } = useUIStore();

  if (!categoriesPanelVisible) {
    return null;
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.categoriesPanel}>
        <div style={{ padding: '16px 8px', color: '#666' }}>
          未读
          <br />
          收藏
          <br />
          标签
          <br />
          已删除
        </div>
      </div>
    </aside>
  );
}