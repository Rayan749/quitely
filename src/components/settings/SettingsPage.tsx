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
  const { i18n } = useTranslation();
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
    { id: 'general', label: 'General' },
    { id: 'tray', label: 'System Tray' },
    { id: 'network', label: 'Network' },
    { id: 'feed', label: 'Feed' },
    { id: 'browser', label: 'Browser' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'labels', label: 'Labels' },
    { id: 'filters', label: 'Filters' },
    { id: 'appearance', label: 'Appearance' },
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
          Back
        </Button>
        <Subtitle2>Settings</Subtitle2>
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
            <div>Loading...</div>
          ) : (
            <>
              {selectedTab === 'general' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>General Settings</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Show splash screen</span>
                      <span className={styles.settingDescription}>Display splash screen on startup</span>
                    </div>
                    <Switch checked={settings.showSplashScreen} onChange={() => handleToggle('showSplashScreen')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Reopen feeds on startup</span>
                      <span className={styles.settingDescription}>Restore previously open feeds</span>
                    </div>
                    <Switch checked={settings.reopenFeedsOnStartup} onChange={() => handleToggle('reopenFeedsOnStartup')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Open tabs next to current</span>
                      <span className={styles.settingDescription}>New tabs open next to the current tab</span>
                    </div>
                    <Switch checked={settings.openTabsNextToCurrent} onChange={() => handleToggle('openTabsNextToCurrent')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Language</span>
                      <span className={styles.settingDescription}>Application language</span>
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
                  <div className={styles.sectionTitle}>System Tray</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Show tray icon</span>
                      <span className={styles.settingDescription}>Display icon in system tray</span>
                    </div>
                    <Switch checked={settings.showTrayIcon} onChange={() => handleToggle('showTrayIcon')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Minimize to tray</span>
                      <span className={styles.settingDescription}>Minimize window to tray instead of taskbar</span>
                    </div>
                    <Switch checked={settings.minimizeToTray} onChange={() => handleToggle('minimizeToTray')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Close to tray</span>
                      <span className={styles.settingDescription}>Close window to tray instead of quitting</span>
                    </div>
                    <Switch checked={settings.closeToTray} onChange={() => handleToggle('closeToTray')} />
                  </div>
                </div>
              )}

              {selectedTab === 'network' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Network Settings</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Request timeout (seconds)</span>
                      <span className={styles.settingDescription}>Timeout for feed requests</span>
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
                      <span>Concurrent requests</span>
                      <span className={styles.settingDescription}>Maximum concurrent feed updates</span>
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
                      <span>Proxy URL</span>
                      <span className={styles.settingDescription}>HTTP/HTTPS/SOCKS5 proxy</span>
                    </div>
                    <Input
                      size="small"
                      value={settings.proxyUrl}
                      placeholder="Leave empty for direct connection"
                      onChange={(_, data) => updateSetting('proxyUrl', data.value)}
                      style={{ width: '250px' }}
                    />
                  </div>
                </div>
              )}

              {selectedTab === 'feed' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Feed Settings</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Update on startup</span>
                      <span className={styles.settingDescription}>Automatically update feeds on startup</span>
                    </div>
                    <Switch checked={settings.updateOnStartup} onChange={() => handleToggle('updateOnStartup')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Auto update interval (minutes)</span>
                      <span className={styles.settingDescription}>Interval for automatic feed updates</span>
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
                      <span>Mark read on select</span>
                      <span className={styles.settingDescription}>Automatically mark articles as read when selected</span>
                    </div>
                    <Switch checked={settings.markReadOnSelect} onChange={() => handleToggle('markReadOnSelect')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Cleanup deleted articles (days)</span>
                      <span className={styles.settingDescription}>Permanently delete articles older than this many days</span>
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
                  <div className={styles.sectionTitle}>Browser Settings</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Use embedded browser</span>
                      <span className={styles.settingDescription}>Open links in embedded browser instead of external</span>
                    </div>
                    <Switch checked={settings.useEmbeddedBrowser} onChange={() => handleToggle('useEmbeddedBrowser')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Auto load images</span>
                      <span className={styles.settingDescription}>Automatically load images in articles</span>
                    </div>
                    <Switch checked={settings.autoLoadImages} onChange={() => handleToggle('autoLoadImages')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Enable JavaScript</span>
                      <span className={styles.settingDescription}>Enable JavaScript in embedded browser</span>
                    </div>
                    <Switch checked={settings.enableJavaScript} onChange={() => handleToggle('enableJavaScript')} />
                  </div>
                </div>
              )}

              {selectedTab === 'notifications' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Notification Settings</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Enable notifications</span>
                      <span className={styles.settingDescription}>Show desktop notifications for new articles</span>
                    </div>
                    <Switch checked={settings.enableNotifications} onChange={() => handleToggle('enableNotifications')} />
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Play sound</span>
                      <span className={styles.settingDescription}>Play sound when new articles arrive</span>
                    </div>
                    <Switch checked={settings.playSound} onChange={() => handleToggle('playSound')} />
                  </div>
                </div>
              )}

              {selectedTab === 'labels' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Manage Labels</span>
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
                      No labels created yet
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'filters' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Create Filter</div>

                  <Input
                    size="small"
                    placeholder="Filter name"
                    value={filterName}
                    onChange={(_, data) => setFilterName(data.value)}
                    style={{ marginBottom: '12px' }}
                  />

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px' }}>When</span>
                    <Dropdown
                      size="small"
                      value={filterField}
                      onOptionSelect={(_, data) => setFilterField(data.optionValue || 'title')}
                    >
                      <Option value="title">Title</Option>
                      <Option value="author">Author</Option>
                      <Option value="category">Category</Option>
                      <Option value="content">Content</Option>
                    </Dropdown>
                    <Dropdown
                      size="small"
                      value={filterOperator}
                      onOptionSelect={(_, data) => setFilterOperator(data.optionValue || 'contains')}
                    >
                      <Option value="contains">contains</Option>
                      <Option value="not_contains">does not contain</Option>
                      <Option value="equals">equals</Option>
                      <Option value="starts_with">starts with</Option>
                      <Option value="regex">matches regex</Option>
                    </Dropdown>
                    <Input
                      size="small"
                      placeholder="Value"
                      value={filterValue}
                      onChange={(_, data) => setFilterValue(data.value)}
                      style={{ flex: 1, minWidth: '120px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px' }}>Then</span>
                    <Dropdown
                      size="small"
                      value={filterAction}
                      onOptionSelect={(_, data) => setFilterAction(data.optionValue || 'mark_read')}
                    >
                      <Option value="mark_read">Mark as read</Option>
                      <Option value="mark_starred">Star</Option>
                      <Option value="delete">Delete</Option>
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
                      Add
                    </Button>
                  </div>

                  <div className={styles.sectionTitle}>Active Filters</div>

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
                      No filters created yet
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'appearance' && (
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Appearance</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Theme</span>
                      <span className={styles.settingDescription}>Application theme</span>
                    </div>
                    <Dropdown
                      size="small"
                      value={settings.theme === 'light' ? 'Light' : settings.theme === 'dark' ? 'Dark' : 'System'}
                      onOptionSelect={(_, data) => updateSetting('theme', (data.optionValue || 'system') as 'light' | 'dark' | 'system')}
                    >
                      <Option value="system">System</Option>
                      <Option value="light">Light</Option>
                      <Option value="dark">Dark</Option>
                    </Dropdown>
                  </div>

                  <div className={styles.sectionTitle}>Font Settings</div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>Font family</span>
                      <span className={styles.settingDescription}>Font used throughout the app</span>
                    </div>
                    <Dropdown
                      size="small"
                      value={settings.fontFamily}
                      onOptionSelect={(_, data) => updateSetting('fontFamily', data.optionValue || 'system-ui')}
                    >
                      <Option value="system-ui">System Default</Option>
                      <Option value="'Segoe UI', sans-serif">Segoe UI</Option>
                      <Option value="'SF Pro', sans-serif">SF Pro</Option>
                      <Option value="'Noto Sans SC', sans-serif">Noto Sans SC</Option>
                      <Option value="monospace">Monospace</Option>
                    </Dropdown>
                  </div>
                  <div className={styles.settingRow}>
                    <div className={styles.settingLabel}>
                      <span>UI font size</span>
                      <span className={styles.settingDescription}>Font size for UI elements</span>
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
                      <span>Content font size</span>
                      <span className={styles.settingDescription}>Font size for article content</span>
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