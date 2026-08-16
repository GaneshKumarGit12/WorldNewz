import React, { useState, useEffect } from "react";
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

export interface TopicItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  followed: boolean;
  categoryKeyword: string; // keyword mapped to filter news
}

export interface SuggestedForYouWidgetProps {
  onTopicsChange?: (topics: string[]) => void;
  onTopicSelect?: (topicId: string) => void;
  activeTopicId?: string;
}

export const defaultTopics: Omit<TopicItem, "followed">[] = [
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
    categoryKeyword: "gaming",
  },
  {
    id: "top-playstation",
    name: "PlayStation",
    icon: <SportsEsportsIcon sx={{ fontSize: 16 }} />,
    categoryKeyword: "gaming",
  },
  {
    id: "top-stocks",
    name: "Stocks",
    icon: <ShowChartIcon sx={{ fontSize: 16 }} />,
    categoryKeyword: "stocks",
  },
];

const LOCAL_STORAGE_KEY = "worldnewz_followed_topics";

export const SuggestedForYouWidget: React.FC<SuggestedForYouWidgetProps> = ({ 
  onTopicsChange, 
  onTopicSelect,
  activeTopicId 
}) => {
  const [topics, setTopics] = useState<TopicItem[]>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: string[] = JSON.parse(stored);
        return defaultTopics.map((topic) => ({
          ...topic,
          followed: parsed.includes(topic.categoryKeyword),
        }));
      } catch {
        return defaultTopics.map((t) => ({ ...t, followed: false }));
      }
    }
    return defaultTopics.map((t) => ({ ...t, followed: false }));
  });

  useEffect(() => {
    // Notify parent of initially followed topics
    const followedKeywords = topics
      .filter((t) => t.followed)
      .map((t) => t.categoryKeyword);
    if (onTopicsChange) {
      onTopicsChange(followedKeywords);
    }
  }, []);

  const handleToggleFollow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = topics.map((t) =>
      t.id === id ? { ...t, followed: !t.followed } : t
    );
    setTopics(updated);

    const followedKeywords = updated
      .filter((t) => t.followed)
      .map((t) => t.categoryKeyword);

    // Save to localstorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(followedKeywords));

    if (onTopicsChange) {
      onTopicsChange(followedKeywords);
    }
    if (onTopicSelect) {
      onTopicSelect(id);
    }
  };

  const handleRowClick = (id: string) => {
    if (onTopicSelect) {
      onTopicSelect(id);
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
          <IconButton size="small" id="suggested-topics-menu-btn">
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2, fontWeight: 500 }}>
          Follow topics to see real-time intelligence feeds
        </Typography>

        {/* Topics checklist */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, overflowY: "auto", pr: 0.5 }}>
          {topics.map((topic) => {
            const isSelected = activeTopicId === topic.id;
            return (
              <Box
                key={topic.id}
                onClick={() => handleRowClick(topic.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  bgcolor: isSelected ? "rgba(183, 34, 43, 0.08)" : "action.hover",
                  p: 1,
                  px: 1.5,
                  borderRadius: 3,
                  border: "1.5px solid",
                  borderColor: isSelected ? "var(--red, #B7222B)" : (topic.followed ? "primary.light" : "divider"),
                  cursor: "pointer",
                  transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    borderColor: "var(--red, #B7222B)",
                    transform: "translateX(2px)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: isSelected || topic.followed ? "var(--red, #B7222B)" : "action.selected",
                      color: isSelected || topic.followed ? "#FFFFFF" : "text.secondary",
                      transition: "all 0.2s",
                    }}
                  >
                    {topic.icon}
                  </Avatar>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: isSelected ? 800 : 700, 
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
                  sx={{
                    bgcolor: topic.followed ? "primary.main" : "action.selected",
                    color: topic.followed ? "primary.contrastText" : "text.secondary",
                    width: 24,
                    height: 24,
                    "&:hover": {
                      bgcolor: topic.followed ? "primary.dark" : "action.hover",
                    },
                  }}
                >
                  {topic.followed ? (
                    <CheckIcon sx={{ fontSize: 14 }} />
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
