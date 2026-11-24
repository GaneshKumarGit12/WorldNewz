import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchSearch } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import NewsGrid from "../components/NewsGrid";
import SectionStatus from "../components/SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import { deduplicateArticles } from "../utils/deduplicate";


const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() ?? "";
  const [inputValue, setInputValue] = useState(query);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed });
    }
  };
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
    <Box sx={{ width: "100%", backgroundColor: "var(--paper)", minHeight: "100vh", py: { xs: 2, md: 4 } }}>
      <SEOMeta
        title={headingText ? `Search: ${headingText}` : "Search News"}
        description={headingText ? `Browse current news and headlines for ${headingText} on WorldNewzs.` : "Search across sports, technology, business, food, and travel news on WorldNewzs."}
        keywords="search news, latest news search, WorldNewzs news lookup, world news query"
        canonical="https://worldnewzs.in/search"
        noIndex={true}
      />
      <Box
        className="wrap"
        sx={{
          maxWidth: "1240px",
          margin: "0 auto",
          px: { xs: 2, md: 3.5 },
        }}
      >
        <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 700, fontFamily: "var(--serif)" }}>
          🔍 Search Results
        </Typography>

        {/* Dedicated Search Input Bar */}
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{ display: "flex", gap: 1, mb: 2.5, maxWidth: 640 }}
        >
          <TextField
            id="page-search-input"
            fullWidth
            size="small"
            placeholder="Search wire dispatches, topics, headlines…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "var(--color-ink-tertiary)", fontSize: 20 }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: "9999px",
                backgroundColor: "var(--color-surface-container)",
                fontFamily: "var(--font-sans-body)",
                fontSize: "14px",
              },
            }}
          />
          <Button
            id="page-search-submit-btn"
            type="submit"
            variant="contained"
            sx={{
              borderRadius: "9999px",
              px: 3,
              backgroundColor: "var(--color-brand-accent)",
              color: "#ffffff",
              fontWeight: 700,
              textTransform: "none",
              fontFamily: "var(--font-sans-body)",
              boxShadow: "none",
              "&:hover": { backgroundColor: "var(--color-brand-accent-hover)" },
            }}
          >
            Search
          </Button>
        </Box>

        <Typography variant="subtitle1" sx={{ mb: 3, color: "var(--slate)" }}>
          {hasSearch ? `Showing results for ${headingText}` : "Enter a search term above to begin exploring our news archives."}
        </Typography>

        {!hasSearch ? (
          <Typography sx={{ color: "var(--slate)" }}>
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
    </Box>
  );
};

export default Search;
