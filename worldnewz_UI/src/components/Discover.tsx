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
import NewsSlider from "../components/NewsSlider";


const Discover: React.FC = () => {
  const outletContext = useOutletContext<{ searchTerm?: string } | undefined>();
  const searchTerm = outletContext?.searchTerm ?? "";
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks(); // ✅ now URL-based


  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredArticles = normalizedSearchTerm
    ? articles.filter((article) => {
      const text = `${article.title} ${article.description ?? ""} ${article.category ?? ""}`.toLowerCase();
      return text.includes(normalizedSearchTerm);
    })
    : articles;

  useEffect(() => {
    fetchDiscover()
      .then((res) => {
        const data = Array.isArray(res.data?.articles) ? res.data.articles : [];
        setArticles(
          data.map((a: any) => ({
            ...a,
            imageUrl: a.urlToImage || a.image,
            category: a.source?.name || "News",
          }))
        );
      })
      .catch((err) => {
        const apiError = axios.isAxiosError(err) ? err.response?.data?.error : null;
        setError(apiError || "Failed to load discover news");
      })
      .finally(() => setLoading(false));
  }, []);

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
                  />

                </Grid>
              ))}
            </Grid>
          </>
        )}
      </SectionStatus>
    </Box>
  );
};

export default Discover;