import type { ThemeOptions } from "@mui/material/styles";

// Centralized colors and design system constants
export const PRIMARY_COLOR = "#c83a15";
export const SECONDARY_COLOR = "#f50057";

// Theme options for dynamic generation in context
export const getThemeOptions = (mode: "light" | "dark"): ThemeOptions => {
  const isLight = mode === "light";
  
  return {
    palette: {
      mode,
      primary: {
        main: PRIMARY_COLOR,
        light: "#ff6f43",
        dark: "#900000",
        contrastText: "#ffffff",
      },
      secondary: {
        main: SECONDARY_COLOR,
      },
      background: {
        default: isLight ? "#f8fafc" : "#0d1117",
        paper: isLight ? "#ffffff" : "#161b22",
      },
      text: {
        primary: isLight ? "#0f172a" : "#f3f4f6",
        secondary: isLight ? "#475569" : "#9ca3af",
      },
      divider: isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)",
    },
    typography: {
      fontFamily: "'Inter', 'Outfit', 'Roboto', system-ui, sans-serif",
      h1: {
        fontWeight: 800,
        letterSpacing: "-0.025em",
        lineHeight: 1.2,
      },
      h2: {
        fontWeight: 750,
        letterSpacing: "-0.02em",
        lineHeight: 1.25,
      },
      h3: {
        fontWeight: 700,
        letterSpacing: "-0.015em",
        lineHeight: 1.3,
      },
      h4: {
        fontWeight: 600,
        letterSpacing: "-0.01em",
        lineHeight: 1.35,
      },
      h5: {
        fontWeight: 600,
        letterSpacing: "0",
        lineHeight: 1.4,
      },
      h6: {
        fontWeight: 600,
        letterSpacing: "0.025em",
        lineHeight: 1.4,
      },
      body1: {
        lineHeight: 1.7,
        fontSize: "1.05rem",
      },
      body2: {
        lineHeight: 1.6,
        fontSize: "0.9375rem",
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isLight
              ? "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)"
              : "0 4px 16px rgba(0, 0, 0, 0.35)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            border: `1px solid ${isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.08)"}`,
            "&:hover": {
              transform: "translateY(-3px)",
              borderColor: isLight ? "#94a3b8" : "rgba(255, 255, 255, 0.2)",
              boxShadow: isLight
                ? "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)"
                : "0 8px 32px rgba(0, 0, 0, 0.5)",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.08)"}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: "none",
            fontWeight: 600,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
          },
        },
      },
    },
  };
};
