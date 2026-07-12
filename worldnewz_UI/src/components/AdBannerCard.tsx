import React, { useEffect, useRef } from "react";
import { Card, Box } from "@mui/material";

const AD_ZONE_ID = "11275370";
const AD_SCRIPT_SRC = "https://nap5k.com/tag.min.js";

const AdBannerCard: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      // Clear container to avoid duplicate elements in React DevMode
      cardRef.current.innerHTML = "";

      const script = document.createElement("script");
      script.src = `${AD_SCRIPT_SRC}?t=${Date.now()}`;
      script.async = true;
      script.dataset.zone = AD_ZONE_ID;
      script.setAttribute("data-cfasync", "false");
      cardRef.current.appendChild(script);
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

      {/* Ad target container matching the exact 300x250 dimensions */}
      <Box
        ref={cardRef}
        sx={{
          width: "300px",
          height: "250px",
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          "& iframe": {
            border: "none !important",
            borderRadius: "6px !important",
          }
        }}
      />
    </Card>
  );
};

export default AdBannerCard;
