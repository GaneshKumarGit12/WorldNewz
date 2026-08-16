import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Card, CardMedia, CardContent, Typography, IconButton, Box, Avatar, Menu, MenuItem, ListItemIcon, ListItemText, Collapse } from "@mui/material";
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
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CommentDialog from "./CommentDialog";
import type { Article } from "../types";
import { optimizeImageUrl, getCategoryFallbackImage } from "../utils/imageOptimizer";
import { getCategoryConfig } from "../utils/categoryConfig";
import { formatTimeAgoLong } from "../utils/formatTime";

interface NewsCardProps {
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
  isDuplicateImage?: boolean;
  cardIndex?: number;
}

const NewsCard: React.FC<NewsCardProps> = ({
  article,
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
  isDuplicateImage = false,
  cardIndex = 0,
}) => {
  const navigate = useNavigate();
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
  const shareOpen = Boolean(shareAnchorEl);
  const [expanded, setExpanded] = useState(false);

  const fallbackImg = React.useMemo(() => {
    return getCategoryFallbackImage(article.category, article.title || article.headline, cardIndex);
  }, [article.category, article.title, article.headline, cardIndex]);

  const originalUrl = article.urlToImage || article.imageUrl || "";
  const optimizedUrl = React.useMemo(() => {
    if (!originalUrl || originalUrl === "null" || isDuplicateImage) return fallbackImg;
    return optimizeImageUrl(originalUrl, 500, article.category, article.title || article.headline, cardIndex);
  }, [originalUrl, isDuplicateImage, article.category, article.title, article.headline, cardIndex, fallbackImg]);

  const [imgSrc, setImgSrc] = useState(optimizedUrl);

  React.useEffect(() => {
    setImgSrc(optimizedUrl);
  }, [optimizedUrl]);

  const handleImageError = () => {
    setImgSrc(fallbackImg);
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
    
    if (platform === "copy") {
      navigator.clipboard.writeText(url).then(() => {
        alert("Article link copied to clipboard!");
      }).catch(err => {
        console.error("Failed to copy link:", err);
      });
      return;
    }

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

  const categoryConfig = getCategoryConfig(article.category);

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
          contentVisibility: "auto",
          containIntrinsicSize: "auto 400px",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s ease, box-shadow 0.25s ease",
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-4px)",
            borderColor: (theme) => theme.palette.mode === "light" ? "#94a3b8" : "rgba(255, 255, 255, 0.2)",
            boxShadow: (theme) => theme.palette.mode === "light" ? "0 12px 28px rgba(0,0,0,0.08)" : "0 12px 32px rgba(0,0,0,0.5)",
            "& .MuiCardMedia-root": {
              transform: "scale(1.04)"
            }
          },
        }}
      >
        <Box sx={{ position: "relative", paddingTop: "56.25%" /* 16:9 aspect ratio */, overflow: "hidden" }}>
          {/* Category Tag overlay on image - Clickable Reciprocal Link */}
          <Box
            component={RouterLink}
            to={categoryConfig.path}
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              bgcolor: categoryConfig.color,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
              zIndex: 2,
              textDecoration: "none",
              cursor: "pointer",
              transition: "transform 0.2s ease, opacity 0.2s ease",
              "&:hover": {
                transform: "scale(1.05)",
                opacity: 0.9,
              }
            }}
          >
            {categoryConfig.icon}
            {categoryConfig.name}
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
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onError={handleImageError}
          />
        </Box>

        <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 1.5, pb: 0 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Avatar 
              sx={{ 
                width: 24, 
                height: 24, 
                fontSize: '0.75rem', 
                bgcolor: categoryConfig.color,
                mt: 0.5
              }}
            >
              {((typeof article.source === 'string' ? article.source : article.source?.name)?.[0] || 'N').toUpperCase()}
            </Avatar>
            <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
              <Typography 
                variant="subtitle2" 
                component="h3"
                color="text.primary"
                sx={{ 
                  fontFamily: "var(--serif, 'Source Serif 4', Georgia, serif)",
                  fontWeight: 600, 
                  fontSize: "1.05rem",
                  display: "-webkit-box", 
                  WebkitLineClamp: 2, 
                  WebkitBoxOrient: "vertical", 
                  overflow: "hidden", 
                  lineHeight: 1.3,
                  letterSpacing: "-0.01em",
                  mb: 0.5
                }}
              >
                {article.headline || article.title}
              </Typography>

              {/* Rich 2-3 sentence summary */}
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  fontFamily: "var(--sans)",
                  display: "-webkit-box", 
                  WebkitLineClamp: 3, 
                  WebkitBoxOrient: "vertical", 
                  overflow: "hidden", 
                  lineHeight: 1.45,
                  fontSize: "0.825rem",
                  mb: 0.5
                }}
              >
                {article.summary || article.description}
              </Typography>

              {/* Continue Reading indicator */}
              <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
                <Typography
                  variant="caption"
                  component="span"
                  sx={{
                    color: categoryConfig.color,
                    fontWeight: 700,
                    fontSize: "0.725rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.25,
                    cursor: "pointer",
                    transition: "gap 0.2s ease",
                    "&:hover": {
                      textDecoration: "underline",
                      gap: "6px",
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick();
                  }}
                >
                  Continue reading
                  <ArrowForwardIcon sx={{ fontSize: "0.8rem" }} />
                </Typography>
              </Box>

              {/* Timestamp & Source Labeling with Verified badge */}
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.725rem' }}>
                {article.verified && (
                  <VerifiedIcon sx={{ fontSize: '0.85rem', color: 'primary.main', mr: 0.5 }} />
                )}
                {article.publishedAt ? (
                  `Updated ${formatTimeAgoLong(article.publishedAt)} – Source: ${(typeof article.source === 'string' ? article.source : article.source?.name) || 'News'}`
                ) : (
                  `Source: ${(typeof article.source === 'string' ? article.source : article.source?.name) || 'News'}`
                )}
              </Typography>

              {/* "Why it matters" collapsible value-add synthesis box */}
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                {(() => {
                  const contextText = article.context || (() => {
                    const text = article.description || article.summary || article.title || "";
                    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 15);
                    if (sentences.length > 0 && sentences[0].length > 20) {
                      return `${sentences[0]}. Key synthesis monitored by WorldNewzs Editorial Desk.`;
                    }
                    return "WorldNewzs Editorial Desk: Key development monitored for real-time updates and global impact.";
                  })();

                  return (
                    <Box 
                      sx={{ 
                        mt: 1.5, 
                        p: 1.25, 
                        borderRadius: 1, 
                        bgcolor: 'action.hover',
                        borderLeft: `3px solid ${categoryConfig.color}`,
                      }}
                    >
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          color: categoryConfig.color,
                          display: 'block',
                          mb: 0.25,
                          letterSpacing: '0.05em'
                        }}
                      >
                        Why it matters
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.primary" 
                        sx={{ 
                          fontSize: '0.75rem', 
                          fontStyle: 'italic',
                          lineHeight: 1.35
                        }}
                      >
                        {contextText}
                      </Typography>
                    </Box>
                  );
                })()}
              </Collapse>
            </Box>
          </Box>
        </CardContent>

        {/* Actions - perfectly aligned to the left like YouTube */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 1.5,
            pb: 1.5,
            pl: 5.5, // Indent to align with text (avatar width 24 + gap 12)
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Like */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={handleLikeClick}
                sx={{ p: 0.5, color: articleEngagement.userLiked ? "primary.main" : "text.secondary", '&:hover': { color: 'primary.main' } }}
              >
                {articleEngagement.userLiked ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOutlinedIcon fontSize="small" />}
              </IconButton>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
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
            <IconButton
              aria-label="expand info"
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              size="small"
              sx={{ p: 0.5, color: expanded ? "primary.main" : "text.secondary", '&:hover': { color: 'primary.main' } }}
            >
              <MoreHorizIcon fontSize="small" />
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
        <MenuItem onClick={handleShare("copy")}>
          <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
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

export default React.memo(NewsCard);