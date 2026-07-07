import React, { useEffect, useState, useRef } from "react";
import { Card, CardMedia, CardContent, Typography, IconButton, Box, Avatar } from "@mui/material";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ShareIcon from "@mui/icons-material/Share";
import { fetchAdByPlacement } from "../api/apiClient";
import { formatTimeAgo } from "../utils/formatTime";

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
    likes: 342,
  },
  {
    title: "Upgrade to the Ultimate Noise-Canceling Wireless Earbuds Today",
    source: "SoundTech",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60",
    publishedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    likes: 819,
  },
  {
    title: "Start Your Premium Coding Journey with Certified Experts Online",
    source: "CodeAcademy",
    imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=60",
    publishedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    likes: 512,
  },
  {
    title: "Master the Art of Coffee Brewing with Premium Roast Beans",
    source: "RoastMasters",
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=60",
    publishedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    likes: 215,
  }
];

const isLocalhost = typeof window !== "undefined" && (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.endsWith(".local")
);

const isAdSenseEligible = typeof window !== "undefined" && 
  !isLocalhost && 
  window.location.protocol === "https:";

const AdCard: React.FC<AdCardProps> = ({ placement = "between-articles", index = 0 }) => {
  const [adScript, setAdScript] = useState<string | null>(null);
  const [adBlocked, setAdBlocked] = useState(!isAdSenseEligible);
  const [isVisible, setIsVisible] = useState(false);
  const initializedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const adElementRef = useRef<HTMLDivElement>(null);

  // Select a unique sponsored item based on the card position index
  const adItem = SPONSORED_ADS[index % SPONSORED_ADS.length];

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // trigger 200px before entering viewport
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    initializedRef.current = false;
    
    if (!isAdSenseEligible) {
      setAdBlocked(true);
      return;
    }

    setAdBlocked(false);
    fetchAdByPlacement(placement)
      .then((res) => {
        if (res.data && res.data.script) {
          setAdScript(res.data.script);
        } else {
          setAdBlocked(true);
        }
      })
      .catch(() => {
        setAdBlocked(true);
      });
  }, [placement, isVisible]);

  useEffect(() => {
    if (!isVisible || !isAdSenseEligible || !adScript || adBlocked || initializedRef.current) return;

    const container = adElementRef.current;
    if (!container) return;

    let resizeObserver: ResizeObserver | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let statusInterval: ReturnType<typeof setInterval> | null = null;

    const startMonitoringAdStatus = () => {
      let checkCount = 0;
      statusInterval = setInterval(() => {
        const insElement = container.querySelector("ins.adsbygoogle");
        if (insElement) {
          const status = insElement.getAttribute("data-ad-status");
          if (status === "unfilled") {
            setAdBlocked(true);
            if (statusInterval) clearInterval(statusInterval);
            return;
          } else if (status === "filled") {
            if (statusInterval) clearInterval(statusInterval);
            return;
          }
        }

        checkCount++;
        if (checkCount > 30) { // Timeout after 3 seconds (30 * 100ms)
          const insElementAfterTimeout = container.querySelector("ins.adsbygoogle");
          const hasIframe = insElementAfterTimeout?.querySelector("iframe") !== null;
          if (!hasIframe) {
            setAdBlocked(true);
          }
          if (statusInterval) clearInterval(statusInterval);
        }
      }, 100);
    };

    const initializeAd = () => {
      const adsbygoogle = (window as any).adsbygoogle;
      try {
        if (adsbygoogle) {
          (adsbygoogle || []).push({});
          initializedRef.current = true;
          startMonitoringAdStatus();
        } else {
          setAdBlocked(true);
        }
      } catch (e) {
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
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [adScript, adBlocked, placement, isVisible]);

  const renderContent = () => {
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
          <Box ref={adElementRef} sx={{ width: "100%", height: "100%", minHeight: 280 }}>
            <div dangerouslySetInnerHTML={{ __html: adScript }} />
          </Box>
        </Card>
      );
    }

    return (
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          minHeight: 320, // Stable layout size to prevent CLS
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
              <IconButton size="small" disabled aria-label="Sponsored like metric" sx={{ p: 0.5 }}>
                <ThumbUpOutlinedIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {adItem.likes}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton size="small" disabled aria-label="Sponsored dislike metric" sx={{ p: 0.5 }}>
                <ThumbDownOutlinedIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton size="small" disabled aria-label="Sponsored comments disabled" sx={{ p: 0.5 }}>
                <ChatBubbleOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <IconButton size="small" disabled aria-label="Sponsored share disabled" sx={{ p: 0.5 }}>
              <ShareIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled aria-label="Sponsored bookmark disabled" sx={{ p: 0.5 }}>
              <BookmarkBorderIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Card>
    );
  };

  return (
    <Box ref={containerRef} role="region" aria-label="Advertisement" sx={{ width: "100%", height: "100%", minHeight: 320, my: 2, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 2, p: 1 }}>
      {renderContent()}
    </Box>
  );
};

export default AdCard;
