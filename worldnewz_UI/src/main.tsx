import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";

import { AppThemeProvider } from "./context/ThemeContext";
import App from "./App";
import { SEOProvider } from "./seo/SEOProvider";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load pages for optimized initial chunk sizing and quick loading
const Discover = React.lazy(() => import("./components/Discover"));
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
const AuthorBioPage = React.lazy(() => import("./pages/AuthorBioPage"));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));

// New categories
const Politics = React.lazy(() => import("./pages/Politics"));
const Technology = React.lazy(() => import("./pages/Technology"));
const Business = React.lazy(() => import("./pages/Business"));
const ScienceHealth = React.lazy(() => import("./pages/ScienceHealth"));
const Lifestyle = React.lazy(() => import("./pages/Lifestyle"));
const Education = React.lazy(() => import("./pages/Education"));
const Opinion = React.lazy(() => import("./pages/Opinion"));
const Trending = React.lazy(() => import("./pages/Trending"));
const PodcastsVideos = React.lazy(() => import("./pages/PodcastsVideos"));
const LocalNews = React.lazy(() => import("./pages/LocalNews"));

// Added menus
const Services = React.lazy(() => import("./pages/Services"));
const Gaming = React.lazy(() => import("./pages/Gaming"));
const Cartoons = React.lazy(() => import("./pages/Cartoons"));
const Polls = React.lazy(() => import("./pages/Polls"));
const PollsHistory = React.lazy(() => import("./pages/PollsHistory"));
const Stocks = React.lazy(() => import("./pages/Stocks"));

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
                  <Route path="politics" element={<Politics />} />
                  <Route path="technology" element={<Technology />} />
                  <Route path="business" element={<Business />} />
                  <Route path="science-health" element={<ScienceHealth />} />
                  <Route path="lifestyle" element={<Lifestyle />} />
                  <Route path="education" element={<Education />} />
                  <Route path="opinion" element={<Opinion />} />
                  <Route path="trending" element={<Trending />} />
                  <Route path="podcasts-videos" element={<PodcastsVideos />} />
                  <Route path="local-news" element={<LocalNews />} />
                  <Route path="services" element={<Services />} />
                  <Route path="gaming" element={<Gaming />} />
                  <Route path="cartoons" element={<Cartoons />} />
                  <Route path="polls" element={<Polls />} />
                  <Route path="polls-history" element={<PollsHistory />} />
                  <Route path="stocks" element={<Stocks />} />
                  <Route path="search" element={<Search />} />
                  <Route path="bookmarks" element={<Bookmarks />} />
                  <Route path="comments" element={<CommentHistory />} />
                  <Route path="article/:id" element={<ResultPage />} />
                  <Route path="read-article/:id" element={<ReadFullArticles />} />
                  <Route path="author/:slug" element={<AuthorBioPage />} />
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

// Unregister any legacy service workers that might be cached in users' browsers to prevent network/fetch errors
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch((err) => {
    console.error("Error unregistering service worker:", err);
  });
}

