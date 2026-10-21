import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import am from "./am.json";
import om from "./om.json";

const resources = {
  en: { translation: en },
  am: { translation: am },
  om: { translation: om },
};

// Get saved language or default to English
const getSavedLanguage = (): string => {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem("pos-lang") || "en";
};

i18n.use(initReactI18next).init({
  resources,
  lng: getSavedLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
