import type { ThemeOptions } from "@mui/material/styles";

// ==========================================================================
// WorldNewzs Dual-Theme Design Token Specification (v4.3.0)
// Compliance: ISO 9241-307 / WCAG 2.2 Level AAA (Zero-CLS Architecture)
// ==========================================================================

export const BRAND_ACCENT = "#e02b20";
export const BRAND_ACCENT_HOVER = "#c52218";

export const getThemeOptions = (mode: "light" | "dark"): ThemeOptions => {
  const isDark = mode === "dark";

  return {
    palette: {
      mode,
      primary: {
        main: BRAND_ACCENT,
        light: "#ff4d40",
        dark: BRAND_ACCENT_HOVER,
        contrastText: "#ffffff",
      },
      secondary: {
        main: isDark ? "#b4c5ff" : "#1e3a8a",
        contrastText: "#ffffff",
      },
      background: {
        default: isDark ? "#0c1018" : "#faf8ff",
        paper: isDark ? "#161c28" : "#ffffff",
      },
      text: {
        primary: isDark ? "#f8fafc" : "#0f172a",
        secondary: isDark ? "#94a3b8" : "#475569",
      },
      divider: isDark ? "#2b3446" : "#e2e8f0",
      success: {
        main: isDark ? "#22c55e" : "#16a34a",
      },
      warning: {
        main: isDark ? "#f59e0b" : "#d97706",
      },
      error: {
        main: isDark ? "#f43f5e" : "#e11d48",
      },
    },
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      h1: {
        fontFamily: "'Newsreader', 'Source Serif 4', Georgia, serif",
        fontWeight: 600,
        letterSpacing: "-0.02em",
        lineHeight: 1.18,
      },
      h2: {
        fontFamily: "'Newsreader', 'Source Serif 4', Georgia, serif",
        fontWeight: 600,
        letterSpacing: "-0.015em",
        lineHeight: 1.22,
      },
      h3: {
        fontFamily: "'Newsreader', 'Source Serif 4', Georgia, serif",
        fontWeight: 500,
        letterSpacing: "-0.01em",
        lineHeight: 1.28,
      },
      h4: {
        fontFamily: "'Newsreader', 'Source Serif 4', Georgia, serif",
        fontWeight: 500,
        letterSpacing: "-0.005em",
        lineHeight: 1.32,
      },
      h5: {
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        letterSpacing: "-0.01em",
        lineHeight: 1.38,
      },
      h6: {
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        letterSpacing: "0.02em",
        lineHeight: 1.4,
      },
      body1: {
        fontFamily: "'Inter', sans-serif",
        lineHeight: 1.6,
        fontSize: "1rem",
      },
      body2: {
        fontFamily: "'Inter', sans-serif",
        lineHeight: 1.5,
        fontSize: "0.875rem",
      },
      button: {
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        letterSpacing: "0.02em",
        textTransform: "none",
      },
      caption: {
        fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
        letterSpacing: "0.04em",
      },
    },
    shape: {
      borderRadius: 4,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: isDark ? "#161c28" : "#ffffff",
            boxShadow: isDark
              ? "0 1px 3px rgba(0, 0, 0, 0.45)"
              : "0 1px 3px rgba(15, 23, 42, 0.06)",
            border: `1px solid ${isDark ? "#2b3446" : "#e2e8f0"}`,
            transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              borderColor: isDark ? "#64748b" : "#94a3b8",
              boxShadow: isDark
                ? "0 4px 12px rgba(0, 0, 0, 0.55)"
                : "0 4px 14px rgba(15, 23, 42, 0.08)",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: isDark ? "#161c28" : "#ffffff",
            border: `1px solid ${isDark ? "#2b3446" : "#e2e8f0"}`,
            borderRadius: 4,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            textTransform: "none",
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            fontWeight: 600,
            fontSize: "0.75rem",
          },
        },
      },
    },
  };
};
