import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardMedia, CardContent, Typography, IconButton, Box } from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import type { Article } from "../types";

interface NewsCardProps {
  article: Article;
  featured?: boolean;
  onBookmark?: (article: Article) => void;
  onRemoveBookmark?: (url: string) => void;
  isBookmarked?: boolean;
}

const NewsCard: React.FC<NewsCardProps> = ({
  article,
  featured = false,
  onBookmark,
  onRemoveBookmark,
  isBookmarked = false,
}) => {
  const navigate = useNavigate();

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

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: featured ? 380 : 188,
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
        height={featured ? "380" : "188"}
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
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {article.description}
          </Typography>
        )}
      </CardContent>

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
    </Card>
  );
};

export default NewsCard;