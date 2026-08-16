import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext, Link as RouterLink, useNavigate } from "react-router-dom";
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
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Paper from "@mui/material/Paper";
import { WatchlistWidget } from "./WatchlistWidget";
import { ShoppingWidget } from "./ShoppingWidget";
import { WeatherWidget } from "./WeatherWidget";
import { SuggestedForYouWidget } from "./SuggestedForYouWidget";
import { PersonalizedTopicHub } from "./PersonalizedTopicHub";
import { TopStoriesSection } from "./TopStoriesSection";
import { TrendingShortVideos } from "./TrendingShortVideos";
import { formatTimeAgoLong } from "../utils/formatTime";
import { optimizeImageUrl, getCategoryFallbackImage } from "../utils/imageOptimizer";
import { fallbackDiscoverArticles } from "../utils/fallbackArticles";

const Discover: React.FC = () => {
  const outletContext = useOutletContext<{ searchTerm?: string } | undefined>();
  const searchTerm = outletContext?.searchTerm ?? "";
  const navigate = useNavigate();

  const handlePlayGamesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/play-games");
  };

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
  const [selectedTopicId, setSelectedTopicId] = useState<string>("top-ai");
  const [personalTab, setPersonalTab] = useState<"recommended" | "trending">("recommended");

  const recommendedArticles = React.useMemo(() => {
    try {
      const weights = JSON.parse(localStorage.getItem("worldnewz_category_weights") || "{}");
      return [...articles].sort((a, b) => {
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
  }, [articles, getEngagement]);

  const trendingArticles = React.useMemo(() => {
    return [...articles].sort((a, b) => {
      const engA = getEngagement(a.url || "") || { likes: 0, comments: [] };
      const engB = getEngagement(b.url || "") || { likes: 0, comments: [] };
      
      const scoreA = (engA.likes * 2) + (engA.comments?.length || 0) * 5 + (a.title.length % 5);
      const scoreB = (engB.likes * 2) + (engB.comments?.length || 0) * 5 + (b.title.length % 5);
      return scoreB - scoreA;
    }).slice(0, 4);
  }, [articles, getEngagement]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  let filteredArticles = articles.filter((article) => {
    if (normalizedSearchTerm) {
      const text = `${article.title} ${article.description ?? ""} ${article.category ?? ""}`.toLowerCase();
      return text.includes(normalizedSearchTerm);
    }
    if (followedTopics.length > 0) {
      const sourceName = typeof article.source === "object" && article.source !== null && "name" in article.source
        ? article.source.name
        : typeof article.source === "string"
        ? article.source
        : "";
      const category = (article.category ?? sourceName ?? "").toLowerCase();
      const title = article.title.toLowerCase();
      return followedTopics.some(topic => 
        category.includes(topic.toLowerCase()) || 
        title.includes(topic.toLowerCase())
      );
    }
    return true;
  });

  if (filteredArticles.length === 0 && articles.length > 0 && !normalizedSearchTerm) {
    filteredArticles = articles;
  }

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

  // Article breakdown for 2-zone editorial newsroom layout
  const leadStory = filteredArticles[0];
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
  const topStoriesGrid = filteredArticles.slice(6, 12);
  const globalNewsGrid = filteredArticles.slice(12);

  return (
    <Box sx={{ width: "100%", backgroundColor: "var(--paper)", minHeight: "100vh", py: { xs: 2, md: 4 } }}>
      <SEOMeta
        title="WorldNewzs — Global News, Verified"
        description={`Stay updated with verified world news on ${dailyKeyword}, politics, business, technology, and health.`}
        keywords={['worldnewzs', 'news', 'breaking news', dailyKeyword]}
        canonical="https://worldnewzs.in"
      />

      <Box
        className="wrap"
        sx={{
          maxWidth: "1240px",
          margin: "0 auto",
          px: { xs: 2, md: 3.5 },
        }}
      >
        {/* 2-Zone Layout: Main Column + Fixed Sidebar */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" },
            gap: { xs: 3, lg: 5.5 },
            alignItems: "start",
          }}
        >
          {/* ================= LEFT MAIN EDITORIAL RIVER ================= */}
          <Box component="section" sx={{ minWidth: 0 }}>
            <SectionStatus
              loading={loading}
              error={error}
              hasData={filteredArticles.length > 0}
              emptyText={normalizedSearchTerm ? "No results matching your search." : "No news available."}
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
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  {/* Lead Story */}
                  <Box
                    onClick={() => handleArticleClick(leadStory)}
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      "&:hover .lead-title": { color: "var(--red-deep)" },
                    }}
                  >
                    <Box
                      className="art tone-red"
                      sx={{
                        position: "relative",
                        width: "100%",
                        height: { xs: 220, sm: 300, md: 340 },
                        borderRadius: "2px",
                        overflow: "hidden",
                        mb: 2,
                        backgroundColor: "var(--paper-raise)",
                      }}
                    >
                      <img
                        src={optimizeImageUrl(leadStory.urlToImage || leadStory.imageUrl, 800, leadStory.category, leadStory.title)}
                        alt={leadStory.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getCategoryFallbackImage(leadStory.category, leadStory.title);
                        }}
                      />
                    </Box>

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
                        gap: 1,
                      }}
                    >
                      Lead Story · {leadStory.category || "Top News"}
                    </Typography>

                    <Typography
                      className="lead-title"
                      component="h1"
                      sx={{
                        fontFamily: "var(--serif)",
                        fontSize: { xs: "24px", sm: "30px", md: "34px" },
                        fontWeight: 700,
                        lineHeight: 1.15,
                        letterSpacing: "-0.015em",
                        color: "var(--text)",
                        mb: 1.5,
                        transition: "color 0.2s ease",
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
                        mb: 2,
                      }}
                    >
                      {leadStory.description || leadStory.summary}
                    </Typography>

                    <Typography
                      sx={{
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        color: "var(--slate-light)",
                      }}
                    >
                      By {(leadStory as any).author || "Editorial Desk"} · {formatTimeAgoLong(leadStory.publishedAt)}
                    </Typography>
                  </Box>

                  {/* Most Read Rail */}
                  <Box
                    sx={{
                      borderLeft: { xs: "none", md: "1px solid var(--line)" },
                      pl: { xs: 0, md: 3 },
                      pt: { xs: 2, md: 0 },
                      borderTop: { xs: "1px solid var(--line)", md: "none" },
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
                        mb: 2.5,
                      }}
                    >
                      <Typography
                        component="h2"
                        sx={{
                          fontFamily: "var(--serif)",
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "var(--text)",
                        }}
                      >
                        Most Read
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: "var(--mono)",
                          fontSize: "10.5px",
                          color: "var(--slate-light)",
                        }}
                      >
                        Top 5
                      </Typography>
                    </Box>

                    {mostReadArticles.map((art: Article, idx: number) => (
                      <Box
                        key={art.url || idx}
                        onClick={() => handleArticleClick(art)}
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 2,
                          mb: 2.2,
                          pb: 2,
                          borderBottom: idx < mostReadArticles.length - 1 ? "1px solid var(--line-soft)" : "none",
                          cursor: "pointer",
                          "&:hover .rail-title": { color: "var(--red)" },
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "var(--serif)",
                            fontSize: "26px",
                            fontWeight: 700,
                            color: "var(--gold)",
                            lineHeight: 1,
                            minWidth: 22,
                          }}
                        >
                          {idx + 1}
                        </Typography>
                        <Box>
                          <Typography
                            className="rail-title"
                            sx={{
                              fontFamily: "var(--sans, 'IBM Plex Sans', sans-serif)",
                              fontSize: "13.5px",
                              fontWeight: 600,
                              lineHeight: 1.35,
                              color: "var(--text)",
                              mb: 0.5,
                              transition: "color 0.2s ease",
                            }}
                          >
                            {art.title}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: "var(--mono)",
                              fontSize: "10.5px",
                              color: "var(--slate-light)",
                            }}
                          >
                            {art.category || "News"} · {formatTimeAgoLong(art.publishedAt)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* 2. TOP STORIES WITH SELECTION & MULTI-API AGGREGATION */}
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

              {/* 3. PERSONALIZED TOPIC INTELLIGENCE HUB (DRIVEN BY TOPIC SELECTIONS) */}
              <PersonalizedTopicHub
                initialTopicId={selectedTopicId}
                followedTopicIds={followedTopics}
                onToggleFollow={(id) => {
                  setFollowedTopics((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  );
                }}
              />

              {/* 4. EDITORIAL VIDEO RAIL */}
              <Box sx={{ mb: 5 }}>
                <TrendingShortVideos />
              </Box>

              {/* 5. MORE GLOBAL NEWS SCANNING GRID */}
              {globalNewsGrid.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Box
                    className="section-head"
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      borderBottom: "1px solid var(--line)",
                      pb: 1.2,
                      mb: 3,
                    }}
                  >
                    <Typography
                      component="h2"
                      sx={{
                        fontFamily: "var(--serif)",
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "var(--text)",
                      }}
                    >
                      More Global News
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        color: "var(--slate-light)",
                      }}
                    >
                      Worldwide Stream
                    </Typography>
                  </Box>

                  <NewsGrid
                    articles={globalNewsGrid}
                    columns={{ xs: 12, sm: 6, md: 4 }}
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

              {isFetchingMore && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={30} sx={{ color: "var(--red)" }} />
                </Box>
              )}
            </SectionStatus>
          </Box>

          {/* ================= RIGHT FIXED SIDEBAR ================= */}
          <Box component="aside" sx={{ display: "flex", flexDirection: "column", gap: 3.5, minWidth: 0 }}>
            {/* 1. PERSONALIZATION TABBED CONTAINER ("For You") */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: "var(--paper-raise)",
                border: "1px solid var(--line)",
                borderRadius: "3px",
              }}
            >
              <Box sx={{ borderBottom: "1px solid var(--line)", pb: 1.5, mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyBetween: "space-between", mb: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: "var(--mono)",
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--red)",
                    }}
                  >
                    Personalization
                  </Typography>
                </Box>
                <Tabs
                  value={personalTab}
                  onChange={(_, val) => setPersonalTab(val)}
                  sx={{
                    minHeight: 32,
                    "& .MuiTabs-indicator": { backgroundColor: "var(--red)", height: 2 },
                  }}
                >
                  <Tab
                    value="recommended"
                    icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                    iconPosition="start"
                    label="For You"
                    sx={{
                      fontSize: "12.5px",
                      fontWeight: 600,
                      fontFamily: "var(--sans)",
                      textTransform: "none",
                      minHeight: 32,
                      py: 0.5,
                      px: 1,
                      color: "var(--slate)",
                      "&.Mui-selected": { color: "var(--text)" },
                    }}
                  />
                  <Tab
                    value="trending"
                    icon={<WhatshotIcon sx={{ fontSize: 14 }} />}
                    iconPosition="start"
                    label="Trending"
                    sx={{
                      fontSize: "12.5px",
                      fontWeight: 600,
                      fontFamily: "var(--sans)",
                      textTransform: "none",
                      minHeight: 32,
                      py: 0.5,
                      px: 1,
                      color: "var(--slate)",
                      "&.Mui-selected": { color: "var(--text)" },
                    }}
                  />
                </Tabs>
              </Box>

              <SuggestedForYouWidget
                onTopicsChange={setFollowedTopics}
                onTopicSelect={setSelectedTopicId}
                activeTopicId={selectedTopicId}
              />

              <Box sx={{ mt: 2 }}>
                {(personalTab === "recommended" ? recommendedArticles : trendingArticles).map((art, idx) => (
                  <Box
                    key={art.url || idx}
                    onClick={() => handleArticleClick(art)}
                    sx={{
                      py: 1,
                      borderBottom: idx < 3 ? "1px solid var(--line-soft)" : "none",
                      cursor: "pointer",
                      "&:hover .item-title": { color: "var(--red)" },
                    }}
                  >
                    <Typography
                      className="item-title"
                      sx={{
                        fontFamily: "var(--sans)",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        lineHeight: 1.35,
                        color: "var(--text)",
                        mb: 0.25,
                      }}
                    >
                      {art.title}
                    </Typography>
                    <Typography sx={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--slate-light)" }}>
                      {art.category || "News"}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* 2. READER TOOLS (Quiz, Polls, Games - clearly labeled as Utilities) */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: "var(--paper-raise)",
                border: "1px solid var(--line)",
                borderRadius: "3px",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--slate-light)",
                  mb: 1.5,
                  pb: 1,
                  borderBottom: "1px solid var(--line-soft)",
                }}
              >
                Reader Utilities & Games
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography sx={{ fontFamily: "var(--sans)", fontSize: "13.5px", fontWeight: 600, mb: 0.5 }}>
                    Daily News Quiz 🏆
                  </Typography>
                  <Typography sx={{ fontFamily: "var(--sans)", fontSize: "12px", color: "var(--slate)", mb: 1 }}>
                    Test your knowledge on today's headlines.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/badge-quiz"
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: "var(--line)",
                      color: "var(--text)",
                      fontSize: "11.5px",
                      textTransform: "none",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    Play Quiz →
                  </Button>
                </Box>

                <Box sx={{ pt: 1.5, borderTop: "1px solid var(--line-soft)" }}>
                  <Typography sx={{ fontFamily: "var(--sans)", fontSize: "13.5px", fontWeight: 600, mb: 0.5 }}>
                    Community Opinion Poll 🗳️
                  </Typography>
                  <Typography sx={{ fontFamily: "var(--sans)", fontSize: "12px", color: "var(--slate)", mb: 1 }}>
                    Vote on active geopolitical and market questions.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/polls"
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: "var(--line)",
                      color: "var(--text)",
                      fontSize: "11.5px",
                      textTransform: "none",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    Vote in Poll →
                  </Button>
                </Box>

                <Box sx={{ pt: 1.5, borderTop: "1px solid var(--line-soft)" }}>
                  <Typography sx={{ fontFamily: "var(--sans)", fontSize: "13.5px", fontWeight: 600, mb: 0.5 }}>
                    Arcade Games 🎮
                  </Typography>
                  <Button
                    onClick={handlePlayGamesClick}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: "var(--line)",
                      color: "var(--text)",
                      fontSize: "11.5px",
                      textTransform: "none",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    Open Arcade →
                  </Button>
                </Box>
              </Box>
            </Paper>

            {/* 3. MARKETPLACE PICKS (Amazon products - strictly isolated to sidebar under Sponsored tag!) */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: "var(--paper-raise)",
                border: "1px solid var(--line)",
                borderRadius: "3px",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography
                  sx={{
                    fontFamily: "var(--sans)",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  Marketplace Picks
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "var(--mono)",
                    fontSize: "10px",
                    color: "var(--slate-light)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    backgroundColor: "var(--paper)",
                    px: 1,
                    py: 0.25,
                    borderRadius: "2px",
                  }}
                >
                  Sponsored
                </Typography>
              </Box>

              <ShoppingWidget />
            </Paper>

            {/* 4. WATCHLIST & WEATHER DATA WIDGETS */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: "var(--paper-raise)",
                border: "1px solid var(--line)",
                borderRadius: "3px",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--slate-light)",
                  mb: 1.5,
                }}
              >
                Market Watchlist
              </Typography>
              <WatchlistWidget />
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: "var(--paper-raise)",
                border: "1px solid var(--line)",
                borderRadius: "3px",
              }}
            >
              <WeatherWidget />
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Discover;