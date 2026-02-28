import { makeStyles, tokens, Button } from '@fluentui/react-components';
import { StarFilled, StarRegular, DeleteRegular, OpenRegular } from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../utils/i18nDate';
import { useNewsStore } from '../../stores';
import DOMPurify from 'dompurify';

const useStyles = makeStyles({
  container: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
  },
  article: {
    maxWidth: '800px',
    margin: '0 auto 32px',
    padding: '24px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    marginBottom: '16px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  content: {
    lineHeight: '1.6',
    '& img': { maxWidth: '100%', height: 'auto' },
    '& a': { color: tokens.colorBrandForeground1 },
    '& pre': { backgroundColor: tokens.colorNeutralBackground3, padding: '12px', borderRadius: '4px', overflow: 'auto' },
    '& code': { backgroundColor: tokens.colorNeutralBackground3, padding: '2px 6px', borderRadius: '4px', fontSize: '13px' },
    '& blockquote': { borderLeft: `4px solid ${tokens.colorBrandStroke1}`, paddingLeft: '16px', marginLeft: 0, color: tokens.colorNeutralForeground2 },
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: tokens.colorNeutralForeground2,
  },
});

export function NewspaperView() {
  const styles = useStyles();
  const { t } = useTranslation();
  const { news, markStarred, deleteNews } = useNewsStore();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(getDateLocale(), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  if (news.length === 0) {
    return <div className={styles.empty}>{t('newspaperView.noArticles')}</div>;
  }

  return (
    <div className={styles.container}>
      {news.map(item => (
        <div key={item.id} className={styles.article}>
          <div className={styles.title}>{item.title || 'Untitled'}</div>
          <div className={styles.meta}>
            {item.author && <span>{item.author}</span>}
            {item.publishedAt && <span>{formatDate(item.publishedAt)}</span>}
          </div>
          <div className={styles.actions}>
            <Button size="small" appearance="subtle" icon={item.isStarred ? <StarFilled /> : <StarRegular />} onClick={() => markStarred([item.id], !item.isStarred)} />
            <Button size="small" appearance="subtle" icon={<DeleteRegular />} onClick={() => deleteNews([item.id])} />
            {item.link && <Button size="small" appearance="subtle" icon={<OpenRegular />} onClick={() => window.open(item.link!, '_blank')} />}
          </div>
          <div className={styles.content} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content || item.description || '') }} />
        </div>
      ))}
    </div>
  );
}
