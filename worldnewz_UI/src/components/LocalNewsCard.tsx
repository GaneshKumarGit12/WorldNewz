import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardMedia, CardContent, Typography, IconButton, Box, Avatar, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ShareIcon from "@mui/icons-material/Share";
import XIcon from "@mui/icons-material/X";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import VerifiedIcon from "@mui/icons-material/Verified";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CommentDialog from "./CommentDialog";
import type { Article } from "../types";
import { optimizeImageUrl } from "../utils/imageOptimizer";
import { formatTimeAgoLong } from "../utils/formatTime";

interface LocalNewsCardProps {
  article: Article;
  featured?: boolean;
  onBookmark?: (article: Article) => void;
  onRemoveBookmark?: (url: string) => void;
  isBookmarked?: boolean;
  onLike?: (articleUrl: string) => void;
  onDislike?: (articleUrl: string) => void;
  onAddComment?: (articleUrl: string, text: string, author: string) => void;
  onDeleteComment?: (articleUrl: string, commentId: string) => void;
  onLikeComment?: (articleUrl: string, commentId: string) => void;
  onDislikeComment?: (articleUrl: string, commentId: string) => void;
  engagement?: any;
  loading?: "lazy" | "eager";
}

const LocalNewsCard: React.FC<LocalNewsCardProps> = ({
  article,
  featured = false,
  onBookmark,
  onRemoveBookmark,
  isBookmarked = false,
  onLike,
  onDislike,
  onAddComment,
  onDeleteComment,
  onLikeComment,
  onDislikeComment,
  engagement,
  loading = "lazy",
}) => {
  const navigate = useNavigate();
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
  const shareOpen = Boolean(shareAnchorEl);

  const originalUrl = article.urlToImage || article.imageUrl || "";
  const optimizedUrl = React.useMemo(() => optimizeImageUrl(originalUrl, 500), [originalUrl]);
  const [imgSrc, setImgSrc] = useState(optimizedUrl);

  React.useEffect(() => {
    setImgSrc(optimizedUrl);
  }, [optimizedUrl]);

  const handleImageError = () => {
     setImgSrc("/placeholder.svg");
  };

  const articleEngagement = engagement || {
    likes: 0,
    dislikes: 0,
    comments: [],
    userLiked: false,
    userDisliked: false,
  };

  const handleCardClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const titleSlug = article.title?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().substring(0, 50) || "article";
    navigate(`/article/${titleSlug}`, { state: { article } });
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!article.url) return;

    if (isBookmarked && onRemoveBookmark) {
      onRemoveBookmark(article.url);
    } else if (!isBookmarked && onBookmark) {
      onBookmark(article);
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (article.url && onLike) {
      onLike(article.url);
    }
  };

  const handleDislikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (article.url && onDislike) {
      onDislike(article.url);
    }
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCommentDialogOpen(true);
  };

  const handleAddComment = (text: string, author: string) => {
    if (article.url && onAddComment) {
      onAddComment(article.url, text, author);
    }
  };

  const handleShareClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setShareAnchorEl(e.currentTarget);
  };

  const handleShareClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShareAnchorEl(null);
  };

  const handleShare = (platform: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShareAnchorEl(null);
    const url = article.url || window.location.href;
    const text = article.socialMediaHook || article.headline || article.title || "";
    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case "x":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case "pinterest":
        shareUrl = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(article.imageUrl || "https://worldnewzs.in/og-image.png")}&description=${encodeURIComponent((text || "").substring(0, 180))}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  const localColor = "#06b6d4"; // Cyan for Local News

  return (
    <>
      <Card
        component="article"
        onClick={handleCardClick}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          bgcolor: "background.paper",
          backgroundImage: "none",
          border: (theme) => `1px solid ${theme.palette.mode === "light" ? "#cbd5e1" : "rgba(255, 255, 255, 0.08)"}`,
          boxShadow: (theme) => theme.palette.mode === "light" ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
          borderRadius: 2,
          overflow: "hidden",
          transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-3px)",
            borderColor: (theme) => theme.palette.mode === "light" ? "#94a3b8" : "rgba(255, 255, 255, 0.2)",
            boxShadow: (theme) => theme.palette.mode === "light" ? "0 8px 20px rgba(0,0,0,0.1)" : "0 8px 24px rgba(0,0,0,0.4)",
          },
          ...(featured && {
            flexDirection: { xs: "column", md: "row" },
            gridColumn: { md: "span 3" },
          })
        }}
      >
        <Box sx={{ 
          position: "relative", 
          paddingTop: featured ? { xs: "56.25%", md: "0" } : "56.25%",
          width: featured ? { xs: "100%", md: "45%" } : "100%",
          minHeight: featured ? { md: "300px" } : "none"
        }}>
          {/* Category Tag overlay on image */}
          <Box
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              bgcolor: localColor,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1.2,
              py: 0.4,
              borderRadius: 1.5,
              fontSize: "0.68rem",
              fontWeight: 700,
              textTransform: "uppercase",
              boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
              zIndex: 2,
            }}
          >
            <LocationOnIcon fontSize="inherit" />
            {article.category || "Local News"}
          </Box>
          <CardMedia
            component="img"
            image={imgSrc || "/placeholder.svg"}
            alt={article.title}
            loading={loading}
            fetchPriority={loading === "eager" ? "high" : undefined}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={handleImageError}
          />
        </Box>

        <CardContent sx={{ 
          flexGrow: 1, 
          display: "flex", 
          flexDirection: "column", 
          p: 2.5, 
          pb: 0,
          width: featured ? { xs: "100%", md: "55%" } : "100%"
        }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, flexGrow: 1 }}>
            <Avatar 
              sx={{ 
                width: 28, 
                height: 28, 
                fontSize: '0.85rem', 
                bgcolor: localColor,
                mt: 0.25
              }}
            >
              {((typeof article.source === 'string' ? article.source : article.source?.name)?.[0] || 'L').toUpperCase()}
            </Avatar>
            <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
              <Typography 
                variant={featured ? "h5" : "subtitle2"}
                component="h3"
                sx={{ 
                  fontWeight: 700, 
                  display: "-webkit-box", 
                  WebkitLineClamp: featured ? 3 : 2, 
                  WebkitBoxOrient: "vertical", 
                  overflow: "hidden", 
                  lineHeight: 1.3,
                  mb: 1,
                  fontSize: featured ? { xs: "1.2rem", md: "1.5rem" } : "0.95rem"
                }}
              >
                {article.headline || article.title}
              </Typography>

              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  display: "-webkit-box", 
                  WebkitLineClamp: featured ? 4 : 3, 
                  WebkitBoxOrient: "vertical", 
                  overflow: "hidden", 
                  lineHeight: 1.45,
                  fontSize: "0.85rem",
                  mb: 1.5
                }}
              >
                {article.summary || article.description}
              </Typography>

              {/* Timestamp & Source Labeling with Verified badge */}
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.75rem', mb: 2 }}>
                {article.verified && (
                  <VerifiedIcon sx={{ fontSize: '0.9rem', color: 'primary.main', mr: 0.5 }} />
                )}
                {article.publishedAt ? (
                  `Updated ${formatTimeAgoLong(article.publishedAt)} – Source: ${(typeof article.source === 'string' ? article.source : article.source?.name) || 'News'}`
                ) : (
                  `Source: ${(typeof article.source === 'string' ? article.source : article.source?.name) || 'News'}`
                )}
              </Typography>
            </Box>
          </Box>
        </CardContent>

        {/* Actions - perfectly aligned to the left */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2.5,
            pb: 2,
            pl: 7.5, // Align with text content
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            {/* Like */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={handleLikeClick}
                sx={{ p: 0.5, color: articleEngagement.userLiked ? "primary.main" : "text.secondary", '&:hover': { color: 'primary.main' } }}
              >
                {articleEngagement.userLiked ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOutlinedIcon fontSize="small" />}
              </IconButton>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {articleEngagement.likes > 0 ? articleEngagement.likes : ''}
              </Typography>
            </Box>

            {/* Dislike */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={handleDislikeClick}
                sx={{ p: 0.5, color: articleEngagement.userDisliked ? "primary.main" : "text.secondary", '&:hover': { color: 'primary.main' } }}
              >
                {articleEngagement.userDisliked ? <ThumbDownIcon fontSize="small" /> : <ThumbDownOutlinedIcon fontSize="small" />}
              </IconButton>
            </Box>

            {/* Comment */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={handleCommentClick}
                sx={{ p: 0.5, color: "text.secondary", '&:hover': { color: 'primary.main' } }}
              >
                <ChatBubbleOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Share & Bookmark */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              aria-label="share"
              onClick={handleShareClick}
              size="small"
              sx={{ p: 0.5, color: "text.secondary", '&:hover': { color: 'primary.main' } }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label={isBookmarked ? "remove bookmark" : "add bookmark"}
              onClick={handleBookmarkClick}
              size="small"
              sx={{ p: 0.5, color: isBookmarked ? "primary.main" : "text.secondary", '&:hover': { color: 'primary.main' } }}
            >
              {isBookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Box>
      </Card>

      {/* Share Menu */}
      <Menu
        anchorEl={shareAnchorEl}
        open={shareOpen}
        onClose={handleShareClose}
        onClick={(e) => e.stopPropagation()}
        transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
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

      {/* Comment Dialog */}
      <CommentDialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        comments={articleEngagement.comments || []}
        onAddComment={handleAddComment}
        onDeleteComment={(commentId) => {
          if (article.url && onDeleteComment) {
            onDeleteComment(article.url, commentId);
          }
        }}
        onLikeComment={(commentId) => {
          if (article.url && onLikeComment) {
            onLikeComment(article.url, commentId);
          }
        }}
        onDislikeComment={(commentId) => {
          if (article.url && onDislikeComment) {
            onDislikeComment(article.url, commentId);
          }
        }}
      />
    </>
  );
};

export default React.memo(LocalNewsCard);
