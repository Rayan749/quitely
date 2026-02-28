import i18n from '../i18n';

export function getDateLocale(): string {
  return i18n.language === 'zh' ? 'zh-CN' : 'en-US';
}
