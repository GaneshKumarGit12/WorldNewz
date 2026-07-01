import { useEffect, useState } from "react";
import { useOutletContext, Link as RouterLink } from "react-router-dom";
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
import { WatchlistWidget } from "./WatchlistWidget";
import { TopEngagingNewsWidget } from "./TopEngagingNewsWidget";
import { ShoppingWidget } from "./ShoppingWidget";
import { WeatherWidget } from "./WeatherWidget";
import { SuggestedForYouWidget } from "./SuggestedForYouWidget";
import { TrendingShortVideos } from "./TrendingShortVideos";


const Discover: React.FC = () => {
  const outletContext = useOutletContext<{ searchTerm?: string } | undefined>();
  const searchTerm = outletContext?.searchTerm ?? "";
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
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontWeight: 700, mb: 1, fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" } }}
        >
          Discover Global News – WorldNewzs
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Stay updated with the latest news from around the world
        </Typography>
      </Box>

      {/* Premium Interactive Widgets Dashboard */}
      <Grid container spacing={3} sx={{ mb: 4 }} id="homepage-widgets-dashboard">
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

      {/* Trending Short Videos */}
      <TrendingShortVideos />

      {/* Dynamic Interactive Features Call-to-Action Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Polls Highlight Card */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, rgba(0, 198, 255, 0.08), rgba(0, 114, 255, 0.08))",
              border: "1px solid rgba(0, 114, 255, 0.2)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "space-between",
              transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 24px rgba(0, 114, 255, 0.18)",
                borderColor: "rgba(0, 114, 255, 0.4)",
              },
              "&:hover .animate-polls-icon": {
                animation: "float 0.8s ease-in-out infinite"
              },
              "@keyframes float": {
                "0%, 100%": { transform: "translateY(0)" },
                "50%": { transform: "translateY(-6px)" }
              }
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                <Typography variant="h5" component="h3" sx={{ fontWeight: 700, color: "text.primary", display: "flex", alignItems: "center", gap: 1 }}>
                  Interactive Polls{" "}
                  <Box className="animate-polls-icon" component="span" sx={{ display: "inline-block" }}>
                    🗳️
                  </Box>
                </Typography>
                <Box sx={{ ml: "auto", px: 1.5, py: 0.25, borderRadius: 10, background: "linear-gradient(135deg, #00c6ff, #0072ff)", color: "#fff", fontSize: "0.75rem", fontWeight: "bold" }}>
                  TRENDING
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, lineHeight: 1.6 }}>
                Make your voice heard! Vote on crucial daily topics, share your opinion on world events, and instantly view visual live statistics from our global audience.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/polls"
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #00c6ff, #0072ff)",
                color: "#fff",
                fontWeight: "bold",
                borderRadius: "20px",
                textTransform: "none",
                py: 1,
                alignSelf: "flex-start",
                boxShadow: "0 4px 15px rgba(0, 114, 255, 0.2)",
                "&:hover": {
                  background: "linear-gradient(135deg, #0072ff, #00c6ff)",
                  boxShadow: "0 6px 20px rgba(0, 114, 255, 0.3)",
                }
              }}
            >
              Vote Now & View Stats
            </Button>
          </Paper>
        </Grid>

        {/* GK Quiz Highlight Card */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, rgba(248, 87, 166, 0.08), rgba(255, 88, 88, 0.08))",
              border: "1px solid rgba(255, 88, 88, 0.2)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "space-between",
              transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 24px rgba(255, 88, 88, 0.18)",
                borderColor: "rgba(255, 88, 88, 0.4)",
              },
              "&:hover .animate-quiz-icon": {
                animation: "wiggle 0.5s ease-in-out infinite"
              },
              "@keyframes wiggle": {
                "0%, 100%": { transform: "rotate(0)" },
                "25%": { transform: "rotate(-10deg)" },
                "75%": { transform: "rotate(10deg)" }
              }
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                <Typography variant="h5" component="h3" sx={{ fontWeight: 700, color: "text.primary", display: "flex", alignItems: "center", gap: 1 }}>
                  GK Badge Quiz{" "}
                  <Box className="animate-quiz-icon" component="span" sx={{ display: "inline-block" }}>
                    🏆
                  </Box>
                </Typography>
                <Box sx={{ ml: "auto", px: 1.5, py: 0.25, borderRadius: 10, background: "linear-gradient(135deg, #f857a6, #ff5858)", color: "#fff", fontSize: "0.75rem", fontWeight: "bold" }}>
                  NEW REWARDS
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, lineHeight: 1.6 }}>
                Challenge your general knowledge and test your news awareness. Answer the daily trivia question set correctly to claim exclusive profile badges and join the leaderboard!
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/badge-quiz"
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #f857a6, #ff5858)",
                color: "#fff",
                fontWeight: "bold",
                borderRadius: "20px",
                textTransform: "none",
                py: 1,
                alignSelf: "flex-start",
                boxShadow: "0 4px 15px rgba(255, 88, 88, 0.2)",
                "&:hover": {
                  background: "linear-gradient(135deg, #ff5858, #f857a6)",
                  boxShadow: "0 6px 20px rgba(255, 88, 88, 0.3)",
                }
              }}
            >
              Play Quiz & Claim Badges
            </Button>
          </Paper>
        </Grid>

        {/* Movies DB Highlight Card */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, rgba(225, 29, 72, 0.08), rgba(190, 18, 60, 0.08))",
              border: "1px solid rgba(225, 29, 72, 0.2)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "space-between",
              transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 24px rgba(225, 29, 72, 0.18)",
                borderColor: "rgba(225, 29, 72, 0.4)",
              },
              "&:hover .animate-movies-icon": {
                animation: "clap 0.6s ease-in-out infinite"
              },
              "@keyframes clap": {
                "0%, 100%": { transform: "rotate(0) scale(1)" },
                "50%": { transform: "rotate(-15deg) scale(1.15)" }
              }
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                <Typography variant="h5" component="h3" sx={{ fontWeight: 700, color: "text.primary", display: "flex", alignItems: "center", gap: 1 }}>
                  Movies DB{" "}
                  <Box className="animate-movies-icon" component="span" sx={{ display: "inline-block" }}>
                    🎬
                  </Box>
                </Typography>
                <Box sx={{ ml: "auto", px: 1.5, py: 0.25, borderRadius: 10, background: "linear-gradient(135deg, #e11d48, #be123c)", color: "#fff", fontSize: "0.75rem", fontWeight: "bold" }}>
                  BOX OFFICE
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, lineHeight: 1.6 }}>
                Explore the latest trending movies, browse box office hits, view detailed ratings and reviews, and search our extensive global cinematic database!
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/movies"
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #e11d48, #be123c)",
                color: "#fff",
                fontWeight: "bold",
                borderRadius: "20px",
                textTransform: "none",
                py: 1,
                alignSelf: "flex-start",
                boxShadow: "0 4px 15px rgba(225, 29, 72, 0.2)",
                "&:hover": {
                  background: "linear-gradient(135deg, #be123c, #e11d48)",
                  boxShadow: "0 6px 20px rgba(225, 29, 72, 0.3)",
                }
              }}
            >
              Browse Movies DB
            </Button>
          </Paper>
        </Grid>

        {/* Amazon Deals Highlight Card */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, rgba(255, 153, 0, 0.08), rgba(255, 60, 0, 0.08))",
              border: "1px solid rgba(255, 153, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "space-between",
              transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 24px rgba(255, 153, 0, 0.18)",
                borderColor: "rgba(255, 153, 0, 0.4)",
              },
              "&:hover .animate-deals-icon": {
                animation: "pulse 0.8s ease-in-out infinite"
              },
              "@keyframes pulse": {
                "0%, 100%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.2) rotate(5deg)" }
              }
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                <Typography variant="h5" component="h3" sx={{ fontWeight: 700, color: "text.primary", display: "flex", alignItems: "center", gap: 1 }}>
                  Amazon Deals{" "}
                  <Box className="animate-deals-icon" component="span" sx={{ display: "inline-block" }}>
                    🛍️
                  </Box>
                </Typography>
                <Box sx={{ ml: "auto", px: 1.5, py: 0.25, borderRadius: 10, background: "linear-gradient(135deg, #FF9900, #FF5500)", color: "#fff", fontSize: "0.75rem", fontWeight: "bold" }}>
                  HOT DEALS
                </Box>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, lineHeight: 1.6 }}>
                Unlock exclusive lightning deals and daily discount shopping on top Amazon products. Scratch and reveal hidden vouchers to save big on electronics, smartwatches, and gadgets!
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/amazon-products"
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #FF9900, #FF5500)",
                color: "#fff",
                fontWeight: "bold",
                borderRadius: "20px",
                textTransform: "none",
                py: 1,
                alignSelf: "flex-start",
                boxShadow: "0 4px 15px rgba(255, 153, 0, 0.2)",
                "&:hover": {
                  background: "linear-gradient(135deg, #FF5500, #FF9900)",
                  boxShadow: "0 6px 20px rgba(255, 153, 0, 0.3)",
                }
              }}
            >
              Shop Deals Hub
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Section Status Wrapper */}
      <SectionStatus
        loading={loading}
        error={error}
        hasData={filteredArticles.length > 0}
        emptyText={normalizedSearchTerm ? "No results matching your search." : "No news available."}
        columns={{ xs: 12, sm: 6, md: 4, lg: 3 }}
      >
        {/* ✅ Top Stories Grid */}
        {topStoriesArticles.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
              Top Stories
            </Typography>
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

        {/* ✅ More News Grid */}
        {remainingArticles.length > 0 && (
          <>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
              More News
            </Typography>
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
          </>
        )}

        {isFetchingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
      </SectionStatus>
    </Box>
  );
};

export default Discover;