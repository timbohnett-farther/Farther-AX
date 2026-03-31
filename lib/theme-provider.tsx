"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createTheme, type ThemeMode, type ThemeType, type StylesType } from "./theme";

type ThemeContextType = {
  theme: ThemeMode;
  THEME: ThemeType;
  STYLES: StylesType;
  CHART_COLORS: readonly string[];
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("farther-ax-theme") as ThemeMode;
    if (stored) {
      setThemeState(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
    } else {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      setThemeState(systemTheme);
      document.documentElement.classList.toggle("dark", systemTheme === "dark");
    }
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem("farther-ax-theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const newTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("farther-ax-theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      return newTheme;
    });
  }, []);

  const { THEME, STYLES, CHART_COLORS } = useMemo(() => createTheme(theme), [theme]);

  const value = useMemo(
    () => ({ theme, THEME, STYLES, CHART_COLORS, setTheme, toggleTheme }),
    [theme, THEME, STYLES, CHART_COLORS, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
