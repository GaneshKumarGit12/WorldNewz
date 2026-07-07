/**
 * Optimizes an image URL by proxying it through the global Cloudflare-backed images.weserv.nl service.
 * This converts images to modern formats (WebP/AVIF), resizes them to the correct layout dimensions,
 * and caches them at the edge.
 * 
 * @param url The original image URL.
 * @param width The target width for the image. Defaults to 600px.
 * @returns The optimized image URL or the original if it cannot be optimized.
 */
export const optimizeImageUrl = (url: string | undefined | null, width: number = 600): string => {
  if (!url) {
    return "";
  }

  const trimmedUrl = url.trim();

  // Don't proxy local assets, SVGs, data URIs, or placeholders
  if (
    trimmedUrl.startsWith("/") || 
    trimmedUrl.startsWith("data:") || 
    trimmedUrl.includes(".svg") ||
    trimmedUrl.includes("via.placeholder.com") ||
    trimmedUrl.includes("placeholder")
  ) {
    return trimmedUrl;
  }

  // Unsplash already supports native parameters, keep them but adjust width if desired
  if (trimmedUrl.includes("images.unsplash.com")) {
    try {
      const urlObj = new URL(trimmedUrl);
      urlObj.searchParams.set("w", width.toString());
      urlObj.searchParams.set("auto", "format");
      urlObj.searchParams.set("q", "75");
      return urlObj.toString();
    } catch {
      return trimmedUrl;
    }
  }

  // Proxy third-party external images using images.weserv.nl
  // weserv.nl is a free, high-performance image proxy backed by Cloudflare's CDN.
  // - w: width
  // - output: format (webp)
  // - q: compression quality (75 is standard)
  // - il: progressive loading (interlaced)
  try {
    const encodedUrl = encodeURIComponent(trimmedUrl);
    return `https://images.weserv.nl/?url=${encodedUrl}&w=${width}&output=webp&q=75&il`;
  } catch (e) {
    console.error("[imageOptimizer] Error encoding image URL:", e);
    return trimmedUrl;
  }
};
