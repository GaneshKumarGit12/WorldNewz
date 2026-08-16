import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import NewsCard from "../components/NewsCard";
import AdBannerCard from "../components/AdBannerCard";
import Alert from "@mui/material/Alert";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import Fab from "@mui/material/Fab";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useState, useEffect } from "react";
import { SEOMeta } from "../seo/SEOMeta";

const Bookmarks: React.FC = () => {
  const { bookmarks, removeBookmark, isBookmarked, clearAll } = useBookmarks();
  const { 
    getEngagement, 
    toggleLike, 
    toggleDislike, 
    addComment, 
    deleteComment, 
    likeComment, 
    dislikeComment 
  } = useComments();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Box sx={{ width: "100%", backgroundColor: "var(--paper)", minHeight: "100vh", py: { xs: 2, md: 4 } }}>
      <SEOMeta
        title="My Bookmarks"
        description="Access and read your saved news articles and stories on WorldNewzs."
        keywords="saved articles, bookmarked news, reading list, saved headlines"
        canonical="https://worldnewzs.in/bookmarks"
      />
      <Box
        className="wrap"
        sx={{
          maxWidth: "1240px",
          margin: "0 auto",
          px: { xs: 2, md: 3.5 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <BookmarkIcon color="warning" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, fontFamily: "var(--serif)", flexGrow: 1 }}>
            My Bookmarks
          </Typography>
          {bookmarks.length > 0 && (
            <Button
              id="bookmarks-clear-all-btn"
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
            {(() => {
              const seenImages = new Set<string>();
              const elements: React.ReactNode[] = [];
              bookmarks.forEach((article: Article, idx: number) => {
                const imageUrl = article.urlToImage || article.imageUrl || "";
                const isDuplicateImage = imageUrl ? seenImages.has(imageUrl) : false;
                if (imageUrl) {
                  seenImages.add(imageUrl);
                }
                elements.push(
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={article.url || article.title} sx={{ display: "flex" }}>
                    <NewsCard
                      article={article}
                      isBookmarked={article.url ? isBookmarked(article.url) : false}
                      onRemoveBookmark={removeBookmark}
                      onLike={toggleLike}
                      onDislike={toggleDislike}
                      onAddComment={(url, text, author) => addComment(url, text, author)}
                      onDeleteComment={deleteComment}
                      onLikeComment={likeComment}
                      onDislikeComment={dislikeComment}
                      engagement={article.url ? getEngagement(article.url) : undefined}
                      isDuplicateImage={isDuplicateImage}
                    />
                  </Grid>
                );
                // Inject ad card after every 5 bookmarks
                if (idx % 5 === 4) {
                  elements.push(
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`ad-bookmark-${idx}`} sx={{ display: "flex" }}>
                      <AdBannerCard />
                    </Grid>
                  );
                }
              });
              return elements;
            })()}
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
    </Box>
  );
};

export default Bookmarks;
