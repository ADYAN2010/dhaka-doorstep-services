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
];

export type AppearanceSettings = {
  brandPreset: string;
  themeMode: "light" | "dark" | "system";
  fontPreset: string;
  radius: number; // rem

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
    howItWorks: boolean;
    whyUs: boolean;
    featuredProviders: boolean;
    areas: boolean;
    testimonials: boolean;
    providerCta: boolean;
    finalCta: boolean;
  };

  reduceMotion: boolean;
};

const DEFAULT_SETTINGS: AppearanceSettings = {
  brandPreset: "emerald-teal",
  themeMode: "system",
  fontPreset: "inter",
  radius: 0.875,

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
    howItWorks: true,
    whyUs: true,
    featuredProviders: true,
    areas: true,
    testimonials: true,
    providerCta: true,
    finalCta: true,
  },

  reduceMotion: false,
};

const STORAGE_KEY = "shebabd-appearance-v2";

type AppearanceContextValue = {
  settings: AppearanceSettings;
  update: (patch: Partial<AppearanceSettings>) => void;
  updateSection: (key: keyof AppearanceSettings["sections"], value: boolean) => void;
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

  // Inject Google Font link if not already present for this preset
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

function getSystemMode(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULT_SETTINGS);
  const [systemMode, setSystemMode] = useState<"light" | "dark">("light");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppearanceSettings>;
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          sections: { ...DEFAULT_SETTINGS.sections, ...(parsed.sections ?? {}) },
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

  // Apply settings whenever they change
  useEffect(() => {
    if (!hydrated) return;
    const brand = BRAND_PRESETS.find((p) => p.id === settings.brandPreset) ?? BRAND_PRESETS[0];
    const font = FONT_PRESETS.find((p) => p.id === settings.fontPreset) ?? FONT_PRESETS[0];
    applyBrand(brand);
    applyFont(font);
    applyRadius(settings.radius);
    applyMode(resolvedMode);
    applyMotion(settings.reduceMotion);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {
      // ignore
    }
  }, [settings, resolvedMode, hydrated]);

  const value = useMemo<AppearanceContextValue>(
    () => ({
      settings,
      update: (patch) => setSettings((s) => ({ ...s, ...patch })),
      updateSection: (key, value) =>
        setSettings((s) => ({ ...s, sections: { ...s.sections, [key]: value } })),
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
