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
        default: isLight ? "#f4f6f8" : "#0d1117",
        paper: isLight ? "#ffffff" : "#161b22",
      },
      text: {
        primary: isLight ? "#1f2937" : "#f3f4f6",
        secondary: isLight ? "#4b5563" : "#9ca3af",
      },
      divider: isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)",
    },
    typography: {
      fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
      h3: {
        fontWeight: 800,
        letterSpacing: "-0.5px",
        lineHeight: 1.2,
      },
      h4: {
        fontWeight: 600,
        letterSpacing: "0.5px",
      },
      h5: {
        fontWeight: 600,
        letterSpacing: "0.2px",
      },
      body1: {
        lineHeight: 1.6,
      },
      body2: {
        lineHeight: 1.5,
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isLight
              ? "0 4px 12px rgba(0, 0, 0, 0.06)"
              : "0 4px 16px rgba(0, 0, 0, 0.35)",
            transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
            border: `1px solid ${isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.05)"}`,
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: isLight
                ? "0 8px 24px rgba(0, 0, 0, 0.1)"
                : "0 8px 32px rgba(0, 0, 0, 0.5)",
            },
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
