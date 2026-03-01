import { makeStyles, tokens, Divider, Button } from '@fluentui/react-components';
import { MailUnreadFilled, StarFilled, DeleteFilled, SettingsRegular } from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { useUIStore, useLabelsStore, useFeedStore } from '../../stores';
import { LabelDialog } from '../settings';
import { FeedTree } from '../feeds';
import { GlassPanel, SpringScale, macosColors, macosRadii } from '../../design-system';
import { motion } from 'framer-motion';
import { springs } from '../../design-system/motion/transitions';

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
  footer: {
    padding: '8px',
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
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
});

export function Sidebar() {
  const styles = useStyles();
  const {
    selectedCategory,
    selectCategory,
    selectedLabelId,
    selectLabel,
    setSettingsPageOpen,
  } = useUIStore();
  const { labels } = useLabelsStore();
  const { selectFeed } = useFeedStore();
  const { t } = useTranslation();

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

  return (
    <GlassPanel style={{ width: '20%', minWidth: '180px', maxWidth: '300px' }}>
      <nav className={styles.root} style={{ width: '100%', backgroundColor: 'transparent', borderRight: 'none' }}>
        <div className={styles.content}>
          {/* Categories Section */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              {t('sidebar.categories')}
            </div>
            {(['unread', 'starred', 'deleted'] as const).map((category) => (
              <motion.div
                key={category}
                animate={{
                  backgroundColor: selectedCategory === category
                    ? macosColors.light.selectedBackground
                    : 'transparent',
                }}
                transition={springs.snappy}
                style={{ borderRadius: macosRadii.small, padding: '4px 8px', margin: '0 8px', cursor: 'pointer' }}
                onClick={() => handleCategoryClick(category)}
              >
                <div className={styles.item} style={{ backgroundColor: 'transparent' }}>
                  {category === 'unread' && <MailUnreadFilled />}
                  {category === 'starred' && <StarFilled />}
                  {category === 'deleted' && <DeleteFilled />}
                  <span>{t(`sidebar.${category}`)}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <Divider />

          {/* Feeds Section */}
          <div className={styles.section}>
            <FeedTree />
          </div>

          <Divider />

          {/* Labels Section */}
          <div className={styles.section}>
            <div className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '8px' }}>
              <span>{t('sidebar.labels')}</span>
              <LabelDialog />
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
                {t('sidebar.noLabels')}
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <SpringScale as="div">
              <Button
                appearance="subtle"
                icon={<SettingsRegular />}
                onClick={() => setSettingsPageOpen(true)}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                {t('sidebar.settings')}
              </Button>
            </SpringScale>
          </div>
        </div>
      </nav>
    </GlassPanel>
  );
}