import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { fetchMoney } from "../api/apiClient";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import NewsGrid from "../components/NewsGrid";
import SectionStatus from "../components/SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import { SEOMeta } from "../seo/SEOMeta";
import CircularProgress from "@mui/material/CircularProgress";

const Money: React.FC = () => {
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

    fetchMoney({ page: currentPage, pageSize: 20 })
      .then((res) => {
        const data = Array.isArray(res.data?.articles) ? res.data.articles : [];
        const formattedData = data.map((a: any) => ({ ...a, imageUrl: a.urlToImage || a.image || a.imageUrl }));
        
        if (formattedData.length === 0) {
          setHasMore(false);
        } else {
          setArticles((prev) => currentPage === 1 ? formattedData : [...prev, ...formattedData]);
        }
      })
      .catch(() => setError("Failed to load money news"))
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
        title="Money News"
        description="Latest financial, business, and stock market news."
        keywords={['money', 'finance', 'business', 'stocks', 'economy', 'latest news']}
      />
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>💰 Money</Typography>
      <SectionStatus loading={loading} error={error} hasData={filteredArticles.length > 0}
        emptyText={normalizedSearchTerm ? "No results matching your search." : "No money news available."}>
        <NewsGrid
          articles={filteredArticles}
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
        {isFetchingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
      </SectionStatus>
    </Box>
  );
};

export default Money;
