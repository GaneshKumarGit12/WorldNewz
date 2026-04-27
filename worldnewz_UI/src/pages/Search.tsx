import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchSearch } from "../api/apiClient";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import NewsCard from "../components/NewsCard";
import SectionStatus from "../components/SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();

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
          data.map((a: any) => ({
            ...a,
            imageUrl: a.urlToImage || a.image || a.imageUrl,
          }))
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
          <Grid container spacing={2}>
            {articles.map((article) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={article.url || article.title} sx={{ display: "flex" }}>
                <NewsCard
                  article={article}
                  onBookmark={addBookmark}
                  onRemoveBookmark={removeBookmark}
                  isBookmarked={article.url ? isBookmarked(article.url) : false}
                />
              </Grid>
            ))}
          </Grid>
        </SectionStatus>
      )}
    </Box>
  );
};

export default Search;
