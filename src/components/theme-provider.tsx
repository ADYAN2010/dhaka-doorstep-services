import { createContext, useContext, type ReactNode } from "react";
import { useAppearance } from "./appearance-provider";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Theme is now a thin wrapper over AppearanceProvider so the global
 * appearance settings stay the single source of truth. The toggle
 * flips between explicit light/dark (overriding "system").
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, update, resolvedMode } = useAppearance();

  const setTheme = (next: Theme) => update({ themeMode: next });
  const toggle = () => update({ themeMode: resolvedMode === "dark" ? "light" : "dark" });

  return (
    <ThemeContext.Provider value={{ theme: resolvedMode, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
  // settings reference kept to ensure context updates trigger re-renders
  void settings;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
