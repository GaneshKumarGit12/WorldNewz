import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatIcon from "@mui/icons-material/Chat";
import ShareIcon from "@mui/icons-material/Share";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import SendIcon from "@mui/icons-material/Send";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router-dom";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { fetchShortVideos } from "../api/apiClient";
import type { ShortVideo } from "../api/apiClient";

interface LocalComment {
  author: string;
  text: string;
  timestamp: string;
}

export const TrendingShortVideos: React.FC = () => {
  const [videos, setVideos] = useState<ShortVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<ShortVideo | null>(null);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, LocalComment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [optionsAnchorEl, setOptionsAnchorEl] = useState<null | HTMLElement>(null);
  const optionsMenuOpen = Boolean(optionsAnchorEl);

  const mainVideoRef = useRef<HTMLVideoElement | null>(null);

  const handleOpenOptionsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setOptionsAnchorEl(event.currentTarget);
  };
  const handleCloseOptionsMenu = () => {
    setOptionsAnchorEl(null);
  };

  useEffect(() => {
    fetchShortVideos()
      .then((res) => {
        if (res.data && res.data.videos) {
          setVideos(res.data.videos);
          // Set initial likes
          const initialLikes: Record<string, number> = {};
          res.data.videos.forEach((v) => {
            initialLikes[v.id] = v.likesCount;
          });
          setLikesCount(initialLikes);
        }
      })
      .catch((err) => {
        console.warn("Failed to load short videos from backend, using fallbacks.", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleVideoClick = (video: ShortVideo) => {
    setActiveVideo(video);
    setIsPlaying(true);
    // Seed initial comments if empty
    if (!comments[video.id]) {
      setComments((prev) => ({
        ...prev,
        [video.id]: [
          { author: "Rajesh K.", text: "Wow, this was super informative!", timestamp: new Date(Date.now() - 3600000).toLocaleTimeString() },
          { author: "Anjali S.", text: "Keep posting these updates!", timestamp: new Date(Date.now() - 7200000).toLocaleTimeString() },
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

    const author = commentAuthor.trim() || "Anonymous";
    const commentItem: LocalComment = {
      author,
      text: newComment.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setComments((prev) => ({
      ...prev,
      [activeVideo.id]: [commentItem, ...(prev[activeVideo.id] || [])],
    }));

    setNewComment("");
    setCommentAuthor("");
  };

  const handleHoverPlay = (e: React.MouseEvent<HTMLVideoElement>) => {
    const videoElement = e.currentTarget;
    videoElement.play().catch(() => {});
  };

  const handleHoverPause = (e: React.MouseEvent<HTMLVideoElement>) => {
    const videoElement = e.currentTarget;
    videoElement.pause();
    videoElement.currentTime = 0;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ my: 6, textAlign: "left" }}>
      {/* Header Row */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "action.hover", p: 1, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <OndemandVideoIcon sx={{ color: "primary.main", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", m: 0, fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" } }}>
              Trending Shorts
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
              Watch quick, engaging video summaries curated directly by our journalists.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Link
            component={RouterLink}
            to="/trending-videos"
            id="see-more-shorts-header-link"
            sx={{
              fontSize: "0.85rem",
              fontWeight: 800,
              color: "text.secondary",
              "&:hover": { color: "primary.main", textDecoration: "underline" },
            }}
          >
            See more
          </Link>
          <IconButton 
            size="small" 
            id="shorts-header-menu-btn"
            onClick={handleOpenOptionsMenu}
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={optionsAnchorEl}
            open={optionsMenuOpen}
            onClose={handleCloseOptionsMenu}
            MenuListProps={{
              "aria-labelledby": "shorts-header-menu-btn",
            }}
            PaperProps={{
              sx: {
                bgcolor: "#090d16",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 2,
                mt: 0.5,
              }
            }}
          >
            <MenuItem 
              onClick={handleCloseOptionsMenu}
              component={RouterLink}
              to="/trending-videos"
              sx={{ 
                fontSize: "0.85rem",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                "&:hover": { bgcolor: "rgba(255,255,255,0.08)" }
              }}
            >
              <span>View All Trending Videos</span>
              <Box sx={{ bgcolor: "error.main", color: "#fff", fontSize: "0.65rem", fontWeight: "bold", px: 0.8, py: 0.2, borderRadius: 1 }}>
                Trending
              </Box>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Videos Horizontal Roll Grid */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          overflowX: "auto",
          pb: 2,
          scrollSnapType: "x mandatory",
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "divider", borderRadius: 4 },
        }}
      >
        {videos.map((video) => {
          const isLiked = userLikes[video.id] || false;
          const likes = likesCount[video.id] ?? video.likesCount;
          const commentList = comments[video.id] || [];
          const commentsCount = video.commentsCount + commentList.length;

          return (
            <Card
              key={video.id}
              onClick={() => handleVideoClick(video)}
              id={`short-card-${video.id}`}
              sx={{
                minWidth: { xs: 200, sm: 240 },
                maxWidth: { xs: 200, sm: 240 },
                height: { xs: 350, sm: 400 },
                position: "relative",
                borderRadius: 4,
                bgcolor: "#000",
                overflow: "hidden",
                cursor: "pointer",
                scrollSnapAlign: "start",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                },
              }}
            >
              {/* HTML5 video loop player */}
              {/* Hybrid Video Preview (Thumbnail image for YouTube, video player for raw MP4) */}
              {video.videoUrl.includes("youtube.com") || video.videoUrl.includes("embed") ? (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${video.thumbnail || (video.id && video.id.length === 11 ? `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800")})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.85,
                    transition: "opacity 0.2s",
                    "&:hover": { opacity: 1 },
                  }}
                >
                  <PlayArrowIcon sx={{ fontSize: 50, color: "#fff", filter: "drop-shadow(0px 2px 10px rgba(0,0,0,0.5))" }} />
                </Box>
              ) : (
                <video
                  src={video.videoUrl}
                  poster={video.authorAvatar}
                  loop
                  muted
                  playsInline
                  onMouseEnter={handleHoverPlay}
                  onMouseLeave={handleHoverPause}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.85,
                  }}
                />
              )}

              {/* Views Counter (Top Left) */}
              <Box
                sx={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  bgcolor: "rgba(0,0,0,0.6)",
                  px: 1,
                  py: 0.5,
                  borderRadius: 2,
                  backdropFilter: "blur(4px)",
                }}
              >
                <VisibilityIcon sx={{ fontSize: 13, color: "#fff" }} />
                <Typography variant="caption" sx={{ fontWeight: "bold", color: "#fff", fontSize: "0.7rem" }}>
                  {video.viewsCount}
                </Typography>
              </Box>

              {/* Publisher Category (Top Right) */}
              <Box
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  bgcolor: "primary.main",
                  color: "#fff",
                  fontSize: "0.65rem",
                  fontWeight: "bold",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1.5,
                }}
              >
                {video.category}
              </Box>

              {/* Floating Interactions Side Panel (Right) */}
              <Box
                sx={{
                  position: "absolute",
                  right: 8,
                  bottom: 90,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1.5,
                  zIndex: 2,
                }}
              >
                {/* Like Button */}
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleLikeToggle(video.id, e)}
                    id={`like-btn-short-${video.id}`}
                    sx={{
                      bgcolor: isLiked ? "rgba(239, 68, 68, 0.2)" : "rgba(0,0,0,0.6)",
                      color: isLiked ? "#ef4444" : "#fff",
                      backdropFilter: "blur(4px)",
                      "&:hover": { bgcolor: "#ef4444", color: "#fff" },
                    }}
                  >
                    {isLiked ? <FavoriteIcon sx={{ fontSize: 16 }} /> : <FavoriteBorderIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                  <Typography variant="caption" sx={{ color: "#fff", fontWeight: "bold", fontSize: "0.65rem", mt: 0.25 }}>
                    {likes.toLocaleString()}
                  </Typography>
                </Box>

                {/* Comment Button */}
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      backdropFilter: "blur(4px)",
                      "&:hover": { bgcolor: "primary.main" },
                    }}
                  >
                    <ChatIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <Typography variant="caption" sx={{ color: "#fff", fontWeight: "bold", fontSize: "0.65rem", mt: 0.25 }}>
                    {commentsCount}
                  </Typography>
                </Box>

                {/* Share Button */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(video.videoUrl);
                    alert("Video link copied to clipboard!");
                  }}
                  sx={{
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    backdropFilter: "blur(4px)",
                    "&:hover": { bgcolor: "primary.main" },
                  }}
                >
                  <ShareIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              {/* Bottom Content Metadata Overlay */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  bgcolor: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)",
                  p: 1.5,
                  pt: 4,
                  zIndex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                {/* Author */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar src={video.authorAvatar} sx={{ width: 20, height: 20 }} />
                  <Typography variant="caption" sx={{ color: "#fff", fontWeight: 700 }}>
                    {video.author}
                  </Typography>
                </Box>

                {/* Title */}
                <Typography
                  variant="body2"
                  sx={{
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.3,
                  }}
                >
                  {video.title}
                </Typography>
              </Box>
            </Card>
          );
        })}
      </Box>

      {/* Theater-Mode Lightbox Dialog */}
      <Dialog
        open={Boolean(activeVideo)}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        id="short-theater-dialog"
        PaperProps={{
          sx: {
            bgcolor: "#090d16",
            color: "#fff",
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      >
        <IconButton
          onClick={handleCloseModal}
          sx={{ position: "absolute", right: 12, top: 12, color: "#fff", zIndex: 10, bgcolor: "rgba(0,0,0,0.5)" }}
        >
          <CloseIcon />
        </IconButton>

        {activeVideo && (
          <DialogContent sx={{ p: 0, display: "flex", flexDirection: { xs: "column", md: "row" }, height: { xs: "80vh", md: 550 } }}>
            {/* Left Side: Video Player Container */}
            <Box
              sx={{
                flex: 1.2,
                bgcolor: "#000",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {activeVideo.videoUrl.includes("youtube.com") || activeVideo.videoUrl.includes("embed") ? (
                <iframe
                  src={`${activeVideo.videoUrl}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${activeVideo.id}&controls=1`}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                  allow="autoplay; encrypted-media"
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
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />

                  {/* Custom Controller Overlay */}
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 16,
                      left: 16,
                      right: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      bgcolor: "rgba(0,0,0,0.6)",
                      p: 1,
                      borderRadius: 3,
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <IconButton onClick={handlePlayPause} sx={{ color: "#fff" }}>
                      {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
                        {activeVideo.duration}
                      </Typography>
                      <IconButton onClick={handleVolumeToggle} sx={{ color: "#fff" }}>
                        {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                      </IconButton>
                    </Box>
                  </Box>
                </>
              )}
            </Box>

            {/* Right Side: Metadata, Engagement & Comments Panel */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                borderLeft: { md: "1px solid rgba(255,255,255,0.08)" },
                p: 3,
                justifyContent: "space-between",
                height: "100%",
                overflow: "hidden",
              }}
            >
              {/* Creator details & title */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  <Avatar src={activeVideo.authorAvatar} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {activeVideo.author}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Posted in {activeVideo.category}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.4 }}>
                  {activeVideo.title}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, color: "text.secondary", mb: 2, borderBottom: "1px solid rgba(255,255,255,0.08)", pb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                    👀 {activeVideo.viewsCount} Views
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                    ❤️ {likesCount[activeVideo.id] ?? activeVideo.likesCount} Likes
                  </Typography>
                </Box>
              </Box>

              {/* Comments Thread list */}
              <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2, mb: 2, pr: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                  Comments ({comments[activeVideo.id]?.length || 0})
                </Typography>
                {(comments[activeVideo.id] || []).length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    No comments yet. Start the conversation!
                  </Typography>
                ) : (
                  (comments[activeVideo.id] || []).map((c, index) => (
                    <Box key={index} sx={{ bgcolor: "rgba(255,255,255,0.03)", p: 1.5, borderRadius: 2, border: "1px solid rgba(255,255,255,0.04)" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: "bold", color: "#38bdf8" }}>
                          {c.author}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>
                          {c.timestamp}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.9)" }}>
                        {c.text}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>

              {/* Post comment form */}
              <Box component="form" onSubmit={handleAddComment} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    placeholder="Your name"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    size="small"
                    variant="outlined"
                    id="comment-author-input"
                    inputProps={{ style: { color: "#fff", fontSize: "0.8rem" } }}
                    sx={{
                      flex: 0.4,
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                        "&.Mui-focused fieldset": { borderColor: "primary.main" },
                      },
                    }}
                  />
                  <TextField
                    placeholder="Add comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    size="small"
                    variant="outlined"
                    fullWidth
                    id="comment-text-input"
                    inputProps={{ style: { color: "#fff", fontSize: "0.8rem" } }}
                    sx={{
                      flex: 1,
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                        "&.Mui-focused fieldset": { borderColor: "primary.main" },
                      },
                    }}
                  />
                  <IconButton type="submit" color="primary" sx={{ bgcolor: "primary.main", color: "#fff", "&:hover": { bgcolor: "primary.dark" } }} id="comment-submit-btn">
                    <SendIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </DialogContent>
        )}
      </Dialog>
    </Box>
  );
};
export default TrendingShortVideos;
