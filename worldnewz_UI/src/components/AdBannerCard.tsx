import React, { useEffect } from "react";
import { Card, Box, Typography } from "@mui/material";
import { AffiliateAdBanner } from "./AffiliateAdBanner";

interface AdBannerCardProps {
  category?: string;
}

const AdBannerCard: React.FC<AdBannerCardProps> = ({ category }) => {
  const adClient = import.meta.env.VITE_ADSENSE_CLIENT || "ca-pub-7547748414764075";
  const adSlot = import.meta.env.VITE_ADSENSE_SLOT || "";

  // Only load AdSense if slot is configured and is not the placeholder
  const isAdSenseConfigured = adSlot && adSlot !== "" && adSlot !== "1234567890";

  useEffect(() => {
    if (isAdSenseConfigured) {
      try {
        // Safely initialize AdSense element push
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      } catch (e) {
        // Fail silently if blocklisted or script isn't loaded yet
      }
    }
  }, [isAdSenseConfigured]);

  if (!isAdSenseConfigured) {
    // Render the dedicated AffiliateAdBanner component interlinking to Amazon Deals
    return <AffiliateAdBanner category={category} />;
  }

  return (
    <Card
      component="aside"
      aria-label="Sponsored advertisement"
      id="ad-banner-card"
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

      {/* Styled Ad Slot Box */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          p: 2,
          boxSizing: "border-box",
        }}
      >
        {/* Google AdSense container slot */}
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", height: "100%", minHeight: "280px" }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        
        {/* Fallback indicator */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.6,
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            Advertisement
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default AdBannerCard;
