"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "qms-theme";
const DEFAULT_THEME = "dark";

function applyTheme(theme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);

    // Only light/dark are valid values.
    // If nothing has been saved, use dark mode.
    const nextTheme =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : DEFAULT_THEME;

    setThemeState(nextTheme);
    applyTheme(nextTheme);

    setMounted(true);
  }, []);

  const setTheme = (nextTheme) => {
    const normalized = nextTheme === "light" ? "light" : "dark";

    setThemeState(normalized);

    window.localStorage.setItem(STORAGE_KEY, normalized);

    applyTheme(normalized);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isDark: theme === "dark",
      mounted,
    }),
    [theme, mounted],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
