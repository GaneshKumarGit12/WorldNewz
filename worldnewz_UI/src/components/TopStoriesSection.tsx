import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Chip, CircularProgress, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import MemoryIcon from "@mui/icons-material/Memory";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ScienceIcon from "@mui/icons-material/Science";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import MovieFilterIcon from "@mui/icons-material/MovieFilter";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import type { Article } from "../types";
import NewsGrid from "./NewsGrid";
import {
  fetchBusiness,
  fetchTechnology,
  fetchPolitics,
  fetchScienceHealth,
  fetchSports,
  fetchLocalNews,
  fetchMoney,
  fetchEntertainment,
  fetchDiscover,
  fetchSearch
} from "../api/apiClient";
import { deduplicateArticles } from "../utils/deduplicate";
import { getCategoryFallbackArticles, fallbackDiscoverArticles } from "../utils/fallbackArticles";

export interface TopStoriesSectionProps {
  initialCategory?: string; // e.g. "business", "technology", "all"
  initialArticles?: Article[]; // initial feed if available
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
  columns?: any;
}

interface CategoryFilter {
  id: string;
  name: string;
  icon: React.ReactNode;
  fetcher: (params?: any) => Promise<any>;
}

const CATEGORY_FILTERS: CategoryFilter[] = [
  {
    id: "all",
    name: "All Top Stories",
    icon: <WhatshotIcon sx={{ fontSize: 15 }} />,
    fetcher: (p) => fetchDiscover({ ...p, pageSize: 8 })
  },
  {
    id: "business",
    name: "Business",
    icon: <BusinessCenterIcon sx={{ fontSize: 15 }} />,
    fetcher: (p) => fetchBusiness({ ...p, pageSize: 8 })
  },
  {
    id: "technology",
    name: "Technology",
    icon: <MemoryIcon sx={{ fontSize: 15 }} />,
    fetcher: (p) => fetchTechnology({ ...p, pageSize: 8 })
  },
  {
    id: "politics",
    name: "Politics",
    icon: <AccountBalanceIcon sx={{ fontSize: 15 }} />,
    fetcher: (p) => fetchPolitics({ ...p, pageSize: 8 })
  },
  {
    id: "science-health",
    name: "Science & Health",
    icon: <ScienceIcon sx={{ fontSize: 15 }} />,
    fetcher: (p) => fetchScienceHealth({ ...p, pageSize: 8 })
  },
  {
    id: "sports",
    name: "Sports",
    icon: <SportsSoccerIcon sx={{ fontSize: 15 }} />,
    fetcher: (p) => fetchSports({ ...p, pageSize: 8 })
  },
  {
    id: "local-news",
    name: "Local News",
    icon: <LocationCityIcon sx={{ fontSize: 15 }} />,
    fetcher: (p) => fetchLocalNews({ ...p, pageSize: 8 })
  },
  {
    id: "money",
    name: "Money",
    icon: <AttachMoneyIcon sx={{ fontSize: 15 }} />,
    fetcher: (p) => fetchMoney({ ...p, pageSize: 8 })
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: <MovieFilterIcon sx={{ fontSize: 15 }} />,
    fetcher: (p) => fetchEntertainment({ ...p, pageSize: 8 })
  }
];

export const TopStoriesSection: React.FC<TopStoriesSectionProps> = ({
  initialCategory = "all",
  initialArticles = [],
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
  columns = { xs: 12, sm: 6, md: 4 }
}) => {
  // Normalize initial category
  const getNormalizedCat = (cat: string) => {
    const lower = (cat || "all").toLowerCase().trim();
    const match = CATEGORY_FILTERS.find((f) => f.id === lower);
    return match ? match.id : "all";
  };

  const [activeCategory, setActiveCategory] = useState<string>(() => getNormalizedCat(initialCategory));
  const [articles, setArticles] = useState<Article[]>(() => {
    if (initialArticles && initialArticles.length >= 4) {
      return initialArticles.slice(0, 6);
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(articles.length === 0);

  // Sync if initialCategory prop changes
  useEffect(() => {
    if (initialCategory) {
      const normalized = getNormalizedCat(initialCategory);
      setActiveCategory(normalized);
    }
  }, [initialCategory]);

  const loadTopStories = useCallback(async (catId: string) => {
    setLoading(true);
    const filter = CATEGORY_FILTERS.find((f) => f.id === catId) || CATEGORY_FILTERS[0];

    try {
      // 1. Primary API call
      const res = await filter.fetcher({ page: 1 });
      const rawData = Array.isArray(res.data?.articles)
        ? res.data.articles
        : Array.isArray(res.data?.results)
        ? res.data.results
        : [];

      let formattedData = rawData.map((a: any) => ({
        ...a,
        imageUrl: a.urlToImage || a.imageUrl || a.image,
        category: a.category || filter.name,
      }));

      // 2. If fewer than 4 articles, supplement from search & world news APIs
      if (formattedData.length < 4 && catId !== "all") {
        try {
          const searchRes = await fetchSearch({ query: filter.name, pageSize: 6 });
          const searchData = Array.isArray(searchRes.data?.results)
            ? searchRes.data.results
            : Array.isArray(searchRes.data?.articles)
            ? searchRes.data.articles
            : [];
          
          formattedData = deduplicateArticles([...formattedData, ...searchData]);
        } catch (searchErr) {
          console.warn("Secondary search API fallback skipped:", searchErr);
        }
      }

      // 3. If still empty, use verified editorial fallbacks
      if (formattedData.length === 0) {
        const fallbacks = catId === "all" ? fallbackDiscoverArticles : getCategoryFallbackArticles(catId);
        setArticles(fallbacks.slice(0, 6));
      } else {
        setArticles(deduplicateArticles(formattedData).slice(0, 6));
      }
    } catch (err) {
      console.warn(`Top Stories fetch for ${catId} failed, using verified fallback content:`, err);
      const fallbacks = catId === "all" ? fallbackDiscoverArticles : getCategoryFallbackArticles(catId);
      setArticles(fallbacks.slice(0, 6));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopStories(activeCategory);
  }, [activeCategory, loadTopStories]);

  const activeFilter = CATEGORY_FILTERS.find((f) => f.id === activeCategory) || CATEGORY_FILTERS[0];

  return (
    <Box id="top-stories-section" sx={{ mb: 5 }}>
      {/* --- Section Header with Category Chips --- */}
      <Box
        className="section-head"
        sx={{
          borderBottom: "1px solid var(--color-border-divider)",
          pb: 1.5,
          mb: 2.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Typography
              component="h2"
              sx={{
                fontFamily: "var(--font-serif-headline)",
                fontSize: { xs: "20px", sm: "24px" },
                fontWeight: 600,
                letterSpacing: "-0.015em",
                color: "var(--color-ink-primary)",
              }}
            >
              Top Stories &amp; Curated Wire
            </Typography>
            <Chip
              label={activeFilter.name}
              size="small"
              sx={{
                fontSize: "10.5px",
                fontFamily: "var(--font-mono-telemetry)",
                fontWeight: 700,
                textTransform: "uppercase",
                bgcolor: "var(--color-brand-accent)",
                color: "#FFFFFF",
                borderRadius: "2px",
                height: "22px",
              }}
            />
          </Box>

          <Button
            component={RouterLink}
            to={activeCategory === "all" ? "/trending" : `/${activeCategory}`}
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
            sx={{
              fontFamily: "var(--font-sans-body)",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--color-brand-accent)",
              "&:hover": { textDecoration: "underline", bgcolor: "transparent" },
            }}
          >
            View All {activeFilter.name} News
          </Button>
        </Box>

        {/* Category Pill Tabs */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            overflowX: "auto",
            pb: 0.5,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = cat.id === activeCategory;
            return (
              <Chip
                key={cat.id}
                icon={cat.icon as any}
                label={cat.name}
                onClick={() => setActiveCategory(cat.id)}
                size="small"
                sx={{
                  fontFamily: "var(--font-sans-body)",
                  fontSize: "12px",
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  backgroundColor: isSelected ? "var(--color-brand-accent)" : "var(--color-surface-container)",
                  color: isSelected ? "#FFFFFF" : "var(--color-ink-primary)",
                  border: isSelected ? "1px solid var(--color-brand-accent)" : "1px solid var(--color-border-divider)",
                  transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                  flexShrink: 0,
                  "&:hover": {
                    backgroundColor: isSelected ? "var(--color-brand-accent-hover)" : "var(--color-surface-container-high)",
                    color: isSelected ? "#FFFFFF" : "var(--color-brand-accent)",
                  },
                  "& .MuiChip-icon": {
                    color: isSelected ? "#FFFFFF" : "inherit",
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* --- News Grid Stream --- */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress size={32} sx={{ color: "var(--red)" }} />
        </Box>
      ) : (
        <NewsGrid
          articles={articles}
          columns={columns}
          onBookmark={onBookmark}
          onRemoveBookmark={onRemoveBookmark}
          isBookmarked={isBookmarked}
          onLike={onLike}
          onDislike={onDislike}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
          onLikeComment={onLikeComment}
          onDislikeComment={onDislikeComment}
          getEngagement={getEngagement}
          category={activeFilter.name}
        />
      )}
    </Box>
  );
};
