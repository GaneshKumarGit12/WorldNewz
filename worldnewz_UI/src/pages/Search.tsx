import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchSearch } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import NewsGrid from "../components/NewsGrid";
import SectionStatus from "../components/SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import { deduplicateArticles } from "../utils/deduplicate";


const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (!query && !category) {
      setArticles([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchSearch({
      query: query || undefined,     // ✅ undefined → axios omits the param entirely
      category: category || "general",
      page: 1,
      pageSize: 12,
      source: "all",
      country: "us",
      language: "en",
    })
      .then((res) => {
        const data = Array.isArray(res.data?.results) ? res.data.results : [];
        setArticles(
          deduplicateArticles(
            data.map((a: any) => ({
              ...a,
              imageUrl: a.urlToImage || a.image || a.imageUrl,
              category: a.category || category || "Discover",
            }))
          )
        );
      })
      .catch((err: any) => {
        let msg = "Unable to load search results.";
        if (err.response?.data?.error) {
          msg = err.response.data.error;
        } else if (err.message) {
          msg = err.message;
        }
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [query, category]);

  const hasSearch = Boolean(query || category);
  const hasResults = articles.length > 0;

  const headingText =
    query && category
      ? `"${query}" in ${category}`
      : query
      ? `"${query}"`
      : category
      ? `Top ${category} news`
      : "";

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <SEOMeta
        title={headingText ? `Search: ${headingText}` : "Search News"}
        description={headingText ? `Browse current news and headlines for ${headingText} on WorldNewzs.` : "Search across sports, technology, business, food, and travel news on WorldNewzs."}
      />
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        🔍 Search Results
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 3, color: "text.secondary" }}>
        {hasSearch ? `Showing results for ${headingText}` : "Enter a search term to begin."}
      </Typography>

      {!hasSearch ? (
        <Typography sx={{ color: "text.secondary" }}>
          Use the search bar above or pick a category chip to get started.
        </Typography>
      ) : (
        <SectionStatus
          loading={loading}
          error={error}
          hasData={hasResults}
          emptyText="No results found. Try a different query or category."
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
            columns={{ xs: 12, sm: 6, md: 4 }}
          />
        </SectionStatus>
      )}
    </Box>
  );
};

export default Search;
