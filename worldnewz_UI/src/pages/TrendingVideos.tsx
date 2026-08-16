import React, { useState, useEffect, useRef, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatIcon from "@mui/icons-material/Chat";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import SearchIcon from "@mui/icons-material/Search";
import ShareIcon from "@mui/icons-material/Share";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import VerifiedIcon from "@mui/icons-material/Verified";

import { fetchShortVideos } from "../api/apiClient";
import type { ShortVideo } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useColorMode } from "../context/ThemeContext";
import { BreadcrumbNav } from "../components/BreadcrumbNav";
import { fallbackShortVideos } from "../utils/fallbackShortVideos";

interface LocalComment {
  author: string;
  text: string;
  timestamp: string;
}

const CATEGORIES = ["All", "News", "Technology", "Business", "Science & Health", "Lifestyle", "Gaming"];

export const TrendingVideos: React.FC = () => {
  const { mode } = useColorMode();
  const isDark = mode === "dark";

  const cardBorderColor = isDark ? "#19202a" : "#e9e3e3";
  const cardBorder = `1px solid ${cardBorderColor}`;

  const [videos, setVideos] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(16);
  const [activeVideo, setActiveVideo] = useState<ShortVideo | null>(null);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, LocalComment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");

  // Social share menu state
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
  const [shareVideo, setShareVideo] = useState<ShortVideo | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const mainVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchShortVideos()
      .then((res) => {
        if (!isMounted) return;
        const apiVideos = res.data?.videos || [];
        if (apiVideos.length > 0) {
          // Merge API videos with fallbacks to avoid duplicates
          const seen = new Set<string>();
          const combined: ShortVideo[] = [];
          
          apiVideos.forEach((v) => {
            if (v.id && !seen.has(v.id)) {
              seen.add(v.id);
              combined.push(v);
            }
          });

          fallbackShortVideos.forEach((v) => {
            if (v.id && !seen.has(v.id)) {
              seen.add(v.id);
              combined.push(v);
            }
          });

          setVideos(combined);
          const initialLikes: Record<string, number> = {};
          combined.forEach((v) => {
            initialLikes[v.id] = v.likesCount;
          });
          setLikesCount(initialLikes);
        } else {
          setVideos(fallbackShortVideos);
        }
      })
      .catch((err) => {
        console.warn("Failed to load short videos from backend, using fallbacks.", err);
        if (isMounted) {
          setVideos(fallbackShortVideos);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleVideoClick = (video: ShortVideo) => {
    setActiveVideo(video);
    setIsPlaying(true);
    if (!comments[video.id]) {
      setComments((prev) => ({
        ...prev,
        [video.id]: [
          { author: "Rajesh K.", text: "Super insightful summary, love the concise format!", timestamp: "1 hour ago" },
          { author: "Anjali S.", text: "Very informative news breakdown. Keep posting these!", timestamp: "2 hours ago" },
        ],
      }));
    }
  };

  const handleCloseModal = () => {
    setActiveVideo(null);
  };

  const handleLikeToggle = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserLikes((prev) => {
      const isLiked = !prev[videoId];
      setLikesCount((prevCounts) => ({
        ...prevCounts,
        [videoId]: isLiked ? (prevCounts[videoId] || 0) + 1 : Math.max(0, (prevCounts[videoId] || 1) - 1),
      }));
      return { ...prev, [videoId]: isLiked };
    });
  };

  const handleShareClick = (video: ShortVideo, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setShareVideo(video);
    setShareAnchorEl(e.currentTarget);
  };

  const handleShareClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setShareAnchorEl(null);
    setShareVideo(null);
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => {
          setCopiedId(null);
          handleShareClose();
        }, 1500);
      })
      .catch(() => {});
  };

  const handlePlayPause = () => {
    if (mainVideoRef.current) {
      if (isPlaying) {
        mainVideoRef.current.pause();
      } else {
        mainVideoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeToggle = () => {
    if (mainVideoRef.current) {
      mainVideoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVideo || !newComment.trim()) return;

    const author = commentAuthor.trim() || "Reader";
    const commentItem: LocalComment = {
      author,
      text: newComment.trim(),
      timestamp: "Just now",
    };

    setComments((prev) => ({
      ...prev,
      [activeVideo.id]: [commentItem, ...(prev[activeVideo.id] || [])],
    }));

    setNewComment("");
    setCommentAuthor("");
  };

  // Filtered video list based on category and search query
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchCat = selectedCategory === "All" || v.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
      const matchSearch = !searchQuery.trim() ||
        (v.title || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (v.author || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (v.category || "").toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchCat && matchSearch;
    });
  }, [videos, selectedCategory, searchQuery]);

  return (
    <Box sx={{ bgcolor: "var(--paper)", color: "var(--text)", minHeight: "100vh", pb: 8 }}>
      <SEOMeta
        title="Trending Videos & News Shorts | Viral Global Coverage | WorldNewzs"
        description="Explore the latest trending short videos, news coverage, technology breakdowns, and quick global news updates on WorldNewzs."
        keywords={["trending videos", "shorts", "news shorts", "technology shorts", "worldnewzs videos"]}
        canonical="https://worldnewzs.in/trending-videos"
      />
      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: "https://worldnewzs.in" },
          { name: "Trending Videos", url: "https://worldnewzs.in/trending-videos" },
        ]}
      />

      <Box className="wrap" sx={{ maxWidth: "1240px", margin: "0 auto", px: { xs: 2, sm: 3, md: 3.5 }, pt: 3, pb: 4 }}>
        <BreadcrumbNav items={[{ label: "Trending Videos & Shorts" }]} />

        {/* ─── MASTHEAD HEADER ─── */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
            <Chip
              icon={<LocalFireDepartmentIcon sx={{ color: "var(--red, #B7222B) !important", fontSize: "0.95rem !important" }} />}
              label="WORLDNEWZS REELS DESK · VIRAL NEWS, TECH & ANALYSIS SHORTS"
              size="small"
              sx={{
                bgcolor: "rgba(183, 34, 43, 0.08)",
                color: "var(--red, #B7222B)",
                fontWeight: 800,
                fontSize: "0.68rem",
                letterSpacing: 0.8,
                border: cardBorder
              }}
            />
            <Typography variant="caption" sx={{ color: "var(--slate)", fontWeight: 600 }}>
              Updated Hourly · Fast-Paced Multimedia Newsroom
            </Typography>
          </Box>

          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 900,
              fontFamily: "var(--serif)",
              fontSize: { xs: "1.9rem", sm: "2.5rem", md: "2.85rem" },
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              color: "var(--text)",
              mb: 1
            }}
          >
            Trending <Box component="span" sx={{ color: "var(--red, #B7222B)" }}>Videos</Box> & News Shorts
          </Typography>
          <Typography variant="body1" sx={{ color: "var(--slate)", maxWidth: 840, lineHeight: 1.6, fontSize: "0.95rem" }}>
            Watch quick, verified video summaries, market breakdowns, technology explainers, and viral dispatches curated across global news channels and digital creators.
          </Typography>
        </Box>

        {/* ─── CATEGORY FILTER PILLS & SEARCH BAR ─── */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: "8px",
            bgcolor: "var(--paper-raise)",
            border: cardBorder,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 2
          }}
        >
          {/* Category Chips */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Chip
                  key={cat}
                  label={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setVisibleCount(16);
                  }}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    px: 1,
                    bgcolor: isSelected ? "var(--red, #B7222B)" : "var(--paper)",
                    color: isSelected ? "#FFFFFF" : "var(--text)",
                    border: `1px solid ${isSelected ? "var(--red, #B7222B)" : cardBorderColor}`,
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: isSelected ? "var(--red-deep, #8E1B22)" : "rgba(183, 34, 43, 0.08)",
                      borderColor: "var(--red, #B7222B)"
                    }
                  }}
                />
              );
            })}
          </Box>

          {/* Search Input */}
          <Box sx={{ alignSelf: { xs: "stretch", md: "auto" } }}>
            <TextField
              size="small"
              placeholder="Search trending shorts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "var(--slate)", fontSize: "1.05rem" }} />
                    </InputAdornment>
                  )
                }
              }}
              sx={{
                width: { xs: "100%", sm: 240 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "6px",
                  bgcolor: "var(--paper)",
                  color: "var(--text)",
                  fontSize: "0.82rem",
                  "& fieldset": { borderColor: cardBorderColor },
                  "&:hover fieldset": { borderColor: "var(--red, #B7222B)" },
                  "&.Mui-focused fieldset": { borderColor: "var(--red, #B7222B)" }
                }
              }}
            />
          </Box>
        </Paper>

        {/* ─── MAIN SHORTS VIDEO GRID ─── */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress sx={{ color: "var(--red, #B7222B)" }} />
          </Box>
        ) : filteredVideos.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: "8px", bgcolor: "var(--paper-raise)", border: cardBorder }}>
            <OndemandVideoIcon sx={{ fontSize: 48, color: "var(--slate)", mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text)", mb: 1 }}>
              No video shorts found matching "{searchQuery}"
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--slate)", mb: 2 }}>
              Try searching with another keyword or resetting the category filter.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              sx={{ borderColor: cardBorderColor, color: "var(--text)", fontWeight: 700 }}
            >
              Reset Filters
            </Button>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3} id="trending-shorts-page-grid">
              {filteredVideos.slice(0, visibleCount).map((video) => {
                const isLiked = userLikes[video.id] || false;
                const likes = likesCount[video.id] ?? video.likesCount;
                const commentList = comments[video.id] || [];
                const commentsCount = video.commentsCount + commentList.length;

                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={video.id}>
                    <Card
                      onClick={() => handleVideoClick(video)}
                      id={`page-short-card-${video.id}`}
                      elevation={0}
                      sx={{
                        height: 440,
                        position: "relative",
                        borderRadius: "8px",
                        bgcolor: "var(--paper-raise)",
                        overflow: "hidden",
                        cursor: "pointer",
                        border: cardBorder,
                        transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          borderColor: "var(--red, #B7222B)",
                          boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.08)",
                          "& .play-hover-icon": {
                            transform: "scale(1.15)",
                            bgcolor: "var(--red, #B7222B)",
                            color: "#FFFFFF"
                          },
                          "& .thumbnail-img": {
                            transform: "scale(1.05)"
                          }
                        },
                      }}
                    >
                      {/* Cover Thumbnail Image */}
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "#000",
                          overflow: "hidden"
                        }}
                      >
                        <Box
                          component="img"
                          className="thumbnail-img"
                          src={video.authorAvatar || video.thumbnail || (video.id && video.id.length === 11 ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800")}
                          alt={video.title}
                          decoding="async"
                          loading="lazy"
                          onError={(e: any) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800";
                          }}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: 0.88,
                            transition: "transform 0.3s ease"
                          }}
                        />

                        {/* Centered Play Action Icon */}
                        <Box
                          className="play-hover-icon"
                          sx={{
                            position: "absolute",
                            width: 54,
                            height: 54,
                            borderRadius: "50%",
                            bgcolor: "rgba(0,0,0,0.65)",
                            backdropFilter: "blur(4px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#FFFFFF",
                            transition: "all 0.25s ease",
                            border: "1px solid rgba(255,255,255,0.25)"
                          }}
                        >
                          <PlayArrowIcon sx={{ fontSize: 32, ml: 0.2 }} />
                        </Box>
                      </Box>

                      {/* Top Badges (Views & Category) */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          right: 10,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          zIndex: 2
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            bgcolor: "rgba(0,0,0,0.7)",
                            px: 1,
                            py: 0.3,
                            borderRadius: "4px",
                            backdropFilter: "blur(4px)",
                            border: "1px solid rgba(255,255,255,0.15)"
                          }}
                        >
                          <VisibilityIcon sx={{ fontSize: 12, color: "#fff" }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "#fff", fontSize: "0.68rem" }}>
                            {video.viewsCount}
                          </Typography>
                        </Box>

                        <Chip
                          label={video.category}
                          size="small"
                          sx={{
                            bgcolor: "var(--red, #B7222B)",
                            color: "#FFFFFF",
                            fontSize: "0.62rem",
                            fontWeight: 900,
                            height: 20,
                            letterSpacing: 0.5,
                            textTransform: "uppercase"
                          }}
                        />
                      </Box>

                      {/* Floating Right Interaction Panel */}
                      <Box
                        sx={{
                          position: "absolute",
                          right: 10,
                          bottom: 95,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 1.25,
                          zIndex: 3,
                        }}
                      >
                        {/* Like Button */}
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleLikeToggle(video.id, e)}
                            sx={{
                              bgcolor: isLiked ? "var(--red, #B7222B)" : "rgba(0,0,0,0.65)",
                              color: "#FFFFFF",
                              backdropFilter: "blur(4px)",
                              p: 0.75,
                              border: "1px solid rgba(255,255,255,0.15)",
                              "&:hover": { bgcolor: "var(--red, #B7222B)" }
                            }}
                          >
                            {isLiked ? <FavoriteIcon sx={{ fontSize: 16 }} /> : <FavoriteBorderIcon sx={{ fontSize: 16 }} />}
                          </IconButton>
                          <Typography variant="caption" sx={{ color: "#fff", fontWeight: 800, fontSize: "0.65rem", mt: 0.25, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                            {likes.toLocaleString()}
                          </Typography>
                        </Box>

                        {/* Comments Count */}
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <IconButton
                            size="small"
                            sx={{
                              bgcolor: "rgba(0,0,0,0.65)",
                              color: "#FFFFFF",
                              backdropFilter: "blur(4px)",
                              p: 0.75,
                              border: "1px solid rgba(255,255,255,0.15)"
                            }}
                          >
                            <ChatIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                          <Typography variant="caption" sx={{ color: "#fff", fontWeight: 800, fontSize: "0.65rem", mt: 0.25, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                            {commentsCount}
                          </Typography>
                        </Box>

                        {/* Share Button */}
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleShareClick(video, e)}
                            sx={{
                              bgcolor: "rgba(0,0,0,0.65)",
                              color: "#FFFFFF",
                              backdropFilter: "blur(4px)",
                              p: 0.75,
                              border: "1px solid rgba(255,255,255,0.15)",
                              "&:hover": { bgcolor: "var(--red, #B7222B)" }
                            }}
                          >
                            <ShareIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </Box>

                      {/* Bottom Meta Info Overlay */}
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)",
                          p: 2,
                          pr: 5,
                          zIndex: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                          <Avatar src={video.authorAvatar} sx={{ width: 22, height: 22, border: "1px solid #fff" }} />
                          <Typography variant="caption" sx={{ color: "#FFFFFF", fontWeight: 800, fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 0.5 }}>
                            {video.author}
                            <VerifiedIcon sx={{ fontSize: 13, color: "#38BDF8" }} />
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#FFFFFF",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: 1.35,
                          }}
                        >
                          {video.title}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Load More Button */}
            {visibleCount < filteredVideos.length && (
              <Box sx={{ display: "flex", justifyContent: "center", width: "100%", mt: 5 }}>
                <Button
                  id="load-more-shorts-btn"
                  variant="contained"
                  onClick={() => setVisibleCount((prev) => Math.min(filteredVideos.length, prev + 8))}
                  sx={{
                    borderRadius: "6px",
                    px: 4,
                    py: 1.25,
                    fontWeight: 800,
                    textTransform: "none",
                    bgcolor: "var(--red, #B7222B)",
                    color: "#FFFFFF",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "var(--red-deep, #8E1B22)"
                    }
                  }}
                >
                  Load More Shorts ({filteredVideos.length - visibleCount} remaining) 🎥
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* ─── THEATER-MODE LIGHTBOX MODAL ─── */}
      <Dialog
        open={Boolean(activeVideo)}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        id="short-theater-dialog-page"
        PaperProps={{
          sx: {
            bgcolor: "var(--paper-raise)",
            color: "var(--text)",
            borderRadius: "8px",
            overflow: "hidden",
            border: cardBorder,
            boxShadow: isDark ? "0 20px 50px rgba(0,0,0,0.7)" : "0 10px 40px rgba(0,0,0,0.15)"
          },
        }}
      >
        <IconButton
          onClick={handleCloseModal}
          sx={{ position: "absolute", right: 12, top: 12, color: "#FFFFFF", zIndex: 10, bgcolor: "rgba(0,0,0,0.6)" }}
        >
          <CloseIcon />
        </IconButton>

        {activeVideo && (
          <DialogContent sx={{ p: 0, display: "flex", flexDirection: { xs: "column", md: "row" }, height: { xs: "85vh", md: 560 } }}>
            {/* Left Player Column */}
            <Box sx={{ flex: 1.2, bgcolor: "#000", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {activeVideo.videoUrl.includes("youtube.com") || activeVideo.videoUrl.includes("embed") ? (
                <iframe
                  src={`${activeVideo.videoUrl}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${activeVideo.id}&controls=1`}
                  title={activeVideo.title}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <>
                  <video
                    ref={mainVideoRef}
                    src={activeVideo.videoUrl}
                    poster={activeVideo.authorAvatar}
                    autoPlay
                    loop
                    muted={muted}
                    playsInline
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                  <Box sx={{ position: "absolute", bottom: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "rgba(0,0,0,0.7)", p: 1, borderRadius: "6px", backdropFilter: "blur(4px)" }}>
                    <IconButton onClick={handlePlayPause} sx={{ color: "#fff" }}>
                      {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>{activeVideo.duration}</Typography>
                      <IconButton onClick={handleVolumeToggle} sx={{ color: "#fff" }}>
                        {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                      </IconButton>
                    </Box>
                  </Box>
                </>
              )}
            </Box>

            {/* Right Comments & Details Column */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", borderLeft: { md: cardBorder }, p: 3, justifyContent: "space-between", height: "100%", overflow: "hidden", bgcolor: "var(--paper-raise)" }}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  <Avatar src={activeVideo.authorAvatar} sx={{ border: "1px solid var(--line)" }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--text)" }}>
                      {activeVideo.author}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--slate)" }}>
                      Category: {activeVideo.category}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 800, mb: 1.5, lineHeight: 1.35, color: "var(--text)", fontSize: "0.95rem" }}>
                  {activeVideo.title}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, color: "var(--slate)", mb: 2, borderBottom: cardBorder, pb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>👀 {activeVideo.viewsCount} Views</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800 }}>❤️ {likesCount[activeVideo.id] ?? activeVideo.likesCount} Likes</Typography>
                </Box>
              </Box>

              {/* Comments Feed */}
              <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1.5, mb: 2, pr: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: "var(--text)" }}>
                  Reader Comments ({(comments[activeVideo.id] || []).length})
                </Typography>
                {(comments[activeVideo.id] || []).length === 0 ? (
                  <Typography variant="caption" sx={{ color: "var(--slate)" }}>No comments yet. Start the conversation!</Typography>
                ) : (
                  (comments[activeVideo.id] || []).map((c, idx) => (
                    <Box key={idx} sx={{ bgcolor: "var(--paper)", p: 1.5, borderRadius: "6px", border: cardBorder }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: "var(--red, #B7222B)" }}>{c.author}</Typography>
                        <Typography variant="caption" sx={{ color: "var(--slate)", fontSize: "0.68rem" }}>{c.timestamp}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontSize: "0.82rem", color: "var(--text)" }}>{c.text}</Typography>
                    </Box>
                  ))
                )}
              </Box>

              {/* Add Comment Input */}
              <Box component="form" onSubmit={handleAddComment} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    placeholder="Your name"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    size="small"
                    variant="outlined"
                    sx={{
                      flex: 0.4,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "6px",
                        bgcolor: "var(--paper)",
                        color: "var(--text)",
                        fontSize: "0.8rem",
                        "& fieldset": { borderColor: cardBorderColor }
                      }
                    }}
                  />
                  <TextField
                    placeholder="Add comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    size="small"
                    variant="outlined"
                    fullWidth
                    sx={{
                      flex: 1,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "6px",
                        bgcolor: "var(--paper)",
                        color: "var(--text)",
                        fontSize: "0.8rem",
                        "& fieldset": { borderColor: cardBorderColor }
                      }
                    }}
                  />
                  <IconButton type="submit" sx={{ bgcolor: "var(--red, #B7222B)", color: "#FFFFFF", borderRadius: "6px", "&:hover": { bgcolor: "var(--red-deep, #8E1B22)" } }}>
                    <SendIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </DialogContent>
        )}
      </Dialog>

      {/* ─── SOCIAL SHARE MENU ─── */}
      <Menu
        anchorEl={shareAnchorEl}
        open={Boolean(shareAnchorEl)}
        onClose={() => handleShareClose()}
        PaperProps={{
          sx: {
            borderRadius: "8px",
            bgcolor: "var(--paper-raise)",
            color: "var(--text)",
            border: cardBorder,
            minWidth: 180,
            boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.5)" : "0 10px 30px rgba(0,0,0,0.08)"
          }
        }}
      >
        {shareVideo && (
          <>
            <MenuItem
              component="a"
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Check out this trending short: " + shareVideo.title + " https://worldnewzs.in/trending-videos")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleShareClose(e)}
            >
              <ListItemIcon><WhatsAppIcon sx={{ color: "#10B981", fontSize: "1.1rem" }} /></ListItemIcon>
              <ListItemText primary="WhatsApp" primaryTypographyProps={{ variant: "body2", fontWeight: 700 }} />
            </MenuItem>

            <MenuItem
              component="a"
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent("https://worldnewzs.in/trending-videos")}&text=${encodeURIComponent("Check out this trending short: " + shareVideo.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleShareClose(e)}
            >
              <ListItemIcon><TwitterIcon sx={{ color: "var(--slate)", fontSize: "1.1rem" }} /></ListItemIcon>
              <ListItemText primary="X (Twitter)" primaryTypographyProps={{ variant: "body2", fontWeight: 700 }} />
            </MenuItem>

            <MenuItem
              component="a"
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://worldnewzs.in/trending-videos")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleShareClose(e)}
            >
              <ListItemIcon><FacebookIcon sx={{ color: "#3B82F6", fontSize: "1.1rem" }} /></ListItemIcon>
              <ListItemText primary="Facebook" primaryTypographyProps={{ variant: "body2", fontWeight: 700 }} />
            </MenuItem>

            <MenuItem
              component="a"
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://worldnewzs.in/trending-videos")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => handleShareClose(e)}
            >
              <ListItemIcon><LinkedInIcon sx={{ color: "#0A66C2", fontSize: "1.1rem" }} /></ListItemIcon>
              <ListItemText primary="LinkedIn" primaryTypographyProps={{ variant: "body2", fontWeight: 700 }} />
            </MenuItem>

            <MenuItem onClick={() => handleCopyLink(`https://worldnewzs.in/trending-videos#${shareVideo.id}`, shareVideo.id)}>
              <ListItemIcon>
                <ContentCopyIcon sx={{ color: copiedId === shareVideo.id ? "#10B981" : "var(--slate)", fontSize: "1.1rem" }} />
              </ListItemIcon>
              <ListItemText
                primary={copiedId === shareVideo.id ? "Copied!" : "Copy Link"}
                primaryTypographyProps={{ variant: "body2", fontWeight: 700, color: copiedId === shareVideo.id ? "#10B981" : "var(--text)" }}
              />
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default TrendingVideos;
