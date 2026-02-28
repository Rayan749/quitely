import { create } from 'zustand';
import { setSetting, getAllSettings } from '../api/commands';

interface AppSettings {
  // General
  showSplashScreen: boolean;
  reopenFeedsOnStartup: boolean;
  openTabsNextToCurrent: boolean;

  // System tray
  showTrayIcon: boolean;
  minimizeToTray: boolean;
  closeToTray: boolean;

  // Network
  requestTimeout: number;
  concurrentRequests: number;
  proxyUrl: string;

  // Feed
  updateOnStartup: boolean;
  autoUpdateInterval: number;
  markReadOnSelect: boolean;

  // Browser
  useEmbeddedBrowser: boolean;
  autoLoadImages: boolean;
  enableJavaScript: boolean;

  // Appearance
  theme: 'light' | 'dark' | 'system';
  cleanupDays: number;

  // Notifications
  enableNotifications: boolean;
  playSound: boolean;
}

interface SettingsState {
  settings: AppSettings;
  loading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
}

const defaultSettings: AppSettings = {
  showSplashScreen: true,
  reopenFeedsOnStartup: true,
  openTabsNextToCurrent: true,
  showTrayIcon: true,
  minimizeToTray: false,
  closeToTray: true,
  requestTimeout: 30,
  concurrentRequests: 5,
  proxyUrl: '',
  updateOnStartup: true,
  autoUpdateInterval: 30,
  markReadOnSelect: true,
  useEmbeddedBrowser: true,
  autoLoadImages: true,
  enableJavaScript: true,
  theme: 'system' as const,
  cleanupDays: 30,
  enableNotifications: true,
  playSound: false,
};

const settingKeyMap: Record<keyof AppSettings, string> = {
  showSplashScreen: 'general.show_splash_screen',
  reopenFeedsOnStartup: 'general.reopen_feeds_on_startup',
  openTabsNextToCurrent: 'general.open_tabs_next_to_current',
  showTrayIcon: 'tray.show_icon',
  minimizeToTray: 'tray.minimize_to_tray',
  closeToTray: 'tray.close_to_tray',
  requestTimeout: 'network.request_timeout',
  concurrentRequests: 'network.concurrent_requests',
  proxyUrl: 'network.proxy_url',
  updateOnStartup: 'feed.update_on_startup',
  autoUpdateInterval: 'feed.auto_update_interval',
  markReadOnSelect: 'feed.mark_read_on_select',
  useEmbeddedBrowser: 'browser.use_embedded',
  autoLoadImages: 'browser.auto_load_images',
  enableJavaScript: 'browser.enable_javascript',
  theme: 'appearance.theme',
  cleanupDays: 'feed.cleanup_days',
  enableNotifications: 'notifications.enabled',
  playSound: 'notifications.play_sound',
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: defaultSettings,
  loading: false,
  error: null,

  loadSettings: async () => {
    set({ loading: true, error: null });
    try {
      const allSettings = await getAllSettings();
      const settingsMap = new Map(allSettings);

      const loadedSettings = { ...defaultSettings };
      for (const key of Object.keys(settingKeyMap) as (keyof AppSettings)[]) {
        const dbKey = settingKeyMap[key];
        const value = settingsMap.get(dbKey);
        if (value !== undefined) {
          // Parse boolean and number values
          if (typeof defaultSettings[key] === 'boolean') {
            (loadedSettings as Record<string, unknown>)[key] = value === 'true';
          } else if (typeof defaultSettings[key] === 'number') {
            (loadedSettings as Record<string, unknown>)[key] = parseInt(value, 10);
          } else {
            (loadedSettings as Record<string, unknown>)[key] = value;
          }
        }
      }

      set({ settings: loadedSettings, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  updateSetting: async (key, value) => {
    try {
      const dbKey = settingKeyMap[key];
      const stringValue = typeof value === 'boolean' ? String(value) : String(value);
      await setSetting(dbKey, stringValue);

      set(state => ({
        settings: { ...state.settings, [key]: value },
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },
}));