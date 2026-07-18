import { useEffect, useState } from "react";
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
import { optimizeImageUrl } from "../utils/imageOptimizer";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { WatchlistWidget } from "./WatchlistWidget";
import { TopEngagingNewsWidget } from "./TopEngagingNewsWidget";
import { ShoppingWidget } from "./ShoppingWidget";
import { WeatherWidget } from "./WeatherWidget";
import { SuggestedForYouWidget } from "./SuggestedForYouWidget";
import { TrendingShortVideos } from "./TrendingShortVideos";


const Discover: React.FC = () => {
  const outletContext = useOutletContext<{ searchTerm?: string } | undefined>();
  const searchTerm = outletContext?.searchTerm ?? "";
  const navigate = useNavigate();

  const handlePlayGamesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open("https://omg10.com/4/11269029", "_blank", "noopener,noreferrer");
    navigate("/play-games");
  };
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks(); // ✅ now URL-based
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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredArticles = articles.filter((article) => {
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
          setHasMore(false);
        } else {
          setArticles((prev) => {
            const combined = currentPage === 1 ? formattedData : [...prev, ...formattedData];
            return deduplicateArticles(combined);
          });
        }
      })
      .catch((err) => {
        const apiError = axios.isAxiosError(err) ? err.response?.data?.error : null;
        setError(apiError || "Failed to load discover news");
      })
      .finally(() => {
        setLoading(false);
        setIsFetchingMore(false);
      });
  };

  useEffect(() => {
    setArticles([]);
    setPage(1);
    setHasMore(true);
    loadData(1);
  }, [searchTerm]); // Re-fetch from page 1 when search term changes

  useEffect(() => {
    if (page > 1) {
      loadData(page);
    }
  }, [page]);

  // Infinite Scroll logic
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.offsetHeight
      ) {
        if (!isFetchingMore && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFetchingMore, hasMore, loading]);

  const topStoriesArticles = filteredArticles.slice(0, 6);
  const remainingArticles = filteredArticles.slice(6);

  // Dynamically preload the first article image to optimize LCP
  useEffect(() => {
    if (filteredArticles.length > 0) {
      const firstArticle = filteredArticles[0];
      const imageUrl = firstArticle.imageUrl || firstArticle.urlToImage;
      if (imageUrl) {
        const optimizedUrl = optimizeImageUrl(imageUrl, 500);
        const existingLink = document.querySelector(`link[rel="preload"][href="${optimizedUrl}"]`);
        if (!existingLink) {
          const link = document.createElement("link");
          link.rel = "preload";
          link.as = "image";
          link.href = optimizedUrl;
          link.setAttribute("fetchpriority", "high");
          document.head.appendChild(link);
        }
      }
    }
  }, [filteredArticles]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <SEOMeta
        title="Discover News"
        description={`Stay updated with the latest news on ${dailyKeyword} and more.`}
        keywords={['discover', 'news', dailyKeyword]}
        canonical="https://worldnewzs.in"
      />
      {/* Page Header Banner */}
      <Box 
        sx={{ 
          mb: 4, 
          p: { xs: 3, md: 4 }, 
          borderRadius: 4, 
          background: (theme) => theme.palette.mode === "dark" 
            ? "linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.6))"
            : "linear-gradient(135deg, #f8fafc, #f1f5f9)",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: (theme) => theme.palette.mode === "dark"
            ? "inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 4px 20px rgba(0,0,0,0.2)"
            : "0 2px 10px rgba(0,0,0,0.02)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <Box 
          sx={{ 
            position: "absolute", 
            top: -100, 
            right: -100, 
            width: 300, 
            height: 300, 
            borderRadius: "50%", 
            background: "radial-gradient(circle, rgba(200, 58, 21, 0.08) 0%, rgba(255,112,67,0) 70%)",
            filter: "blur(40px)",
            pointerEvents: "none"
          }}
        />
        <Typography
          variant="h3"
          component="h1"
          sx={{ 
            fontWeight: 850, 
            mb: 1, 
            fontSize: { xs: "2rem", sm: "2.4rem", md: "2.8rem" },
            letterSpacing: "-0.02em",
            background: (theme) => theme.palette.mode === "dark"
              ? "linear-gradient(90deg, #ffffff, #cbd5e1)"
              : "linear-gradient(90deg, #0f172a, #475569)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          Discover Global News – WorldNewzs
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: "text.secondary", 
            fontWeight: 500, 
            maxWidth: "600px", 
            lineHeight: 1.6,
            fontSize: { xs: "0.9rem", sm: "1rem" } 
          }}
        >
          Real-time curated news, deep editorial briefings, and global updates updated continuously.
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1.35fr 0.85fr" }, mb: 5 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2.5, sm: 3.5 }, 
            borderRadius: 4, 
            border: "1px solid", 
            borderColor: "divider", 
            background: (theme) => theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.4)" : "#ffffff",
            transition: "all 0.3s ease",
            "&:hover": {
              borderColor: "primary.main",
              transform: "translateY(-2px)",
              boxShadow: (theme) => theme.palette.mode === "dark" ? "0 8px 30px rgba(0,0,0,0.3)" : "0 8px 24px rgba(0,0,0,0.04)"
            }
          }}
        >
          <Typography variant="overline" sx={{ fontWeight: 800, color: "primary.main", letterSpacing: "0.18em", display: "block", mb: 0.5 }}>
            TODAY'S NEWS FOCUS
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, lineHeight: 1.35, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
            The story mix is shifting fast — from market moves to major policy updates and cultural headlines.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
            WorldNewzs keeps this homepage tuned for speed, clarity, and context so readers can quickly scan what matters most without losing the broader picture.
          </Typography>
        </Paper>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2.5, sm: 3.5 }, 
            borderRadius: 4, 
            border: "1px solid", 
            borderColor: "divider", 
            background: (theme) => theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.45)" : "#f8fafc",
            transition: "all 0.3s ease",
            "&:hover": {
              borderColor: "primary.main",
              transform: "translateY(-2px)",
              boxShadow: (theme) => theme.palette.mode === "dark" ? "0 8px 30px rgba(0,0,0,0.3)" : "0 8px 24px rgba(0,0,0,0.04)"
            }
          }}
        >
          <Typography variant="overline" sx={{ fontWeight: 800, color: "text.secondary", letterSpacing: "0.18em", display: "block", mb: 0.5 }}>
            WHY READERS STAY
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, lineHeight: 1.35, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
            Verified coverage, editorial briefings, and useful tools in one place.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: "0.875rem" }}>
            The homepage now blends breaking headlines with deeper explainers, live utility widgets, and direct access to editorial analysis.
          </Typography>
        </Paper>
      </Box>

      {/* ✅ 1. PRIMARY NEWS FEED ABOVE THE FOLD (Top Stories) */}
      <SectionStatus
        loading={loading}
        error={error}
        hasData={filteredArticles.length > 0}
        emptyText={normalizedSearchTerm ? "No results matching your search." : "No news available."}
        columns={{ xs: 12, sm: 6, md: 4, lg: 3 }}
      >
        {topStoriesArticles.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between", 
                mb: 3, 
                pb: 1.5,
                borderBottom: "2px solid",
                borderColor: "divider"
              }}
            >
              <Typography 
                variant="h5" 
                component="h2" 
                sx={{ 
                  fontWeight: 850, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1.25,
                  fontSize: { xs: "1.3rem", sm: "1.5rem" }
                }}
              >
                Top Stories <span style={{ color: "#ef4444" }}>⚡</span>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Curated Editorial Engine
              </Typography>
            </Box>
            <NewsGrid
              articles={topStoriesArticles}
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
      </SectionStatus>

      {/* ✅ 2. FEATURED EDITORIAL BRIEFINGS SPOTLIGHT */}
      <Paper
        elevation={0}
        sx={{
          mb: 5,
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 4,
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(200, 58, 21, 0.15), rgba(255, 112, 67, 0.08))"
              : "linear-gradient(135deg, #fff5f2, #fff0eb)",
          border: "1px solid",
          borderColor: "rgba(200, 58, 21, 0.25)",
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <AutoAwesomeIcon sx={{ color: "#c83a15", fontSize: "1.4rem" }} />
              <Typography variant="overline" sx={{ fontWeight: 800, color: "#c83a15", letterSpacing: "0.1em" }}>
                EDITORIAL BRIEFINGS & SYNTHESIS
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: "text.primary" }}>
              In-Depth Analytical Briefings & Global Impact Syntheses
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
              Explore original editorial analysis, cross-referenced multi-source takeaways, and strategic insights curated directly by our journalists and NLP synthesis desk.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", fontSize: "0.75rem", fontWeight: 700 }}>
                💡 Global Trade & Market Resilience
              </Box>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", fontSize: "0.75rem", fontWeight: 700 }}>
                ⚽ Sports Analytics & Data Insights
              </Box>
              <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", fontSize: "0.75rem", fontWeight: 700 }}>
                🤖 AI Regulation & Tech Frontiers
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { xs: "left", md: "right" } }}>
            <Button
              component={RouterLink}
              to="/editorial-briefings"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              sx={{
                background: "linear-gradient(135deg, #c83a15, #ff7043)",
                color: "#fff",
                fontWeight: 800,
                borderRadius: "20px",
                px: 3,
                py: 1.25,
                textTransform: "none",
                boxShadow: "0 4px 15px rgba(200, 58, 21, 0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #ff7043, #c83a15)",
                  boxShadow: "0 6px 20px rgba(200, 58, 21, 0.4)",
                },
              }}
            >
              Read Full Briefings
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ✅ 3. DYNAMIC INTERACTIVE FEATURES (Polls, Badge Quiz, MoviesDB) */}
      <Box 
        sx={{ 
          display: "flex", 
          alignItems: "center", 
          mb: 3, 
          mt: 2,
          pb: 1.5,
          borderBottom: "2px solid",
          borderColor: "divider"
        }}
      >
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            fontWeight: 850, 
            display: "flex", 
            alignItems: "center", 
            gap: 1.25,
            fontSize: { xs: "1.3rem", sm: "1.5rem" }
          }}
        >
          Interactive & Fun Hub <span style={{ color: "#3b82f6" }}>🎮</span>
        </Typography>
      </Box>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Polls Highlight Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={3}
            sx={{
              p: 2.5,
              borderRadius: 3,
              background: "linear-gradient(135deg, rgba(0, 198, 255, 0.08), rgba(0, 114, 255, 0.08))",
              border: "1px solid rgba(0, 114, 255, 0.2)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "space-between",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 24px rgba(0, 114, 255, 0.18)",
              },
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                Interactive Polls 🗳️
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: "0.85rem", lineHeight: 1.5 }}>
                Vote on crucial daily topics and share your opinion on world events.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/polls"
              variant="contained"
              size="small"
              sx={{
                background: "linear-gradient(135deg, #00c6ff, #0072ff)",
                color: "#fff",
                fontWeight: "bold",
                borderRadius: "20px",
                textTransform: "none",
                alignSelf: "flex-start",
              }}
            >
              Vote Now
            </Button>
          </Paper>
        </Grid>

        {/* GK Quiz Highlight Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={3}
            sx={{
              p: 2.5,
              borderRadius: 3,
              background: "linear-gradient(135deg, rgba(248, 87, 166, 0.08), rgba(255, 88, 88, 0.08))",
              border: "1px solid rgba(255, 88, 88, 0.2)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "space-between",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 24px rgba(255, 88, 88, 0.18)",
              },
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                GK Badge Quiz 🏆
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: "0.85rem", lineHeight: 1.5 }}>
                Challenge your trivia skills, earn coin rewards, and claim profile badges!
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/badge-quiz"
              variant="contained"
              size="small"
              sx={{
                background: "linear-gradient(135deg, #f857a6, #ff5858)",
                color: "#fff",
                fontWeight: "bold",
                borderRadius: "20px",
                textTransform: "none",
                alignSelf: "flex-start",
              }}
            >
              Play Quiz
            </Button>
          </Paper>
        </Grid>

        {/* Movies DB Highlight Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={3}
            sx={{
              p: 2.5,
              borderRadius: 3,
              background: "linear-gradient(135deg, rgba(225, 29, 72, 0.08), rgba(190, 18, 60, 0.08))",
              border: "1px solid rgba(225, 29, 72, 0.2)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "space-between",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 24px rgba(225, 29, 72, 0.18)",
              },
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                Movies DB 🎬
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: "0.85rem", lineHeight: 1.5 }}>
                Explore trending movies, box office hits, and detailed film ratings.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/movies"
              variant="contained"
              size="small"
              sx={{
                background: "linear-gradient(135deg, #e11d48, #be123c)",
                color: "#fff",
                fontWeight: "bold",
                borderRadius: "20px",
                textTransform: "none",
                alignSelf: "flex-start",
              }}
            >
              Browse Movies
            </Button>
          </Paper>
        </Grid>

        {/* Play Arcade Games Highlight Card */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper
            elevation={3}
            sx={{
              p: 2.5,
              borderRadius: 3,
              background: "linear-gradient(135deg, rgba(76, 175, 80, 0.08), rgba(56, 142, 60, 0.08))",
              border: "1px solid rgba(76, 175, 80, 0.2)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "space-between",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 24px rgba(76, 175, 80, 0.18)",
              },
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                Arcade Games 🎮
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: "0.85rem", lineHeight: 1.5 }}>
                Play retro games like Snake, Mario, and Chess to challenge your highscore!
              </Typography>
            </Box>
            <Button
              onClick={handlePlayGamesClick}
              variant="contained"
              size="small"
              sx={{
                background: "linear-gradient(135deg, #4caf50, #388e3c)",
                color: "#fff",
                fontWeight: "bold",
                borderRadius: "20px",
                textTransform: "none",
                alignSelf: "flex-start",
              }}
            >
              Play Now
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Trending Short Videos */}
      <TrendingShortVideos />

      {/* ✅ 4. MORE NEWS GRID */}
      {remainingArticles.length > 0 && (
        <Box sx={{ my: 4 }}>
          <Box 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              mb: 3, 
              pb: 1.5,
              borderBottom: "2px solid",
              borderColor: "divider"
            }}
          >
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 850, 
                display: "flex", 
                alignItems: "center", 
                gap: 1.25,
                fontSize: { xs: "1.3rem", sm: "1.5rem" }
              }}
            >
              More Global News <span style={{ color: "#10b981" }}>🌐</span>
            </Typography>
          </Box>
          <NewsGrid
            articles={remainingArticles}
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
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ✅ 5. COLLAPSIBLE MARKET TOOLS & DASHBOARD (Below News Feed) */}
      <Box sx={{ mt: 6, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
        <Box 
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            mb: 3, 
            pb: 1.5,
            borderBottom: "2px solid",
            borderColor: "divider"
          }}
        >
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              fontWeight: 850, 
              display: "flex", 
              alignItems: "center", 
              gap: 1.25,
              fontSize: { xs: "1.3rem", sm: "1.5rem" }
            }}
          >
            Market & Utility Tools <span style={{ color: "#f59e0b" }}>🛠️</span>
          </Typography>
        </Box>
        <Grid container spacing={3} id="homepage-widgets-dashboard">
          <Grid size={{ xs: 12, md: 4 }}>
            <WatchlistWidget />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TopEngagingNewsWidget articles={articles} getEngagement={getEngagement} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <ShoppingWidget />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <WeatherWidget />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <SuggestedForYouWidget onTopicsChange={setFollowedTopics} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Discover;