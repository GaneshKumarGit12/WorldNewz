import { useEffect, useState } from "react";
import axios from "axios";
import { fetchSports } from "../api/apiClient";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import NewsCard from "../components/NewsCard";
import SectionStatus from "../components/SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";

const Sports: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();

  useEffect(() => {
    fetchSports()
      .then((res) => {
        const data = Array.isArray(res.data?.articles) ? res.data.articles : [];
        setArticles(
          data.map((a: any) => ({
            ...a,
            imageUrl: a.urlToImage || a.image,
            category: a.source?.name || "Sports",
          }))
        );
      })
      .catch((err) => {
        const apiError = axios.isAxiosError(err) ? err.response?.data?.error : null;
        setError(apiError || "Failed to load sports news");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          Sports
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Latest updates from the world of sports
        </Typography>
      </Box>

      <SectionStatus
        loading={loading}
        error={error}
        hasData={articles.length > 0}
        emptyText="No sports news available."
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
              />
            </Grid>
          ))}
        </Grid>
      </SectionStatus>
    </Box>
  );
};

export default Sports;