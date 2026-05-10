import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { fetchShopping } from "../api/apiClient";
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

const Shopping: React.FC = () => {
  const outletContext = useOutletContext<{ searchTerm?: string } | undefined>();
  const searchTerm = outletContext?.searchTerm ?? "";
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

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredArticles = normalizedSearchTerm
    ? articles.filter((a) =>
        `${a.title} ${a.description ?? ""}`.toLowerCase().includes(normalizedSearchTerm)
      )
    : articles;

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);



  const loadData = (currentPage: number) => {
    if (currentPage === 1) setLoading(true);
    else setIsFetchingMore(true);

    fetchShopping({ page: currentPage, pageSize: 20 })
      .then((res) => {
        const data = Array.isArray(res.data?.articles) ? res.data.articles : [];
        const formattedData = data.map((a: any) => ({ ...a, imageUrl: a.urlToImage || a.image || a.imageUrl }));
        
        if (formattedData.length === 0) {
          setHasMore(false);
        } else {
          setArticles((prev) => currentPage === 1 ? formattedData : [...prev, ...formattedData]);
        }
      })
      .catch(() => setError("Failed to load shopping news"))
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
    <Box sx={{ p: 2 }}>
      <SEOMeta
        title="Shopping News"
        description="Latest shopping trends, deals, and e-commerce news."
        keywords={['shopping', 'e-commerce', 'deals', 'trends', 'discounts', 'news']}
      />
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>🛒 Shopping</Typography>
      <SectionStatus loading={loading} error={error} hasData={filteredArticles.length > 0}
        emptyText={normalizedSearchTerm ? "No results matching your search." : "No shopping news available."}>
        <Grid container spacing={2}>
          {filteredArticles.map((a) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={a.url || a.title} sx={{ display: "flex" }}>
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

export default Shopping;
