import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  CircularProgress, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Chip, 
  Alert
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import StarIcon from "@mui/icons-material/Star";
import NewspaperIcon from "@mui/icons-material/Newspaper";

import LocalNewsCard from "../components/LocalNewsCard";
import AdBannerCard from "../components/AdBannerCard";
import { 
  detectCountryCode, 
  fetchTopHeadlines, 
  fetchMoreLocalNews, 
  SUPPORTED_COUNTRIES 
} from "../api/localNewsService";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useColorMode } from "../context/ThemeContext";
import type { Article } from "../types";
import { CategoryEditorial } from "../components/CategoryEditorial";

const LocalNews: React.FC = () => {
  const { mode } = useColorMode();
  const isDark = mode === "dark";

  // Access global search term if present
  const outletContext = useOutletContext<{ searchTerm?: string } | undefined>();
  const searchTerm = outletContext?.searchTerm ?? "";

  // Bookmarks & Comments integration
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const { 
    getEngagement, 
    toggleLike, 
    toggleDislike, 
    addComment, 
    deleteComment, 
    likeComment, 
    dislikeComment 
  } = useComments();

  // Location and country state
  const [detectedCountry, setDetectedCountry] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("in");
  const [countryDetecting, setCountryDetecting] = useState<boolean>(true);

  // News articles states
  const [topHeadlines, setTopHeadlines] = useState<Article[]>([]);
  const [moreLocalNews, setMoreLocalNews] = useState<Article[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMoreArticles, setHasMoreArticles] = useState<boolean>(true);

  // Loading & Error states
  const [loadingHeadlines, setLoadingHeadlines] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(true);
  const [loadingNextPage, setLoadingNextPage] = useState<boolean>(false);
  const [headlinesError, setHeadlinesError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);

  // Auto-detect location on mount
  useEffect(() => {
    const initLocation = async () => {
      setCountryDetecting(true);
      try {
        const detected = await detectCountryCode();
        setDetectedCountry(detected);
        setSelectedCountry(detected);
      } catch (err) {
        console.error("Location initialization failed:", err);
        setSelectedCountry("in"); // Fallback
      } finally {
        setCountryDetecting(false);
      }
    };
    initLocation();
  }, []);

  // Fetch top headlines when selected country changes
  useEffect(() => {
    const loadHeadlines = async () => {
      if (!selectedCountry) return;
      setLoadingHeadlines(true);
      setHeadlinesError(null);
      try {
        const data = await fetchTopHeadlines(selectedCountry);
        setTopHeadlines(data);
      } catch (err: any) {
        setHeadlinesError(err.message || "Failed to load top headlines.");
      } finally {
        setLoadingHeadlines(false);
      }
    };

    loadHeadlines();
  }, [selectedCountry]);

  // Fetch more local news (national) when selected country or page changes
  useEffect(() => {
    const loadMoreNews = async () => {
      if (!selectedCountry) return;
      
      if (page === 1) {
        setLoadingMore(true);
        setMoreError(null);
      } else {
        setLoadingNextPage(true);
      }

      try {
        const data = await fetchMoreLocalNews(selectedCountry, page);
        if (data.length === 0) {
          setHasMoreArticles(false);
        } else {
          setMoreLocalNews((prev) => {
            const combined = page === 1 ? data : [...prev, ...data];
            // Deduplicate
            const uniqueUrls = new Set<string>();
            return combined.filter(article => {
              if (!article.url) return true;
              if (uniqueUrls.has(article.url)) return false;
              uniqueUrls.add(article.url);
              return true;
            });
          });
          // GNews free keys have limit on page sizes or total articles, cap around page 3-4 safely
          if (data.length < 9 || page >= 4) {
            setHasMoreArticles(false);
          } else {
            setHasMoreArticles(true);
          }
        }
      } catch (err: any) {
        setMoreError(err.message || "Failed to load more news.");
      } finally {
        setLoadingMore(false);
        setLoadingNextPage(false);
      }
    };

    loadMoreNews();
  }, [selectedCountry, page]);

  // Reset page when country changes
  useEffect(() => {
    setMoreLocalNews([]);
    setPage(1);
    setHasMoreArticles(true);
  }, [selectedCountry]);

  // Country selector change handler
  const handleCountryChange = (event: SelectChangeEvent) => {
    setSelectedCountry(event.target.value as string);
  };

  // Load next page of "More News"
  const handleLoadMore = () => {
    if (!loadingNextPage && hasMoreArticles) {
      setPage((prev) => prev + 1);
    }
  };

  // Filter headlines and more news based on global search term
  const normalizedSearch = searchTerm.trim().toLowerCase();
  
  const filteredHeadlines = normalizedSearch
    ? topHeadlines.filter((a) =>
        `${a.title} ${a.description ?? ""}`.toLowerCase().includes(normalizedSearch)
      )
    : topHeadlines;

  const filteredMoreNews = normalizedSearch
    ? moreLocalNews.filter((a) =>
        `${a.title} ${a.description ?? ""}`.toLowerCase().includes(normalizedSearch)
      )
    : moreLocalNews;

  const currentCountryName = SUPPORTED_COUNTRIES.find(c => c.code === selectedCountry)?.name || "selected location";
  const todayDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* SEO configuration */}
      <SEOMeta
        title={`Local News in ${currentCountryName} (${todayDate})`}
        description={`Read top headlines and local national updates in ${currentCountryName}. Verified regional updates from verified publishers on WorldNewzs.`}
        keywords={["local news", currentCountryName.toLowerCase(), "regional updates", "breaking news", "national news"]}
        canonical={`https://worldnewzs.in/local-news`}
      />

      <JSONLDBreadcrumb crumbs={[
        { name: "Home", url: "https://worldnewzs.in" },
        { name: "Local News", url: "https://worldnewzs.in/local-news" }
      ]} />

      {/* Hero Header Card */}
      <Card 
        elevation={0}
        sx={{ 
          mb: 4, 
          borderRadius: 4, 
          border: "1px solid",
          borderColor: "divider",
          background: isDark 
            ? "linear-gradient(135deg, #0e1e25 0%, #061118 100%)" 
            : "linear-gradient(135deg, #f0fafd 0%, #ffffff 100%)",
          boxShadow: isDark 
            ? "0 4px 20px rgba(0,0,0,0.3)" 
            : "0 4px 20px rgba(0,0,0,0.02)"
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 3 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Typography variant="h3" component="h1" sx={{ fontSize: { xs: "1.8rem", sm: "2.4rem" }, fontWeight: 800 }}>
                  📍 Local News
                </Typography>
                <Chip 
                  icon={<VerifiedIcon />}
                  label="Verified Regional Feed" 
                  variant="outlined"
                  color="info"
                  sx={{ fontWeight: 600, borderRadius: 2, height: 28 }}
                />
              </Box>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: "text.secondary", 
                  fontSize: { xs: "0.95rem", sm: "1.05rem" },
                  maxWidth: 700,
                  lineHeight: 1.6
                }}
              >
                Displaying news tailored to your location. We use your IP geolocation to automatically load stories from your region.
              </Typography>
              
              {/* Location detection status */}
              {!countryDetecting && detectedCountry && (
                <Typography variant="caption" display="block" sx={{ mt: 1.5, color: "text.secondary", fontStyle: "italic" }}>
                  System auto-detected location: <strong>{SUPPORTED_COUNTRIES.find(c => c.code === detectedCountry)?.name || detectedCountry.toUpperCase()}</strong>.
                </Typography>
              )}
            </Box>

            {/* Country Selector Dropdown */}
            <Box sx={{ minWidth: 200 }}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="country-select-label">Change Location</InputLabel>
                <Select
                  labelId="country-select-label"
                  id="country-select"
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  label="Change Location"
                  sx={{ 
                    borderRadius: 2.5,
                    bgcolor: "background.paper",
                    fontWeight: 600
                  }}
                >
                  {SUPPORTED_COUNTRIES.map((country) => (
                    <MenuItem key={country.code} value={country.code}>
                      <span style={{ marginRight: 8 }}>
                        {country.code === "in" && "🇮🇳"}
                        {country.code === "us" && "🇺🇸"}
                        {country.code === "gb" && "🇬🇧"}
                        {country.code === "ca" && "🇨🇦"}
                        {country.code === "au" && "🇦🇺"}
                        {country.code === "sg" && "🇸🇬"}
                        {country.code === "pk" && "🇵🇰"}
                        {country.code === "nz" && "🇳🇿"}
                        {country.code === "ie" && "🇮🇪"}
                        {country.code === "hk" && "🇭🇰"}
                        {country.code === "ph" && "🇵🇭"}
                        {country.code === "fr" && "🇫🇷"}
                        {country.code === "de" && "🇩🇪"}
                        {country.code === "jp" && "🇯🇵"}
                      </span>
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ================= SECTION 1: TOP HEADLINES ================= */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <StarIcon sx={{ color: "#ff8f00" }} />
          <Typography variant="h5" sx={{ fontWeight: 800, textTransform: "capitalize" }}>
            Top Headlines in {currentCountryName}
          </Typography>
        </Box>

        {loadingHeadlines ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="info" />
          </Box>
        ) : headlinesError ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {headlinesError}
          </Alert>
        ) : filteredHeadlines.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No top headlines found matching your search.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {/* Display first headline as featured article (spans full width on desktop) */}
            {(() => {
              const elements: React.ReactNode[] = [];
              filteredHeadlines.forEach((article, idx) => {
                elements.push(
                  <Grid size={idx === 0 ? { xs: 12 } : { xs: 12, sm: 6, md: 4 }} key={`headline-${idx}`}>
                    <LocalNewsCard
                      article={article}
                      featured={idx === 0}
                      isBookmarked={isBookmarked(article.url || "")}
                      onBookmark={addBookmark}
                      onRemoveBookmark={removeBookmark}
                      onLike={toggleLike}
                      onDislike={toggleDislike}
                      onAddComment={addComment}
                      onDeleteComment={deleteComment}
                      onLikeComment={likeComment}
                      onDislikeComment={dislikeComment}
                      engagement={getEngagement(article.url || "")}
                      loading={idx === 0 ? "eager" : "lazy"}
                    />
                  </Grid>
                );
                // Inject ad card after every 5 headlines
                if (idx > 0 && idx % 5 === 4) {
                  elements.push(
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`ad-headline-${idx}`}>
                      <AdBannerCard />
                    </Grid>
                  );
                }
              });
              return elements;
            })()}
          </Grid>
        )}
      </Box>

      {/* ================= SECTION 2: MORE LOCAL NEWS ================= */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <NewspaperIcon sx={{ color: "#06b6d4" }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            More Local & National Stories
          </Typography>
        </Box>

        {loadingMore ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="info" />
          </Box>
        ) : moreError ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {moreError}
          </Alert>
        ) : filteredMoreNews.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No additional local stories found.
          </Alert>
        ) : (
          <>
            <Grid container spacing={3}>
              {(() => {
                const elements: React.ReactNode[] = [];
                filteredMoreNews.forEach((article, idx) => {
                  elements.push(
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`more-${idx}`}>
                      <LocalNewsCard
                        article={article}
                        isBookmarked={isBookmarked(article.url || "")}
                        onBookmark={addBookmark}
                        onRemoveBookmark={removeBookmark}
                        onLike={toggleLike}
                        onDislike={toggleDislike}
                        onAddComment={addComment}
                        onDeleteComment={deleteComment}
                        onLikeComment={likeComment}
                        onDislikeComment={dislikeComment}
                        engagement={getEngagement(article.url || "")}
                        loading="lazy"
                      />
                    </Grid>
                  );
                  // Inject ad card after every 5 articles
                  if (idx % 5 === 4) {
                    elements.push(
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`ad-more-${idx}`}>
                        <AdBannerCard />
                      </Grid>
                    );
                  }
                });
                return elements;
              })()}
            </Grid>

            {/* Load More Button */}
            {hasMoreArticles && !searchTerm && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={loadingNextPage}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1,
                    textTransform: "none",
                    fontWeight: 700,
                    borderColor: "#06b6d4",
                    color: isDark ? "#26c6da" : "#00acc1",
                    "&:hover": {
                      borderColor: "#00acc1",
                      backgroundColor: "rgba(6, 182, 212, 0.05)",
                    }
                  }}
                >
                  {loadingNextPage ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CircularProgress size={20} color="inherit" />
                      Loading Stories...
                    </Box>
                  ) : (
                    "Load More Local News"
                  )}
                </Button>
              </Box>
            )}
          </>
        )}

        <CategoryEditorial categoryKey="local-news" />
      </Box>
    </Box>
  );
};

export default LocalNews;
