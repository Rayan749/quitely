import * as React from 'react';
import {
  makeStyles,
  tokens,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Tab,
  TabList,
  Switch,
  SpinButton,
  Input,
  Badge,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import { SettingsRegular, AddRegular, DeleteRegular } from '@fluentui/react-icons';
import { useSettingsStore, useLabelsStore, useFiltersStore } from '../../stores';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: '400px',
  },
  tabContent: {
    paddingTop: '16px',
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

export function SettingsDialog() {
  const styles = useStyles();
  const [open, setOpen] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState('general');
  const { settings, loading, loadSettings, updateSetting } = useSettingsStore();
  const { labels, loadLabels, addLabel, removeLabel } = useLabelsStore();
  const { filters, loadFilters, addFilter, removeFilter, toggleFilter } = useFiltersStore();
  const [newLabelName, setNewLabelName] = React.useState('');
  const [newLabelColor, setNewLabelColor] = React.useState('#0078d4');
  const [filterName, setFilterName] = React.useState('');
  const [filterField, setFilterField] = React.useState('title');
  const [filterOperator, setFilterOperator] = React.useState('contains');
  const [filterValue, setFilterValue] = React.useState('');
  const [filterAction, setFilterAction] = React.useState('mark_read');

  React.useEffect(() => {
    if (open) {
      loadSettings();
      loadLabels();
      loadFilters();
    }
  }, [open, loadSettings, loadLabels, loadFilters]);

  const handleToggle = (key: keyof typeof settings) => {
    updateSetting(key, !settings[key]);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button appearance="subtle" icon={<SettingsRegular />} title="Settings">
          Settings
        </Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogTitle>Settings</DialogTitle>
        <DialogBody>
          <DialogContent>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <div className={styles.container}>
                <TabList selectedValue={selectedTab} onTabSelect={(_, data) => setSelectedTab(data.value as string)}>
                  <Tab value="general" id="general">
                    General
                  </Tab>
                  <Tab value="tray" id="tray">
                    System Tray
                  </Tab>
                  <Tab value="network" id="network">
                    Network
                  </Tab>
                  <Tab value="feed" id="feed">
                    Feed
                  </Tab>
                  <Tab value="browser" id="browser">
                    Browser
                  </Tab>
                  <Tab value="notifications" id="notifications">
                    Notifications
                  </Tab>
                  <Tab value="labels" id="labels">
                    Labels
                  </Tab>
                  <Tab value="filters" id="filters">
                    Filters
                  </Tab>
                </TabList>

                <div className={styles.tabContent}>
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
                          <span className={styles.settingDescription}>HTTP/HTTPS/SOCKS5 proxy (e.g., socks5://127.0.0.1:1080)</span>
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
                      <div className={styles.sectionTitle}>Manage Labels</div>

                      {/* Add new label */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Input
                          size="small"
                          placeholder="Label name"
                          value={newLabelName}
                          onChange={(_, data) => setNewLabelName(data.value)}
                        />
                        <input
                          type="color"
                          value={newLabelColor}
                          onChange={(e) => setNewLabelColor(e.target.value)}
                          style={{ width: '32px', height: '32px', border: 'none', cursor: 'pointer' }}
                        />
                        <Button
                          size="small"
                          icon={<AddRegular />}
                          onClick={async () => {
                            if (newLabelName.trim()) {
                              await addLabel({ name: newLabelName.trim(), color: newLabelColor });
                              setNewLabelName('');
                            }
                          }}
                        >
                          Add
                        </Button>
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
                      />

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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

                      <div className={styles.sectionTitle} style={{ marginTop: '16px' }}>Active Filters</div>

                      {filters.map(filter => (
                        <div key={filter.id} className={styles.settingRow}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: filter.enabled ? '600' : '400' }}>{filter.name}</span>
                            <span className={styles.settingDescription}>
                              {filter.conditions.map(c => `${c.field} ${c.operator} "${c.value}"`).join(', ')}
                              {' \u2192 '}
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
                </div>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Close</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}