import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import bnCommon from "./locales/bn/common.json";
import enCommon from "./locales/en/common.json";

export const SUPPORTED_LANGUAGES = ["bn", "en"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "bn";
export const STORAGE_KEY = "shebabd-language";

/**
 * Read the user's preferred language. Priority:
 * 1. Explicit URL prefix `/en/...`
 * 2. localStorage value
 * 3. Default (Bangla)
 *
 * Safe to call during SSR — returns the default when no window/localStorage.
 */
export function detectInitialLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const path = window.location.pathname;
    if (path === "/en" || path.startsWith("/en/")) return "en";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "bn" || stored === "en") return stored;
  } catch {
    // localStorage may be blocked — fall through to default
  }
  return DEFAULT_LANGUAGE;
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      bn: { common: bnCommon },
      en: { common: enCommon },
    },
    lng: detectInitialLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: "common",
    ns: ["common"],
    interpolation: { escapeValue: false }, // React already escapes
    react: { useSuspense: false },
  });
}

export default i18n;

/** Update <html lang> attribute to match the active language. */
export function syncHtmlLang(lang: Language) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang === "bn" ? "bn" : "en";
  }
}

/** Persist the user's language choice. */
export function persistLanguage(lang: Language) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore — storage may be unavailable
  }
}
