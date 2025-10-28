// i18n configuration

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from './locales/tr';
import en from './locales/en';

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      tr: { translation: tr },
      en: { translation: en },
    },
    lng: 'tr', // Default language
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
