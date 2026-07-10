import React from "react";
import Grid from "@mui/material/Grid";
import NewsCard from "./NewsCard";
import type { Article } from "../types";
import AdCard from "./AdCard";

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
  columns = { xs: 12, sm: 6, md: 4, lg: 3 },
}) => {
  const seenImages = new Set<string>();

  return (
    <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
      {articles.map((article, index) => {
        const imageUrl = article.urlToImage || article.imageUrl || "";
        const isDuplicateImage = imageUrl ? seenImages.has(imageUrl) : false;
        if (imageUrl) {
          seenImages.add(imageUrl);
        }

        const showAd = index > 0 && index % 6 === 0;

        return (
          <React.Fragment key={article.url || `${article.title}-${index}`}>
            {showAd && (
              <Grid size={{ xs: 12 }} sx={{ display: "flex", justifyContent: "center", my: 1.5 }}>
                <AdCard placement="between-articles" index={index} />
              </Grid>
            )}
            <Grid
              size={columns}
              sx={{
                display: "flex",
                // Performance acceleration: skips rendering work for cards outside viewport
                contentVisibility: "auto",
                containIntrinsicSize: "auto 400px",
              }}
            >
              <NewsCard
                article={article}
                loading={index < 3 ? "eager" : "lazy"}
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
                isDuplicateImage={isDuplicateImage}
              />
            </Grid>
          </React.Fragment>
        );
      })}
    </Grid>
  );
};

// Memoize to prevent unnecessary feed re-renders
export default React.memo(NewsGrid);
