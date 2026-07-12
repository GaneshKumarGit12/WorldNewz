import React, { useEffect, useRef, useState } from "react";
import { Card, Box, Typography } from "@mui/material";

const AD_ZONE_ID = "11268966";
const AD_SCRIPT_SRC = "https://nap5k.com/tag.min.js";

const AdBannerCard: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);

  // 1. Lazy-load when visible in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          // Once visible, we can stop observing
          if (cardRef.current) {
            observer.unobserve(cardRef.current);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  // 2. Inject ad script
  useEffect(() => {
    if (!isVisible || !adContainerRef.current) return;

    adContainerRef.current.innerHTML = "";

    try {
      const script = document.createElement("script");
      script.src = `${AD_SCRIPT_SRC}?t=${Date.now()}`;
      script.async = true;
      script.dataset.zone = AD_ZONE_ID;
      script.setAttribute("data-cfasync", "false");

      adContainerRef.current.appendChild(script);
    } catch (err) {
      console.error("Failed to load ad banner script inside AdBannerCard:", err);
    }
  }, [isVisible]);

  return (
    <Card
      ref={cardRef}
      component="article"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        minHeight: 350,
        bgcolor: "background.paper",
        backgroundImage: "none",
        border: (theme) => `1px solid ${theme.palette.mode === "light" ? "#cbd5e1" : "rgba(255, 255, 255, 0.08)"}`,
        boxShadow: (theme) => theme.palette.mode === "light" ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: (theme) => theme.palette.mode === "light" ? "#94a3b8" : "rgba(255, 255, 255, 0.2)",
          boxShadow: (theme) => theme.palette.mode === "light" ? "0 8px 20px rgba(0,0,0,0.1)" : "0 8px 24px rgba(0,0,0,0.4)",
        },
      }}
    >
      {/* Subtle SPONSORED/AD indicator overlay in the top-right corner */}
      <Box
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          bgcolor: (theme) => theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.08)",
          color: "text.secondary",
          px: 1,
          py: 0.2,
          borderRadius: 0.5,
          fontSize: "0.65rem",
          fontWeight: 700,
          letterSpacing: "0.5px",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        SPONSORED
      </Box>

      {/* Ad target container */}
      <Box
        ref={adContainerRef}
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 1.5,
          boxSizing: "border-box",
          "& iframe": {
            maxWidth: "100% !important",
            maxHeight: "100% !important",
            borderRadius: "6px",
            border: "none",
          },
          "& div": {
            maxWidth: "100% !important",
          }
        }}
      >
        {!isVisible && (
          <Typography variant="caption" color="text.secondary">
            Ad will load when visible...
          </Typography>
        )}
      </Box>
    </Card>
  );
};

export default AdBannerCard;
