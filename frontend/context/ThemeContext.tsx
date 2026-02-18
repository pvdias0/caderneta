import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { LightColors, DarkColors, ThemeColors } from "../theme";

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: LightColors,
  toggleTheme: () => {},
});

const THEME_KEY = "caderneta_theme_mode";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(THEME_KEY);
        if (saved === "dark") setIsDark(true);
      } catch {
        // ignore
      }
    })();
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await SecureStore.setItemAsync(THEME_KEY, next ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [isDark]);

  const colors = useMemo(() => (isDark ? DarkColors : LightColors), [isDark]);

  const value = useMemo(() => ({ isDark, colors, toggleTheme }), [isDark, colors, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export const useThemeColors = (): ThemeColors => {
  const { colors } = useContext(ThemeContext);
  return colors;
};
