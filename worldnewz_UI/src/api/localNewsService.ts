import { apiClient } from "./apiClient";
import type { Article } from "../types";

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
 * Fetches Top Headlines for a given country code from backend proxy.
 */
export async function fetchTopHeadlines(country: string): Promise<Article[]> {
  try {
    const response = await apiClient.get("/news/gnews-headlines", {
      params: { country }
    });
    return response.data?.articles || [];
  } catch (err: any) {
    console.error("Error fetching top headlines from backend API:", err);
    const errorMessage = err.response?.data?.error || err.message || "Failed to load top headlines.";
    throw new Error(errorMessage);
  }
}

/**
 * Fetches More Local News for a given country code from backend proxy.
 */
export async function fetchMoreLocalNews(country: string, page: number = 1): Promise<Article[]> {
  try {
    const response = await apiClient.get("/news/gnews-more", {
      params: { country, page }
    });
    return response.data?.articles || [];
  } catch (err: any) {
    console.error("Error fetching more local news from backend API:", err);
    const errorMessage = err.response?.data?.error || err.message || "Failed to load more local news.";
    throw new Error(errorMessage);
  }
}
