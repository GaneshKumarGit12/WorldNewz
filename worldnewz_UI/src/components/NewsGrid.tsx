import React from "react";
import Grid from "@mui/material/Grid";
import NewsCard from "./NewsCard";
import AdCard from "./AdCard";
import type { Article } from "../types";

interface NewsGridProps {
  articles: Article[];
  onBookmark: (article: Article) => void;
  onRemoveBookmark: (url: string) => void;
  isBookmarked: (url: string) => boolean;
  onLike: (url: string) => void;
  onDislike: (url: string) => void;
  onAddComment: (url: string, text: string, author: string) => void;
  onDeleteComment: (url: string, commentId: string) => void;
  onLikeComment: (url: string, commentId: string) => void;
  onDislikeComment: (url: string, commentId: string) => void;
  getEngagement: (url: string) => any;
  adInterval?: number; // How often to insert an Ad (e.g. after every 6th card)
  columns?: any; // Grid layout columns
}

const NewsGrid: React.FC<NewsGridProps> = ({
  articles,
  onBookmark,
  onRemoveBookmark,
  isBookmarked,
  onLike,
  onDislike,
  onAddComment,
  onDeleteComment,
  onLikeComment,
  onDislikeComment,
  getEngagement,
  adInterval = 6,
  columns = { xs: 12, sm: 6, md: 4, lg: 3 },
}) => {
  return (
    <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
      {articles.flatMap((article, index) => {
        const itemNumber = index + 1;
        const items = [
          <Grid
            size={columns}
            key={article.url || `${article.title}-${index}`}
            sx={{
              display: "flex",
              // Performance acceleration: skips rendering work for cards outside viewport
              contentVisibility: "auto",
              containIntrinsicSize: "auto 400px",
            }}
          >
            <NewsCard
              article={article}
              onBookmark={onBookmark}
              onRemoveBookmark={onRemoveBookmark}
              isBookmarked={article.url ? isBookmarked(article.url) : false}
              onLike={onLike}
              onDislike={onDislike}
              onAddComment={onAddComment}
              onDeleteComment={onDeleteComment}
              onLikeComment={onLikeComment}
              onDislikeComment={onDislikeComment}
              engagement={article.url ? getEngagement(article.url) : undefined}
            />
          </Grid>,
        ];

        // Insert an AdCard after every 6th card (or configurable interval)
        if (itemNumber % adInterval === 0) {
          items.push(
            <Grid
              size={columns}
              key={`ad-slot-${index}`}
              sx={{
                display: "flex",
                contentVisibility: "auto",
                containIntrinsicSize: "auto 400px",
              }}
            >
              <AdCard placement="between-articles" />
            </Grid>
          );
        }

        return items;
      })}
    </Grid>
  );
};

// Memoize to prevent unnecessary feed re-renders
export default React.memo(NewsGrid);
