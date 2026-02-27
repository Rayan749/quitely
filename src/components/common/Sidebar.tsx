import { makeStyles, tokens } from '@fluentui/react-components';
import { useUIStore } from '../../stores';

const useStyles = makeStyles({
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    width: '200px',
    minWidth: '200px',
    backgroundColor: tokens.fillStyleNeutralBackground1,
    borderRight: `1px solid ${tokens.strokeColorNeutral1}`,
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
        <div style={{ padding: '16px 8px', color: tokens.colorNeutralForeground3 }}>
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