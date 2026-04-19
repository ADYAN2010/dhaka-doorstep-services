import { useEffect, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { useLocation } from "@tanstack/react-router";
import i18n, {
  detectInitialLanguage,
  persistLanguage,
  syncHtmlLang,
  type Language,
} from "@/i18n/config";

/**
 * Wraps the app with i18next and keeps `<html lang>` in sync.
 * Reacts to URL changes so that visiting `/en/...` flips the language to
 * English (and persists it), while any other path honours the stored
 * preference (defaulting to Bangla).
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    const desired: Language = location.pathname === "/en" || location.pathname.startsWith("/en/")
      ? "en"
      : detectInitialLanguage();
    if (i18n.language !== desired) {
      void i18n.changeLanguage(desired);
    }
    persistLanguage(desired);
    syncHtmlLang(desired);
  }, [location.pathname]);

  // Initial mount — make sure <html lang> matches before any URL effect runs.
  useEffect(() => {
    syncHtmlLang((i18n.language as Language) ?? "bn");
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
