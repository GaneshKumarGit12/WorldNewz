import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";

import { AppThemeProvider } from "./context/ThemeContext";
import App from "./App";
import { SEOProvider } from "./seo/SEOProvider";
import Discover from "./components/Discover";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load pages for optimized initial chunk sizing and quick loading
const Sports = React.lazy(() => import("./pages/Sports"));
const Money = React.lazy(() => import("./pages/Money"));
const Weather = React.lazy(() => import("./pages/Weather"));
const Shopping = React.lazy(() => import("./pages/Shopping"));
const Search = React.lazy(() => import("./pages/Search"));
const Bookmarks = React.lazy(() => import("./pages/Bookmarks"));
const ResultPage = React.lazy(() => import("./pages/ResultPage"));
const ReadFullArticles = React.lazy(() => import("./pages/ReadFullArticles"));
const CommentHistory = React.lazy(() => import("./pages/CommentHistory"));
const PrivacyPolicyPage = React.lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsPage = React.lazy(() => import("./pages/TermsPage"));
const AboutPage = React.lazy(() => import("./pages/AboutPage"));
const ContactPage = React.lazy(() => import("./pages/ContactPage"));
const EditorialBriefingsPage = React.lazy(() => import("./pages/EditorialBriefingsPage"));
const EditorialGuidelinesPage = React.lazy(() => import("./pages/EditorialGuidelinesPage"));
const Travel = React.lazy(() => import("./pages/Travel"));
const Food = React.lazy(() => import("./pages/Food"));
const Entertainment = React.lazy(() => import("./pages/Entertainment"));
const FacebookSettings = React.lazy(() => import("./pages/FacebookSettings"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));

const PageLoader = () => (
  <Box sx={{ width: "100%", p: 4, display: "flex", flexDirection: "column", gap: 2 }}>
    <LinearProgress sx={{ borderRadius: 1 }} />
  </Box>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SEOProvider>
      <AppThemeProvider>
         <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<App />}>
                  <Route index element={<Discover />} />
                  <Route path="sports" element={<Sports />} />
                  <Route path="money" element={<Money />} />
                  <Route path="weather" element={<Weather />} />
                  <Route path="shopping" element={<Shopping />} />
                  <Route path="travel" element={<Travel />} />
                  <Route path="food" element={<Food />} />
                  <Route path="entertainment" element={<Entertainment />} />
                  <Route path="search" element={<Search />} />
                  <Route path="bookmarks" element={<Bookmarks />} />
                  <Route path="comments" element={<CommentHistory />} />
                  <Route path="article/:id" element={<ResultPage />} />
                  <Route path="read-article/:id" element={<ReadFullArticles />} />
                  <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="terms" element={<TermsPage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="editorial-briefings" element={<EditorialBriefingsPage />} />
                  <Route path="editorial-guidelines" element={<EditorialGuidelinesPage />} />
                  <Route path="contact" element={<ContactPage />} />
                  <Route path="facebook-settings" element={<FacebookSettings />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </AppThemeProvider>
    </SEOProvider>
  </React.StrictMode>
);
