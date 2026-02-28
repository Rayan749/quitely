import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import en from './locales/en.json';
import zh from './locales/zh.json';

async function getPersistedLanguage(): Promise<string> {
  try {
    const lang = await invoke<string | null>('get_setting', { key: 'general.language' });
    return lang || 'en';
  } catch {
    return 'en';
  }
}

const initPromise = getPersistedLanguage().then((lng) => {
  return i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        zh: { translation: zh },
      },
      lng,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
});

export { initPromise };
export default i18n;
