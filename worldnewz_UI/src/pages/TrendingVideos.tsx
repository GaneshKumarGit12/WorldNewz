import React, { useState, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
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
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import { fetchShortVideos } from "../api/apiClient";
import type { ShortVideo } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";

interface LocalComment {
  author: string;
  text: string;
  timestamp: string;
}

const TrendingVideos: React.FC = () => {
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

  const mainVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    fetchShortVideos()
      .then((res) => {
        if (res.data && res.data.videos) {
          setVideos(res.data.videos);
          const initialLikes: Record<string, number> = {};
          res.data.videos.forEach((v) => {
            initialLikes[v.id] = v.likesCount;
          });
          setLikesCount(initialLikes);
        }
      })
      .catch((err) => {
        console.warn("Failed to load trending videos, using fallbacks.", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleVideoClick = (video: ShortVideo) => {
    setActiveVideo(video);
    setIsPlaying(true);
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

  return (
    <>
      <SEOMeta
        title="Trending Videos & Shorts | WorldNewzs"
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

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Page Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(239, 68, 68, 0.15)", p: 1.5, borderRadius: 3, border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            <OndemandVideoIcon sx={{ color: "#ef4444", fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 900 }}>
              Trending Videos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Watch quick, engaging video summaries and news coverage.
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={50} />
          </Box>
        ) : (
          <Grid container spacing={3} id="trending-shorts-page-grid">
            {videos.map((video) => {
              const isLiked = userLikes[video.id] || false;
              const likes = likesCount[video.id] ?? video.likesCount;
              const commentList = comments[video.id] || [];
              const commentsCount = video.commentsCount + commentList.length;

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={video.id}>
                  <Card
                    onClick={() => handleVideoClick(video)}
                    id={`page-short-card-${video.id}`}
                    sx={{
                      height: 420,
                      position: "relative",
                      borderRadius: 4,
                      bgcolor: "#000",
                      overflow: "hidden",
                      cursor: "pointer",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                      },
                    }}
                  >
                    {/* Cover Thumbnail */}
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url(https://img.youtube.com/vi/${video.id}/hqdefault.jpg)`,
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
                      <PlayArrowIcon sx={{ fontSize: 60, color: "#fff", filter: "drop-shadow(0px 2px 10px rgba(0,0,0,0.5))" }} />
                    </Box>

                    {/* Views Count */}
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

                    {/* Category */}
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

                    {/* Floating Side Panel */}
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
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleLikeToggle(video.id, e)}
                          sx={{
                            bgcolor: isLiked ? "rgba(239, 68, 68, 0.2)" : "rgba(0,0,0,0.6)",
                            color: isLiked ? "#ef4444" : "#fff",
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          {isLiked ? <FavoriteIcon sx={{ fontSize: 16 }} /> : <FavoriteBorderIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                        <Typography variant="caption" sx={{ color: "#fff", fontWeight: "bold", fontSize: "0.65rem", mt: 0.25 }}>
                          {likes.toLocaleString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <IconButton
                          size="small"
                          sx={{
                            bgcolor: "rgba(0,0,0,0.6)",
                            color: "#fff",
                            backdropFilter: "blur(4px)",
                          }}
                        >
                          <ChatIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <Typography variant="caption" sx={{ color: "#fff", fontWeight: "bold", fontSize: "0.65rem", mt: 0.25 }}>
                          {commentsCount}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Meta Info Overlay */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        bgcolor: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)",
                        p: 2,
                        zIndex: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Avatar src={video.authorAvatar} sx={{ width: 22, height: 22 }} />
                        <Typography variant="caption" sx={{ color: "#fff", fontWeight: 700 }}>
                          {video.author}
                        </Typography>
                      </Box>
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
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* Theater-Mode Lightbox Dialog */}
      <Dialog
        open={Boolean(activeVideo)}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        id="short-theater-dialog-page"
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
            <Box sx={{ flex: 1.2, bgcolor: "#000", position: "relative", display: "flex", alignItems: "center", justifyCenter: "center" }}>
              {activeVideo.videoUrl.includes("youtube.com") || activeVideo.videoUrl.includes("embed") ? (
                <iframe
                  src={`${activeVideo.videoUrl}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${activeVideo.id}&controls=1`}
                  style={{ width: "100%", height: "100%", border: "none" }}
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
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                  <Box sx={{ position: "absolute", bottom: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "rgba(0,0,0,0.6)", p: 1, borderRadius: 3, backdropFilter: "blur(4px)" }}>
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

            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", borderLeft: { md: "1px solid rgba(255,255,255,0.08)" }, p: 3, justifyContent: "space-between", height: "100%", overflow: "hidden" }}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  <Avatar src={activeVideo.authorAvatar} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{activeVideo.author}</Typography>
                    <Typography variant="caption" color="text.secondary">Posted in {activeVideo.category}</Typography>
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.4 }}>{activeVideo.title}</Typography>
                <Box sx={{ display: "flex", gap: 2, color: "text.secondary", mb: 2, borderBottom: "1px solid rgba(255,255,255,0.08)", pb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: "bold" }}>👀 {activeVideo.viewsCount} Views</Typography>
                  <Typography variant="caption" sx={{ fontWeight: "bold" }}>❤️ {likesCount[activeVideo.id] ?? activeVideo.likesCount} Likes</Typography>
                </Box>
              </Box>

              <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2, mb: 2, pr: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>Comments ({(comments[activeVideo.id] || []).length})</Typography>
                {(comments[activeVideo.id] || []).length === 0 ? (
                  <Typography variant="caption" color="text.secondary">No comments yet. Start the conversation!</Typography>
                ) : (
                  (comments[activeVideo.id] || []).map((c, idx) => (
                    <Box key={idx} sx={{ bgcolor: "rgba(255,255,255,0.03)", p: 1.5, borderRadius: 2, border: "1px solid rgba(255,255,255,0.04)" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: "bold", color: "#38bdf8" }}>{c.author}</Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem" }}>{c.timestamp}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.9)" }}>{c.text}</Typography>
                    </Box>
                  ))
                )}
              </Box>

              <Box component="form" onSubmit={handleAddComment} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    placeholder="Your name"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    size="small"
                    variant="outlined"
                    inputProps={{ style: { color: "#fff", fontSize: "0.8rem" } }}
                    sx={{ flex: 0.4, "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "rgba(255,255,255,0.15)" } } }}
                  />
                  <TextField
                    placeholder="Add comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    size="small"
                    variant="outlined"
                    fullWidth
                    inputProps={{ style: { color: "#fff", fontSize: "0.8rem" } }}
                    sx={{ flex: 1, "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "rgba(255,255,255,0.15)" } } }}
                  />
                  <IconButton type="submit" color="primary" sx={{ bgcolor: "primary.main", color: "#fff", "&:hover": { bgcolor: "primary.dark" } }}>
                    <SendIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};

export default TrendingVideos;
