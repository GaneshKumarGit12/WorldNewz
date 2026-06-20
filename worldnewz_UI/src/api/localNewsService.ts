import axios from "axios";
import type { Article } from "../types";

const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY || "f6dca38320ca277194f33d5269c40137";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

// Supported country list from GNews documentation
export const SUPPORTED_COUNTRIES = [
  { code: "in", name: "India" },
  { code: "us", name: "United States" },
  { code: "gb", name: "United Kingdom" },
  { code: "ca", name: "Canada" },
  { code: "au", name: "Australia" },
  { code: "sg", name: "Singapore" },
  { code: "pk", name: "Pakistan" },
  { code: "nz", name: "New Zealand" },
  { code: "ie", name: "Ireland" },
  { code: "hk", name: "Hong Kong" },
  { code: "ph", name: "Philippines" },
  { code: "fr", name: "France" },
  { code: "de", name: "Germany" },
  { code: "jp", name: "Japan" }
];

/**
 * Detects the user's country code using free IP geolocation services.
 * Caches the result in localStorage to optimize performance and prevent repeated hits.
 */
export async function detectCountryCode(): Promise<string> {
  const cached = localStorage.getItem("worldnewz_country_code");
  if (cached) {
    const cleanCached = cached.trim().toLowerCase();
    if (SUPPORTED_COUNTRIES.some(c => c.code === cleanCached)) {
      return cleanCached;
    }
  }

  // 1. Try ipapi.co
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (res.ok) {
      const data = await res.json();
      if (data.country_code) {
        const code = data.country_code.toLowerCase();
        if (SUPPORTED_COUNTRIES.some(c => c.code === code)) {
          localStorage.setItem("worldnewz_country_code", code);
          return code;
        }
      }
    }
  } catch (err) {
    console.warn("ipapi.co geolocation lookup failed:", err);
  }

  // 2. Try ipinfo.io as fallback
  try {
    const res = await fetch("https://ipinfo.io/json");
    if (res.ok) {
      const data = await res.json();
      if (data.country) {
        const code = data.country.toLowerCase();
        if (SUPPORTED_COUNTRIES.some(c => c.code === code)) {
          localStorage.setItem("worldnewz_country_code", code);
          return code;
        }
      }
    }
  } catch (err) {
    console.warn("ipinfo.io geolocation lookup failed:", err);
  }

  // Default fallback is India ('in')
  return "in";
}

/**
 * Helper to get cached data from sessionStorage.
 */
function getCachedData<T>(key: string): T | null {
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp < CACHE_TTL) {
      return parsed.data as T;
    }
    // Expired
    sessionStorage.removeItem(key);
  } catch (e) {
    console.error("Error reading cache from sessionStorage", e);
  }
  return null;
}

/**
 * Helper to write data to sessionStorage cache.
 */
function setCachedData<T>(key: string, data: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error("Error writing cache to sessionStorage", e);
  }
}

/**
 * Maps GNews API articles into the application's Article model.
 */
function mapGNewsArticles(gnewsArticles: any[]): Article[] {
  if (!Array.isArray(gnewsArticles)) return [];
  return gnewsArticles.map((a: any) => ({
    title: a.title,
    description: a.description || "",
    summary: a.description || "",
    url: a.url,
    imageUrl: a.image || "",
    urlToImage: a.image || "",
    publishedAt: a.publishedAt,
    source: typeof a.source === "string" ? a.source : (a.source?.name || "News"),
    category: "Local News",
    verified: true // Mark as verified for premium badge overlay
  }));
}

/**
 * Fetches Top Headlines for a given country code from GNews.
 */
export async function fetchTopHeadlines(country: string): Promise<Article[]> {
  const cacheKey = `gnews_headlines_${country}`;
  const cached = getCachedData<Article[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get("https://gnews.io/api/v4/top-headlines", {
      params: {
        category: "general",
        lang: "en",
        country: country,
        max: 10,
        apikey: GNEWS_API_KEY
      }
    });

    const articles = mapGNewsArticles(response.data?.articles || []);
    setCachedData(cacheKey, articles);
    return articles;
  } catch (err: any) {
    console.error("Error fetching top headlines from GNews API:", err);
    const errorMessage = err.response?.data?.errors?.[0] || err.message || "Failed to load top headlines.";
    throw new Error(errorMessage);
  }
}

/**
 * Fetches More Local News (National Category) for a given country code from GNews.
 */
export async function fetchMoreLocalNews(country: string, page: number = 1): Promise<Article[]> {
  const cacheKey = `gnews_more_${country}_page_${page}`;
  const cached = getCachedData<Article[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get("https://gnews.io/api/v4/top-headlines", {
      params: {
        category: "nation",
        lang: "en",
        country: country,
        max: 9, // Grid friendly layout sizing
        page: page,
        apikey: GNEWS_API_KEY
      }
    });

    const articles = mapGNewsArticles(response.data?.articles || []);
    setCachedData(cacheKey, articles);
    return articles;
  } catch (err: any) {
    console.error("Error fetching more local news from GNews API:", err);
    const errorMessage = err.response?.data?.errors?.[0] || err.message || "Failed to load more local news.";
    throw new Error(errorMessage);
  }
}
