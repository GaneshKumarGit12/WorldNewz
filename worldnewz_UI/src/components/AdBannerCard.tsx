import React, { useEffect, useRef } from "react";
import { Card, Box } from "@mui/material";

const AdBannerCard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous children to prevent duplicate ad insertions in React dev mode
    containerRef.current.innerHTML = "";

    try {
      // Create and inject the Monetag script tag inside our container
      const script = document.createElement("script");
      script.dataset.zone = "11275370";
      // Using a unique timestamp query parameter forces the browser to evaluate
      // and execute the script fresh on every render/page transition.
      script.src = `https://nap5k.com/tag.min.js?t=${Date.now()}`;
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      containerRef.current.appendChild(script);
    } catch (err) {
      console.error("Failed to load ad banner script inside AdBannerCard:", err);
    }
  }, []);

  return (
    <Card
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

      {/* Ad Script Target container */}
      <Box
        ref={containerRef}
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
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
      />
    </Card>
  );
};

export default AdBannerCard;
