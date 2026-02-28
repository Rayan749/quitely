import * as React from 'react';
import {
  makeStyles,
  tokens,
  Switch,
  SpinButton,
  Input,
  Badge,
  Dropdown,
  Option,
  Button,
  Subtitle2,
} from '@fluentui/react-components';
import { AddRegular, DeleteRegular, ArrowLeftRegular } from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, useLabelsStore, useFiltersStore, useUIStore } from '../../stores';
import { LabelDialog } from './LabelDialog';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  backButton: {
    marginRight: '8px',
  },
  content: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  sidebar: {
    width: '220px',
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: '16px 0',
    overflowY: 'auto',
  },
  mainContent: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
  },
  tabItem: {
    padding: '10px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  tabItemSelected: {
    backgroundColor: tokens.colorNeutralBackground1Selected,
    fontWeight: '600',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  settingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
  },
  settingLabel: {
    display: 'flex',
    flexDirection: 'column',
  },
  settingDescription: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
  },
});

export function SettingsPage() {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = React.useState('general');
  const { settings, loading, loadSettings, updateSetting } = useSettingsStore();
  const { labels, loadLabels, removeLabel } = useLabelsStore();
  const { filters, loadFilters, addFilter, removeFilter, toggleFilter } = useFiltersStore();
  const { settingsPageOpen, setSettingsPageOpen } = useUIStore();
  const { t, i18n } = useTranslation();
  const [filterName, setFilterName] = React.useState('');
  const [filterField, setFilterField] = React.useState('title');
  const [filterOperator, setFilterOperator] = React.useState('contains');
  const [filterValue, setFilterValue] = React.useState('');
  const [filterAction, setFilterAction] = React.useState('mark_read');

  React.useEffect(() => {
    if (settingsPageOpen) {
      loadSettings();
      loadLabels();
      loadFilters();
    }
  }, [settingsPageOpen, loadSettings, loadLabels, loadFilters]);

  const handleToggle = (key: keyof typeof settings) => {
    updateSetting(key, !settings[key]);
  };

  const handleClose = () => {
    setSettingsPageOpen(false);
  };

  if (!settingsPageOpen) {
    return null;
  }

  const tabs = [
    { id: 'general', label: t('settings.general') },
    { id: 'tray', label: t('settings.tray') },
    { id: 'network', label: t('settings.network') },
    { id: 'feed', label: t('settings.feed') },
    { id: 'browser', label: t('settings.browser') },
    { id: 'notifications', label: t('settings.notifications') },
    { id: 'labels', label: t('settings.labels') },
    { id: 'filters', label: t('settings.filters') },
    { id: 'appearance', label: t('settings.appearance') },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button
          appearance="subtle"
          icon={<ArrowLeftRegular />}
          onClick={handleClose}
          className={styles.backButton}
        >
          {t('settings.back')}
        </Button>
        <Subtitle2>{t('settings.title')}</Subtitle2>
      </div>

      <div className={styles.content}>
        <div className={styles.sidebar}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`${styles.tabItem} ${selectedTab === tab.id ? styles.tabItemSelected : ''}`}
              onClick={() => setSelectedTab(tab.id)}
            >
              {tab.label}
            </div>
          ))}
        </div>

        <div className={styles.mainContent}>
          {loading ? (
            <div>{t('settings.loading')}</div>
          ) : (
            <>
              {selectedTab === 'general' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>{t('settings.generalSettings')}</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.showSplash')}</span>
                      <span className={styles.settingDescription}>{t('settings.showSplashDesc')}</span>
                    </div>
                    <Switch checked={settings.showSplashScreen} onChange={() => handleToggle('showSplashScreen')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.reopenFeeds')}</span>
                      <span className={styles.settingDescription}>{t('settings.reopenFeedsDesc')}</span>
                    </div>
                    <Switch checked={settings.reopenFeedsOnStartup} onChange={() => handleToggle('reopenFeedsOnStartup')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.openTabsNext')}</span>
                      <span className={styles.settingDescription}>{t('settings.openTabsNextDesc')}</span>
                    </div>
                    <Switch checked={settings.openTabsNextToCurrent} onChange={() => handleToggle('openTabsNextToCurrent')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.languageLabel')}</span>
                      <span className={styles.settingDescription}>{t('settings.languageDesc')}</span>
                    </div>
                    <Dropdown
                      size="small"
                      value={settings.language === 'zh' ? '中文' : 'English'}
                      onOptionSelect={(_, data) => {
                        const lang = data.optionValue || 'en';
                        updateSetting('language', lang);
                        i18n.changeLanguage(lang);
                      }}
                    >
                      <Option value="en">English</Option>
                      <Option value="zh">中文</Option>
                    </Dropdown>
                  </div>
                </div>
              )}

              {selectedTab === 'tray' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>{t('settings.tray')}</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.showTrayIcon')}</span>
                      <span className={styles.settingDescription}>{t('settings.showTrayIconDesc')}</span>
                    </div>
                    <Switch checked={settings.showTrayIcon} onChange={() => handleToggle('showTrayIcon')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.minimizeToTray')}</span>
                      <span className={styles.settingDescription}>{t('settings.minimizeToTrayDesc')}</span>
                    </div>
                    <Switch checked={settings.minimizeToTray} onChange={() => handleToggle('minimizeToTray')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.closeToTray')}</span>
                      <span className={styles.settingDescription}>{t('settings.closeToTrayDesc')}</span>
                    </div>
                    <Switch checked={settings.closeToTray} onChange={() => handleToggle('closeToTray')} />
                  </div>
                </div>
              )}

              {selectedTab === 'network' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>{t('settings.networkSettings')}</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.requestTimeout')}</span>
                      <span className={styles.settingDescription}>{t('settings.requestTimeoutDesc')}</span>
                    </div>
                    <SpinButton
                      value={settings.requestTimeout}
                      min={5}
                      max={120}
                      step={5}
                      onChange={(_, data) => updateSetting('requestTimeout', parseInt(String(data.value), 10) || 30)}
                    />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.concurrentRequests')}</span>
                      <span className={styles.settingDescription}>{t('settings.concurrentRequestsDesc')}</span>
                    </div>
                    <SpinButton
                      value={settings.concurrentRequests}
                      min={1}
                      max={20}
                      step={1}
                      onChange={(_, data) => updateSetting('concurrentRequests', parseInt(String(data.value), 10) || 5)}
                    />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.proxyUrl')}</span>
                      <span className={styles.settingDescription}>{t('settings.proxyUrlDesc')}</span>
                    </div>
                    <Input
                      size="small"
                      value={settings.proxyUrl}
                      placeholder={t('settings.proxyPlaceholder')}
                      onChange={(_, data) => updateSetting('proxyUrl', data.value)}
                      style={{ width: '250px' }}
                    />
                  </div>
                </div>
              )}

              {selectedTab === 'feed' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>{t('settings.feedSettings')}</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.updateOnStartup')}</span>
                      <span className={styles.settingDescription}>{t('settings.updateOnStartupDesc')}</span>
                    </div>
                    <Switch checked={settings.updateOnStartup} onChange={() => handleToggle('updateOnStartup')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.autoUpdateInterval')}</span>
                      <span className={styles.settingDescription}>{t('settings.autoUpdateIntervalDesc')}</span>
                    </div>
                    <SpinButton
                      value={settings.autoUpdateInterval}
                      min={5}
                      max={1440}
                      step={5}
                      onChange={(_, data) => updateSetting('autoUpdateInterval', parseInt(String(data.value), 10) || 30)}
                    />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.markReadOnSelect')}</span>
                      <span className={styles.settingDescription}>{t('settings.markReadOnSelectDesc')}</span>
                    </div>
                    <Switch checked={settings.markReadOnSelect} onChange={() => handleToggle('markReadOnSelect')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.cleanupDays')}</span>
                      <span className={styles.settingDescription}>{t('settings.cleanupDaysDesc')}</span>
                    </div>
                    <SpinButton
                      value={settings.cleanupDays}
                      min={1}
                      max={365}
                      step={1}
                      onChange={(_, data) => updateSetting('cleanupDays', parseInt(String(data.value), 10) || 30)}
                    />
                  </div>
                </div>
              )}

              {selectedTab === 'browser' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>{t('settings.browserSettings')}</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.useEmbeddedBrowser')}</span>
                      <span className={styles.settingDescription}>{t('settings.useEmbeddedBrowserDesc')}</span>
                    </div>
                    <Switch checked={settings.useEmbeddedBrowser} onChange={() => handleToggle('useEmbeddedBrowser')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.autoLoadImages')}</span>
                      <span className={styles.settingDescription}>{t('settings.autoLoadImagesDesc')}</span>
                    </div>
                    <Switch checked={settings.autoLoadImages} onChange={() => handleToggle('autoLoadImages')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.enableJavaScript')}</span>
                      <span className={styles.settingDescription}>{t('settings.enableJavaScriptDesc')}</span>
                    </div>
                    <Switch checked={settings.enableJavaScript} onChange={() => handleToggle('enableJavaScript')} />
                  </div>
                </div>
              )}

              {selectedTab === 'notifications' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>{t('settings.notificationSettings')}</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.enableNotifications')}</span>
                      <span className={styles.settingDescription}>{t('settings.enableNotificationsDesc')}</span>
                    </div>
                    <Switch checked={settings.enableNotifications} onChange={() => handleToggle('enableNotifications')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.playSound')}</span>
                      <span className={styles.settingDescription}>{t('settings.playSoundDesc')}</span>
                    </div>
                    <Switch checked={settings.playSound} onChange={() => handleToggle('playSound')} />
                  </div>
                </div>
              )}

              {selectedTab === 'labels' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{t('settings.manageLabels')}</span>
                    <LabelDialog />
                  </div>

                  {/* Label list */}
                  {labels.map(label => (
                    <div key={label.id} className={styles.settingRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge
                          size="small"
                          appearance="filled"
                          style={{ backgroundColor: label.color || '#0078d4' }}
                        >
                          {label.name}
                        </Badge>
                      </div>
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<DeleteRegular />}
                        onClick={() => removeLabel(label.id)}
                      />
                    </div>
                  ))}

                  {labels.length === 0 && (
                    <div style={{ color: tokens.colorNeutralForeground3, fontSize: '13px' }}>
                      {t('settings.noLabelsCreated')}
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'filters' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>{t('settings.createFilter')}</div>

                  <Input
                    size="small"
                    placeholder={t('settings.filterName')}
                    value={filterName}
                    onChange={(_, data) => setFilterName(data.value)}
                    style={{ marginBottom: '12px' }}
                  />

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px' }}>{t('settings.when')}</span>
                    <Dropdown
                      size="small"
                      value={filterField}
                      onOptionSelect={(_, data) => setFilterField(data.optionValue || 'title')}
                    >
                      <Option value="title">{t('settings.filterTitle')}</Option>
                      <Option value="author">{t('settings.filterAuthor')}</Option>
                      <Option value="category">{t('settings.filterCategory')}</Option>
                      <Option value="content">{t('settings.filterContent')}</Option>
                    </Dropdown>
                    <Dropdown
                      size="small"
                      value={filterOperator}
                      onOptionSelect={(_, data) => setFilterOperator(data.optionValue || 'contains')}
                    >
                      <Option value="contains">{t('settings.contains')}</Option>
                      <Option value="not_contains">{t('settings.notContains')}</Option>
                      <Option value="equals">{t('settings.equals')}</Option>
                      <Option value="starts_with">{t('settings.startsWith')}</Option>
                      <Option value="regex">{t('settings.matchesRegex')}</Option>
                    </Dropdown>
                    <Input
                      size="small"
                      placeholder={t('settings.filterValue')}
                      value={filterValue}
                      onChange={(_, data) => setFilterValue(data.value)}
                      style={{ flex: 1, minWidth: '120px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px' }}>{t('settings.then')}</span>
                    <Dropdown
                      size="small"
                      value={filterAction}
                      onOptionSelect={(_, data) => setFilterAction(data.optionValue || 'mark_read')}
                    >
                      <Option value="mark_read">{t('settings.markAsRead')}</Option>
                      <Option value="mark_starred">{t('settings.starAction')}</Option>
                      <Option value="delete">{t('settings.deleteAction')}</Option>
                    </Dropdown>
                    <Button
                      size="small"
                      icon={<AddRegular />}
                      onClick={async () => {
                        if (filterName.trim() && filterValue.trim()) {
                          await addFilter({
                            name: filterName.trim(),
                            feedIds: [],
                            matchType: 'any',
                            conditions: [{ field: filterField, operator: filterOperator, value: filterValue }],
                            actions: [{ action: filterAction }],
                          });
                          setFilterName('');
                          setFilterValue('');
                        }
                      }}
                    >
                      {t('settings.addFilter')}
                    </Button>
                  </div>

                  <div className={styles.sectionTitle}>{t('settings.activeFilters')}</div>

                  {filters.map(filter => (
                    <div key={filter.id} className={styles.settingRow}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: filter.enabled ? '600' : '400' }}>{filter.name}</span>
                        <span className={styles.settingDescription}>
                          {filter.conditions.map(c => `${c.field} ${c.operator} "${c.value}"`).join(', ')}
                          {' → '}
                          {filter.actions.map(a => a.action.replace('_', ' ')).join(', ')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Switch
                          checked={filter.enabled}
                          onChange={() => toggleFilter(filter.id, !filter.enabled)}
                        />
                        <Button
                          size="small"
                          appearance="subtle"
                          icon={<DeleteRegular />}
                          onClick={() => removeFilter(filter.id)}
                        />
                      </div>
                    </div>
                  ))}

                  {filters.length === 0 && (
                    <div style={{ color: tokens.colorNeutralForeground3, fontSize: '13px' }}>
                      {t('settings.noFiltersCreated')}
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'appearance' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>{t('settings.appearanceTitle')}</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.theme')}</span>
                      <span className={styles.settingDescription}>{t('settings.themeDesc')}</span>
                    </div>
                    <Dropdown
                      size="small"
                      value={settings.theme === 'light' ? t('settings.themeLight') : settings.theme === 'dark' ? t('settings.themeDark') : t('settings.themeSystem')}
                      onOptionSelect={(_, data) => updateSetting('theme', (data.optionValue || 'system') as 'light' | 'dark' | 'system')}
                    >
                      <Option value="system">{t('settings.themeSystem')}</Option>
                      <Option value="light">{t('settings.themeLight')}</Option>
                      <Option value="dark">{t('settings.themeDark')}</Option>
                    </Dropdown>
                  </div>

                  <div className={styles.sectionTitle}>{t('settings.fontSettings')}</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.fontFamily')}</span>
                      <span className={styles.settingDescription}>{t('settings.fontFamilyDesc')}</span>
                    </div>
                    <Dropdown
                      size="small"
                      value={settings.fontFamily}
                      onOptionSelect={(_, data) => updateSetting('fontFamily', data.optionValue || 'system-ui')}
                    >
                      <Option value="system-ui">{t('settings.fontSystemDefault')}</Option>
                      <Option value="'Segoe UI', sans-serif">Segoe UI</Option>
                      <Option value="'SF Pro', sans-serif">SF Pro</Option>
                      <Option value="'Noto Sans SC', sans-serif">Noto Sans SC</Option>
                      <Option value="monospace">Monospace</Option>
                    </Dropdown>
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.uiFontSize')}</span>
                      <span className={styles.settingDescription}>{t('settings.uiFontSizeDesc')}</span>
                    </div>
                    <SpinButton
                      value={settings.fontSize}
                      min={10}
                      max={24}
                      step={1}
                      onChange={(_, data) => updateSetting('fontSize', parseInt(String(data.value), 10) || 14)}
                    />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>{t('settings.contentFontSize')}</span>
                      <span className={styles.settingDescription}>{t('settings.contentFontSizeDesc')}</span>
                    </div>
                    <SpinButton
                      value={settings.contentFontSize}
                      min={12}
                      max={32}
                      step={1}
                      onChange={(_, data) => updateSetting('contentFontSize', parseInt(String(data.value), 10) || 16)}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
