import { useEffect, useState } from "react";
import axios from "axios";
import { fetchFood } from "../api/apiClient";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import NewsCard from "../components/NewsCard";
import SectionStatus from "../components/SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import { SEOMeta } from "../seo/SEOMeta";
import CircularProgress from "@mui/material/CircularProgress";

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
          category: a.source?.name || "Food",
        }));
        
        if (formattedData.length === 0) {
          setHasMore(false);
        } else {
          setArticles((prev) => {
            const existing = currentPage === 1 ? [] : prev;
            const newArticles = formattedData.filter((a: Article) => !existing.some((e: Article) => e.url === a.url || (e.title && e.title === a.title)));
            return [...existing, ...newArticles];
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

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <SEOMeta
        title="Food News"
        description="Latest updates and recipes from the world of food."
        keywords={['food', 'news', 'dining', 'recipes', 'latest food']}
      />
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
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
          {articles.map((a) => (
            <Grid
              size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
              key={a.url || a.title}
              sx={{ display: "flex" }}
            >
              <NewsCard
                article={a}
                onBookmark={addBookmark}
                onRemoveBookmark={removeBookmark}
                isBookmarked={a.url ? isBookmarked(a.url) : false}
                onLike={toggleLike}
                onDislike={toggleDislike}
                onAddComment={(url, text, author) => addComment(url, text, author)}
                onDeleteComment={deleteComment}
                onLikeComment={likeComment}
                onDislikeComment={dislikeComment}
                engagement={a.url ? getEngagement(a.url) : undefined}
              />
            </Grid>
          ))}
        </Grid>
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
