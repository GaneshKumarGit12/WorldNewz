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
import ScienceIcon from "@mui/icons-material/Science";
import LaptopIcon from "@mui/icons-material/Laptop";
import ExploreIcon from "@mui/icons-material/Explore";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import FlightIcon from "@mui/icons-material/Flight";
import MovieIcon from "@mui/icons-material/Movie";
import VerifiedIcon from "@mui/icons-material/Verified";
import CommentDialog from "./CommentDialog";
import type { Article } from "../types";

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
}

const formatTimeAgoLong = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};

const getCategoryConfig = (category?: string) => {
  const cat = (category || '').toLowerCase().trim();
  switch (cat) {
    case 'science':
      return { color: '#4caf50', icon: <ScienceIcon fontSize="inherit" />, name: 'Science' };
    case 'tech':
    case 'technology':
      return { color: '#2196f3', icon: <LaptopIcon fontSize="inherit" />, name: 'Technology' };
    case 'discover':
    case 'general':
    case 'news':
      return { color: '#ff9800', icon: <ExploreIcon fontSize="inherit" />, name: 'Discover' };
    case 'sports':
      return { color: '#f44336', icon: <SportsSoccerIcon fontSize="inherit" />, name: 'Sports' };
    case 'money':
    case 'business':
    case 'finance':
      return { color: '#e91e63', icon: <MonetizationOnIcon fontSize="inherit" />, name: 'Money' };
    case 'food':
      return { color: '#9c27b0', icon: <RestaurantIcon fontSize="inherit" />, name: 'Food' };
    case 'shopping':
      return { color: '#00bcd4', icon: <ShoppingBagIcon fontSize="inherit" />, name: 'Shopping' };
    case 'travel':
      return { color: '#009688', icon: <FlightIcon fontSize="inherit" />, name: 'Travel' };
    case 'entertainment':
      return { color: '#673ab7', icon: <MovieIcon fontSize="inherit" />, name: 'Entertainment' };
    default:
      return { color: '#ff9800', icon: <ExploreIcon fontSize="inherit" />, name: 'Discover' };
  }
};

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
}) => {
  const navigate = useNavigate();
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
  const shareOpen = Boolean(shareAnchorEl);

  const articleEngagement = engagement || {
    likes: 0,
    dislikes: 0,
    comments: [],
    userLiked: false,
    userDisliked: false,
  };

  const handleCardClick = () => {
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
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  const categoryConfig = getCategoryConfig(article.category);

  return (
    <>
      <Card
        onClick={handleCardClick}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          bgcolor: "background.paper", // Let theme handle it, but typically #212121 or #18181b in dark mode
          backgroundImage: "none", // Remove MUI default overlay
          boxShadow: "none",
          borderRadius: 2,
          overflow: "hidden",
          transition: "transform 0.2s ease",
          cursor: "pointer",
          "&:hover": {
            transform: "scale(1.02)",
          },
        }}
      >
        <Box sx={{ position: "relative", paddingTop: "56.25%" /* 16:9 aspect ratio */ }}>
          {/* Category Tag overlay on image */}
          <Box
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
            }}
          >
            {categoryConfig.icon}
            {categoryConfig.name}
          </Box>
          <CardMedia
            component="img"
            image={article.urlToImage || article.imageUrl}
            alt={article.title}
            loading={loading}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={(e: any) => {
              e.target.src = "https://via.placeholder.com/320x180?text=No+Image";
            }}
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
                sx={{ 
                  fontWeight: 600, 
                  display: "-webkit-box", 
                  WebkitLineClamp: 2, 
                  WebkitBoxOrient: "vertical", 
                  overflow: "hidden", 
                  lineHeight: 1.3,
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
                  display: "-webkit-box", 
                  WebkitLineClamp: 3, 
                  WebkitBoxOrient: "vertical", 
                  overflow: "hidden", 
                  lineHeight: 1.4,
                  fontSize: "0.8rem",
                  mb: 1
                }}
              >
                {article.summary || article.description}
              </Typography>

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

              {/* "Why it matters" context box */}
              {article.context && (
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
                    {article.context}
                  </Typography>
                </Box>
              )}
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

export default React.memo(NewsCard);