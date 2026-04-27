import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { fetchMoney } from "../api/apiClient";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import NewsCard from "../components/NewsCard";
import SectionStatus from "../components/SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";

const Money: React.FC = () => {
  const outletContext = useOutletContext<{ searchTerm?: string } | undefined>();
  const searchTerm = outletContext?.searchTerm ?? "";
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredArticles = normalizedSearchTerm
    ? articles.filter((a) =>
        `${a.title} ${a.description ?? ""}`.toLowerCase().includes(normalizedSearchTerm)
      )
    : articles;

  useEffect(() => {
    fetchMoney()
      .then((res) => {
        const data = Array.isArray(res.data?.articles) ? res.data.articles : [];
        setArticles(data.map((a: any) => ({ ...a, imageUrl: a.urlToImage || a.image || a.imageUrl })));
      })
      .catch(() => setError("Failed to load money news"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>💰 Money</Typography>
      <SectionStatus loading={loading} error={error} hasData={filteredArticles.length > 0}
        emptyText={normalizedSearchTerm ? "No results matching your search." : "No money news available."}>
        <Grid container spacing={2}>
          {filteredArticles.map((a) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={a.url || a.title} sx={{ display: "flex" }}>
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

export default Money;
