import { useNavigate, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { persistLanguage, syncHtmlLang, type Language } from "@/i18n/config";

/**
 * `বাংলা | EN` toggle. Clicking the inactive option:
 *   1. Updates i18next + localStorage so the choice persists.
 *   2. Rewrites the URL — Bangla lives at `/path`, English at `/en/path`.
 *      We do NOT duplicate route files: the URL prefix is purely cosmetic
 *      so users can share a language-locked link, and the EN routes are
 *      handled by `src/routes/en.$.tsx` which strips the prefix.
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const current: Language = i18n.language === "en" ? "en" : "bn";

  function switchTo(target: Language) {
    if (target === current) return;
    void i18n.changeLanguage(target);
    persistLanguage(target);
    syncHtmlLang(target);

    // Rewrite the URL between `/path` <-> `/en/path`
    const path = location.pathname;
    let nextPath: string;
    if (target === "en") {
      nextPath = path === "/" ? "/en" : `/en${path}`;
    } else {
      nextPath = path === "/en" ? "/" : path.replace(/^\/en(?=\/)/, "");
      if (nextPath === "") nextPath = "/";
    }
    void navigate({ to: nextPath, replace: true });
  }

  const baseBtn =
    "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors";
  const active = "bg-primary text-primary-foreground shadow-soft";
  const inactive = "text-muted-foreground hover:text-foreground";

  return (
    <div
      role="group"
      aria-label={t("language.switchTo")}
      className={`inline-flex items-center gap-0.5 rounded-full border border-border bg-background p-0.5 ${className}`}
    >
      <button
        type="button"
        onClick={() => switchTo("bn")}
        aria-pressed={current === "bn"}
        className={`${baseBtn} ${current === "bn" ? active : inactive}`}
      >
        বাংলা
      </button>
      <button
        type="button"
        onClick={() => switchTo("en")}
        aria-pressed={current === "en"}
        className={`${baseBtn} ${current === "en" ? active : inactive}`}
      >
        EN
      </button>
    </div>
  );
}
