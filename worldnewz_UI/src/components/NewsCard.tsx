import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardMedia, CardContent, Typography, IconButton, Box } from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
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
          height: featured ? 420 : 220,
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          cursor: "pointer",
          "&:hover": {
            transform: "scale(1.05)",
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

        <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", pb: 1 }}>
          <Typography variant={featured ? "h5" : "subtitle1"} fontWeight="bold" sx={{ mb: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {article.title}
          </Typography>

          {article.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                flexGrow: 1,
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {article.description}
            </Typography>
          )}
        </CardContent>

        {/* Category and Bookmark */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1, pb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {article.category || "News"}
          </Typography>
          <IconButton
            aria-label={isBookmarked ? "remove bookmark" : "add bookmark"}
            onClick={handleBookmarkClick}
            size="small"
          >
            {isBookmarked ? (
              <BookmarkIcon color="warning" fontSize="small" />
            ) : (
              <BookmarkBorderIcon color="action" fontSize="small" />
            )}
          </IconButton>
        </Box>

        {/* Engagement Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            borderTop: "1px solid #e0e0e0",
            px: 1,
            py: 0.5,
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handleLikeClick}
              sx={{ 
                p: 0.5,
                color: articleEngagement.userLiked ? "#1976d2" : "inherit" 
              }}
            >
              {articleEngagement.userLiked ? (
                <ThumbUpIcon fontSize="small" />
              ) : (
                <ThumbUpOutlinedIcon fontSize="small" />
              )}
            </IconButton>
            <Typography variant="caption" sx={{ minWidth: "20px" }}>
              {articleEngagement.likes}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handleDislikeClick}
              sx={{ 
                p: 0.5,
                color: articleEngagement.userDisliked ? "#f44336" : "inherit" 
              }}
            >
              {articleEngagement.userDisliked ? (
                <ThumbDownIcon fontSize="small" />
              ) : (
                <ThumbDownOutlinedIcon fontSize="small" />
              )}
            </IconButton>
            <Typography variant="caption" sx={{ minWidth: "20px" }}>
              {articleEngagement.dislikes}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handleCommentClick}
              sx={{ p: 0.5 }}
            >
              {articleEngagement.comments?.length > 0 ? (
                <ChatBubbleIcon fontSize="small" />
              ) : (
                <ChatBubbleOutlineIcon fontSize="small" />
              )}
            </IconButton>
            <Typography variant="caption" sx={{ minWidth: "20px" }}>
              {articleEngagement.comments?.length || 0}
            </Typography>
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