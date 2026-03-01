import { makeStyles, tokens, Divider, Button } from '@fluentui/react-components';
import { MailUnreadFilled, StarFilled, DeleteFilled, SettingsRegular } from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { useUIStore, useLabelsStore, useFeedStore } from '../../stores';
import { LabelDialog } from '../settings';
import { FeedTree } from '../feeds';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { springs } from '../../design-system/motion/transitions';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
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
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    position: 'relative',
    borderRadius: '6px',
    margin: '1px 8px',
    transition: 'background-color 0.1s',
    ':hover': {
      backgroundColor: tokens.colorSubtleBackgroundHover,
    },
  },
  labelBadge: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
});

/**
 * Animated selection indicator with pill background + left bar.
 * Uses layoutId so Framer Motion animates it sliding between items in the same group.
 */
function SelectionIndicator({ groupId }: { groupId: string }) {
  return (
    <>
      {/* Pill background */}
      <motion.div
        layoutId={`${groupId}-pill`}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '6px',
          backgroundColor: tokens.colorSubtleBackgroundSelected,
          zIndex: 0,
        }}
        transition={springs.fluent}
      />
      {/* Left bar */}
      <motion.div
        layoutId={`${groupId}-bar`}
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          width: '3px',
          height: '16px',
          marginTop: '-8px',
          borderRadius: '0 2px 2px 0',
          backgroundColor: tokens.colorBrandForeground1,
          zIndex: 1,
        }}
        transition={springs.fluent}
      />
    </>
  );
}

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
    <nav className={styles.root} style={{ width: '20%', minWidth: '180px', maxWidth: '300px' }}>
      <div className={styles.content}>
        {/* Categories Section */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            {t('sidebar.categories')}
          </div>
          <LayoutGroup id="categories">
            <AnimatePresence>
              {(['unread', 'starred', 'deleted'] as const).map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <div
                    key={category}
                    className={styles.item}
                    onClick={() => handleCategoryClick(category)}
                    style={{ fontWeight: isSelected ? 600 : 400 }}
                  >
                    {isSelected && <SelectionIndicator groupId="category" />}
                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {category === 'unread' && <MailUnreadFilled />}
                      {category === 'starred' && <StarFilled />}
                      {category === 'deleted' && <DeleteFilled />}
                      <span>{t(`sidebar.${category}`)}</span>
                    </span>
                  </div>
                );
              })}
            </AnimatePresence>
          </LayoutGroup>
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
          <LayoutGroup id="labels">
            <AnimatePresence>
              {labels.map((label) => {
                const isSelected = selectedLabelId === label.id;
                return (
                  <div
                    key={label.id}
                    className={styles.item}
                    onClick={() => handleLabelClick(label.id)}
                    style={{ fontWeight: isSelected ? 600 : 400 }}
                  >
                    {isSelected && <SelectionIndicator groupId="label" />}
                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        className={styles.labelBadge}
                        style={{ backgroundColor: label.color || '#0078d4' }}
                      />
                      <span>{label.name}</span>
                    </span>
                  </div>
                );
              })}
            </AnimatePresence>
          </LayoutGroup>
          {labels.length === 0 && (
            <div style={{ padding: '8px 16px', fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
              {t('sidebar.noLabels')}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <Button
            appearance="subtle"
            icon={<SettingsRegular />}
            onClick={() => setSettingsPageOpen(true)}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            {t('sidebar.settings')}
          </Button>
        </div>
      </div>
    </nav>
  );
}
