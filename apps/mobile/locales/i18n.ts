import "intl-pluralrules";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import { I18nManager } from "react-native";
import en from "./en.json";
import ar from "./ar.json";
import { kv } from "../services/storage";

/** i18next setup — English + Arabic, with RTL wired to I18nManager. */

export const LANGUAGES = ["en", "ar"] as const;
export type Lang = (typeof LANGUAGES)[number];
const LANG_KEY = "chat.lang.v1";

const saved = kv.getItem(LANG_KEY) as Lang | null;
const device = getLocales()[0]?.languageCode === "ar" ? "ar" : "en";
const initial: Lang = saved ?? device;

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: initial,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

applyDirection(initial);

export function setLanguage(lang: Lang) {
  kv.setItem(LANG_KEY, lang);
  void i18n.changeLanguage(lang);
  applyDirection(lang);
}

function applyDirection(lang: Lang) {
  const rtl = lang === "ar";
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl); // full layout flip applies on the next app launch
  }
}

export default i18n;
