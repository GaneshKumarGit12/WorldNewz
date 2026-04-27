import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Card, CardMedia, Button, Container, Divider, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useEffect, useState } from "react";
import type { Article } from "../types";
import { useBookmarks } from "../hooks/useBookmarks";

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();

  useEffect(() => {
    const state = location.state as { article?: Article };
    if (state?.article) {
      setArticle(state.article);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [location]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!article) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Article not found. Please go back and select an article.</Alert>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  const bookmarked = article.url ? isBookmarked(article.url) : false;

  const handleBookmarkClick = () => {
    if (!article.url) return;
    if (bookmarked) {
      removeBookmark(article.url);
    } else {
      addBookmark(article);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date unknown";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4, minHeight: "70vh" }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        variant="outlined"
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      {/* Main Article Card */}
      <Card sx={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)", borderRadius: 2, overflow: "hidden" }}>
        {/* Article Image */}
        {(article.urlToImage || article.imageUrl) && (
          <CardMedia
            component="img"
            height={400}
            image={article.urlToImage || article.imageUrl}
            alt={article.title}
            onError={(e: any) => {
              e.target.style.display = "none";
            }}
            sx={{
              objectFit: "cover",
              backgroundColor: "#f5f5f5",
            }}
          />
        )}

        <Box sx={{ p: { xs: 2, sm: 4 } }}>
          {/* Title */}
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 2,
              lineHeight: 1.3,
              fontSize: { xs: "1.75rem", sm: "2.25rem" },
            }}
          >
            {article.title}
          </Typography>

          {/* Meta Information */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 3,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              📅 {formatDate(article.publishedAt)}
            </Typography>

            {article.category && (
              <Typography
                variant="body2"
                sx={{
                  backgroundColor: "primary.light",
                  color: "primary.contrastText",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 6,
                }}
              >
                {article.category}
              </Typography>
            )}

            {typeof article.source === "string" ? (
              <Typography variant="body2" color="text.secondary">
                Source: {article.source}
              </Typography>
            ) : article.source?.name ? (
              <Typography variant="body2" color="text.secondary">
                Source: {article.source.name}
              </Typography>
            ) : null}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Bookmark & Open Button */}
          <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
            <Button
              startIcon={bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              variant={bookmarked ? "contained" : "outlined"}
              color={bookmarked ? "warning" : "inherit"}
              onClick={handleBookmarkClick}
            >
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </Button>

            {article.url && (
              <Button
                endIcon={<OpenInNewIcon />}
                variant="outlined"
                onClick={() => window.open(article.url, "_blank")}
              >
                Read Full Article
              </Button>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Content/Description */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Overview
            </Typography>
            <Typography
              variant="body1"
              sx={{
                lineHeight: 1.8,
                color: "text.primary",
                whiteSpace: "pre-wrap",
              }}
            >
              {article.description || "No description available for this article."}
            </Typography>
          </Box>

          {/* Additional Info */}
          {article.url && (
            <Box sx={{ mt: 4, p: 2, backgroundColor: "background.default", borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Want to read the complete article? Click the "Read Full Article" button above to visit the source.
              </Typography>
            </Box>
          )}
        </Box>
      </Card>

      {/* Back to Top Button */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Box>
    </Container>
  );
};

export default ResultPage;
