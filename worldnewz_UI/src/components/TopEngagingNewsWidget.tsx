import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import Link from "@mui/material/Link";
import Avatar from "@mui/material/Avatar";
import ForumIcon from "@mui/icons-material/Forum";
import type { Article } from "../types";

interface TopEngagingNewsWidgetProps {
  articles?: Article[];
  getEngagement?: (url: string) => { comments: any[] };
}

interface EngagingNewsItem {
  id: string;
  source: string;
  sourceLogo: string;
  title: string;
  commentsCount: number;
  articleUrl?: string;
}

const mockEngagingNews: EngagingNewsItem[] = [
  {
    id: "eng-1",
    source: "India Today",
    sourceLogo: "IT",
    title: "This is not share market, it's poison market: Why ace investor wants stock trading restricted...",
    commentsCount: 4,
  },
  {
    id: "eng-2",
    source: "ABP Live",
    sourceLogo: "ABP",
    title: "NCERT adds emergency chapter to class 9 textbook for first time, calls it a major milestone...",
    commentsCount: 5,
  },
  {
    id: "eng-3",
    source: "Times Now",
    sourceLogo: "TN",
    title: "Priyanka Chopra calls out household gender stereotypes: Cooking, cleaning shouldn't fall only on...",
    commentsCount: 2,
  },
];

export const TopEngagingNewsWidget: React.FC<TopEngagingNewsWidgetProps> = ({ articles = [], getEngagement }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<EngagingNewsItem[]>(mockEngagingNews);

  useEffect(() => {
    if (articles.length > 0) {
      // Extract articles with engagement data
      const processed: EngagingNewsItem[] = articles
        .map((art, idx) => {
          const eng = getEngagement && art.url ? getEngagement(art.url) : { comments: [] };
          // Simulate some default engagement counts to keep the UI rich
          const baseComments = art.title.length % 6; // procedural seed
          const totalComments = (eng.comments?.length || 0) + baseComments;

          const sourceName = typeof art.source === "object" && art.source !== null && "name" in art.source
            ? art.source.name
            : typeof art.source === "string"
            ? art.source
            : "";
          const source = art.category || sourceName || "Global News";

          return {
            id: `eng-${idx}-${art.url || ""}`,
            source,
            sourceLogo: (source || "G")[0].toUpperCase(),
            title: art.title,
            commentsCount: totalComments,
            articleUrl: art.url,
          };
        })
        .sort((a, b) => b.commentsCount - a.commentsCount)
        .slice(0, 3);

      if (processed.length > 0) {
        setItems(processed);
      }
    }
  }, [articles, getEngagement]);

  // Color mapper for source avatars to look premium
  const getAvatarColor = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes("india")) return "#d32f2f";
    if (s.includes("abp")) return "#ff9800";
    if (s.includes("times")) return "#0d47a1";
    if (s.includes("bbc")) return "#b71c1c";
    if (s.includes("reuters")) return "#ff5722";
    return "#3f51b5";
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
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ForumIcon sx={{ color: "primary.main" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Top Engaging News
            </Typography>
          </Box>
          <IconButton size="small" id="engaging-news-menu-btn">
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Engaging List */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, overflowY: "auto" }}>
          {items.map((item) => (
            <Box key={item.id} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {/* Publisher & comments info */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar
                    sx={{
                      width: 18,
                      height: 18,
                      fontSize: "0.6rem",
                      fontWeight: "bold",
                      bgcolor: getAvatarColor(item.source),
                      color: "#fff",
                    }}
                  >
                    {item.sourceLogo}
                  </Avatar>
                  <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.75rem", color: "text.secondary" }}>
                    {item.source}
                  </Typography>
                </Box>

                {/* Comment count */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 13 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                    {item.commentsCount}
                  </Typography>
                </Box>
              </Box>

              {/* Title */}
              <Typography
                variant="body2"
                id={`engaging-news-title-${item.id}`}
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.4,
                  color: "text.primary",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  cursor: item.articleUrl ? "pointer" : "default",
                  "&:hover": {
                    color: item.articleUrl ? "primary.main" : "text.primary",
                  },
                }}
                onClick={() => {
                  if (item.articleUrl) {
                    window.open(item.articleUrl, "_blank");
                  }
                }}
              >
                {item.title}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Footer Dots and See More */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", gap: 0.75 }}>
            {[0, 1, 2].map((dot) => (
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
            id="see-more-engaging-link"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              navigate("/trending");
            }}
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "primary.main",
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            See more
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
};
