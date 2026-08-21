import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { Link } from "react-router-dom";

interface CategoryLinkItem {
  name: string;
  path: string;
  description: string;
}

const CATEGORY_LINKS: CategoryLinkItem[] = [
  { name: "Politics", path: "/politics", description: "Global geopolitics, elections & policy" },
  { name: "Technology", path: "/technology", description: "AI, silicon innovation & gadget reviews" },
  { name: "Business", path: "/business", description: "Stock markets, corporate mergers & startups" },
  { name: "Science & Health", path: "/science-health", description: "Medical research, space & wellness" },
  { name: "Sports", path: "/sports", description: "Live scores, match results & tournaments" },
  { name: "Money", path: "/money", description: "Personal finance, investments & tax advice" },
  { name: "Weather", path: "/weather", description: "Local forecasts, radar & severe alerts" },
  { name: "Shopping & Deals", path: "/amazon-products", description: "Verified discounts & product buying guides" },
  { name: "Stock Tracker", path: "/stocks", description: "Nifty 50, Sensex & live price movements" },
  { name: "Badge Quiz", path: "/badge-quiz", description: "Daily trivia quizzes, coins & mastery badges" },
  { name: "Opinion Polls", path: "/polls", description: "Vote & inspect real-time citizen sentiment" },
  { name: "Jobs Board", path: "/jobs", description: "Remote & verified tech career opportunities" },
  { name: "Movies Database", path: "/movies", description: "Cinema reviews, cast ratings & box office" },
  { name: "Transportation", path: "/transportation", description: "City transit routes & cab booking guides" },
  { name: "NewsBot AI", path: "/chatbot", description: "Chat with our verified news AI assistant" },
  { name: "Trending Videos", path: "/trending-videos", description: "Curated news clips & video shorts" },
  { name: "Play Games", path: "/play-games", description: "Browser arcade games & interactive puzzles" },
  { name: "Editorial Briefings", path: "/editorial-briefings", description: "Deep-dive investigative journalism" },
];

interface InternalLinkHubProps {
  currentCategory?: string;
}

export const InternalLinkHub: React.FC<InternalLinkHubProps> = ({ currentCategory }) => {
  const filteredLinks = CATEGORY_LINKS.filter(
    (item) => !currentCategory || !item.path.includes(currentCategory.toLowerCase())
  );

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3.5 },
        mt: 4,
        mb: 4,
        backgroundColor: "var(--paper-raise, #162035)",
        border: "1px solid var(--line, #232E48)",
        borderRadius: "4px",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          fontFamily: "var(--serif, 'Source Serif 4', Georgia, serif)",
          color: "var(--text, #FFFFFF)",
          fontSize: { xs: "1.1rem", md: "1.25rem" },
          mb: 0.5,
        }}
      >
        Explore Related News Pillars & Interactive Utilities
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "var(--slate, #9AA2B4)",
          fontFamily: "var(--sans, sans-serif)",
          lineHeight: 1.5,
          mb: 2.5,
        }}
      >
        Navigate to other high-value reporting sections, market tools, quizzes, and multimedia features:
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 1.5,
        }}
      >
        {filteredLinks.map((item) => (
          <Box
            key={item.path}
            component={Link}
            to={item.path}
            sx={{
              p: 1.5,
              borderRadius: "4px",
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1px solid var(--line-soft, rgba(255,255,255,0.08))",
              textDecoration: "none",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: "rgba(183, 34, 43, 0.08)",
                borderColor: "var(--red, #B7222B)",
                transform: "translateY(-2px)",
              },
            }}
          >
            <Typography
              sx={{
                fontFamily: "var(--sans, sans-serif)",
                fontSize: "13.5px",
                fontWeight: 600,
                color: "var(--text, #FFFFFF)",
                mb: 0.25,
              }}
            >
              {item.name} &rarr;
            </Typography>
            <Typography
              sx={{
                fontFamily: "var(--sans, sans-serif)",
                fontSize: "11.5px",
                color: "var(--slate, #9AA2B4)",
                lineHeight: 1.4,
              }}
            >
              {item.description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default InternalLinkHub;
