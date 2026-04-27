import { useBookmarks } from "../hooks/useBookmarks";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import NewsCard from "../components/NewsCard";
import Alert from "@mui/material/Alert";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import Fab from "@mui/material/Fab";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useState, useEffect } from "react";

const Bookmarks: React.FC = () => {
  const { bookmarks, removeBookmark, isBookmarked, clearAll } = useBookmarks();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: "60vh" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <BookmarkIcon color="warning" sx={{ fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 700, flexGrow: 1 }}>
          My Bookmarks
        </Typography>
        {bookmarks.length > 0 && (
          <Button
            startIcon={<DeleteSweepIcon />}
            variant="outlined"
            color="error"
            size="small"
            onClick={clearAll}
          >
            Clear All
          </Button>
        )}
      </Box>

      {bookmarks.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No bookmarks yet. Click the bookmark icon on any article to save it here.
        </Alert>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {bookmarks.length} saved article{bookmarks.length !== 1 ? "s" : ""}
          </Typography>
          <Grid container spacing={2}>
            {bookmarks.map((article: Article) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={article.url || article.title} sx={{ display: "flex" }}>
                <NewsCard
                  article={article}
                  isBookmarked={article.url ? isBookmarked(article.url) : false}
                  onRemoveBookmark={removeBookmark}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {showTop && (
        <Fab
          color="primary"
          size="medium"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          sx={{ position: "fixed", bottom: 24, right: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      )}
    </Box>
  );
};

export default Bookmarks;
