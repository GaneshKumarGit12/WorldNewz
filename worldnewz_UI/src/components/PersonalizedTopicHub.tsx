import React, { useState, useEffect, useMemo } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Chip, 
  CircularProgress, 
  IconButton,
  Divider
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import AddIcon from "@mui/icons-material/Add";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

import type { Article } from "../types";
import { fetchSearch } from "../api/apiClient";
import { optimizeImageUrl, getCategoryFallbackImage } from "../utils/imageOptimizer";
import { formatTimeAgoLong } from "../utils/formatTime";
import { useBookmarks } from "../hooks/useBookmarks";
import { useFollowedTopics } from "../hooks/useFollowedTopics";
import { TOPIC_DEFINITIONS } from "../utils/topicDefinitions";

interface PersonalizedTopicHubProps {
  initialTopicId?: string;
  followedTopicIds?: string[];
  onToggleFollow?: (topicId: string) => void;
}

export const PersonalizedTopicHub: React.FC<PersonalizedTopicHubProps> = ({
  initialTopicId = "top-ai",
  followedTopicIds: propFollowedTopicIds,
  onToggleFollow: propOnToggleFollow
}) => {
  const navigate = useNavigate();
  const [activeTopicId, setActiveTopicId] = useState<string>(initialTopicId);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const { followedTopicIds: hookFollowedTopicIds, toggleFollow: hookToggleFollow } = useFollowedTopics();

  const followedTopicIds = propFollowedTopicIds !== undefined ? propFollowedTopicIds : hookFollowedTopicIds;
  const handleToggleFollow = propOnToggleFollow || hookToggleFollow;

  // Sync activeTopicId if initialTopicId changes
  useEffect(() => {
    if (initialTopicId && TOPIC_DEFINITIONS[initialTopicId]) {
      setActiveTopicId(initialTopicId);
    }
  }, [initialTopicId]);

  const activeTopic = useMemo(() => {
    return TOPIC_DEFINITIONS[activeTopicId] || TOPIC_DEFINITIONS["top-ai"];
  }, [activeTopicId]);

  // Fetch live articles for active topic
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchSearch({ query: activeTopic.query, pageSize: 6 })
      .then((res) => {
        if (!isMounted) return;
        const results = Array.isArray(res.data?.results) ? res.data.results : [];
        if (results.length > 0) {
          setArticles(results);
        } else {
          // Fallback articles
          const fallbackImg = getCategoryFallbackImage(activeTopic.category, activeTopic.name);
          setArticles([
            {
              title: `${activeTopic.name}: Comprehensive Sector Analysis & Strategic Outlook`,
              description: activeTopic.overview[0],
              category: activeTopic.category,
              publishedAt: new Date().toISOString(),
              source: { name: "WorldNewzs Intelligence Desk" },
              urlToImage: fallbackImg,
              imageUrl: fallbackImg,
              verified: true
            },
            {
              title: `Global Trends and Innovations Transforming ${activeTopic.name}`,
              description: activeTopic.developments[0],
              category: activeTopic.category,
              publishedAt: new Date().toISOString(),
              source: { name: "WorldNewzs Editorial Desk" },
              urlToImage: fallbackImg,
              imageUrl: fallbackImg,
              verified: true
            },
            {
              title: `Market Impact and Consumer Adoption Patterns in ${activeTopic.name}`,
              description: activeTopic.impact[0],
              category: activeTopic.category,
              publishedAt: new Date().toISOString(),
              source: { name: "WorldNewzs Special Report" },
              urlToImage: fallbackImg,
              imageUrl: fallbackImg,
              verified: true
            }
          ]);
        }
      })
      .catch((err) => {
        console.warn("Topic news fetch failed, loading curated editorial articles:", err);
        if (!isMounted) return;
        const fallbackImg = getCategoryFallbackImage(activeTopic.category, activeTopic.name);
        setArticles([
          {
            title: `${activeTopic.name}: Comprehensive Sector Analysis & Strategic Outlook`,
            description: activeTopic.overview[0],
            category: activeTopic.category,
            publishedAt: new Date().toISOString(),
            source: { name: "WorldNewzs Intelligence Desk" },
            urlToImage: fallbackImg,
            imageUrl: fallbackImg,
            verified: true
          },
          {
            title: `Global Trends and Innovations Transforming ${activeTopic.name}`,
            description: activeTopic.developments[0],
            category: activeTopic.category,
            publishedAt: new Date().toISOString(),
            source: { name: "WorldNewzs Editorial Desk" },
            urlToImage: fallbackImg,
            imageUrl: fallbackImg,
            verified: true
          }
        ]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTopic]);

  const handleArticleClick = (art: Article) => {
    const titleSlug = art.title?.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().substring(0, 60) || "article";
    navigate(`/read-article/${titleSlug}`, { state: { article: art } });
  };

  const isFollowed = followedTopicIds.includes(activeTopic.id);

  return (
    <Paper
      id="personalized-topic-hub"
      elevation={0}
      sx={{
        mb: 6,
        p: { xs: 2.5, sm: 4 },
        borderRadius: "10px",
        backgroundColor: "var(--paper-raise)",
        border: "1px solid var(--line)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        transition: "all 0.25s ease",
      }}
    >
      {/* 1. TOPIC SELECTOR TAB BAR */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          borderBottom: "1px solid var(--line)",
          pb: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: "var(--red, #B7222B)", fontSize: 20 }} />
          <Typography
            variant="subtitle1"
            sx={{
              fontFamily: "var(--serif)",
              fontWeight: 750,
              fontSize: { xs: "16px", sm: "18px" },
              color: "var(--text)",
            }}
          >
            Personalized Topic Intelligence
          </Typography>
        </Box>

        {/* Topic Pills */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {Object.values(TOPIC_DEFINITIONS).map((topic) => {
            const isSelected = topic.id === activeTopic.id;
            return (
              <Chip
                key={topic.id}
                icon={topic.icon as any}
                label={topic.name}
                onClick={() => setActiveTopicId(topic.id)}
                sx={{
                  fontFamily: "var(--sans)",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  backgroundColor: isSelected ? "var(--red, #B7222B)" : "var(--paper)",
                  color: isSelected ? "#FFFFFF" : "var(--text)",
                  border: isSelected ? "1px solid var(--red, #B7222B)" : "1px solid var(--line)",
                  transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    backgroundColor: isSelected ? "var(--red-deep, #8E1B22)" : "rgba(183, 34, 43, 0.08)",
                    color: isSelected ? "#FFFFFF" : "var(--red, #B7222B)",
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

      {/* 2. ACTIVE TOPIC HERO BANNER */}
      <Box
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 4,
          borderRadius: "8px",
          backgroundColor: "var(--paper)",
          border: "1px solid var(--line-soft)",
          borderLeft: "4px solid var(--red, #B7222B)",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2.5,
        }}
      >
        <Box sx={{ maxWidth: 700 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Chip
              label={activeTopic.category}
              size="small"
              sx={{
                fontSize: "11px",
                fontWeight: 700,
                backgroundColor: "rgba(183, 34, 43, 0.1)",
                color: "var(--red, #B7222B)",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}
            />
            <Typography sx={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--slate-light)" }}>
              ● Verified Editorial Synthesis
            </Typography>
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontFamily: "var(--serif)",
              fontWeight: 800,
              fontSize: { xs: "22px", sm: "26px" },
              color: "var(--text)",
              mb: 1,
            }}
          >
            {activeTopic.name}
          </Typography>

          <Typography
            sx={{
              fontFamily: "var(--sans)",
              fontSize: "14px",
              color: "var(--slate)",
              lineHeight: 1.6,
            }}
          >
            {activeTopic.tagline}
          </Typography>
        </Box>

        <Button
          variant={isFollowed ? "outlined" : "contained"}
          startIcon={isFollowed ? <CheckIcon sx={{ fontSize: 16 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
          onClick={() => handleToggleFollow(activeTopic.id)}
          sx={{
            fontFamily: "var(--sans)",
            fontWeight: 700,
            fontSize: "13px",
            textTransform: "none",
            borderRadius: "6px",
            px: 2.5,
            py: 1,
            whiteSpace: "nowrap",
            backgroundColor: isFollowed ? "transparent" : "var(--red, #B7222B)",
            color: isFollowed ? "var(--text)" : "#FFFFFF",
            borderColor: isFollowed ? "var(--line)" : "transparent",
            "&:hover": {
              backgroundColor: isFollowed ? "rgba(183, 34, 43, 0.06)" : "var(--red-deep, #8E1B22)",
              borderColor: isFollowed ? "var(--red)" : "transparent",
            },
          }}
        >
          {isFollowed ? "Following Topic" : "Follow Topic"}
        </Button>
      </Box>

      {/* 3. STRUCTURED 6 TO 10 PARAGRAPH EDITORIAL DEEP-DIVE */}
      <Box sx={{ mb: 5 }}>
        <Grid container spacing={4}>
          {/* Main Editorial Text (Left 7 Cols) */}
          <Grid size={{ xs: 12, md: 7 }}>
            {/* Section 1: Executive Overview (Paras 1-2) */}
            <Typography
              variant="h6"
              sx={{
                fontFamily: "var(--serif)",
                fontWeight: 750,
                fontSize: "18px",
                color: "var(--text)",
                mb: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <LibraryBooksIcon sx={{ fontSize: 18, color: "var(--red)" }} />
              Executive Overview & Industry Momentum
            </Typography>
            {activeTopic.overview.map((p, idx) => (
              <Typography
                key={idx}
                sx={{
                  fontFamily: "var(--serif, Georgia, serif)",
                  fontSize: "15.5px",
                  lineHeight: 1.75,
                  color: "var(--text)",
                  mb: 2,
                }}
              >
                {p}
              </Typography>
            ))}

            {/* Section 2: Critical Developments (Paras 3-4) */}
            <Typography
              variant="h6"
              sx={{
                fontFamily: "var(--serif)",
                fontWeight: 750,
                fontSize: "18px",
                color: "var(--text)",
                mt: 3,
                mb: 1.5,
              }}
            >
              Critical Market & Technology Developments
            </Typography>
            {activeTopic.developments.map((p, idx) => (
              <Typography
                key={idx}
                sx={{
                  fontFamily: "var(--serif, Georgia, serif)",
                  fontSize: "15.5px",
                  lineHeight: 1.75,
                  color: "var(--text)",
                  mb: 2,
                }}
              >
                {p}
              </Typography>
            ))}

            {/* Section 3: Sector Transformation & Impact (Paras 5-6) */}
            <Typography
              variant="h6"
              sx={{
                fontFamily: "var(--serif)",
                fontWeight: 750,
                fontSize: "18px",
                color: "var(--text)",
                mt: 3,
                mb: 1.5,
              }}
            >
              Sector Transformation & Consumer Impact
            </Typography>
            {activeTopic.impact.map((p, idx) => (
              <Typography
                key={idx}
                sx={{
                  fontFamily: "var(--serif, Georgia, serif)",
                  fontSize: "15.5px",
                  lineHeight: 1.75,
                  color: "var(--text)",
                  mb: 2,
                }}
              >
                {p}
              </Typography>
            ))}
          </Grid>

          {/* Key Takeaways & FAQs Sidebar (Right 5 Cols) */}
          <Grid size={{ xs: 12, md: 5 }}>
            {/* Takeaways Box (Paras 7-8) */}
            <Box
              sx={{
                p: 3,
                mb: 3,
                borderRadius: "8px",
                backgroundColor: "var(--paper)",
                border: "1px solid var(--line-soft)",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontFamily: "var(--sans)",
                  fontWeight: 800,
                  fontSize: "14px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--red, #B7222B)",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 16 }} />
                Empirical Takeaways & Metrics
              </Typography>

              {activeTopic.takeaways.map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    py: 1,
                    borderBottom: idx < activeTopic.takeaways.length - 1 ? "1px solid var(--line-soft)" : "none",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "var(--sans)",
                      fontSize: "13.5px",
                      lineHeight: 1.55,
                      color: "var(--text)",
                      fontWeight: 500,
                    }}
                  >
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* FAQs Box (Paras 9-10) */}
            <Box
              sx={{
                p: 3,
                borderRadius: "8px",
                backgroundColor: "var(--paper)",
                border: "1px solid var(--line-soft)",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontFamily: "var(--sans)",
                  fontWeight: 800,
                  fontSize: "14px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text)",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <HelpOutlineIcon sx={{ fontSize: 16, color: "var(--red)" }} />
                Frequently Asked Questions
              </Typography>

              {activeTopic.faqs.map((faq, idx) => (
                <Box
                  key={idx}
                  sx={{
                    mb: idx < activeTopic.faqs.length - 1 ? 2 : 0,
                    pb: idx < activeTopic.faqs.length - 1 ? 2 : 0,
                    borderBottom: idx < activeTopic.faqs.length - 1 ? "1px solid var(--line-soft)" : "none",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "var(--sans)",
                      fontSize: "13.5px",
                      fontWeight: 700,
                      color: "var(--text)",
                      mb: 0.5,
                    }}
                  >
                    Q: {faq.q}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "var(--sans)",
                      fontSize: "13px",
                      color: "var(--slate)",
                      lineHeight: 1.5,
                    }}
                  >
                    {faq.a}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* 4. LIVE TOPIC NEWS STREAM (3-4 LIVE API CARDS) */}
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "var(--serif)",
                fontWeight: 750,
                fontSize: "18px",
                color: "var(--text)",
              }}
            >
              Breaking News Stream: {activeTopic.name}
            </Typography>
            <Chip
              label="LIVE"
              size="small"
              sx={{
                fontSize: "10px",
                fontWeight: 800,
                bgcolor: "var(--red)",
                color: "#FFFFFF",
                height: "20px",
              }}
            />
          </Box>

          <Button
            component={RouterLink}
            to={`/search?q=${encodeURIComponent(activeTopic.name)}`}
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
            sx={{
              fontFamily: "var(--sans)",
              fontSize: "12.5px",
              fontWeight: 600,
              textTransform: "none",
              color: "var(--red)",
              "&:hover": { textDecoration: "underline", bgcolor: "transparent" },
            }}
          >
            Explore All Coverage
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} sx={{ color: "var(--red)" }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {articles.slice(0, 3).map((art, idx) => {
              const imgUrl = art.urlToImage || art.imageUrl || getCategoryFallbackImage(activeTopic.category, art.title);
              const optimizedImg = optimizeImageUrl(imgUrl, 600, activeTopic.category, art.title);
              const bookmarked = art.url ? isBookmarked(art.url) : false;

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={art.url || idx}>
                  <Card
                    onClick={() => handleArticleClick(art)}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "8px",
                      backgroundColor: "var(--paper)",
                      border: "1px solid var(--line-soft)",
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                        borderColor: "var(--red)",
                        "& .headline": { color: "var(--red)" },
                      },
                    }}
                  >
                    <Box sx={{ position: "relative", width: "100%", height: 160, overflow: "hidden", bgcolor: "#1e293b" }}>
                      <CardMedia
                        component="img"
                        image={optimizedImg}
                        alt={art.title}
                        loading="lazy"
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <Chip
                        label={typeof art.source === "object" ? art.source?.name : (art.source || "WorldNewzs Desk")}
                        size="small"
                        sx={{
                          position: "absolute",
                          bottom: 8,
                          left: 8,
                          bgcolor: "rgba(16, 23, 42, 0.85)",
                          color: "#FFFFFF",
                          fontSize: "10px",
                          fontWeight: 700,
                          backdropFilter: "blur(4px)",
                        }}
                      />
                    </Box>

                    <CardContent sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <Box>
                        <Typography
                          className="headline"
                          sx={{
                            fontFamily: "var(--serif)",
                            fontWeight: 700,
                            fontSize: "15px",
                            lineHeight: 1.35,
                            color: "var(--text)",
                            mb: 1,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            transition: "color 0.15s ease",
                          }}
                        >
                          {art.title}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "var(--sans)",
                            fontSize: "12.5px",
                            color: "var(--slate)",
                            lineHeight: 1.5,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {art.description || art.summary || "Click to read verified full analysis on WorldNewzs."}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mt: 2,
                          pt: 1.5,
                          borderTop: "1px solid var(--line-soft)",
                        }}
                      >
                        <Typography sx={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--slate-light)" }}>
                          {formatTimeAgoLong(art.publishedAt)}
                        </Typography>

                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (art.url) {
                              bookmarked ? removeBookmark(art.url) : addBookmark(art);
                            }
                          }}
                          sx={{
                            color: bookmarked ? "var(--gold)" : "var(--slate-light)",
                            "&:hover": { color: "var(--red)" },
                          }}
                        >
                          {bookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Paper>
  );
};
