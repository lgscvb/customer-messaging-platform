"use client";

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// 導入翻譯文件
import translationEN from './locales/en/translation.json';
import translationZHTW from './locales/zh-TW/translation.json';
import translationJA from './locales/ja/translation.json';

// 翻譯資源
const resources = {
  en: {
    translation: translationEN
  },
  'zh-TW': {
    translation: translationZHTW
  },
  ja: {
    translation: translationJA
  }
};

i18n
  // 使用 i18next-http-backend 加載翻譯文件
  .use(Backend)
  // 使用瀏覽器語言檢測
  .use(LanguageDetector)
  // 將 i18n 實例傳遞給 react-i18next
  .use(initReactI18next)
  // 初始化 i18next
  .init({
    resources,
    lng: 'zh-TW', // 強制使用繁體中文作為默認語言
    fallbackLng: 'zh-TW',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // 不需要 React 中的轉義
    },
    
    // 檢測用戶語言的選項
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    
    // 命名空間
    ns: ['translation'],
    defaultNS: 'translation',
    
    // 語言變更時的回調
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      nsMode: 'default'
    }
  });

export default i18n;