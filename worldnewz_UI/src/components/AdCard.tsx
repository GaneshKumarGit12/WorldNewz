import React, { useEffect, useState, useRef } from "react";
import { Box } from "@mui/material";

interface AdCardProps {
  placement?: string;
  index?: number;
}

const AdCard: React.FC<AdCardProps> = ({ placement = "between-articles", index = 0 }) => {
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

  // Dynamic React-style programmatic injection for Adsterra 728x90 Banner
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

      // Create a same-origin blank iframe to host the ad script context safely
      const iframe = document.createElement("iframe");
      iframe.width = "728";
      iframe.height = "90";
      iframe.style.border = "none";
      iframe.style.overflow = "hidden";
      iframe.scrolling = "no";
      // Generate a unique frame ID to avoid collision across multiple widgets
      const uniqueId = `${index}-${Math.random().toString(36).substring(2, 9)}`;
      iframe.id = `adsterra-frame-${uniqueId}`;

      adElementRef.current.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        // Initialize the base HTML structure of the blank iframe
        iframeDoc.open();
        iframeDoc.write(`
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
                #ad-wrapper {
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
              <div id="ad-wrapper"></div>
            </body>
          </html>
        `);
        iframeDoc.close();

        // Inject the configuration onto the iframe's global window scope
        const iframeWindow = iframe.contentWindow as any;
        if (iframeWindow) {
          iframeWindow.atOptions = {
            'key' : 'bf9bede62cc1cd83c4fad46360bd114e',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        }

        const adWrapper = iframeDoc.getElementById("ad-wrapper");
        if (adWrapper) {
          // Create the matching container element that invoke.js requires
          const innerContainer = iframeDoc.createElement("div");
          innerContainer.id = "container-bf9bede62cc1cd83c4fad46360bd114e";
          adWrapper.appendChild(innerContainer);

          // Create the script tag dynamically to fetch invoke.js
          const script = iframeDoc.createElement("script");
          script.type = "text/javascript";
          // Use the user's specific script URL
          script.src = "https://servicessitclaims.com/bf9bede62cc1cd83c4fad46360bd114e/invoke.js";
          script.setAttribute("data-cfasync", "false");
          adWrapper.appendChild(script);
        }
      }

      // Verify if the ad successfully loaded or was blocked inside the iframe
      const checkTimeout = setTimeout(() => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          const adContainer = iframeDoc?.getElementById("container-bf9bede62cc1cd83c4fad46360bd114e");
          // Adsterra's invoke.js dynamically builds an iframe inside the container
          const hasInnerIframe = adContainer?.querySelector("iframe") !== null;
          if (!hasInnerIframe) {
            setAdsterraFailed(true);
          }
        } catch (e) {
          setAdsterraFailed(true);
        }
      }, 8000);

      return () => clearTimeout(checkTimeout);
    }
  }, [placement, isMobile, isVisible, index]);

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
