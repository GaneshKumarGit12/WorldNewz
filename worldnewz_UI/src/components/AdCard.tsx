import React, { useEffect, useState, useRef } from "react";
import { Card, CardMedia, CardContent, Typography, IconButton, Box, Avatar } from "@mui/material";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ShareIcon from "@mui/icons-material/Share";
import { fetchAdByPlacement } from "../api/apiClient";

interface AdCardProps {
  placement?: string;
  index?: number;
}

const SPONSORED_ADS = [
  {
    title: "Discover Next-Gen Cloud Storage Solutions for Modern Teams",
    source: "CloudSpace",
    imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=60",
    publishedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    likes: 124,
  },
  {
    title: "Upgrade Your Workspace: The Best Ergonomic Chairs of 2026",
    source: "ErgoDesign",
    imageUrl: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=60",
    publishedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    likes: 85,
  },
  {
    title: "Learn Python in 30 Days: Zero to Hero Software Engineering Bootcamp",
    source: "CodeAcademy",
    imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&auto=format&fit=crop&q=60",
    publishedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    likes: 342,
  },
  {
    title: "Switch to Green Energy: Save Up to 40% on Your Monthly Electricity Bill",
    source: "EcoPower",
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&auto=format&fit=crop&q=60",
    publishedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    likes: 93,
  },
  {
    title: "Master the Art of Coffee Brewing with Premium Roast Beans",
    source: "RoastMasters",
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=60",
    publishedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    likes: 215,
  }
];

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  return "1d";
};

const AdCard: React.FC<AdCardProps> = ({ placement = "between-articles", index = 0 }) => {
  const [adScript, setAdScript] = useState<string | null>(null);
  const [adBlocked, setAdBlocked] = useState(false);
  const initializedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Select a unique sponsored item based on the card position index
  const adItem = SPONSORED_ADS[index % SPONSORED_ADS.length];

  useEffect(() => {
    initializedRef.current = false;
    setAdBlocked(false);
    fetchAdByPlacement(placement)
      .then((res) => {
        if (res.data && res.data.script) {
          setAdScript(res.data.script);
        } else {
          setAdBlocked(true);
        }
      })
      .catch((err) => {
        console.warn(`Failed to fetch ad for placement '${placement}', using placeholder.`, err);
        setAdBlocked(true);
      });
  }, [placement]);

  useEffect(() => {
    if (!adScript || adBlocked || initializedRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    let resizeObserver: ResizeObserver | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const initializeAd = () => {
      const adsbygoogle = (window as any).adsbygoogle;
      try {
        if (adsbygoogle) {
          (adsbygoogle || []).push({});
          initializedRef.current = true;
        } else {
          setAdBlocked(true);
        }
      } catch (e) {
        console.error("AdSense initialization error: ", e);
        setAdBlocked(true);
      }
    };

    const checkWidthAndInit = () => {
      if (container.offsetWidth > 0) {
        if (resizeObserver) {
          resizeObserver.disconnect();
          resizeObserver = null;
        }
        timer = setTimeout(() => {
          initializeAd();
        }, 50);
      }
    };

    if (typeof window !== "undefined" && "ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(() => {
        checkWidthAndInit();
      });
      resizeObserver.observe(container);
      checkWidthAndInit();
    } else {
      timer = setTimeout(() => {
        initializeAd();
      }, 150);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [adScript, adBlocked]);

  // If the script is loaded and not blocked, render the AdSense container
  if (!adBlocked && adScript) {
    return (
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          minHeight: 320,
          bgcolor: "background.paper",
          backgroundImage: "none",
          boxShadow: "none",
          borderRadius: 2,
          overflow: "hidden",
          p: 1.5,
          justifyContent: "center",
          alignItems: "center",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box ref={containerRef} sx={{ width: "100%", height: "100%", minHeight: 280 }}>
          <div dangerouslySetInnerHTML={{ __html: adScript }} />
        </Box>
      </Card>
    );
  }

  // Otherwise (local dev, ad-blocked), render a perfectly matched placeholder card
  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        bgcolor: "background.paper",
        backgroundImage: "none",
        boxShadow: "none",
        borderRadius: 2,
        overflow: "hidden",
        transition: "transform 0.2s ease",
        "&:hover": {
          transform: "scale(1.02)",
        },
      }}
    >
      <Box sx={{ position: "relative", paddingTop: "56.25%" }}>
        <CardMedia
          component="img"
          image={adItem.imageUrl}
          alt={adItem.title}
          loading="lazy"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {/* Sponsored Tag */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            bgcolor: "rgba(0, 0, 0, 0.75)",
            color: "#fff",
            px: 1,
            py: 0.25,
            borderRadius: 0.5,
            fontSize: "0.65rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            zIndex: 2,
          }}
        >
          Sponsored
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 1.5, pb: 0 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Avatar
            sx={{
              width: 24,
              height: 24,
              fontSize: "0.75rem",
              bgcolor: "warning.main",
              mt: 0.5,
            }}
          >
            {adItem.source[0].toUpperCase()}
          </Avatar>
          <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.3,
                mb: 0.5,
              }}
            >
              {adItem.title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: "flex", alignItems: "center", fontSize: "0.75rem" }}
            >
              {adItem.source}
              <Box component="span" sx={{ mx: 0.5 }}>
                •
              </Box>
              {formatTimeAgo(adItem.publishedAt)}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 1.5,
          pb: 1.5,
          pl: 5.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton size="small" disabled sx={{ p: 0.5 }}>
              <ThumbUpOutlinedIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              {adItem.likes}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton size="small" disabled sx={{ p: 0.5 }}>
              <ThumbDownOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton size="small" disabled sx={{ p: 0.5 }}>
              <ChatBubbleOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton size="small" disabled sx={{ p: 0.5 }}>
            <ShareIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" disabled sx={{ p: 0.5 }}>
            <BookmarkBorderIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Card>
  );
};

export default AdCard;
