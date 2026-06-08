import { useEffect, useState } from "react";
import axios from "axios";
import { fetchFood } from "../api/apiClient";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import NewsGrid from "../components/NewsGrid";
import SectionStatus from "../components/SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import CircularProgress from "@mui/material/CircularProgress";
import { deduplicateArticles } from "../utils/deduplicate";
import { optimizeImageUrl } from "../utils/imageOptimizer";


const Food: React.FC = () => {
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

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const loadData = (currentPage: number) => {
    if (currentPage === 1) setLoading(true);
    else setIsFetchingMore(true);

    fetchFood({ page: currentPage, pageSize: 20 })
      .then((res) => {
        const data = Array.isArray(res.data?.articles) ? res.data.articles : [];
        const formattedData = data.map((a: any) => ({
          ...a,
          imageUrl: a.urlToImage || a.image,
          category: a.category || "Food",
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
        setError(apiError || "Failed to load food news");
      })
      .finally(() => {
        setLoading(false);
        setIsFetchingMore(false);
      });
  };

  useEffect(() => {
    loadData(1);
  }, []);

  useEffect(() => {
    if (page > 1) {
      loadData(page);
    }
  }, [page]);

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

  // Dynamically preload the first article image to optimize LCP
  useEffect(() => {
    if (articles.length > 0) {
      const firstArticle = articles[0];
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
  }, [articles]);

  const [description, setDescription] = useState("Latest updates and recipes from the world of food.");

  useEffect(() => {
    if (articles.length > 0) {
      const headlines = articles.slice(0, 3).map(a => a.title).join("; ");
      const text = `Latest food headlines: ${headlines}. Read verified food reporting, recipes, and dining trends on WorldNewzs.`;
      setDescription(text.substring(0, 155) + "...");
    }
  }, [articles]);

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <SEOMeta
        title="Food News"
        description={description}
        keywords={['food', 'news', 'dining', 'recipes', 'latest food']}
      />
      <JSONLDBreadcrumb crumbs={[
        { name: "Home", url: window.location.origin },
        { name: "Food", url: `${window.location.origin}/food` }
      ]} />
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          Food
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Latest updates and recipes from the world of food
        </Typography>
      </Box>

      <SectionStatus
        loading={loading}
        error={error}
        hasData={articles.length > 0}
        emptyText="No food news available."
      >
        <NewsGrid
          articles={articles}
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
        {isFetchingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
      </SectionStatus>
    </Box>
  );
};

export default Food;
