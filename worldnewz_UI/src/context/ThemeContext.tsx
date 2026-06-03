import { createContext, useContext, useState, useMemo, useEffect } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { getThemeOptions } from "../Themes";

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
    return (localStorage.getItem("worldnewz_theme") as "light" | "dark") ?? "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("worldnewz_theme", next);
      return next;
    });
  };

  const theme = useMemo(
    () => createTheme(getThemeOptions(mode)),
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
