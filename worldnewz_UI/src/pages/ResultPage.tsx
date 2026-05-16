import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Card, CardMedia, Button, Container, Divider, Alert, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ShareIcon from "@mui/icons-material/Share";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import { useEffect, useState } from "react";
import type { Article } from "../types";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import { fetchDiscover } from "../api/apiClient";
import SectionStatus from "../components/SectionStatus";
import NewsSlider from "../components/NewsSlider";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CommentDialog from "../components/CommentDialog";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import { JSONLDNewsArticle } from "../seo/JSONLDSchemas";

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
  const shareOpen = Boolean(shareAnchorEl);
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
    const state = location.state as { article?: Article };
    if (state?.article) {
      setArticle(state.article);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    if (!article) {
      setRelatedArticles([]);
      setRelatedLoading(false);
      return;
    }

    setRelatedLoading(true);
    setRelatedError(null);

    fetchDiscover()
      .then((res) => {
        const data = Array.isArray(res.data?.articles) ? res.data.articles : [];
        const related = data
          .map((a: any) => ({
            ...a,
            imageUrl: a.urlToImage || a.image || a.imageUrl,
            category: a.source?.name || "News",
          }))
          .filter((item: Article) => item.url && item.url !== article.url)
          .slice(0, 10);

        setRelatedArticles(related);
      })
      .catch((err: any) => {
        const apiError = err.response?.data?.error || err.message || "Unable to load related stories.";
        setRelatedError(apiError);
      })
      .finally(() => setRelatedLoading(false));
  }, [article]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress size={60} />
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

  const handleShareClick = (e: React.MouseEvent<HTMLElement>) => {
    setShareAnchorEl(e.currentTarget);
  };

  const handleShareClose = () => {
    setShareAnchorEl(null);
  };

  const handleShare = (platform: string) => () => {
    setShareAnchorEl(null);
    if (!article) return;
    
    const url = article.url || window.location.href;
    const title = article.title || "";
    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "x":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  const articleEngagement = article.url ? getEngagement(article.url) : {
    likes: 0,
    dislikes: 0,
    comments: [],
    userLiked: false,
    userDisliked: false,
  };

  const handleAddComment = (text: string, author: string) => {
    if (article.url && addComment) {
      addComment(article.url, text, author);
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
      <JSONLDNewsArticle
        article={{
          title: article.title,
          summary: article.description || "",
          url: article.url || "",
          imageUrl: article.urlToImage || article.imageUrl || "",
          publishedAt: article.publishedAt || "",
          category: article.category || ""
        }}
      />
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

          {/* Bookmark, Engage & Open Button */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3, alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Like */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton
                  onClick={() => article.url && toggleLike(article.url)}
                  sx={{ color: articleEngagement.userLiked ? "primary.main" : "text.secondary", '&:hover': { color: 'primary.main' } }}
                >
                  {articleEngagement.userLiked ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                </IconButton>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {articleEngagement.likes > 0 ? articleEngagement.likes : ''}
                </Typography>
              </Box>

              {/* Dislike */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton
                  onClick={() => article.url && toggleDislike(article.url)}
                  sx={{ color: articleEngagement.userDisliked ? "primary.main" : "text.secondary", '&:hover': { color: 'primary.main' } }}
                >
                  {articleEngagement.userDisliked ? <ThumbDownIcon /> : <ThumbDownOutlinedIcon />}
                </IconButton>
              </Box>

              {/* Comment */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton
                  onClick={() => setCommentDialogOpen(true)}
                  sx={{ color: "text.secondary", '&:hover': { color: 'primary.main' } }}
                >
                  <ChatBubbleOutlineIcon />
                </IconButton>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {articleEngagement.comments.length > 0 ? articleEngagement.comments.length : ''}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<ShareIcon />}
                variant="outlined"
                color="inherit"
                onClick={handleShareClick}
              >
                Share
              </Button>
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

      {/* Share Menu */}
      <Menu
        anchorEl={shareAnchorEl}
        open={shareOpen}
        onClose={handleShareClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 150 }
        }}
      >
        <MenuItem onClick={handleShare("facebook")}>
          <ListItemIcon><FacebookIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText>Facebook</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShare("x")}>
          <ListItemIcon><XIcon fontSize="small" sx={{ color: 'text.primary' }} /></ListItemIcon>
          <ListItemText>X (Twitter)</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShare("linkedin")}>
          <ListItemIcon><LinkedInIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText>LinkedIn</ListItemText>
        </MenuItem>
      </Menu>

      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Related Stories
        </Typography>
        <SectionStatus
          loading={relatedLoading}
          error={relatedError}
          hasData={relatedArticles.length > 0}
          emptyText="No related stories available right now."
        >
          <NewsSlider
            articles={relatedArticles}
            onBookmark={addBookmark}
            onRemoveBookmark={removeBookmark}
            isBookmarked={isBookmarked}
            onLike={toggleLike}
            onDislike={toggleDislike}
            onAddComment={(url, text, author) => addComment(url, text, author)}
            onDeleteComment={deleteComment}
            onLikeComment={likeComment}
            onDislikeComment={dislikeComment}
            getEngagement={getEngagement}
          />
        </SectionStatus>
      </Box>

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

      {/* Comment Dialog */}
      <CommentDialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        comments={articleEngagement.comments || []}
        onAddComment={handleAddComment}
        onDeleteComment={(commentId) => {
          if (article.url && deleteComment) {
            deleteComment(article.url, commentId);
          }
        }}
        onLikeComment={(commentId) => {
          if (article.url && likeComment) {
            likeComment(article.url, commentId);
          }
        }}
        onDislikeComment={(commentId) => {
          if (article.url && dislikeComment) {
            dislikeComment(article.url, commentId);
          }
        }}
      />
    </Container>
  );
};

export default ResultPage;
