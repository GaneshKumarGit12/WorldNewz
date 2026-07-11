import React, { useEffect, useState, useRef } from "react";
import { Box } from "@mui/material";

interface AdCardProps {
  placement?: string;
  index?: number;
}

const AdCard: React.FC<AdCardProps> = ({ placement = "between-articles" }) => {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [adsterraFailed, setAdsterraFailed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const adElementRef = useRef<HTMLDivElement>(null);

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

      // Create a same-origin iframe to load Adsterra in an isolated context using srcdoc
      const iframe = document.createElement("iframe");
      iframe.width = "728";
      iframe.height = "90";
      iframe.style.border = "none";
      iframe.style.overflow = "hidden";
      iframe.scrolling = "no";
      iframe.id = "adsterra-frame";

      const adsterraHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
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
              #ad-container {
                width: 728px;
                height: 90px;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
              }
            </style>
          </head>
          <body>
            <div id="ad-container">
              <script data-cfasync="false" type="text/javascript">
                window.atOptions = {
                  'key' : 'bf9bede62cc1cd83c4fad46360bd114e',
                  'format' : 'iframe',
                  'height' : 90,
                  'width' : 728,
                  'params' : {}
                };
              </script>
              <script data-cfasync="false" type="text/javascript" src="https://www.highperformanceformat.com/bf9bede62cc1cd83c4fad46360bd114e/invoke.js"></script>
            </div>
          </body>
        </html>
      `;

      iframe.srcdoc = adsterraHtml;
      adElementRef.current.appendChild(iframe);

      // Verify if the ad successfully loaded or was blocked inside the iframe
      const checkTimeout = setTimeout(() => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          const adContainer = iframeDoc?.getElementById("ad-container");
          // Adsterra's invoke.js dynamically builds an iframe inside the container
          const hasInnerIframe = adContainer?.querySelector("iframe") !== null;
          if (!hasInnerIframe) {
            setAdsterraFailed(true);
          }
        } catch (e) {
          // If cross-origin or security restrictions block access, default to fallback
          setAdsterraFailed(true);
        }
      }, 8000);

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

  // Otherwise, return null (do not display any generic sponsored cards or fallbacks)
  return null;
};

export default AdCard;
