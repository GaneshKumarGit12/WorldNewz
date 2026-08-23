import React, { useState, useEffect } from "react";
import { Box, IconButton, Tooltip, Chip } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { fetchLiveStream, type LiveStreamItem } from "../../api/apiClient";
import { getFallbackLiveStream } from "../../utils/fallbackLiveStreams";
import { optimizeImageUrl, getCategoryFallbackImage } from "../../utils/imageOptimizer";

interface HeroLeadMediaProps {
  imageUrl?: string;
  category?: string;
  title: string;
  onArticleClick?: () => void;
  defaultMode?: "video" | "photo";
}

export const HeroLeadMedia: React.FC<HeroLeadMediaProps> = ({
  imageUrl,
  category,
  title,
  onArticleClick,
  defaultMode = "photo",
}) => {
  const [activeTab, setActiveTab] = useState<"video" | "photo">(defaultMode);
  const [liveStream, setLiveStream] = useState<LiveStreamItem>(() => getFallbackLiveStream(category));
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const initialFallback = getFallbackLiveStream(category);
    setLiveStream(initialFallback);

    fetchLiveStream(category)
      .then((res) => {
        if (isMounted && res?.data?.data?.embedUrl) {
          setLiveStream(res.data.data);
        }
      })
      .catch(() => {
        // Keeps the robust fallback
      });

    return () => {
      isMounted = false;
    };
  }, [category]);

  const fallbackImg = getCategoryFallbackImage(category, title);
  const optimizedSrc = imgError
    ? fallbackImg
    : optimizeImageUrl(imageUrl || fallbackImg, 900, category, title);

  return (
    <Box
      className="art tone-red"
      sx={{
        position: "relative",
        width: "100%",
        height: { xs: 240, sm: 320, md: 360 },
        borderRadius: "4px",
        overflow: "hidden",
        mb: 2,
        backgroundColor: "#0a0c10",
        border: "1px solid var(--line, rgba(255,255,255,0.08))",
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      }}
    >
      {/* 1. MEDIA DISPLAY (VIDEO OR PHOTO) */}
      {activeTab === "video" ? (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            position: "relative",
            backgroundColor: "#000",
          }}
        >
          <iframe
            src={liveStream.embedUrl}
            title={liveStream.title || `${category} Live Stream`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            onLoad={() => setIsVideoLoaded(true)}
            style={{
              width: "100%",
              height: "100%",
              border: 0,
              display: "block",
            }}
          />
          {!isVideoLoaded && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "#fff",
                fontSize: "13px",
                fontFamily: "var(--mono, monospace)",
              }}
            >
              Connecting to {liveStream.channelTitle || "Live Stream"}...
            </Box>
          )}
        </Box>
      ) : (
        <Box
          onClick={onArticleClick}
          sx={{
            width: "100%",
            height: "100%",
            position: "relative",
            cursor: onArticleClick ? "pointer" : "default",
          }}
        >
          <img
            src={optimizedSrc}
            alt={title}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            width={800}
            height={450}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.35s ease",
            }}
            onError={() => setImgError(true)}
          />
          {/* Subtle gradient overlay at bottom of photo */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 40%, transparent 100%)",
              pointerEvents: "none",
            }}
          />
        </Box>
      )}

      {/* 2. TOP CONTROL BAR / LIVE STREAM TOGGLE OVERLAYS */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          left: 10,
          right: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        {/* Pulsing Live Badge */}
        <Chip
          icon={
            <FiberManualRecordIcon
              sx={{
                fontSize: "10px !important",
                color: "#ff2a2a !important",
                animation: "pulseLive 1.4s ease-in-out infinite",
                "@keyframes pulseLive": {
                  "0%": { opacity: 1, transform: "scale(1)" },
                  "50%": { opacity: 0.4, transform: "scale(1.25)" },
                  "100%": { opacity: 1, transform: "scale(1)" },
                },
              }}
            />
          }
          label={activeTab === "video" ? `LIVE · ${liveStream.channelTitle}` : "LIVE BROADCAST AVAILABLE"}
          size="small"
          sx={{
            pointerEvents: "auto",
            backgroundColor: "rgba(12, 14, 18, 0.88)",
            backdropFilter: "blur(8px)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "11px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            border: "1px solid rgba(255, 42, 42, 0.4)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
            height: "26px",
          }}
        />

        {/* Action Toggle Switchers */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            pointerEvents: "auto",
            backgroundColor: "rgba(12, 14, 18, 0.88)",
            backdropFilter: "blur(8px)",
            borderRadius: "20px",
            padding: "2px 4px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          <Tooltip title="Switch to 24/7 Live Video Stream">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("video");
              }}
              sx={{
                color: activeTab === "video" ? "#ff4d4d" : "rgba(255,255,255,0.7)",
                backgroundColor: activeTab === "video" ? "rgba(255, 42, 42, 0.18)" : "transparent",
                borderRadius: "16px",
                padding: "3px 8px",
                fontSize: "12px",
                gap: "4px",
                "&:hover": {
                  backgroundColor: "rgba(255, 42, 42, 0.28)",
                  color: "#ff6666",
                },
              }}
            >
              <VideocamIcon sx={{ fontSize: "16px" }} />
              <Box component="span" sx={{ fontSize: "11px", fontWeight: 600, display: { xs: "none", sm: "inline" } }}>
                Live Stream
              </Box>
            </IconButton>
          </Tooltip>

          <Tooltip title="Switch to Article Photo">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab("photo");
              }}
              sx={{
                color: activeTab === "photo" ? "#4da6ff" : "rgba(255,255,255,0.7)",
                backgroundColor: activeTab === "photo" ? "rgba(77, 166, 255, 0.18)" : "transparent",
                borderRadius: "16px",
                padding: "3px 8px",
                fontSize: "12px",
                gap: "4px",
                "&:hover": {
                  backgroundColor: "rgba(77, 166, 255, 0.28)",
                  color: "#70b8ff",
                },
              }}
            >
              <PhotoCameraIcon sx={{ fontSize: "16px" }} />
              <Box component="span" sx={{ fontSize: "11px", fontWeight: 600, display: { xs: "none", sm: "inline" } }}>
                Photo
              </Box>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 3. BOTTOM INFO STRIP (When in Video Mode) */}
      {activeTab === "video" && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "4px 12px",
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
            color: "rgba(255,255,255,0.8)",
            fontSize: "11px",
            fontFamily: "var(--mono, monospace)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", pr: 1 }}>
            📡 Broadcasting: {liveStream.title}
          </Box>
          <Box sx={{ flexShrink: 0, color: "var(--red, #ff4d4d)" }}>
            ● AUTO-UPDATED DAILY
          </Box>
        </Box>
      )}
    </Box>
  );
};
export default HeroLeadMedia;
