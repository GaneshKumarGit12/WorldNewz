/**
 * Simple string hash function to generate a deterministic integer seed from text.
 */
const hashString = (str: string): number => {
  let hash = 0;
  if (!str) return 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
};

export const CATEGORY_IMAGE_POOLS: Record<string, string[]> = {
  technology: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80",
  ],
  business: [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1542744094-3a31727223ec?auto=format&fit=crop&w=800&q=80",
  ],
  science: [
    "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80",
  ],
  sports: [
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80",
  ],
  entertainment: [
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80",
  ],
  general: [
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1476242906366-d816472b67ed?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?auto=format&fit=crop&w=800&q=80",
  ]
};

/**
 * Returns a high-resolution, curated Unsplash editorial image matching the article's category or title keywords.
 * Uses deterministic string hashing so each article gets a unique photo from the multi-image pool.
 */
export const getCategoryFallbackImage = (
  category?: string, 
  articleTitle?: string,
  indexOffset: number = 0
): string => {
  const cat = (category || "").toLowerCase();
  const title = (articleTitle || "").toLowerCase();

  let pool = CATEGORY_IMAGE_POOLS.general;

  if (cat.includes("tech") || title.includes("ai") || title.includes("robot") || title.includes("chip") || title.includes("software") || title.includes("tech")) {
    pool = CATEGORY_IMAGE_POOLS.technology;
  } else if (cat.includes("busin") || cat.includes("econ") || cat.includes("money") || title.includes("market") || title.includes("stock") || title.includes("bank") || title.includes("ceo")) {
    pool = CATEGORY_IMAGE_POOLS.business;
  } else if (cat.includes("scien") || cat.includes("health") || cat.includes("med") || title.includes("health") || title.includes("doctor") || title.includes("space") || title.includes("nasa")) {
    pool = CATEGORY_IMAGE_POOLS.science;
  } else if (cat.includes("sport") || title.includes("match") || title.includes("game") || title.includes("cup") || title.includes("league") || title.includes("cricket") || title.includes("football")) {
    pool = CATEGORY_IMAGE_POOLS.sports;
  } else if (cat.includes("enter") || cat.includes("movie") || cat.includes("music") || title.includes("film") || title.includes("actor") || title.includes("cinema")) {
    pool = CATEGORY_IMAGE_POOLS.entertainment;
  }

  const seed = title ? hashString(title) + indexOffset : indexOffset;
  const selectedIndex = seed % pool.length;
  return pool[selectedIndex];
};

/**
 * Optimizes an image URL by proxying it through the global Cloudflare-backed images.weserv.nl service.
 * Resizes images to layout dimensions and falls back to curated Unsplash editorial photos if empty.
 */
export const optimizeImageUrl = (
  url: string | undefined | null, 
  width: number = 600,
  category?: string,
  articleTitle?: string,
  indexOffset: number = 0
): string => {
  if (!url || url === "null" || url.trim() === "") {
    return getCategoryFallbackImage(category, articleTitle, indexOffset);
  }

  const trimmedUrl = url.trim();

  // Don't proxy local assets, SVGs, or data URIs
  if (
    trimmedUrl.startsWith("/") || 
    trimmedUrl.startsWith("data:") || 
    trimmedUrl.includes(".svg")
  ) {
    return trimmedUrl;
  }

  // Detect deprecated or broken Unsplash dynamic endpoints and return curated photo
  if (
    trimmedUrl.includes("images.unsplash.com/featured") ||
    trimmedUrl.includes("source.unsplash.com") ||
    trimmedUrl.includes("images.unsplash.com/?") ||
    trimmedUrl.includes("example.com")
  ) {
    return getCategoryFallbackImage(category, articleTitle, indexOffset);
  }

  // Valid Unsplash direct photo URLs already support native resizing
  if (trimmedUrl.includes("images.unsplash.com/photo-")) {
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

  // Proxy third-party external images using images.weserv.nl with fallback fallback
  try {
    const encodedUrl = encodeURIComponent(trimmedUrl);
    return `https://images.weserv.nl/?url=${encodedUrl}&w=${width}&output=webp&q=75&il`;
  } catch (e) {
    console.error("[imageOptimizer] Error encoding image URL:", e);
    return trimmedUrl;
  }
};
