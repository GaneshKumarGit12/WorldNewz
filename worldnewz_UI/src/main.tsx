import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AppThemeProvider } from "./context/ThemeContext";
import App from "./App";
import Discover from "./components/Discover";
import Sports from "./pages/Sports";
import Money from "./pages/Money";
import Weather from "./pages/Weather";
import Shopping from "./pages/Shopping";
import Search from "./pages/Search";
import Bookmarks from "./pages/Bookmarks";
import ResultPage from "./pages/ResultPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Discover />} />
            <Route path="sports" element={<Sports />} />
            <Route path="money" element={<Money />} />
            <Route path="weather" element={<Weather />} />
            <Route path="shopping" element={<Shopping />} />
            <Route path="search" element={<Search />} />
            <Route path="bookmarks" element={<Bookmarks />} />
            <Route path="article/:id" element={<ResultPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppThemeProvider>
  </React.StrictMode>
);
