import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Chip,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  Button
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AutorenewIcon from "@mui/icons-material/Autorenew";

import NewsGrid from "../components/NewsGrid";
import SectionStatus from "../components/SectionStatus";
import { BreadcrumbNav } from "../components/BreadcrumbNav";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { CategoryEditorial } from "../components/CategoryEditorial";
import { SuggestedForYouWidget } from "../components/SuggestedForYouWidget";
import { PersonalizedTopicHub } from "../components/PersonalizedTopicHub";
import { TopStoriesSection } from "../components/TopStoriesSection";
import { WeatherWidget } from "../components/WeatherWidget";
import { WatchlistWidget } from "../components/WatchlistWidget";
import { ShoppingWidget } from "../components/ShoppingWidget";

import {
  detectCountryCode,
  fetchTopHeadlines,
  fetchMoreLocalNews,
  SUPPORTED_COUNTRIES
} from "../api/localNewsService";
import { fetchLocalNews } from "../api/apiClient";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import { deduplicateArticles } from "../utils/deduplicate";
import { formatTimeAgoLong } from "../utils/formatTime";
import { HeroLeadMedia } from "../components/common/HeroLeadMedia";
import { getCategoryFallbackArticles, fallbackDiscoverArticles } from "../utils/fallbackArticles";
import type { Article } from "../types";

const LocalNews: React.FC = () => {
  const navigate = useNavigate();

  // Access global search term if present
  const outletContext = useOutletContext<{ searchTerm?: string } | undefined>();
  const searchTerm = outletContext?.searchTerm ?? "";
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

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
  const [selectedCountry, setSelectedCountry] = useState<string>("in");

  // News articles states
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMoreArticles, setHasMoreArticles] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Topic Hub state
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("top-ai");

  // Auto-detect location on mount
  useEffect(() => {
    const initLocation = async () => {
      try {
        const detected = await detectCountryCode();
        if (detected) {
          setSelectedCountry(detected);
        }
      } catch (err) {
        console.error("Location initialization failed:", err);
        setSelectedCountry("in"); // Fallback
      }
    };
    initLocation();
  }, []);

  // Fetch local news headlines and stream
  const loadData = async (currentPage: number, countryCode: string) => {
    if (currentPage === 1) setLoading(true);
    else setIsFetchingMore(true);

    try {
      let fetched: Article[] = [];

      if (currentPage === 1) {
        // Fetch top headlines + more news in parallel
        const [headlines, more] = await Promise.allSettled([
          fetchTopHeadlines(countryCode),
          fetchMoreLocalNews(countryCode, 1)
        ]);

        const headlinesData = headlines.status === "fulfilled" ? headlines.value : [];
        const moreData = more.status === "fulfilled" ? more.value : [];
        fetched = deduplicateArticles([...headlinesData, ...moreData]);
      } else {
        fetched = await fetchMoreLocalNews(countryCode, currentPage);
      }

      // Secondary fallback to primary backend local-news endpoint if GNews key limits
      if (fetched.length < 4 && currentPage === 1) {
        try {
          const res = await fetchLocalNews({ page: 1, pageSize: 12 });
          const raw = Array.isArray(res.data?.articles) ? res.data.articles : [];
          const formatted = raw.map((a: any) => ({
            ...a,
            imageUrl: a.urlToImage || a.image || a.imageUrl,
            category: a.category || "Local News",
          }));
          fetched = deduplicateArticles([...fetched, ...formatted]);
        } catch (backendErr) {
          console.warn("Backend local-news fallback skipped:", backendErr);
        }
      }

      if (fetched.length === 0) {
        if (currentPage === 1) {
          const fallbacks = getCategoryFallbackArticles("Local News");
          setArticles(fallbacks);
          setHasMoreArticles(false);
        } else {
          setHasMoreArticles(false);
        }
      } else if (fetched.length < 5 && currentPage === 1) {
        const fallbacks = getCategoryFallbackArticles("Local News");
        setArticles(deduplicateArticles([...fetched, ...fallbacks]));
        setHasMoreArticles(false);
      } else {
        setArticles((prev) => {
          const combined = currentPage === 1 ? fetched : [...prev, ...fetched];
          return deduplicateArticles(combined);
        });
        setHasMoreArticles(fetched.length >= 6 && currentPage < 4);
      }
    } catch (err: any) {
      console.warn(`Local news fetch failed for ${countryCode}, using verified fallback articles:`, err);
      if (currentPage === 1) {
        setArticles(getCategoryFallbackArticles("Local News"));
        setError(null);
      } else {
        setError("Failed to load additional local stories");
      }
      setHasMoreArticles(false);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  // Trigger data load on country change
  useEffect(() => {
    if (!selectedCountry) return;
    setArticles([]);
    setPage(1);
    setHasMoreArticles(true);
    loadData(1, selectedCountry);
  }, [selectedCountry]);

  // Handle page pagination
  useEffect(() => {
    if (page > 1 && selectedCountry) {
      loadData(page, selectedCountry);
    }
  }, [page]);

  // Infinite scroll trigger
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.offsetHeight
      ) {
        if (!isFetchingMore && hasMoreArticles && !loading) {
          setPage((prev) => prev + 1);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFetchingMore, hasMoreArticles, loading]);

  // Country selector change handler
  const handleCountryChange = (event: SelectChangeEvent) => {
    setSelectedCountry(event.target.value as string);
  };

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return normalizedSearchTerm
      ? articles.filter((a) =>
          `${a.title} ${a.description ?? ""}`.toLowerCase().includes(normalizedSearchTerm)
        )
      : articles;
  }, [articles, normalizedSearchTerm]);

  // Derived sections matching signature 2-zone newsroom layout
  const leadStory = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const mostReadArticles = useMemo(() => {
    const direct = filteredArticles.slice(1, 6);
    if (direct.length >= 4) return direct;
    const fallbacks = getCategoryFallbackArticles("Local News");
    const pool = [...filteredArticles.slice(1), ...fallbacks, ...fallbackDiscoverArticles];
    const unique: Article[] = [];
    for (const item of pool) {
      if (item && item.title !== leadStory?.title && !unique.some((u) => u.title === item.title)) {
        unique.push(item);
      }
      if (unique.length >= 5) break;
    }
    return unique;
  }, [filteredArticles, leadStory]);

  const regionalStream = useMemo(
    () => (filteredArticles.length > 6 ? filteredArticles.slice(6) : []),
    [filteredArticles]
  );

  const currentCountryName =
    SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountry)?.name || "Selected Location";
  const todayDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const handleArticleClick = (art: Article) => {
    const titleSlug =
      art.title?.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().substring(0, 50) || "article";
    navigate(`/read-article/${titleSlug}`, { state: { article: art } });
  };

  return (
    <Box sx={{ width: "100%", backgroundColor: "var(--paper)", minHeight: "100vh", py: { xs: 2, md: 4 } }}>
      {/* SEO configuration */}
      <SEOMeta
        title={`Local News in ${currentCountryName} (${todayDate}) — WorldNewzs`}
        description={`Read top verified local headlines and regional news from ${currentCountryName}. Real-time geolocation updates on WorldNewzs.`}
        keywords={[
          "local news",
          currentCountryName.toLowerCase(),
          "regional updates",
          "breaking local news",
          "national news",
          todayDate
        ]}
        canonical="https://worldnewzs.in/local-news"
      />

      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: "https://worldnewzs.in" },
          { name: "Local News", url: "https://worldnewzs.in/local-news" }
        ]}
      />

      <Box
        className="wrap"
        sx={{
          maxWidth: "1240px",
          margin: "0 auto",
          px: { xs: 2, md: 3.5 }
        }}
      >
        <BreadcrumbNav items={[{ label: "Local News" }]} />

        {/* --- Unified Masthead & Location Selector --- */}
        <Box sx={{ mb: 3, pb: 2, borderBottom: "1px solid var(--line)" }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              mb: 1
            }}
          >
            <Typography
              sx={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--red)",
              }}
            >
              Edition No. 4,821 · Regional Desk · Geolocation Verification Active
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Chip
                icon={<VerifiedIcon sx={{ fontSize: "14px !important" }} />}
                label="Regional Verification Active"
                variant="outlined"
                size="small"
                sx={{
                  fontFamily: "var(--mono)",
                  fontSize: "10.5px",
                  fontWeight: 600,
                  color: "var(--gold)",
                  borderColor: "var(--gold)",
                  borderRadius: "2px"
                }}
              />

              {/* Country Selector Dropdown */}
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  displayEmpty
                  sx={{
                    fontFamily: "var(--sans)",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    height: "30px",
                    backgroundColor: "var(--paper-raise)",
                    color: "var(--text)",
                    borderRadius: "4px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--line)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "var(--red)",
                    }
                  }}
                >
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <MenuItem
                      key={c.code}
                      value={c.code}
                      sx={{
                        fontFamily: "var(--sans)",
                        fontSize: "13px",
                        fontWeight: c.code === selectedCountry ? 700 : 500
                      }}
                    >
                      <span style={{ marginRight: 8 }}>
                        {c.code === "in" && "🇮🇳"}
                        {c.code === "us" && "🇺🇸"}
                        {c.code === "gb" && "🇬🇧"}
                        {c.code === "ca" && "🇨🇦"}
                        {c.code === "au" && "🇦🇺"}
                        {c.code === "sg" && "🇸🇬"}
                        {c.code === "pk" && "🇵🇰"}
                        {c.code === "nz" && "🇳🇿"}
                        {c.code === "ie" && "🇮🇪"}
                        {c.code === "hk" && "🇭🇰"}
                        {c.code === "ph" && "🇵🇭"}
                        {c.code === "fr" && "🇫🇷"}
                        {c.code === "de" && "🇩🇪"}
                        {c.code === "jp" && "🇯🇵"}
                      </span>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Typography
            component="h1"
            sx={{
              fontFamily: "var(--serif)",
              fontSize: { xs: "28px", sm: "36px", md: "40px" },
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              mb: 1
            }}
          >
            📍 Local News — {currentCountryName}
          </Typography>

          <Typography
            sx={{
              fontFamily: "var(--sans)",
              fontSize: { xs: "14px", sm: "15px" },
              color: "var(--slate)",
              lineHeight: 1.6,
              maxWidth: 900
            }}
          >
            Real-time verified reporting, municipal developments, and community updates tailored to{" "}
            <strong>{currentCountryName}</strong> using IP-based regional geolocation.
          </Typography>
        </Box>

        {/* --- 2-ZONE EDITORIAL RIVER LAYOUT --- */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" },
            gap: { xs: 3, lg: 5.5 },
            alignItems: "start"
          }}
        >
          {/* ================= LEFT MAIN EDITORIAL RIVER ================= */}
          <Box component="section" sx={{ minWidth: 0 }}>
            <SectionStatus
              loading={loading}
              error={error}
              hasData={filteredArticles.length > 0}
              emptyText={
                normalizedSearchTerm
                  ? "No regional news matching your search query."
                  : `No verified local articles currently available for ${currentCountryName}.`
              }
            >
              {/* 1. HERO LEAD STORY & MOST READ RAIL */}
              {leadStory && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1.65fr 1fr" },
                    gap: 3.5,
                    pb: 4,
                    mb: 4,
                    borderBottom: "1px solid var(--line)"
                  }}
                >
                  {/* Lead Story */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      "&:hover .lead-title": { color: "var(--red-deep)" }
                    }}
                  >
                    <HeroLeadMedia
                      imageUrl={leadStory.urlToImage || leadStory.imageUrl}
                      category={leadStory.category || currentCountryName || "Local News"}
                      title={leadStory.title}
                      onArticleClick={() => handleArticleClick(leadStory)}
                    />

                    <Box
                      onClick={() => handleArticleClick(leadStory)}
                      sx={{ cursor: "pointer" }}
                    >
                      <Typography
                        className="eyebrow"
                        sx={{
                          fontFamily: "var(--mono)",
                          fontSize: "11px",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--red)",
                          mb: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1
                        }}
                      >
                        Featured Regional Lead · {leadStory.category || currentCountryName}
                      </Typography>

                      <Typography
                        className="lead-title"
                        component="h2"
                        sx={{
                          fontFamily: "var(--serif)",
                          fontSize: { xs: "24px", sm: "30px", md: "34px" },
                          fontWeight: 700,
                          lineHeight: 1.15,
                          letterSpacing: "-0.015em",
                          color: "var(--text)",
                          mb: 1.5,
                          transition: "color 0.2s ease"
                        }}
                      >
                        {leadStory.title}
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: "var(--serif)",
                          fontStyle: "italic",
                          fontSize: "16px",
                          color: "var(--slate)",
                          lineHeight: 1.55,
                          mb: 2
                        }}
                      >
                        {leadStory.description || leadStory.summary}
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: "var(--mono)",
                          fontSize: "11px",
                          color: "var(--slate-light)"
                        }}
                      >
                        By {(leadStory as any).author || "Regional Desk"} ·{" "}
                        {formatTimeAgoLong(leadStory.publishedAt)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Most Read Rail */}
                  <Box
                    sx={{
                      borderLeft: { xs: "none", md: "1px solid var(--line)" },
                      pl: { xs: 0, md: 3 },
                      pt: { xs: 2, md: 0 },
                      borderTop: { xs: "1px solid var(--line)", md: "none" }
                    }}
                  >
                    <Box
                      className="section-head"
                      sx={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        borderBottom: "1px solid var(--line)",
                        pb: 1,
                        mb: 2.5
                      }}
                    >
                      <Typography
                        component="h2"
                        sx={{
                          fontFamily: "var(--serif)",
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "var(--text)"
                        }}
                      >
                        Top Stories
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: "var(--mono)",
                          fontSize: "10.5px",
                          color: "var(--slate-light)"
                        }}
                      >
                        Most Read
                      </Typography>
                    </Box>

                    {mostReadArticles.map((art, idx) => (
                      <Box
                        key={art.url || idx}
                        onClick={() => handleArticleClick(art)}
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 2,
                          mb: 2.2,
                          pb: 2,
                          borderBottom:
                            idx < mostReadArticles.length - 1
                              ? "1px solid var(--line-soft)"
                              : "none",
                          cursor: "pointer",
                          "&:hover .rail-title": { color: "var(--red)" }
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "var(--serif)",
                            fontSize: "26px",
                            fontWeight: 700,
                            color: "var(--gold)",
                            lineHeight: 1,
                            minWidth: 22
                          }}
                        >
                          {idx + 1}
                        </Typography>
                        <Box>
                          <Typography
                            className="rail-title"
                            sx={{
                              fontFamily: "var(--sans)",
                              fontSize: "13.5px",
                              fontWeight: 600,
                              lineHeight: 1.35,
                              color: "var(--text)",
                              mb: 0.5,
                              transition: "color 0.2s ease"
                            }}
                          >
                            {art.title}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: "var(--mono)",
                              fontSize: "10.5px",
                              color: "var(--slate-light)"
                            }}
                          >
                            {art.category || currentCountryName} ·{" "}
                            {formatTimeAgoLong(art.publishedAt)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* 2. TOP STORIES WITH SELECTION & MULTI-API AGGREGATION */}
              <TopStoriesSection
                initialCategory="local-news"
                onBookmark={addBookmark}
                onRemoveBookmark={removeBookmark}
                isBookmarked={isBookmarked}
                onLike={toggleLike}
                onDislike={toggleDislike}
                onAddComment={addComment}
                onDeleteComment={deleteComment}
                onLikeComment={likeComment}
                onDislikeComment={dislikeComment}
                getEngagement={getEngagement}
                columns={{ xs: 12, sm: 6 }}
              />

              {/* 3. PERSONALIZED TOPIC INTELLIGENCE HUB */}
              <PersonalizedTopicHub
                initialTopicId={selectedTopicId}
                followedTopicIds={followedTopics}
                onToggleFollow={(id) => {
                  setFollowedTopics((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  );
                }}
              />

              {/* 4. REGIONAL DISPATCH STREAM */}
              {regionalStream.length > 0 && (
                <Box sx={{ my: 6 }}>
                  <Box
                    className="section-head"
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      borderBottom: "1px solid var(--line)",
                      pb: 1.2,
                      mb: 3
                    }}
                  >
                    <Typography
                      component="h2"
                      sx={{
                        fontFamily: "var(--serif)",
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "var(--text)"
                      }}
                    >
                      Regional Dispatch — {currentCountryName}
                    </Typography>

                    <Chip
                      label={`${regionalStream.length} Stories`}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontFamily: "var(--mono)",
                        fontSize: "10px",
                        borderColor: "var(--line)"
                      }}
                    />
                  </Box>

                  <NewsGrid
                    articles={regionalStream}
                    onBookmark={addBookmark}
                    onRemoveBookmark={removeBookmark}
                    isBookmarked={isBookmarked}
                    onLike={toggleLike}
                    onDislike={toggleDislike}
                    onAddComment={addComment}
                    onDeleteComment={deleteComment}
                    onLikeComment={likeComment}
                    onDislikeComment={dislikeComment}
                    getEngagement={getEngagement}
                    columns={{ xs: 12, sm: 6 }}
                    category="Local News"
                  />
                </Box>
              )}

              {/* Load More Pagination */}
              {hasMoreArticles && !normalizedSearchTerm && (
                <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isFetchingMore}
                    startIcon={
                      isFetchingMore ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <AutorenewIcon />
                      )
                    }
                    sx={{
                      fontFamily: "var(--sans)",
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "none",
                      px: 3.5,
                      py: 1,
                      borderRadius: "2px",
                      color: "var(--text)",
                      borderColor: "var(--line)",
                      backgroundColor: "var(--paper-raise)",
                      "&:hover": {
                        borderColor: "var(--red)",
                        color: "var(--red)",
                        backgroundColor: "rgba(183, 34, 43, 0.05)"
                      }
                    }}
                  >
                    {isFetchingMore ? "Loading Stories..." : "Load More Regional Stories"}
                  </Button>
                </Box>
              )}

              {/* 5. EDITORIAL GUIDELINE & BACKGROUND COVERAGE */}
              <Box sx={{ mt: 6 }}>
                <CategoryEditorial categoryKey="local-news" />
              </Box>
            </SectionStatus>
          </Box>

          {/* ================= RIGHT 340PX FIXED SIDEBAR ================= */}
          <Box
            component="aside"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              position: { lg: "sticky" },
              top: { lg: 84 }
            }}
          >
            {/* Geolocation indicator card */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: "2px",
                border: "1px solid var(--line)",
                backgroundColor: "var(--paper-raise)"
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <LocationOnIcon sx={{ fontSize: 18, color: "var(--red)" }} />
                <Typography
                  sx={{
                    fontFamily: "var(--sans)",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "var(--text)"
                  }}
                >
                  Regional Feed Active
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontFamily: "var(--sans)",
                  fontSize: "12px",
                  color: "var(--slate)",
                  lineHeight: 1.5
                }}
              >
                Displaying news for <strong>{currentCountryName}</strong>. You can change your location
                anytime from the masthead selector.
              </Typography>
            </Box>

            {/* Weather Widget */}
            <WeatherWidget />

            {/* Suggested For You Widget (wires to Topic Hub) */}
            <SuggestedForYouWidget
              onTopicsChange={setFollowedTopics}
              onTopicSelect={(topicId) => {
                setSelectedTopicId(topicId);
                const el = document.getElementById("personalized-topic-hub");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              activeTopicId={selectedTopicId}
            />

            {/* Financial Markets & Watchlist */}
            <WatchlistWidget />

            {/* Curated Products */}
            <ShoppingWidget />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LocalNews;
