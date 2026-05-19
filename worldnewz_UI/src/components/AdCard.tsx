import React, { useEffect, useState, useRef } from "react";
import { Card, Box, Typography } from "@mui/material";
import { fetchAdByPlacement } from "../api/apiClient";

interface AdCardProps {
  placement?: string;
}

const AdCard: React.FC<AdCardProps> = ({ placement = "between-articles" }) => {
  const [adScript, setAdScript] = useState<string | null>(null);
  const [adBlocked, setAdBlocked] = useState(false);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Fetch the ad configuration from the backend
    fetchAdByPlacement(placement)
      .then((res) => {
        if (res.data && res.data.script) {
          setAdScript(res.data.script);
        } else {
          setAdBlocked(true);
        }
      })
      .catch((err) => {
        console.warn(`Failed to fetch ad for placement '${placement}', using fallback.`, err);
        // Fallback to local default script if API is unavailable
        setAdScript(
          `<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-7547748414764075" data-ad-slot="7829102931" data-ad-format="auto" data-ad-full-width-responsive="true"></ins>`
        );
      });
  }, [placement]);

  useEffect(() => {
    if (!adScript || initializedRef.current) return;

    // Check if google ads is loaded and not blocked
    const adsbygoogle = (window as any).adsbygoogle;
    
    // Give the DOM a tiny bit of time to render the injected html
    const timer = setTimeout(() => {
      try {
        if (adsbygoogle) {
          (adsbygoogle || []).push({});
          initializedRef.current = true;
        } else {
          // If adsbygoogle script is not on window (e.g. ad blocked)
          setAdBlocked(true);
        }
      } catch (e) {
        console.error("AdSense initialization error: ", e);
        setAdBlocked(true);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [adScript]);

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        minHeight: 320,
        p: 2,
        borderRadius: 2,
        boxShadow: "none",
        position: "relative",
        overflow: "hidden",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(22, 27, 34, 0.7) 0%, rgba(13, 17, 23, 0.95) 100%)"
            : "linear-gradient(135deg, rgba(240, 244, 255, 0.6) 0%, rgba(224, 231, 255, 0.9) 100%)",
        border: "1px dashed",
        borderColor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"),
      }}
    >
      {/* Dynamic background circles for premium aesthetics */}
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(25, 118, 210, 0.12) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -30,
          left: -30,
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(156, 39, 176, 0.08) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          zIndex: 1,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexGrow: 1,
        }}
      >
        {/* Ad Tag */}
        <Typography
          variant="caption"
          sx={{
            alignSelf: "flex-start",
            px: 1,
            py: 0.25,
            borderRadius: 0.5,
            backgroundColor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"),
            color: "text.secondary",
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Sponsored
        </Typography>

        {/* Ad Container */}
        <Box
          ref={adContainerRef}
          sx={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            my: 2,
            width: "100%",
            minHeight: 180,
          }}
        >
          {adBlocked ? (
            <Box sx={{ textAlign: "center", p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                Advertisement
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ display: "block", maxWidth: 200, mx: "auto" }}>
                Support our news team by keeping ads enabled.
              </Typography>
            </Box>
          ) : (
            adScript && (
              <div
                style={{ width: "100%", height: "100%" }}
                dangerouslySetInnerHTML={{ __html: adScript }}
              />
            )
          )}
        </Box>

        {/* Ad Footer */}
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ textAlign: "center", fontSize: "0.65rem", letterSpacing: 0.5 }}
        >
          Ads by Google
        </Typography>
      </Box>
    </Card>
  );
};

export default AdCard;
