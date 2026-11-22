import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { getThemeOptions } from "../Themes";

interface ColorModeContextType {
  mode: "light" | "dark";
  toggleMode: (viaShortcut?: boolean) => void;
  showThemeToast: (message: string) => void;
}

export const ColorModeContext = createContext<ColorModeContextType>({
  mode: "dark",
  toggleMode: () => {},
  showThemeToast: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

const STORAGE_KEY = "worldnewzs_theme";

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  const showThemeToast = useCallback((message: string) => {
    if (typeof document === "undefined") return;
    let toast = document.getElementById("theme-toast-indicator");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "theme-toast-indicator";
      toast.className = "theme-toast-indicator";
      document.body.appendChild(toast);
    }
    toast.innerHTML = `
      <svg style="width:16px;height:16px;color:#e02b20;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <span>${message}</span>
    `;
    toast.style.display = "flex";
    toast.style.opacity = "1";

    const timerKey = "__themeToastTimer";
    clearTimeout((window as any)[timerKey]);
    (window as any)[timerKey] = setTimeout(() => {
      if (toast) {
        toast.style.opacity = "0";
        setTimeout(() => {
          if (toast) toast.style.display = "none";
        }, 300);
      }
    }, 2200);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", mode);
    if (mode === "light") {
      root.classList.remove("dark");
      document.body.classList.add("light-mode");
    } else {
      root.classList.add("dark");
      document.body.classList.remove("light-mode");
    }
  }, [mode]);

  const toggleMode = useCallback((viaShortcut: boolean = false) => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {
        console.warn("Could not save theme preference:", e);
      }
      showThemeToast(
        next === "dark"
          ? (viaShortcut ? "Wire Dark Mode (Alt+T)" : "Wire Dark Mode Active")
          : (viaShortcut ? "Broadsheet Light Mode (Alt+T)" : "Broadsheet Light Mode Active")
      );
      return next;
    });
  }, [showThemeToast]);

  // Global Alt+T Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        e.stopPropagation();
        toggleMode(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [toggleMode]);

  // System Theme Preference change listener
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setMode(e.matches ? "dark" : "light");
      }
    };

    media.addEventListener("change", handleMediaChange);
    return () => media.removeEventListener("change", handleMediaChange);
  }, []);

  const theme = useMemo(
    () => createTheme(getThemeOptions(mode)),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={{ mode, toggleMode, showThemeToast }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
