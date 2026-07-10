import React, { useEffect, useState, useRef } from "react";
import { Card, CardMedia, CardContent, Typography, IconButton, Box, Avatar } from "@mui/material";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ShareIcon from "@mui/icons-material/Share";
import { formatTimeAgo } from "../utils/formatTime";

interface AdCardProps {
  placement?: string;
  index?: number;
}

const ADSTERRA_SMART_LINK = "https://servicessitclaims.com/adjy687gk?key=bc72885b3b812917f1e35083ca18d3a5";

const SPONSORED_ADS = [
  {
    title: "Discover Next-Gen Cloud Storage Solutions for Modern Teams",
    source: "CloudSpace",
    imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=60",
    publishedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    likes: 342,
    link: ADSTERRA_SMART_LINK
  },
  {
    title: "Upgrade to the Ultimate Noise-Canceling Wireless Earbuds Today",
    source: "SoundTech",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60",
    publishedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    likes: 819,
    link: ADSTERRA_SMART_LINK
  },
  {
    title: "Start Your Premium Coding Journey with Certified Experts Online",
    source: "CodeAcademy",
    imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=60",
    publishedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    likes: 512,
    link: ADSTERRA_SMART_LINK
  },
  {
    title: "Master the Art of Coffee Brewing with Premium Roast Beans",
    source: "RoastMasters",
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=60",
    publishedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    likes: 215,
    link: ADSTERRA_SMART_LINK
  }
];

const AdCard: React.FC<AdCardProps> = ({ placement = "between-articles", index = 0 }) => {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [adsterraFailed, setAdsterraFailed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const adElementRef = useRef<HTMLDivElement>(null);

  // Select a unique sponsored item based on the card position index
  const adItem = SPONSORED_ADS[index % SPONSORED_ADS.length];

  // Screen size change handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Intersection observer to lazy-load scripts only when visible
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

  // Dynamic script injection for Adsterra 728x90 Banner (Desktop only)
  useEffect(() => {
    if (!isVisible) return;

    const isBannerPlacement = 
      placement === "play-games-banner" || 
      placement === "weather-page-bottom" || 
      placement === "between-articles";

    if (isBannerPlacement && !isMobile && adElementRef.current) {
      // Clear any existing children (useful during hot-reloads)
      adElementRef.current.innerHTML = "";
      setAdsterraFailed(false);

      const scriptContainer = document.createElement("div");
      scriptContainer.id = "adsterra-banner-wrapper";
      scriptContainer.style.width = "728px";
      scriptContainer.style.height = "90px";
      adElementRef.current.appendChild(scriptContainer);

      // Create configuration script
      const optionsScript = document.createElement("script");
      optionsScript.type = "text/javascript";
      optionsScript.innerHTML = `
        atOptions = {
          'key' : 'bf9bede62cc1cd83c4fad46360bd114e',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      `;

      // Create invoke script
      const invokeScript = document.createElement("script");
      invokeScript.type = "text/javascript";
      invokeScript.src = "https://www.highperformanceformat.com/bf9bede62cc1cd83c4fad46360bd114e/invoke.js";
      invokeScript.async = true;

      // Handle loading failure
      invokeScript.onerror = () => {
        setAdsterraFailed(true);
      };

      scriptContainer.appendChild(optionsScript);
      scriptContainer.appendChild(invokeScript);

      // Verify if banner actually gets loaded (if script blocked by local extension)
      const checkTimeout = setTimeout(() => {
        const hasIframe = adElementRef.current?.querySelector("iframe") !== null;
        if (!hasIframe) {
          // If no iframe is generated, fall back to our clickable Smart Link card
          setAdsterraFailed(true);
        }
      }, 3000);

      return () => clearTimeout(checkTimeout);
    }
  }, [placement, isMobile, isVisible]);

  const isBannerPlacement = 
    placement === "play-games-banner" || 
    placement === "weather-page-bottom" || 
    placement === "between-articles";

  const showDesktopBanner = isBannerPlacement && !isMobile && !adsterraFailed;

  if (showDesktopBanner) {
    return (
      <Box
        ref={containerRef}
        role="region"
        aria-label="Advertisement"
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          my: 2.5,
          minHeight: 90
        }}
      >
        <Box
          ref={adElementRef}
          sx={{
            width: "728px",
            height: "90px",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: 1.5,
            border: "1px solid rgba(255,255,255,0.05)"
          }}
        />
      </Box>
    );
  }

  // Otherwise, render the sponsored card that links to the smart link on click
  return (
    <Box
      ref={containerRef}
      role="region"
      aria-label="Advertisement"
      sx={{
        width: "100%",
        minHeight: 320,
        my: 2,
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 3,
        p: 1
      }}
    >
      <Card
        onClick={() => window.open(adItem.link, "_blank", "noopener,noreferrer")}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          minHeight: 320,
          bgcolor: "background.paper",
          backgroundImage: "none",
          boxShadow: "none",
          borderRadius: 2.5,
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
            borderColor: "rgba(255,138,101,0.2)"
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
              top: 10,
              left: 10,
              bgcolor: "rgba(0, 0, 0, 0.8)",
              color: "#ff8a65",
              px: 1.2,
              py: 0.4,
              borderRadius: 1,
              fontSize: "0.65rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 0.75,
              zIndex: 2,
              border: "1px solid rgba(255,138,101,0.3)"
            }}
          >
            Sponsored
          </Box>
        </Box>

        <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 2, pb: 0 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                fontSize: "0.8rem",
                bgcolor: "warning.main",
                mt: 0.5,
                fontWeight: 700
              }}
            >
              {adItem.source[0].toUpperCase()}
            </Avatar>
            <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  lineHeight: 1.35,
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
            px: 2,
            pb: 2,
            pl: 6,
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
    </Box>
  );
};

export default AdCard;
