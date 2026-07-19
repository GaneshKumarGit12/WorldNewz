import React, { useEffect } from "react";
import { Card, Box, Typography, Button } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const AdBannerCard: React.FC = () => {
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
    // Render a stunning premium local sponsorship promo card instead of invalid AdSense requests
    return (
      <Card
        component="article"
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          minHeight: 350,
          bgcolor: (theme) => theme.palette.mode === "light" ? "#f8fafc" : "#1e222b",
          border: (theme) => `1px solid ${theme.palette.mode === "light" ? "#cbd5e1" : "rgba(255, 255, 255, 0.08)"}`,
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
          p: 3,
          justifyContent: "space-between",
          alignItems: "center",
          transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
          background: (theme) => theme.palette.mode === "light" 
            ? "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" 
            : "linear-gradient(135deg, #1e222b 0%, #15181f 100%)",
          "&:hover": {
            transform: "translateY(-3px)",
            borderColor: (theme) => theme.palette.mode === "light" ? "#94a3b8" : "rgba(255, 255, 255, 0.2)",
            boxShadow: (theme) => theme.palette.mode === "light" ? "0 8px 20px rgba(0,0,0,0.1)" : "0 8px 24px rgba(0,0,0,0.4)"
          }
        }}
      >
        <Box
          sx={{
            alignSelf: "flex-end",
            bgcolor: "rgba(200, 58, 21, 0.15)",
            color: "#c83a15",
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.8px",
          }}
        >
          SPONSORSHIP
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, my: "auto", textAlign: "center" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #c83a15 0%, #a12d10 100%)",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(200, 58, 21, 0.3)"
            }}
          >
            <EmailIcon sx={{ fontSize: 28 }} />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary", mt: 1 }}>
            WorldNewzs Premium
          </Typography>

          <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 280, lineHeight: 1.6 }}>
            Subscribe to our newsletter for curated digests, daily briefs, and ad-free summaries.
          </Typography>
        </Box>

        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          sx={{
            width: "100%",
            py: 1.2,
            borderRadius: 2,
            fontWeight: 700,
            background: "linear-gradient(135deg, #c83a15 0%, #a12d10 100%)",
            color: "#fff",
            textTransform: "none",
            boxShadow: "0 4px 12px rgba(200, 58, 21, 0.2)",
            "&:hover": {
              background: "linear-gradient(135deg, #a12d10 0%, #7e220b 100%)",
              boxShadow: "0 6px 16px rgba(200, 58, 21, 0.3)"
            }
          }}
          href="/newsletter-subscribe"
        >
          Subscribe Free
        </Button>
      </Card>
    );
  }

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
