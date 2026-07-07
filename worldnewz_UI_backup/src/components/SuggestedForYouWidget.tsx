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

interface TopicItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  followed: boolean;
  categoryKeyword: string; // keyword mapped to filter news
}

interface SuggestedForYouWidgetProps {
  onTopicsChange?: (topics: string[]) => void;
}

const defaultTopics = [
  {
    id: "top-movies",
    name: "Movies",
    icon: <MovieIcon sx={{ fontSize: 16 }} />,
    followed: false,
    categoryKeyword: "movies",
  },
  {
    id: "top-ai",
    name: "Artificial Intelligence",
    icon: <PsychologyIcon sx={{ fontSize: 16 }} />,
    followed: true,
    categoryKeyword: "technology",
  },
  {
    id: "top-gaming",
    name: "Gaming Accessories",
    icon: <SportsEsportsIcon sx={{ fontSize: 16 }} />,
    followed: false,
    categoryKeyword: "gaming",
  },
  {
    id: "top-playstation",
    name: "PlayStation",
    icon: <SportsEsportsIcon sx={{ fontSize: 16 }} />,
    followed: false,
    categoryKeyword: "gaming",
  },
  {
    id: "top-stocks",
    name: "Stocks",
    icon: <ShowChartIcon sx={{ fontSize: 16 }} />,
    followed: false,
    categoryKeyword: "stocks",
  },
];

const LOCAL_STORAGE_KEY = "worldnewz_followed_topics";

export const SuggestedForYouWidget: React.FC<SuggestedForYouWidgetProps> = ({ onTopicsChange }) => {
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
        return defaultTopics;
      }
    }
    return defaultTopics;
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

  const handleToggleFollow = (id: string) => {
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
          Follow topics to see more of what you like
        </Typography>

        {/* Topics checklist */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, overflowY: "auto", pr: 0.5 }}>
          {topics.map((topic) => (
            <Box
              key={topic.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "action.hover",
                p: 1,
                px: 1.5,
                borderRadius: 3,
                border: "1px solid",
                borderColor: topic.followed ? "primary.light" : "divider",
                transition: "border-color 0.2s",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: topic.followed ? "accent-bg" : "action.selected",
                    color: topic.followed ? "primary.main" : "text.secondary",
                  }}
                >
                  {topic.icon}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.85rem", color: "text.primary" }}>
                  {topic.name}
                </Typography>
              </Box>

              <IconButton
                size="small"
                onClick={() => handleToggleFollow(topic.id)}
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
          ))}
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
