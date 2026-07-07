import React, { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component:
 * Listens to location changes (pathname and search) and immediately scrolls the window
 * back to the top (0, 0). Ensures no page or news card transition leaves the viewport
 * scrolled down.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
