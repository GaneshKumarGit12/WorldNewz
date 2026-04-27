import { createContext, useContext, useState, useMemo } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

interface ColorModeContextType {
  mode: "light" | "dark";
  toggleMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextType>({
  mode: "light",
  toggleMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("worldnewz_theme") as "light" | "dark") ?? "light";
  });

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("worldnewz_theme", next);
      return next;
    });
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: "#1976d2" },
          secondary: { main: "#f50057" },
          background: {
            default: mode === "light" ? "#f4f6f8" : "#0d1117",
            paper: mode === "light" ? "#ffffff" : "#161b22",
          },
        },
        typography: {
          fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
          h4: { fontWeight: 600, letterSpacing: "0.5px" },
          body1: { lineHeight: 1.6 },
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: mode === "light"
                  ? "0 4px 12px rgba(0,0,0,0.08)"
                  : "0 4px 12px rgba(0,0,0,0.4)",
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
