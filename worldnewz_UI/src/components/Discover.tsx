import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { fetchDiscover } from "../api/apiClient";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import NewsGrid from "../components/NewsGrid";
import SectionStatus from "../components/SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import NewsSlider from "../components/NewsSlider";
import { SEOMeta } from "../seo/SEOMeta";
import { getDailyKeyword } from "../utils/dailyKeyword";
import CircularProgress from "@mui/material/CircularProgress";
import { deduplicateArticles } from "../utils/deduplicate";
import { optimizeImageUrl } from "../utils/imageOptimizer";


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

  const sliderArticles = filteredArticles.slice(0, 10);
  const remainingArticles = filteredArticles.slice(10);

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

      {/* Section Status Wrapper */}
      <SectionStatus
        loading={loading}
        error={error}
        hasData={filteredArticles.length > 0}
        emptyText={normalizedSearchTerm ? "No results matching your search." : "No news available."}
        columns={{ xs: 12, sm: 6, md: 4, lg: 3 }}
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