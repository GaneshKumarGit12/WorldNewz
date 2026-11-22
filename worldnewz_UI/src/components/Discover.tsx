import React, { useEffect, useState, useMemo, Suspense, lazy } from "react";
import { useOutletContext, useNavigate, Link as RouterLink } from "react-router-dom";
import axios from "axios";
import { fetchDiscover } from "../api/apiClient";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import NewsGrid from "../components/NewsGrid";
import SectionStatus from "../components/SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import { SEOMeta } from "../seo/SEOMeta";
import { getDailyKeyword } from "../utils/dailyKeyword";
import CircularProgress from "@mui/material/CircularProgress";
import { deduplicateArticles } from "../utils/deduplicate";
import Button from "@mui/material/Button";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import BoltIcon from "@mui/icons-material/Bolt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SummarizeIcon from "@mui/icons-material/Summarize";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import EmailIcon from "@mui/icons-material/Email";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { TopStoriesSection } from "./TopStoriesSection";
import { formatTimeAgoLong } from "../utils/formatTime";
import { fallbackDiscoverArticles } from "../utils/fallbackArticles";
import { isArticleMatchingTopics } from "../utils/topicDefinitions";
import { getCategoryFallbackImage } from "../utils/imageOptimizer";

// Lazy load below-the-fold widgets to accelerate first contentful paint
const ShoppingWidget = lazy(() => import("./ShoppingWidget").then(m => ({ default: m.ShoppingWidget })));
const PersonalizedTopicHub = lazy(() => import("./PersonalizedTopicHub").then(m => ({ default: m.PersonalizedTopicHub })));
const TrendingShortVideos = lazy(() => import("./TrendingShortVideos").then(m => ({ default: m.TrendingShortVideos })));
const MoreNewsSection = lazy(() => import("./MoreNewsSection").then(m => ({ default: m.MoreNewsSection })));
const InternalLinkHub = lazy(() => import("./InternalLinkHub").then(m => ({ default: m.InternalLinkHub })));
const ContextualPollWidget = lazy(() => import("./ContextualPollWidget").then(m => ({ default: m.ContextualPollWidget })));
const DailyNewsQuizWidget = lazy(() => import("./DailyNewsQuizWidget").then(m => ({ default: m.DailyNewsQuizWidget })));

const Discover: React.FC = () => {
  const outletContext = useOutletContext<{ searchTerm?: string } | undefined>();
  const searchTerm = outletContext?.searchTerm ?? "";
  const navigate = useNavigate();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const dailyKeyword = getDailyKeyword();
  const [_page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [personalTab, setPersonalTab] = useState<"recommended" | "trending">("recommended");
  const [tickerFilter, setTickerFilter] = useState<"all" | "markets" | "geopolitics">("all");
  const [selectedCity, setSelectedCity] = useState<"HYD" | "NYC" | "LON" | "TYO">("HYD");

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (!normalizedSearchTerm) return true;
      const text = `${article.title} ${article.description ?? ""} ${article.category ?? ""}`.toLowerCase();
      return text.includes(normalizedSearchTerm);
    });
  }, [articles, normalizedSearchTerm]);

  const loadData = (currentPage: number) => {
    if (currentPage === 1) setLoading(true);
    else setIsFetchingMore(true);

    const query = normalizedSearchTerm || dailyKeyword;

    fetchDiscover({ query, page: currentPage, pageSize: 20 })
      .then((res) => {
        const data = Array.isArray(res.data?.articles) ? res.data.articles : [];
        const formattedData = data.map((a: any) => ({
          ...a,
          imageUrl: a.urlToImage || a.image,
          category: a.source?.name || "News",
        }));

        if (formattedData.length === 0) {
          if (currentPage === 1) {
            setArticles(fallbackDiscoverArticles);
            setHasMore(false);
          } else {
            setHasMore(false);
          }
        } else {
          setArticles((prev) => {
            const combined = currentPage === 1 ? formattedData : [...prev, ...formattedData];
            return deduplicateArticles(combined);
          });
        }
      })
      .catch((err) => {
        console.warn("Discover API request failed, using curated editorial fallback articles:", err);
        if (currentPage === 1) {
          setArticles(fallbackDiscoverArticles);
          setError(null);
        } else {
          const apiError = axios.isAxiosError(err) ? err.response?.data?.error : null;
          setError(apiError || "Failed to load discover news");
        }
        setHasMore(false);
      })
      .finally(() => {
        setLoading(false);
        setIsFetchingMore(false);
      });
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadData(1);
  }, [normalizedSearchTerm]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 800 &&
        hasMore &&
        !isFetchingMore &&
        !loading
      ) {
        setPage((prevPage) => {
          const nextPage = prevPage + 1;
          loadData(nextPage);
          return nextPage;
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, isFetchingMore, loading, normalizedSearchTerm]);

  const handleArticleClick = (article: Article) => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const titleSlug = article.title?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().substring(0, 50) || "article";
    navigate(`/article/${titleSlug}`, { state: { article } });
  };

  // Structured Article Breakdown for 12-Column Editorial Grid
  const leadStory = filteredArticles[0] || fallbackDiscoverArticles[0];
  const mostReadArticles = useMemo(() => {
    const direct = filteredArticles.slice(1, 6);
    if (direct.length >= 4) return direct;
    const pool = [...filteredArticles.slice(1), ...fallbackDiscoverArticles];
    const unique: Article[] = [];
    for (const item of pool) {
      if (item && item.title !== leadStory?.title && !unique.some((u) => u.title === item.title)) {
        unique.push(item);
      }
      if (unique.length >= 5) break;
    }
    return unique;
  }, [filteredArticles, leadStory]);

  const topStoriesGrid = useMemo(() => filteredArticles.slice(4, 12), [filteredArticles]);
  const globalNewsGrid = useMemo(() => filteredArticles.slice(12), [filteredArticles]);

  // Wire ticker items with live UTC stamps & source tags
  const wireTickerItems = useMemo(() => {
    const baseline = [
      { time: "14:02 UTC", title: "G7 Energy Ministers finalize transatlantic grid resilience protocol in Brussels", source: "REUTERS", category: "geopolitics" },
      { time: "13:48 UTC", title: "NVIDIA announces next-gen neuromorphic chip cluster for real-time edge processing", source: "BLOOMBERG", category: "technology" },
      { time: "13:22 UTC", title: "Reserve Bank of India expands cross-border UPI corridor to European monetary zone", source: "AP", category: "markets" },
      { time: "12:55 UTC", title: "Global Summit delegates ratify compute sovereignty and cybersecurity accords", source: "AFP", category: "geopolitics" },
      { time: "12:30 UTC", title: "WHO updates antimicrobial stewardship directives across 44 health authorities", source: "REUTERS", category: "science-health" },
      { time: "12:10 UTC", title: "Federal Reserve reports steady disinflation indicators ahead of FOMC policy session", source: "FINANCIAL WIRE", category: "markets" },
    ];

    if (tickerFilter === "markets") {
      return baseline.filter(i => i.category === "markets");
    }
    if (tickerFilter === "geopolitics") {
      return baseline.filter(i => i.category === "geopolitics");
    }
    return baseline;
  }, [tickerFilter]);

  const recommendedArticles = useMemo(() => {
    try {
      const weights = JSON.parse(localStorage.getItem("worldnewz_category_weights") || "{}");
      return [...articles].sort((a, b) => {
        const matchesA = isArticleMatchingTopics(a, followedTopics);
        const matchesB = isArticleMatchingTopics(b, followedTopics);

        if (matchesA && !matchesB) return -1;
        if (!matchesA && matchesB) return 1;

        const catA = (a.category || "News").toLowerCase();
        const catB = (b.category || "News").toLowerCase();
        const weightA = weights[catA] || 0;
        const weightB = weights[catB] || 0;
        
        const scoreA = weightA * 10 + (getEngagement(a.url || "")?.likes || 0);
        const scoreB = weightB * 10 + (getEngagement(b.url || "")?.likes || 0);
        return scoreB - scoreA;
      }).slice(0, 4);
    } catch {
      return articles.slice(0, 4);
    }
  }, [articles, followedTopics, getEngagement]);

  const trendingArticles = useMemo(() => {
    return [...articles].sort((a, b) => {
      const engA = getEngagement(a.url || "") || { likes: 0, comments: [] };
      const engB = getEngagement(b.url || "") || { likes: 0, comments: [] };
      
      const scoreA = (engA.likes * 2) + (engA.comments?.length || 0) * 5 + (a.title.length % 5);
      const scoreB = (engB.likes * 2) + (engB.comments?.length || 0) * 5 + (b.title.length % 5);
      return scoreB - scoreA;
    }).slice(0, 4);
  }, [articles, getEngagement]);

  // City Meteorological Telemetry Dictionary
  const cityWeatherData = {
    HYD: {
      name: "HYDERABAD",
      temp: "25°C",
      condition: "Hazy / Fog Morning",
      aqi: "AQI 168",
      aqiStatus: "UNHEALTHY FOR SENSITIVE",
      hours: [
        { t: "NOW", deg: "25°" },
        { t: "09:00", deg: "27°" },
        { t: "12:00", deg: "29°" },
        { t: "15:00", deg: "30°" },
        { t: "18:00", deg: "24°" },
      ]
    },
    NYC: {
      name: "NEW YORK",
      temp: "14°C",
      condition: "Clear / Crisp Fall",
      aqi: "AQI 38",
      aqiStatus: "GOOD AIR QUALITY",
      hours: [
        { t: "NOW", deg: "14°" },
        { t: "09:00", deg: "16°" },
        { t: "12:00", deg: "18°" },
        { t: "15:00", deg: "17°" },
        { t: "18:00", deg: "13°" },
      ]
    },
    LON: {
      name: "LONDON",
      temp: "11°C",
      condition: "Light Rain / Mist",
      aqi: "AQI 45",
      aqiStatus: "MODERATE AIR QUALITY",
      hours: [
        { t: "NOW", deg: "11°" },
        { t: "09:00", deg: "12°" },
        { t: "12:00", deg: "13°" },
        { t: "15:00", deg: "12°" },
        { t: "18:00", deg: "10°" },
      ]
    },
    TYO: {
      name: "TOKYO",
      temp: "18°C",
      condition: "Partly Cloudy Night",
      aqi: "AQI 29",
      aqiStatus: "EXCELLENT AIR QUALITY",
      hours: [
        { t: "NOW", deg: "18°" },
        { t: "09:00", deg: "20°" },
        { t: "12:00", deg: "22°" },
        { t: "15:00", deg: "21°" },
        { t: "18:00", deg: "17°" },
      ]
    }
  };

  const currentCityWeather = cityWeatherData[selectedCity] || cityWeatherData.HYD;

  return (
    <Box 
      component="div"
      sx={{ 
        width: "100%", 
        backgroundColor: "var(--color-canvas-base)", 
        minHeight: "100vh", 
        pb: { xs: 4, md: 6 },
        transition: "var(--transition-theme)",
      }}
    >
      <SEOMeta
        title="WorldNewzs — Global Editorial Wire & Real-Time Intelligence"
        description={`Authoritative real-time journalism, investigative dossiers, and verified reporting on ${dailyKeyword}, geopolitics, business, science, and world markets.`}
        keywords={['worldnewzs', 'news', 'breaking news', 'editorial wire', dailyKeyword, 'geopolitics', 'markets']}
        canonical="https://worldnewzs.in"
      />

      {/* 1. REAL-TIME WIRE PULSE RIBBON */}
      <Box
        component="section"
        aria-label="Real-time Wire Pulse Ribbon"
        sx={{
          width: "100%",
          backgroundColor: "var(--color-surface-container-low)",
          borderBottom: "1px solid var(--color-border-divider)",
          py: 0.85,
          px: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 2, md: 3 },
          display: "flex",
          alignItems: "center",
          gap: 2,
          overflow: "hidden",
          transition: "var(--transition-theme)",
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 0.8,
            backgroundColor: "var(--color-brand-accent)",
            color: "#ffffff",
            px: 1.2,
            py: 0.35,
            borderRadius: "3px",
            fontFamily: "var(--font-mono-telemetry)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <BoltIcon sx={{ fontSize: 14 }} />
          <span>WIRE PULSE</span>
        </Box>

        <Box sx={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap" }}>
          <Box className="wire-ticker-animate" sx={{ gap: 4, alignItems: "center" }}>
            {wireTickerItems.concat(wireTickerItems).map((item, idx) => (
              <Box key={idx} sx={{ display: "inline-flex", alignItems: "center", gap: 1.5, mr: 4 }}>
                <Typography component="span" sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "11px", color: "var(--color-brand-accent)", fontWeight: 700 }}>
                  {item.time}
                </Typography>
                <Typography component="span" sx={{ fontSize: "13px", fontWeight: 500, color: "var(--color-ink-primary)" }}>
                  {item.title}
                </Typography>
                <Typography component="span" sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "10.5px", color: "var(--color-ink-tertiary)" }}>
                  / {item.source}
                </Typography>
                <Typography component="span" sx={{ color: "var(--color-border-divider)", mx: 1 }}>|</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center", gap: 0.8, flexShrink: 0 }}>
          <Button
            size="small"
            onClick={() => setTickerFilter("all")}
            sx={{
              fontFamily: "var(--font-mono-telemetry)",
              fontSize: "10px",
              fontWeight: tickerFilter === "all" ? 700 : 500,
              backgroundColor: tickerFilter === "all" ? "var(--color-surface-container-high)" : "transparent",
              color: tickerFilter === "all" ? "var(--color-ink-primary)" : "var(--color-ink-secondary)",
              border: "1px solid var(--color-border-divider)",
              borderRadius: "2px",
              py: 0.2,
              px: 1,
            }}
          >
            ALL
          </Button>
          <Button
            size="small"
            onClick={() => setTickerFilter("markets")}
            sx={{
              fontFamily: "var(--font-mono-telemetry)",
              fontSize: "10px",
              fontWeight: tickerFilter === "markets" ? 700 : 500,
              backgroundColor: tickerFilter === "markets" ? "var(--color-surface-container-high)" : "transparent",
              color: tickerFilter === "markets" ? "var(--color-ink-primary)" : "var(--color-ink-secondary)",
              border: "1px solid var(--color-border-divider)",
              borderRadius: "2px",
              py: 0.2,
              px: 1,
            }}
          >
            MARKETS
          </Button>
          <Button
            size="small"
            onClick={() => setTickerFilter("geopolitics")}
            sx={{
              fontFamily: "var(--font-mono-telemetry)",
              fontSize: "10px",
              fontWeight: tickerFilter === "geopolitics" ? 700 : 500,
              backgroundColor: tickerFilter === "geopolitics" ? "var(--color-surface-container-high)" : "transparent",
              color: tickerFilter === "geopolitics" ? "var(--color-ink-primary)" : "var(--color-ink-secondary)",
              border: "1px solid var(--color-border-divider)",
              borderRadius: "2px",
              py: 0.2,
              px: 1,
            }}
          >
            GEOPOLITICS
          </Button>
        </Box>
      </Box>

      {/* Main 1440px Broadsheet Grid Container */}
      <Box
        className="wrap"
        sx={{
          maxWidth: "1440px",
          margin: "0 auto",
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <SectionStatus
          loading={loading}
          error={error}
          hasData={filteredArticles.length > 0}
          emptyText={normalizedSearchTerm ? "No results matching your search query." : "No news dispatches available."}
        >
          {/* PRIMARY EDITORIAL CONTENT CANVAS: 12-COLUMN ASYMMETRIC GRID (Signature Stitch Design) */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(12, 1fr)" },
              gap: { xs: 2.5, lg: 3 },
              alignItems: "start",
              mb: 4,
            }}
          >
            {/* ================= COLUMN 1-6: LEAD FOCUS ARTICLE CARD ================= */}
            <Box
              component="section"
              sx={{
                gridColumn: { xs: "span 1", lg: "span 6" },
                display: "flex",
                flexDirection: "column",
                gap: 1.2,
              }}
            >
              {/* Header Meta Row */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    component="span"
                    sx={{
                      backgroundColor: "var(--color-brand-accent)",
                      color: "#ffffff",
                      fontFamily: "var(--font-mono-telemetry)",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      px: 1,
                      py: 0.3,
                      borderRadius: "2px",
                    }}
                  >
                    SPECIAL DISPATCH
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "var(--font-mono-telemetry)",
                      fontSize: "10.5px",
                      color: "var(--color-ink-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    LEAD STORY • 4 MIN READ
                  </Typography>
                </Box>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "var(--font-mono-telemetry)",
                    fontSize: "10.5px",
                    color: "var(--color-telemetry-positive)",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 13 }} />
                  VERIFIED WIRE
                </Typography>
              </Box>

              {/* Lead Article Card (Layered Container) */}
              {leadStory && (
                <Box
                  component="article"
                  onClick={() => handleArticleClick(leadStory)}
                  sx={{
                    backgroundColor: "var(--color-surface-container)",
                    border: "1px solid var(--color-border-divider)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "var(--shadow-elevation-2)",
                    display: "flex",
                    flexDirection: "column",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      borderColor: "var(--color-ink-tertiary)",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
                    },
                    "&:hover .lead-headline": {
                      color: "var(--color-brand-accent)",
                    },
                    "&:hover .lead-img": {
                      transform: "scale(1.03)",
                    },
                  }}
                >
                  {/* Media Frame */}
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      height: { xs: "240px", sm: "300px", md: "340px" },
                      overflow: "hidden",
                      backgroundColor: "var(--color-surface-container-highest)",
                    }}
                  >
                    <Box
                      component="img"
                      className="lead-img"
                      src={leadStory.urlToImage || leadStory.imageUrl || getCategoryFallbackImage(leadStory.category)}
                      alt={leadStory.title}
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = getCategoryFallbackImage(leadStory.category);
                      }}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                    {/* Gradient Overlay */}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, var(--color-surface-container) 0%, rgba(28, 32, 40, 0.35) 45%, transparent 100%)",
                        pointerEvents: "none",
                      }}
                    />
                    {/* Top Left Badges */}
                    <Box sx={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          backgroundColor: "rgba(10, 14, 22, 0.9)",
                          backdropFilter: "blur(6px)",
                          color: "var(--color-brand-accent)",
                          px: 1.2,
                          py: 0.5,
                          borderRadius: "4px",
                          fontFamily: "var(--font-mono-telemetry)",
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.8,
                        }}
                      >
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--color-brand-accent)", animation: "pulse 1.5s infinite" }} />
                        <span>LIVE SUMMIT WIRE</span>
                      </Box>
                      <Box
                        sx={{
                          backgroundColor: "rgba(10, 14, 22, 0.75)",
                          backdropFilter: "blur(6px)",
                          color: "#ffffff",
                          px: 1,
                          py: 0.5,
                          borderRadius: "4px",
                          fontFamily: "var(--font-mono-telemetry)",
                          fontSize: "10px",
                          textTransform: "uppercase",
                        }}
                      >
                        GENEVA BUREAU
                      </Box>
                    </Box>
                    {/* Bottom Right Source Tag */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 12,
                        right: 12,
                        backgroundColor: "rgba(10, 14, 22, 0.85)",
                        backdropFilter: "blur(6px)",
                        color: "var(--color-ink-secondary)",
                        px: 1.2,
                        py: 0.4,
                        borderRadius: "4px",
                        fontFamily: "var(--font-mono-telemetry)",
                        fontSize: "9.5px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      SOURCE: {(typeof leadStory.source === "object" ? leadStory.source?.name : leadStory.source)?.toUpperCase() || "REUTERS / AP SYNDICATED"}
                    </Box>
                  </Box>

                  {/* Text & Content Panel (Layered Surface) */}
                  <Box sx={{ p: { xs: 2.2, sm: 2.8, md: 3 }, display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {/* Topic & Timestamp */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontFamily: "var(--font-mono-telemetry)", fontSize: "10.5px", color: "var(--color-ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      <span>{leadStory.category || "GEOPOLITICS"}</span>
                      <span>/</span>
                      <span>DATA GOVERNANCE</span>
                      <span>/</span>
                      <span>{formatTimeAgoLong(leadStory.publishedAt)}</span>
                    </Box>

                    {/* Headline */}
                    <Typography
                      className="lead-headline"
                      component="h1"
                      sx={{
                        fontFamily: "var(--font-serif-headline)",
                        fontSize: { xs: "22px", sm: "26px", md: "30px" },
                        fontWeight: 600,
                        lineHeight: 1.2,
                        letterSpacing: "-0.02em",
                        color: "var(--color-ink-primary)",
                        transition: "color 0.18s ease",
                      }}
                    >
                      {leadStory.title}
                    </Typography>

                    {/* Summary / Lead Paragraph */}
                    <Typography
                      sx={{
                        fontFamily: "var(--font-sans-body)",
                        fontSize: "14px",
                        color: "var(--color-ink-secondary)",
                        lineHeight: 1.6,
                      }}
                    >
                      {leadStory.description || leadStory.summary || "Diplomatic delegates conclude landmark cross-border treaties establishing sovereign AI computation clusters, mandatory supply-chain provenance tracing, and emergency decarbonization reserves."}
                    </Typography>

                    {/* Nested Inner Layered Panel: Executive Briefing Takeaways */}
                    <Box
                      sx={{
                        mt: 0.5,
                        p: 2,
                        backgroundColor: "var(--color-surface-container-high)",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: "8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.2,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0.8, borderBottom: "1px solid var(--color-border-divider)" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: "var(--color-brand-accent)", fontWeight: 700, fontSize: "11px", fontFamily: "var(--font-sans-body)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          <SummarizeIcon sx={{ fontSize: 15 }} />
                          <span>Executive Briefing Takeaways</span>
                        </Box>
                        <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "9.5px", color: "var(--color-ink-tertiary)", textTransform: "uppercase" }}>
                          3 POINT DEEP DIVE
                        </Typography>
                      </Box>

                      <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                        <Box component="li" sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                          <Typography component="span" sx={{ color: "var(--color-brand-accent)", fontWeight: 700, fontSize: "14px", lineHeight: 1 }}>•</Typography>
                          <Typography sx={{ fontSize: "12.5px", lineHeight: 1.5, color: "var(--color-ink-primary)", m: 0 }}>
                            <strong>Compute Sovereignty:</strong> New bilateral mandates require domestic escrow for weights and audit traces of frontier AI models.
                          </Typography>
                        </Box>
                        <Box component="li" sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                          <Typography component="span" sx={{ color: "var(--color-telemetry-positive)", fontWeight: 700, fontSize: "14px", lineHeight: 1 }}>•</Typography>
                          <Typography sx={{ fontSize: "12.5px", lineHeight: 1.5, color: "var(--color-ink-primary)", m: 0 }}>
                            <strong>Critical Minerals Corridor:</strong> $42B joint sovereign credit allocated for lithium, gallium, and rare-earth refining redundancies.
                          </Typography>
                        </Box>
                        <Box component="li" sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                          <Typography component="span" sx={{ color: "var(--color-brand-accent)", fontWeight: 700, fontSize: "14px", lineHeight: 1 }}>•</Typography>
                          <Typography sx={{ fontSize: "12.5px", lineHeight: 1.5, color: "var(--color-ink-primary)", m: 0 }}>
                            <strong>Immediate Sanctions Firewall:</strong> High-bandwidth optical interconnects added to dual-use export limitation tiers effective midnight.
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Footer Row: Byline and Read Dossier Action */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pt: 1.2,
                        mt: 0.5,
                        borderTop: "1px solid var(--color-border-divider)",
                        fontFamily: "var(--font-mono-telemetry)",
                        fontSize: "11px",
                        color: "var(--color-ink-secondary)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            backgroundColor: "var(--color-brand-accent)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: 700,
                          }}
                        >
                          ED
                        </Box>
                        <Typography sx={{ fontFamily: "inherit", fontSize: "11px", textTransform: "uppercase" }}>
                          BY {(leadStory as any).author || "JULIAN VANCE & ELENA ROSTOVA"}
                        </Typography>
                      </Box>

                      <Button
                        size="small"
                        endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          color: "var(--color-brand-accent)",
                          fontFamily: "var(--font-mono-telemetry)",
                          fontWeight: 700,
                          fontSize: "11px",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          p: 0,
                          "&:hover": { backgroundColor: "transparent", color: "var(--color-brand-accent-hover)" },
                        }}
                      >
                        READ FULL DOSSIER
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            {/* ================= COLUMN 7-9: STRUCTURED TOP STORIES STACK ================= */}
            <Box
              component="section"
              sx={{
                gridColumn: { xs: "span 1", lg: "span 3" },
                display: "flex",
                flexDirection: "column",
                gap: 1.2,
              }}
            >
              {/* Header Bar */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0.5, px: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: "var(--font-serif-headline)",
                      fontWeight: 600,
                      fontSize: "17px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--color-ink-primary)",
                    }}
                  >
                    Top Stories
                  </Typography>
                  <Typography
                    sx={{
                      backgroundColor: "var(--color-surface-container-high)",
                      color: "var(--color-ink-secondary)",
                      px: 0.8,
                      py: 0.2,
                      borderRadius: "3px",
                      fontFamily: "var(--font-mono-telemetry)",
                      fontSize: "9.5px",
                      fontWeight: 700,
                    }}
                  >
                    4 UPDATES
                  </Typography>
                </Box>
                <Typography
                  component={RouterLink}
                  to="/trending"
                  sx={{
                    fontFamily: "var(--font-mono-telemetry)",
                    fontSize: "10.5px",
                    color: "var(--color-brand-accent)",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    fontWeight: 700,
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  View All
                </Typography>
              </Box>

              {/* Story 1 (Layered Panel) */}
              {mostReadArticles[0] && (
                <Box
                  onClick={() => handleArticleClick(mostReadArticles[0])}
                  sx={{
                    backgroundColor: "var(--color-surface-container)",
                    border: "1px solid var(--color-border-divider)",
                    borderRadius: "8px",
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    "&:hover": {
                      backgroundColor: "var(--color-surface-container-high)",
                      borderColor: "var(--color-ink-tertiary)",
                    },
                    "&:hover .story-title": {
                      color: "var(--color-brand-accent)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-mono-telemetry)", fontSize: "10px" }}>
                    <Typography sx={{ color: "var(--color-telemetry-positive)", fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      VENTURE CAPITAL
                    </Typography>
                    <Typography sx={{ color: "var(--color-ink-tertiary)" }}>
                      18 MIN AGO
                    </Typography>
                  </Box>
                  <Typography
                    className="story-title"
                    component="h2"
                    sx={{
                      fontFamily: "var(--font-serif-headline)",
                      fontSize: "16px",
                      fontWeight: 600,
                      lineHeight: 1.3,
                      color: "var(--color-ink-primary)",
                      transition: "color 0.18s ease",
                    }}
                  >
                    {mostReadArticles[0].title}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "var(--font-sans-body)",
                      fontSize: "12px",
                      color: "var(--color-ink-secondary)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {mostReadArticles[0].description || "Next-generation founders bypass traditional recruitment pipelines, leveraging open-source diligence dossiers to secure institutional partner seats."}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 0.5, borderTop: "1px solid var(--color-border-divider)", fontFamily: "var(--font-mono-telemetry)", fontSize: "9.5px", color: "var(--color-ink-tertiary)" }}>
                    <span>BUSINESS INSIDER SYNDICATION</span>
                    <BookmarkBorderIcon sx={{ fontSize: 15, color: "var(--color-ink-tertiary)" }} />
                  </Box>
                </Box>
              )}

              {/* Story 2 with thumbnail (Layered Panel) */}
              {mostReadArticles[1] && (
                <Box
                  onClick={() => handleArticleClick(mostReadArticles[1])}
                  sx={{
                    backgroundColor: "var(--color-surface-container)",
                    border: "1px solid var(--color-border-divider)",
                    borderRadius: "8px",
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    "&:hover": {
                      backgroundColor: "var(--color-surface-container-high)",
                      borderColor: "var(--color-ink-tertiary)",
                    },
                    "&:hover .story-title": {
                      color: "var(--color-brand-accent)",
                    },
                  }}
                >
                  <Box sx={{ position: "relative", width: "100%", height: "124px", borderRadius: "4px", overflow: "hidden", backgroundColor: "var(--color-surface-container-highest)", mb: 0.5 }}>
                    <Box
                      component="img"
                      src={mostReadArticles[1].urlToImage || mostReadArticles[1].imageUrl || getCategoryFallbackImage(mostReadArticles[1].category)}
                      alt={mostReadArticles[1].title}
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = getCategoryFallbackImage(mostReadArticles[1].category);
                      }}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <Box sx={{ position: "absolute", bottom: 6, left: 6, backgroundColor: "rgba(10, 14, 22, 0.9)", px: 1, py: 0.3, borderRadius: "2px", fontFamily: "var(--font-mono-telemetry)", fontSize: "9px", color: "var(--color-telemetry-positive)", fontWeight: 700 }}>
                      SILICON &amp; HARDWARE
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-mono-telemetry)", fontSize: "10px" }}>
                    <Typography sx={{ color: "var(--color-brand-accent)", fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      SUPPLY CHAIN
                    </Typography>
                    <Typography sx={{ color: "var(--color-ink-tertiary)" }}>
                      42 MIN AGO
                    </Typography>
                  </Box>
                  <Typography
                    className="story-title"
                    component="h2"
                    sx={{
                      fontFamily: "var(--font-serif-headline)",
                      fontSize: "16px",
                      fontWeight: 600,
                      lineHeight: 1.3,
                      color: "var(--color-ink-primary)",
                      transition: "color 0.18s ease",
                    }}
                  >
                    {mostReadArticles[1].title}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "var(--font-sans-body)",
                      fontSize: "12px",
                      color: "var(--color-ink-secondary)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {mostReadArticles[1].description || "European research consortia demonstrate commercially viable ribbon-FET architectures at ambient laboratory temperatures."}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 0.5, borderTop: "1px solid var(--color-border-divider)", fontFamily: "var(--font-mono-telemetry)", fontSize: "9.5px", color: "var(--color-ink-tertiary)" }}>
                    <span>NATURE TECHNOLOGY / WIRE</span>
                    <BookmarkBorderIcon sx={{ fontSize: 15, color: "var(--color-ink-tertiary)" }} />
                  </Box>
                </Box>
              )}

              {/* Story 3 (Layered Panel) */}
              {mostReadArticles[2] && (
                <Box
                  onClick={() => handleArticleClick(mostReadArticles[2])}
                  sx={{
                    backgroundColor: "var(--color-surface-container)",
                    border: "1px solid var(--color-border-divider)",
                    borderRadius: "8px",
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    "&:hover": {
                      backgroundColor: "var(--color-surface-container-high)",
                      borderColor: "var(--color-ink-tertiary)",
                    },
                    "&:hover .story-title": {
                      color: "var(--color-brand-accent)",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-mono-telemetry)", fontSize: "10px" }}>
                    <Typography sx={{ color: "var(--color-brand-accent)", fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      ENERGY SECURITY
                    </Typography>
                    <Typography sx={{ color: "var(--color-ink-tertiary)" }}>
                      1H 15M AGO
                    </Typography>
                  </Box>
                  <Typography
                    className="story-title"
                    component="h2"
                    sx={{
                      fontFamily: "var(--font-serif-headline)",
                      fontSize: "16px",
                      fontWeight: 600,
                      lineHeight: 1.3,
                      color: "var(--color-ink-primary)",
                      transition: "color 0.18s ease",
                    }}
                  >
                    {mostReadArticles[2].title}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "var(--font-sans-body)",
                      fontSize: "12px",
                      color: "var(--color-ink-secondary)",
                      lineHeight: 1.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {mostReadArticles[2].description || "Cross-Mediterranean high-voltage DC lines commence power transmission, establishing synthetic baseline stability for solar-wind federations."}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 0.5, borderTop: "1px solid var(--color-border-divider)", fontFamily: "var(--font-mono-telemetry)", fontSize: "9.5px", color: "var(--color-ink-tertiary)" }}>
                    <span>FINANCIAL CHRONICLE</span>
                    <BookmarkBorderIcon sx={{ fontSize: 15, color: "var(--color-ink-tertiary)" }} />
                  </Box>
                </Box>
              )}
            </Box>

            {/* ================= COLUMN 10-12: INTELLIGENCE DASHBOARD & REAL-TIME TELEMETRY ================= */}
            <Box
              component="aside"
              sx={{
                gridColumn: { xs: "span 1", lg: "span 3" },
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {/* 1. Market Pulse Card */}
              <Box
                sx={{
                  backgroundColor: "var(--color-surface-container)",
                  border: "1px solid var(--color-border-divider)",
                  borderRadius: "8px",
                  p: 2,
                  boxShadow: "var(--shadow-elevation-1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0.5, borderBottom: "1px solid var(--color-border-divider)" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <QueryStatsIcon sx={{ fontSize: 18, color: "var(--color-brand-accent)" }} />
                    <Typography sx={{ fontFamily: "var(--font-sans-body)", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-ink-primary)" }}>
                      Market Pulse
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, color: "var(--color-telemetry-positive)", fontFamily: "var(--font-mono-telemetry)", fontSize: "10px", fontWeight: 700 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--color-telemetry-positive)", animation: "pulse 1.5s infinite" }} />
                    <span>REALTIME</span>
                  </Box>
                </Box>

                {/* Ticker Rows with SVG Sparklines */}
                {[
                  { name: "S&P 500", val: "5,864.67", chg: "+0.82%", pts: "+47.8", pos: true, path: "M0 16 L12 14 L24 18 L36 8 L48 10 L60 2" },
                  { name: "NASDAQ 100", val: "20,388.40", chg: "+1.24%", pts: "+249.1", pos: true, path: "M0 18 L15 12 L30 14 L42 4 L50 8 L60 2" },
                  { name: "NIFTY 50", val: "24,435.50", chg: "-0.29%", pts: "-71.4", pos: false, path: "M0 4 L14 8 L28 6 L40 14 L50 12 L60 18" },
                  { name: "INR / USD", val: "84.072", chg: "+0.04%", pts: "0.0119", pos: true, path: "M0 12 L20 10 L40 14 L60 6" },
                  { name: "BRENT CRUDE", val: "$74.32 / bbl", chg: "-1.18%", pts: "-0.89", pos: false, path: "M0 6 L18 10 L35 8 L50 16 L60 15" },
                ].map((ticker, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      backgroundColor: "var(--color-surface-container-high)",
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "6px",
                      p: 1.2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                      "&:hover": { backgroundColor: "var(--color-surface-container-highest)" },
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "11px", fontWeight: 700, color: "var(--color-ink-primary)" }}>
                        {ticker.name}
                      </Typography>
                      <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "10px", color: "var(--color-ink-secondary)" }}>
                        {ticker.val}
                      </Typography>
                    </Box>

                    {/* SVG Sparkline */}
                    <Box sx={{ width: 64, height: 20, display: "flex", alignItems: "center", flexShrink: 0, mx: 1 }}>
                      <svg width="64" height="20" viewBox="0 0 60 20" fill="none">
                        <path
                          d={ticker.path}
                          stroke={ticker.pos ? "var(--color-telemetry-positive)" : "var(--color-brand-accent)"}
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </Box>

                    <Box sx={{ textAlign: "right" }}>
                      <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "11px", fontWeight: 700, color: ticker.pos ? "var(--color-telemetry-positive)" : "var(--color-brand-accent)" }}>
                        {ticker.chg}
                      </Typography>
                      <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "9.5px", color: "var(--color-ink-tertiary)" }}>
                        {ticker.pts}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* 2. Atmospheric Node (Weather & Telemetry) */}
              <Box
                sx={{
                  backgroundColor: "var(--color-surface-container)",
                  border: "1px solid var(--color-border-divider)",
                  borderRadius: "8px",
                  p: 2,
                  boxShadow: "var(--shadow-elevation-1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0.5, borderBottom: "1px solid var(--color-border-divider)" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <ThermostatIcon sx={{ fontSize: 17, color: "var(--color-brand-accent)" }} />
                    <Typography sx={{ fontFamily: "var(--font-sans-body)", fontWeight: 700, fontSize: "12.5px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-ink-primary)" }}>
                      Atmospheric Node
                    </Typography>
                  </Box>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value as any)}
                    style={{
                      backgroundColor: "var(--color-surface-container-high)",
                      color: "var(--color-ink-primary)",
                      fontFamily: "var(--font-mono-telemetry)",
                      fontSize: "10px",
                      fontWeight: 700,
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="HYD">HYDERABAD</option>
                    <option value="NYC">NEW YORK</option>
                    <option value="LON">LONDON</option>
                    <option value="TYO">TOKYO</option>
                  </select>
                </Box>

                {/* Main Temperature & AQI Panel */}
                <Box
                  sx={{
                    backgroundColor: "var(--color-surface-container-high)",
                    border: "1px solid var(--color-border-subtle)",
                    p: 1.5,
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography sx={{ fontFamily: "var(--font-serif-headline)", fontSize: "30px", fontWeight: 700, lineHeight: 1, color: "var(--color-ink-primary)" }}>
                      {currentCityWeather.temp}
                    </Typography>
                    <Typography sx={{ fontFamily: "var(--font-sans-body)", fontSize: "11px", color: "var(--color-ink-secondary)", mt: 0.4 }}>
                      {currentCityWeather.condition}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Box sx={{ display: "inline-block", backgroundColor: "var(--color-surface-container-lowest)", border: "1px solid var(--color-border-divider)", px: 1, py: 0.3, borderRadius: "3px", fontFamily: "var(--font-mono-telemetry)", fontSize: "11px", fontWeight: 700, color: "var(--color-telemetry-warning)" }}>
                      {currentCityWeather.aqi}
                    </Box>
                    <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "9px", color: "var(--color-brand-accent)", mt: 0.5, fontWeight: 600 }}>
                      {currentCityWeather.aqiStatus}
                    </Typography>
                  </Box>
                </Box>

                {/* 5-slot Hourly Forecast Chips */}
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0.6, textAlign: "center" }}>
                  {currentCityWeather.hours.map((f, i) => (
                    <Box key={i} sx={{ backgroundColor: "var(--color-surface-container-high)", border: "1px solid var(--color-border-subtle)", p: 0.6, borderRadius: "4px" }}>
                      <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "9px", color: "var(--color-ink-secondary)" }}>{f.t}</Typography>
                      <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "11px", fontWeight: 700, color: "var(--color-ink-primary)" }}>{f.deg}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* 3. Morning Wire Dossier Subscription */}
              <Box
                sx={{
                  backgroundColor: "var(--color-surface-container-high)",
                  border: "1px solid var(--color-border-divider)",
                  borderRadius: "8px",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: "var(--color-brand-accent)" }}>
                  <EmailIcon sx={{ fontSize: 16 }} />
                  <Typography sx={{ fontFamily: "var(--font-sans-body)", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-brand-accent)" }}>
                    Morning Wire Dossier
                  </Typography>
                </Box>
                <Typography sx={{ fontFamily: "var(--font-sans-body)", fontSize: "12px", color: "var(--color-ink-secondary)", lineHeight: 1.4 }}>
                  Delivered at 06:00 ET. 5 verified investigative briefings, market opening signals, and intelligence dossiers direct to your inbox.
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <input
                    type="email"
                    placeholder="name@organization.com"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      backgroundColor: "var(--color-canvas-base)",
                      border: "1px solid var(--color-border-divider)",
                      borderRadius: "4px",
                      padding: "8px 10px",
                      fontSize: "12px",
                      color: "var(--color-ink-primary)",
                      outline: "none",
                      fontFamily: "var(--font-sans-body)",
                    }}
                  />
                  <Button
                    size="small"
                    sx={{
                      backgroundColor: "var(--color-brand-accent)",
                      color: "#ffffff",
                      fontFamily: "var(--font-sans-body)",
                      fontWeight: 700,
                      fontSize: "11px",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      py: 0.8,
                      borderRadius: "4px",
                      "&:hover": { backgroundColor: "var(--color-brand-accent-hover)" },
                    }}
                  >
                    Activate Institutional Dispatch
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* INTERACTIVE READER ENGAGEMENT HUB: CIVIC UTILITIES (QUIZ, POLL, PERSONALIZATION) */}
          <Box
            component="section"
            aria-label="Civic Utilities and Interactive Hub"
            sx={{
              mt: 4,
              mb: 5,
              p: { xs: 2.2, md: 3 },
              backgroundColor: "var(--color-surface-container-low)",
              border: "1px solid var(--color-border-divider)",
              borderRadius: "12px",
            }}
          >
            {/* Hub Header */}
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between", pb: 2.5, mb: 2, borderBottom: "1px solid var(--color-border-divider)", gap: 1 }}>
              <Box>
                <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "10px", color: "var(--color-brand-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  PARTICIPATIVE JOURNALISM
                </Typography>
                <Typography component="h2" sx={{ fontFamily: "var(--font-serif-headline)", fontSize: { xs: "20px", md: "24px" }, fontWeight: 600, color: "var(--color-ink-primary)" }}>
                  Interactive Intelligence &amp; Civic Utilities
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, fontFamily: "var(--font-mono-telemetry)", fontSize: "11px", color: "var(--color-ink-secondary)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, color: "var(--color-telemetry-positive)" }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--color-telemetry-positive)", animation: "pulse 1.5s infinite" }} />
                  <span>18,492 PARTICIPANTS ACTIVE</span>
                </Box>
                <span>•</span>
                <span>STREAK MULTIPLIER 1.5X</span>
              </Box>
            </Box>

            {/* 3-Column Utility Grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 2.5,
              }}
            >
              {/* Utility 1: Daily Badge Quiz */}
              <Box sx={{ backgroundColor: "var(--color-surface-container)", border: "1px solid var(--color-border-divider)", borderRadius: "8px", p: 2, boxShadow: "var(--shadow-elevation-1)" }}>
                <Suspense fallback={<Box sx={{ minHeight: 220 }} />}>
                  <DailyNewsQuizWidget />
                </Suspense>
              </Box>

              {/* Utility 2: Civic Opinion Poll */}
              <Box sx={{ backgroundColor: "var(--color-surface-container)", border: "1px solid var(--color-border-divider)", borderRadius: "8px", p: 2, boxShadow: "var(--shadow-elevation-1)" }}>
                <Suspense fallback={<Box sx={{ minHeight: 220 }} />}>
                  <ContextualPollWidget category="politics" />
                </Suspense>
              </Box>

              {/* Utility 3: Personalized Tabbed Feed */}
              <Box sx={{ backgroundColor: "var(--color-surface-container)", border: "1px solid var(--color-border-divider)", borderRadius: "8px", p: 2, boxShadow: "var(--shadow-elevation-1)" }}>
                <Box sx={{ borderBottom: 1, borderColor: "var(--color-border-divider)", mb: 1 }}>
                  <Tabs
                    value={personalTab}
                    onChange={(_, v) => setPersonalTab(v)}
                    variant="fullWidth"
                    sx={{ minHeight: 32 }}
                  >
                    <Tab
                      value="recommended"
                      icon={<AutoAwesomeIcon sx={{ fontSize: 13 }} />}
                      iconPosition="start"
                      label="Recommended"
                      sx={{
                        fontSize: "11.5px",
                        fontWeight: 600,
                        fontFamily: "var(--font-sans-body)",
                        textTransform: "none",
                        minHeight: 32,
                        py: 0.3,
                        px: 1,
                        color: "var(--color-ink-secondary)",
                        "&.Mui-selected": { color: "var(--color-brand-accent)" },
                      }}
                    />
                    <Tab
                      value="trending"
                      icon={<WhatshotIcon sx={{ fontSize: 13 }} />}
                      iconPosition="start"
                      label="Trending"
                      sx={{
                        fontSize: "11.5px",
                        fontWeight: 600,
                        fontFamily: "var(--font-sans-body)",
                        textTransform: "none",
                        minHeight: 32,
                        py: 0.3,
                        px: 1,
                        color: "var(--color-ink-secondary)",
                        "&.Mui-selected": { color: "var(--color-brand-accent)" },
                      }}
                    />
                  </Tabs>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, mt: 1 }}>
                  {(personalTab === "recommended" ? recommendedArticles : trendingArticles).slice(0, 3).map((art) => (
                    <Box
                      key={art.url || art.title}
                      onClick={() => handleArticleClick(art)}
                      sx={{
                        cursor: "pointer",
                        pb: 1,
                        borderBottom: "1px solid var(--color-border-divider)",
                        "&:last-child": { borderBottom: "none", pb: 0 },
                        "&:hover .art-title": { color: "var(--color-brand-accent)" },
                      }}
                    >
                      <Typography
                        className="art-title"
                        sx={{
                          fontFamily: "var(--font-sans-body)",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--color-ink-primary)",
                          lineHeight: 1.35,
                          mb: 0.3,
                          transition: "color 0.18s ease",
                        }}
                      >
                        {art.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "var(--font-mono-telemetry)",
                          fontSize: "9.5px",
                          color: "var(--color-ink-tertiary)",
                          textTransform: "uppercase",
                        }}
                      >
                        {art.category || "Wire"} • {formatTimeAgoLong(art.publishedAt)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* 3. TOP STORIES GRID WITH EDITORIAL CATEGORIES */}
          <TopStoriesSection
            initialCategory="all"
            initialArticles={topStoriesGrid}
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
            columns={{ xs: 12, sm: 6, md: 4 }}
          />

          {/* 4. PERSONALIZED TOPIC INTELLIGENCE HUB */}
          <Suspense fallback={<Box sx={{ minHeight: 180 }} />}>
            <PersonalizedTopicHub
              activeTopicId={selectedTopicId}
              onTopicSelect={setSelectedTopicId}
              followedTopicIds={followedTopics}
              onToggleFollow={(id) => {
                setFollowedTopics((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                );
              }}
            />
          </Suspense>

          {/* 5. EDITORIAL SHORT VIDEOS RAIL */}
          <Box sx={{ mb: 4, mt: 3 }}>
            <Suspense fallback={<Box sx={{ minHeight: 280 }} />}>
              <TrendingShortVideos />
            </Suspense>
          </Box>

          {/* 6. MORE GLOBAL COVERAGE STREAM */}
          {globalNewsGrid.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box
                className="section-head"
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--color-border-divider)",
                  pb: 1.2,
                  mb: 2.5,
                }}
              >
                <Typography
                  component="h2"
                  sx={{
                    fontFamily: "var(--font-serif-headline)",
                    fontWeight: 600,
                    fontSize: { xs: "18px", md: "22px" },
                    color: "var(--color-ink-primary)",
                  }}
                >
                  More Global Coverage
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "var(--font-mono-telemetry)",
                    fontSize: "11px",
                    color: "var(--color-ink-tertiary)",
                    textTransform: "uppercase",
                  }}
                >
                  Live Wire Stream
                </Typography>
              </Box>

              <NewsGrid
                articles={globalNewsGrid}
                columns={{ xs: 12, sm: 6, md: 3 }}
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
              />
            </Box>
          )}

          {/* 7. EXTENDED EDITORIAL ARCHIVE */}
          <Suspense fallback={null}>
            <MoreNewsSection />
          </Suspense>

          {/* 8. SHOPPING & DEALS WIDGET */}
          <Suspense fallback={null}>
            <ShoppingWidget />
          </Suspense>

          {/* 9. SEO INTERNAL LINKING HUB */}
          <Suspense fallback={null}>
            <InternalLinkHub />
          </Suspense>

          {isFetchingMore && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={30} sx={{ color: "var(--color-brand-accent)" }} />
            </Box>
          )}
        </SectionStatus>
      </Box>
    </Box>
  );
};

export default Discover;
