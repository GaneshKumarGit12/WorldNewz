import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import StarIcon from "@mui/icons-material/Star";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import Avatar from "@mui/material/Avatar";
import Link from "@mui/material/Link";
import MovieIcon from "@mui/icons-material/Movie";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import ShowChartIcon from "@mui/icons-material/ShowChart";

import { useFollowedTopics } from "../hooks/useFollowedTopics";

export interface TopicItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  categoryKeyword: string;
}

export interface SuggestedForYouWidgetProps {
  onTopicsChange?: (topicIds: string[]) => void;
  onTopicSelect?: (topicId: string | null) => void;
  activeTopicId?: string | null;
}

export const defaultTopics: TopicItem[] = [
  {
    id: "top-ai",
    name: "Artificial Intelligence",
    icon: <PsychologyIcon sx={{ fontSize: 16 }} />,
    categoryKeyword: "technology",
  },
  {
    id: "top-movies",
    name: "Movies",
    icon: <MovieIcon sx={{ fontSize: 16 }} />,
    categoryKeyword: "movies",
  },
  {
    id: "top-gaming",
    name: "Gaming Accessories",
    icon: <SportsEsportsIcon sx={{ fontSize: 16 }} />,
    categoryKeyword: "gaming accessories",
  },
  {
    id: "top-playstation",
    name: "PlayStation",
    icon: <SportsEsportsIcon sx={{ fontSize: 16 }} />,
    categoryKeyword: "playstation",
  },
  {
    id: "top-stocks",
    name: "Stocks",
    icon: <ShowChartIcon sx={{ fontSize: 16 }} />,
    categoryKeyword: "stocks",
  },
];

export const SuggestedForYouWidget: React.FC<SuggestedForYouWidgetProps> = ({ 
  onTopicsChange, 
  onTopicSelect,
  activeTopicId 
}) => {
  const { followedTopicIds, toggleFollow } = useFollowedTopics();

  useEffect(() => {
    if (onTopicsChange) {
      onTopicsChange(followedTopicIds);
    }
  }, [followedTopicIds, onTopicsChange]);

  const handleToggleFollow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toggleFollow(id);
  };

  const handleRowClick = (id: string) => {
    if (onTopicSelect) {
      const next = activeTopicId === id ? null : id;
      onTopicSelect(next);
    }
  };

  const handleSeeMoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("personalized-topic-hub");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Card
      sx={{
        background: (theme) =>
          theme.palette.mode === "dark" ? "#161b22" : "#ffffff",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        height: 380,
        boxShadow: "none",
        "&:hover": { transform: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" },
      }}
    >
      <CardContent sx={{ p: 2.5, pb: "16px !important", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <StarIcon sx={{ color: "#3b82f6" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Suggested for you
            </Typography>
          </Box>
          <IconButton size="small" id="suggested-topics-menu-btn" aria-label="Suggested topics menu">
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2, fontWeight: 500 }}>
          Follow topics to see real-time intelligence feeds
        </Typography>

        {/* Topics checklist */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, overflowY: "auto", pr: 0.5 }}>
          {defaultTopics.map((topic) => {
            const isSelected = activeTopicId === topic.id;
            const isFollowed = followedTopicIds.includes(topic.id);

            return (
              <Box
                key={topic.id}
                onClick={() => handleRowClick(topic.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  bgcolor: isSelected ? "rgba(183, 34, 43, 0.06)" : "transparent",
                  p: 1,
                  px: 1.5,
                  borderRadius: 2.5,
                  border: isSelected ? "1.5px solid" : "1px solid",
                  borderColor: isSelected ? "var(--red, #B7222B)" : "divider",
                  cursor: "pointer",
                  transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    borderColor: isSelected ? "var(--red, #B7222B)" : "text.secondary",
                    bgcolor: isSelected ? "rgba(183, 34, 43, 0.09)" : "action.hover",
                    transform: "translateX(2px)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: isSelected ? "var(--red, #B7222B)" : "action.selected",
                      color: isSelected ? "#FFFFFF" : "text.secondary",
                      transition: "all 0.2s",
                    }}
                  >
                    {topic.icon}
                  </Avatar>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: isSelected ? 800 : 600, 
                      fontSize: "0.85rem", 
                      color: isSelected ? "var(--red, #B7222B)" : "text.primary" 
                    }}
                  >
                    {topic.name}
                  </Typography>
                </Box>

                <IconButton
                  size="small"
                  onClick={(e) => handleToggleFollow(topic.id, e)}
                  id={`topic-toggle-${topic.name.replace(/\s+/g, "")}`}
                  aria-label={`${isFollowed ? "Unfollow" : "Follow"} ${topic.name}`}
                  sx={{
                    bgcolor: isFollowed ? "var(--red, #B7222B)" : "action.hover",
                    color: isFollowed ? "#FFFFFF" : "text.secondary",
                    border: "1px solid",
                    borderColor: isFollowed ? "var(--red, #B7222B)" : "divider",
                    width: 24,
                    height: 24,
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: isFollowed ? "var(--red-deep, #8E1B22)" : "action.selected",
                    },
                  }}
                >
                  {isFollowed ? (
                    <CheckIcon sx={{ fontSize: 13 }} />
                  ) : (
                    <AddIcon sx={{ fontSize: 14 }} />
                  )}
                </IconButton>
              </Box>
            );
          })}
        </Box>

        {/* Footer Link */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
          {/* Dots */}
          <Box sx={{ display: "flex", gap: 0.75 }}>
            {[0, 1, 2, 3].map((dot) => (
              <Box
                key={dot}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: dot === 0 ? "text.primary" : "text.disabled",
                }}
              />
            ))}
          </Box>

          <Link
            id="see-more-topics-link"
            onClick={handleSeeMoreClick}
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "primary.main",
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            See more topics
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
};
