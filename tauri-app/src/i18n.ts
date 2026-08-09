import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    zh: {
      translation: {
        sidebar: {
          home: "首页",
          logs: "日志列表",
          groups: "分组归纳",
          mods: "模组管理",
          settings: "设置",
		  analysis: "分析报错",
        },
        search: {
          placeholder: "Ctrl+K 搜索",
          noResults: "无结果",
        },
      },
    },
    en: {
      translation: {
        sidebar: {
          home: "Home",
          logs: "Logs",
          groups: "Groups",
          mods: "Mods",
          settings: "Settings",
		  analysis: "Crash Analysis", 
        },
        search: {
          placeholder: "Ctrl+K search",
          noResults: "No results",
        },
      },
    },
  },
  lng: "zh",
  fallbackLng: "zh",
  interpolation: { escapeValue: false },
});

export default i18n;