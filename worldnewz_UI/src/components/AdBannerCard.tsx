import React from "react";
import { Card, Box } from "@mui/material";

const AdBannerCard: React.FC = () => {
  // We construct an isolated document inside the iframe that loads the Monetag banner script
  const iframeSrcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            background: transparent;
          }
        </style>
      </head>
      <body>
        <script>
          (function(s){
            s.dataset.zone='11275370';
            s.src='https://nap5k.com/tag.min.js';
          })([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')));
        </script>
      </body>
    </html>
  `;

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

      {/* Ad Iframe container */}
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        <iframe
          srcDoc={iframeSrcDoc}
          title="Monetag Ad Banner"
          width="100%"
          height="100%"
          style={{
            border: "none",
            borderRadius: "6px",
            overflow: "hidden",
            backgroundColor: "transparent",
          }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </Box>
    </Card>
  );
};

export default AdBannerCard;
