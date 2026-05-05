import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardMedia, CardContent, Typography, IconButton, Box, Avatar } from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
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
}

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo`;
  return `${Math.floor(diffInDays / 365)}y`;
};

const NewsCard: React.FC<NewsCardProps> = ({
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
}) => {
  const navigate = useNavigate();
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);

  const articleEngagement = engagement || {
    likes: 0,
    dislikes: 0,
    comments: [],
    userLiked: false,
    userDisliked: false,
  };

  const handleCardClick = () => {
    navigate(`/article/${article.url?.split("/").pop() || ""}`, { state: { article } });
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

  return (
    <>
      <Card
        onClick={handleCardClick}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: featured ? 420 : 280,
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          cursor: "pointer",
          "&:hover": {
            transform: "scale(1.02)",
            boxShadow: "0 12px 24px rgba(0,0,0,0.15)",
          },
        }}
      >
        <CardMedia
          component="img"
          height={featured ? "280" : "130"}
          image={article.urlToImage || article.imageUrl}
          alt={article.title}
          sx={{ objectFit: "cover" }}
          onError={(e: any) => {
            e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
          }}
        />

        <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 2, pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}>
            <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>
              {((typeof article.source === 'string' ? article.source : article.source?.name)?.[0] || 'N').toUpperCase()}
            </Avatar>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              {(typeof article.source === 'string' ? article.source : article.source?.name) || 'News'}
              {article.publishedAt && (
                <>
                  <Box component="span" sx={{ mx: 0.5 }}>•</Box>
                  {formatTimeAgo(article.publishedAt)}
                </>
              )}
            </Typography>
          </Box>

          <Typography variant={featured ? "h6" : "subtitle2"} fontWeight="bold" sx={{ mb: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.3 }}>
            {article.title}
          </Typography>
        </CardContent>

        {/* Actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2,
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Like */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={handleLikeClick}
                sx={{ p: 0, color: articleEngagement.userLiked ? "primary.main" : "text.secondary", '&:hover': { color: 'primary.main' } }}
              >
                {articleEngagement.userLiked ? <ThumbUpIcon fontSize="small" /> : <ThumbUpOutlinedIcon fontSize="small" />}
              </IconButton>
              <Typography variant="caption" color="text.secondary">
                {articleEngagement.likes > 0 ? articleEngagement.likes : ''}
              </Typography>
            </Box>

            {/* Dislike */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={handleDislikeClick}
                sx={{ p: 0, color: articleEngagement.userDisliked ? "primary.main" : "text.secondary", '&:hover': { color: 'primary.main' } }}
              >
                {articleEngagement.userDisliked ? <ThumbDownIcon fontSize="small" /> : <ThumbDownOutlinedIcon fontSize="small" />}
              </IconButton>
            </Box>

            {/* Comment */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={handleCommentClick}
                sx={{ p: 0, color: "text.secondary", '&:hover': { color: 'primary.main' } }}
              >
                <ChatBubbleOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Bookmark */}
          <Box>
            <IconButton
              aria-label={isBookmarked ? "remove bookmark" : "add bookmark"}
              onClick={handleBookmarkClick}
              size="small"
              sx={{ p: 0, color: isBookmarked ? "primary.main" : "text.secondary", '&:hover': { color: 'primary.main' } }}
            >
              {isBookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Box>
      </Card>

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

export default NewsCard;