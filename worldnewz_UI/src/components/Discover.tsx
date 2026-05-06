import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { fetchDiscover } from "../api/apiClient";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import NewsCard from "../components/NewsCard";
import SectionStatus from "../components/SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import NewsSlider from "../components/NewsSlider";
import { useSEO } from "../hooks/useSEO";
import { getDailyKeyword } from "../utils/dailyKeyword";
import CircularProgress from "@mui/material/CircularProgress";


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

  useSEO({
    title: "Discover News",
    description: `Stay updated with the latest news on ${dailyKeyword} and more.`,
    keywords: `discover, news, ${dailyKeyword}`,
  });

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredArticles = normalizedSearchTerm
    ? articles.filter((article) => {
      const text = `${article.title} ${article.description ?? ""} ${article.category ?? ""}`.toLowerCase();
      return text.includes(normalizedSearchTerm);
    })
    : articles;

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
          setArticles((prev) => currentPage === 1 ? formattedData : [...prev, ...formattedData]);
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

  const sliderArticles = filteredArticles.slice(0, 10);
  const remainingArticles = filteredArticles.slice(10);

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 700, mb: 1, fontSize: { xs: "1.75rem", sm: "2rem", md: "2.5rem" } }}
        >
          Discover
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Stay updated with the latest news from around the world
        </Typography>
      </Box>

      {/* Section Status Wrapper */}
      <SectionStatus
        loading={loading}
        error={error}
        hasData={filteredArticles.length > 0}
        emptyText={normalizedSearchTerm ? "No results matching your search." : "No news available."}
      >
        {/* ✅ Top Stories Slider */}
        {sliderArticles.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              Top Stories
            </Typography>
            <NewsSlider
              articles={sliderArticles}
              onBookmark={addBookmark}
              onRemoveBookmark={removeBookmark}
              isBookmarked={isBookmarked}
              onLike={toggleLike}
              onDislike={toggleDislike}
              onAddComment={(url, text, author) => addComment(url, text, author)}
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
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
              More News
            </Typography>
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
              {remainingArticles.map((article) => (
                <Grid
                  size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                  key={article.url || article.title}
                  sx={{ display: "flex" }}
                >
                  <NewsCard
                    article={article}
                    onBookmark={(article) => addBookmark(article)} // ✅ fixed: passes Article object
                    onRemoveBookmark={(url) => removeBookmark(url)} // ✅ still URL-based
                    isBookmarked={article.url ? isBookmarked(article.url) : false}
                    onLike={toggleLike}
                    onDislike={toggleDislike}
                    onAddComment={(url, text, author) => addComment(url, text, author)}
                    onDeleteComment={deleteComment}
                    onLikeComment={likeComment}
                    onDislikeComment={dislikeComment}
                    engagement={article.url ? getEngagement(article.url) : undefined}
                  />

                </Grid>
              ))}
            </Grid>
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