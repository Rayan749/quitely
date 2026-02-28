import { makeStyles, tokens, Button, Link, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem, Badge } from '@fluentui/react-components';
import { OpenRegular, StarFilled, StarRegular, DeleteRegular, GlobeRegular, TagRegular } from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { useNewsStore, useLabelsStore, useSettingsStore } from '../../stores';
import { getDateLocale } from '../../utils/i18nDate';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    flexWrap: 'wrap',
    gap: '8px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    flex: 1,
    minWidth: '200px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '8px 16px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
    lineHeight: '1.6',
  },
  articleContent: {
    maxWidth: '800px',
    margin: '0 auto',
    '& img': {
      maxWidth: '100%',
      height: 'auto',
    },
    '& a': {
      color: tokens.colorBrandForeground1,
    },
    '& pre': {
      backgroundColor: tokens.colorNeutralBackground3,
      padding: '12px',
      borderRadius: '4px',
      overflow: 'auto',
    },
    '& code': {
      backgroundColor: tokens.colorNeutralBackground3,
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '13px',
    },
    '& blockquote': {
      borderLeft: `4px solid ${tokens.colorBrandStroke1}`,
      paddingLeft: '16px',
      marginLeft: 0,
      color: tokens.colorNeutralForeground2,
    },
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
  link: {
    wordBreak: 'break-all',
  },
});

export function ContentViewer() {
  const styles = useStyles();
  const { news, selectedNewsId, markStarred, deleteNews, loadNews, filter } = useNewsStore();
  const { labels, setArticleLabels } = useLabelsStore();
  const { settings } = useSettingsStore();
  const { t } = useTranslation();

  const selectedNews = news.find(n => n.id === selectedNewsId);

  const handleLabelToggle = async (labelId: number) => {
    if (!selectedNews) return;
    const currentLabels = selectedNews.labels;
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter(l => l !== labelId)
      : [...currentLabels, labelId];
    await setArticleLabels([selectedNews.id], newLabels);
    loadNews(filter);
  };

  const handleStarClick = () => {
    if (selectedNews) {
      markStarred([selectedNews.id], !selectedNews.isStarred);
    }
  };

  const handleDeleteClick = () => {
    if (selectedNews) {
      deleteNews([selectedNews.id]);
    }
  };

  const handleOpenExternal = () => {
    if (selectedNews?.link) {
      window.open(selectedNews.link, '_blank');
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(getDateLocale(), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (!selectedNews) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <GlobeRegular style={{ fontSize: '48px', marginBottom: '16px' }} />
          <p>{t('contentViewer.selectArticle')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{selectedNews.title || t('contentViewer.untitled')}</h1>
        <div className={styles.actions}>
          <Button
            appearance="subtle"
            icon={selectedNews.isStarred ? <StarFilled /> : <StarRegular />}
            onClick={handleStarClick}
            title={selectedNews.isStarred ? 'Unstar' : 'Star'}
          >
            {selectedNews.isStarred ? t('contentViewer.starred') : t('contentViewer.star')}
          </Button>
          <Button
            appearance="subtle"
            icon={<DeleteRegular />}
            onClick={handleDeleteClick}
            title="Delete"
          >
            {t('contentViewer.delete')}
          </Button>
          {selectedNews.link && (
            <Button
              appearance="subtle"
              icon={<OpenRegular />}
              onClick={handleOpenExternal}
              title="Open in browser"
            >
              {t('contentViewer.open')}
            </Button>
          )}
          {labels.length > 0 && (
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button
                  appearance="subtle"
                  icon={<TagRegular />}
                  title="Labels"
                >
                  {t('contentViewer.labels')}
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {labels.map(label => (
                    <MenuItem
                      key={label.id}
                      onClick={() => handleLabelToggle(label.id)}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge
                          size="tiny"
                          appearance="filled"
                          style={{ backgroundColor: label.color || '#0078d4' }}
                        >
                          &nbsp;
                        </Badge>
                        {label.name}
                        {selectedNews?.labels.includes(label.id) ? ' \u2713' : ''}
                      </span>
                    </MenuItem>
                  ))}
                </MenuList>
              </MenuPopover>
            </Menu>
          )}
        </div>
      </div>

      <div className={styles.meta}>
        {selectedNews.author && (
          <span className={styles.metaItem}>
            By: {selectedNews.author}
          </span>
        )}
        {selectedNews.publishedAt && (
          <span className={styles.metaItem}>
            {formatDate(selectedNews.publishedAt)}
          </span>
        )}
        {selectedNews.link && (
          <Link
            className={styles.link}
            href={selectedNews.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            Source
          </Link>
        )}
      </div>

      {selectedNews.labels.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', padding: '4px 16px' }}>
          {selectedNews.labels.map(labelId => {
            const label = labels.find(l => l.id === labelId);
            return label ? (
              <Badge
                key={labelId}
                size="small"
                appearance="filled"
                style={{ backgroundColor: label.color || '#0078d4' }}
              >
                {label.name}
              </Badge>
            ) : null;
          })}
        </div>
      )}

      <div className={styles.content} style={{ fontFamily: settings.fontFamily, fontSize: `${settings.contentFontSize}px` }}>
        <div
          className={styles.articleContent}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(
              selectedNews.content || selectedNews.description || '<p>No content available</p>'
            ),
          }}
        />
      </div>
    </div>
  );
}