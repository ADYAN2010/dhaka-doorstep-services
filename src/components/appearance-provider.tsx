import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type BrandPreset = {
  id: string;
  name: string;
  hue: number;
  chroma: number;
  lightLight: number;
  lightDark: number;
};

export const BRAND_PRESETS: BrandPreset[] = [
  { id: "emerald-teal", name: "Emerald Teal", hue: 175, chroma: 0.13, lightLight: 0.58, lightDark: 0.74 },
  { id: "emerald", name: "Emerald", hue: 155, chroma: 0.15, lightLight: 0.6, lightDark: 0.72 },
  { id: "teal", name: "Teal", hue: 195, chroma: 0.13, lightLight: 0.6, lightDark: 0.74 },
  { id: "indigo", name: "Indigo", hue: 280, chroma: 0.16, lightLight: 0.55, lightDark: 0.7 },
  { id: "rose", name: "Rose", hue: 15, chroma: 0.18, lightLight: 0.62, lightDark: 0.74 },
  { id: "amber", name: "Amber", hue: 75, chroma: 0.15, lightLight: 0.7, lightDark: 0.8 },
  { id: "ocean", name: "Ocean Blue", hue: 230, chroma: 0.14, lightLight: 0.6, lightDark: 0.74 },
  { id: "violet", name: "Royal Violet", hue: 305, chroma: 0.16, lightLight: 0.58, lightDark: 0.72 },
  { id: "sunset", name: "Sunset Coral", hue: 35, chroma: 0.17, lightLight: 0.66, lightDark: 0.78 },
];

export type FontPreset = {
  id: string;
  name: string;
  body: string;
  display: string;
  googleFamilies: string;
};

export const FONT_PRESETS: FontPreset[] = [
  { id: "inter", name: "Inter — Modern", body: "Inter", display: "Inter", googleFamilies: "Inter:wght@400;500;600;700;800" },
  { id: "manrope", name: "Manrope — Friendly", body: "Manrope", display: "Manrope", googleFamilies: "Manrope:wght@400;500;600;700;800" },
  { id: "grotesk", name: "Space Grotesk — Editorial", body: "Inter", display: "Space Grotesk", googleFamilies: "Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700" },
  { id: "playfair", name: "Playfair — Luxe", body: "Inter", display: "Playfair Display", googleFamilies: "Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800" },
  { id: "dmsans", name: "DM Sans — Crisp", body: "DM Sans", display: "DM Sans", googleFamilies: "DM+Sans:wght@400;500;600;700" },
  { id: "poppins", name: "Poppins — Rounded", body: "Poppins", display: "Poppins", googleFamilies: "Poppins:wght@400;500;600;700;800" },
];

export type SeasonalPreset = {
  id: string;
  name: string;
  description: string;
  brandPreset: string;
  themeMode: "light" | "dark" | "system";
  fontPreset: string;
  promoStripText: string;
  promoStripCta: string;
};

export const SEASONAL_PRESETS: SeasonalPreset[] = [
  {
    id: "default",
    name: "Default",
    description: "Year-round emerald-teal identity",
    brandPreset: "emerald-teal",
    themeMode: "system",
    fontPreset: "inter",
    promoStripText: "🎉 Get 20% off your first booking with code WELCOME20",
    promoStripCta: "Book now",
  },
  {
    id: "eid",
    name: "Eid Festival",
    description: "Warm amber palette for Eid season",
    brandPreset: "amber",
    themeMode: "light",
    fontPreset: "playfair",
    promoStripText: "🌙 Eid Mubarak — 25% off all home services",
    promoStripCta: "Celebrate now",
  },
  {
    id: "monsoon",
    name: "Monsoon",
    description: "Cool ocean blues for the rainy season",
    brandPreset: "ocean",
    themeMode: "light",
    fontPreset: "manrope",
    promoStripText: "☔ Monsoon ready — book AC service & cleaning",
    promoStripCta: "Get protected",
  },
  {
    id: "winter",
    name: "Winter",
    description: "Royal violet evening tones",
    brandPreset: "violet",
    themeMode: "dark",
    fontPreset: "grotesk",
    promoStripText: "❄️ Winter cozy — 15% off geyser & heater service",
    promoStripCta: "Stay warm",
  },
  {
    id: "victory-day",
    name: "Victory Day",
    description: "Patriotic emerald & sunset",
    brandPreset: "sunset",
    themeMode: "light",
    fontPreset: "poppins",
    promoStripText: "🇧🇩 Celebrating Bangladesh — special offers all week",
    promoStripCta: "Explore offers",
  },
];

export type SocialLinks = {
  facebook: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  twitter: string;
  whatsapp: string;
};

export type AppearanceSettings = {
  brandPreset: string;
  themeMode: "light" | "dark" | "system";
  fontPreset: string;
  radius: number; // rem

  // Site identity
  siteName: string;
  tagline: string;
  logoUrl: string; // data URL or external URL; empty = use default Logo
  faviconUrl: string;

  // Hero / banner image
  heroImageUrl: string;

  promoStripEnabled: boolean;
  promoStripText: string;
  promoStripCta: string;
  promoStripHref: string;

  bannerEnabled: boolean;
  bannerHeadline: string;
  bannerSubtext: string;
  bannerCta: string;
  bannerHref: string;
  bannerVariant: "info" | "success" | "warning" | "brand";

  sections: {
    popularCategories: boolean;
    featuredServices: boolean;
    howItWorks: boolean;
    whyUs: boolean;
    featuredProviders: boolean;
    areas: boolean;
    testimonials: boolean;
    providerCta: boolean;
    finalCta: boolean;
  };

  // Footer + contact
  footerTagline: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  social: SocialLinks;

  reduceMotion: boolean;

  activeSeasonalPreset: string; // id of seasonal preset, or "custom"
};

const DEFAULT_SETTINGS: AppearanceSettings = {
  brandPreset: "emerald-teal",
  themeMode: "system",
  fontPreset: "inter",
  radius: 0.875,

  siteName: "ServiceHub Bangladesh",
  tagline: "Trusted home services across Dhaka",
  logoUrl: "",
  faviconUrl: "",

  heroImageUrl: "",

  promoStripEnabled: true,
  promoStripText: "🎉 Eid offer — 20% off your first booking with code WELCOME20",
  promoStripCta: "Book now",
  promoStripHref: "/services",

  bannerEnabled: false,
  bannerHeadline: "We're hiring trusted providers across Dhaka",
  bannerSubtext: "Join 500+ approved professionals earning on the platform.",
  bannerCta: "Apply",
  bannerHref: "/become-provider",
  bannerVariant: "brand",

  sections: {
    popularCategories: true,
    featuredServices: true,
    howItWorks: true,
    whyUs: true,
    featuredProviders: true,
    areas: true,
    testimonials: true,
    providerCta: true,
    finalCta: true,
  },

  footerTagline:
    "Bangladesh's all-in-one service platform. Verified professionals across Dhaka.",
  contactEmail: "hello@servicehub.bd",
  contactPhone: "+880 1700-000000",
  contactAddress: "House 12, Road 4, Dhanmondi, Dhaka 1205",
  social: {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    linkedin: "https://linkedin.com/",
    youtube: "",
    twitter: "",
    whatsapp: "",
  },

  reduceMotion: false,

  activeSeasonalPreset: "default",
};

const STORAGE_KEY = "shebabd-appearance-v4";

type AppearanceContextValue = {
  settings: AppearanceSettings;
  update: (patch: Partial<AppearanceSettings>) => void;
  updateSection: (key: keyof AppearanceSettings["sections"], value: boolean) => void;
  updateSocial: (key: keyof SocialLinks, value: string) => void;
  applySeasonal: (presetId: string) => void;
  reset: () => void;
  resolvedMode: "light" | "dark";
};

const AppearanceContext = createContext<AppearanceContextValue | undefined>(undefined);

function applyBrand(preset: BrandPreset) {
  const root = document.documentElement;
  root.style.setProperty("--brand-h", String(preset.hue));
  root.style.setProperty("--brand-c", String(preset.chroma));
  root.style.setProperty("--brand-l", String(preset.lightLight));
  root.style.setProperty("--brand-l-dark", String(preset.lightDark));
}

function applyFont(preset: FontPreset) {
  const root = document.documentElement;
  root.style.setProperty("--font-sans-runtime", `"${preset.body}"`);
  root.style.setProperty("--font-display-runtime", `"${preset.display}"`);

  const id = `font-preset-${preset.id}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${preset.googleFamilies}&display=swap`;
  document.head.appendChild(link);
}

function applyRadius(rem: number) {
  document.documentElement.style.setProperty("--radius", `${rem}rem`);
}

function applyMode(mode: "light" | "dark") {
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  root.style.colorScheme = mode;
}

function applyMotion(reduce: boolean) {
  document.documentElement.classList.toggle("reduce-motion", reduce);
}

function applyFavicon(url: string) {
  if (!url) return;
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

function getSystemMode(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULT_SETTINGS);
  const [systemMode, setSystemMode] = useState<"light" | "dark">("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppearanceSettings>;
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          sections: { ...DEFAULT_SETTINGS.sections, ...(parsed.sections ?? {}) },
          social: { ...DEFAULT_SETTINGS.social, ...(parsed.social ?? {}) },
        });
      }
    } catch {
      // ignore
    }
    setSystemMode(getSystemMode());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemMode(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    setHydrated(true);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolvedMode: "light" | "dark" =
    settings.themeMode === "system" ? systemMode : settings.themeMode;

  useEffect(() => {
    if (!hydrated) return;
    const brand = BRAND_PRESETS.find((p) => p.id === settings.brandPreset) ?? BRAND_PRESETS[0];
    const font = FONT_PRESETS.find((p) => p.id === settings.fontPreset) ?? FONT_PRESETS[0];
    applyBrand(brand);
    applyFont(font);
    applyRadius(settings.radius);
    applyMode(resolvedMode);
    applyMotion(settings.reduceMotion);
    applyFavicon(settings.faviconUrl);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings, resolvedMode, hydrated]);

  const value = useMemo<AppearanceContextValue>(
    () => ({
      settings,
      update: (patch) =>
        setSettings((s) => ({
          ...s,
          ...patch,
          // Any manual change drops the seasonal lock unless the patch sets it explicitly.
          activeSeasonalPreset:
            patch.activeSeasonalPreset !== undefined ? patch.activeSeasonalPreset : "custom",
        })),
      updateSection: (key, value) =>
        setSettings((s) => ({
          ...s,
          sections: { ...s.sections, [key]: value },
          activeSeasonalPreset: "custom",
        })),
      updateSocial: (key, value) =>
        setSettings((s) => ({
          ...s,
          social: { ...s.social, [key]: value },
          activeSeasonalPreset: "custom",
        })),
      applySeasonal: (presetId) => {
        const p = SEASONAL_PRESETS.find((x) => x.id === presetId);
        if (!p) return;
        setSettings((s) => ({
          ...s,
          brandPreset: p.brandPreset,
          themeMode: p.themeMode,
          fontPreset: p.fontPreset,
          promoStripText: p.promoStripText,
          promoStripCta: p.promoStripCta,
          activeSeasonalPreset: p.id,
        }));
      },
      reset: () => setSettings(DEFAULT_SETTINGS),
      resolvedMode,
    }),
    [settings, resolvedMode],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used inside AppearanceProvider");
  return ctx;
}
