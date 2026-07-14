import { useEffect, useState, useCallback } from "react";

// ============================================================
// USE THEME HOOK — dark/light mode + accessibility mode
// Persists preferences in localStorage.
// ============================================================

type ThemeMode = "dark" | "light";
type AccessibilityMode = "normal" | "high-contrast";

const THEME_STORAGE_KEY = "stadiumiq-theme";
const A11Y_STORAGE_KEY = "stadiumiq-a11y-mode";

interface UseThemeReturn {
  theme: ThemeMode;
  accessibilityMode: AccessibilityMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleAccessibilityMode: () => void;
}

function readStoredTheme(defaultTheme: ThemeMode): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage may be unavailable
  }
  return defaultTheme;
}

function readStoredA11y(): AccessibilityMode {
  try {
    const stored = localStorage.getItem(A11Y_STORAGE_KEY);
    if (stored === "high-contrast") return "high-contrast";
  } catch {
    // ignore
  }
  return "normal";
}

export function useTheme(defaultTheme: ThemeMode = "dark"): UseThemeReturn {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme(defaultTheme));
  const [accessibilityMode, setA11yMode] = useState<AccessibilityMode>(readStoredA11y);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    if (accessibilityMode === "high-contrast") {
      document.documentElement.setAttribute("data-accessibility", "high-contrast");
    } else {
      document.documentElement.removeAttribute("data-accessibility");
    }
    try {
      localStorage.setItem(A11Y_STORAGE_KEY, accessibilityMode);
    } catch {
      // ignore
    }
  }, [accessibilityMode]);

  const setTheme = useCallback((newTheme: ThemeMode): void => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback((): void => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const toggleAccessibilityMode = useCallback((): void => {
    setA11yMode((prev) => (prev === "normal" ? "high-contrast" : "normal"));
  }, []);

  return { theme, accessibilityMode, toggleTheme, setTheme, toggleAccessibilityMode };
}
