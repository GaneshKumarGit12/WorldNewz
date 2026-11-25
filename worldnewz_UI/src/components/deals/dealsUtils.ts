import { useState, useEffect, useCallback, useMemo } from "react";
import type { AmazonProduct } from "../../api/apiClient";

export const SITE_URL = "https://worldnewzs.in";
export const AFFILIATE_TAG = "ganeshd12-21";

export interface StorefrontCategoryDef {
  key: string;
  label: string;
  shortLabel: string;
}

export const STOREFRONT_CATEGORIES: StorefrontCategoryDef[] = [
  { key: "All", label: "All Deals", shortLabel: "All" },
  { key: "Electronics", label: "Electronics & Tech", shortLabel: "Electronics" },
  { key: "Home & Kitchen", label: "Home & Kitchen", shortLabel: "Home & Kitchen" },
  { key: "Fashion & Lifestyle", label: "Fashion & Lifestyle", shortLabel: "Fashion" },
  { key: "Beauty & Health", label: "Beauty & Health", shortLabel: "Beauty & Health" },
  { key: "Sports & Outdoors", label: "Sports & Outdoors", shortLabel: "Sports" },
  { key: "Grocery & Daily Needs", label: "Grocery & Toys", shortLabel: "Grocery & Toys" },
  { key: "Essentials & More", label: "Office, Books & More", shortLabel: "Office & More" },
];

export type ImageSizePreset = "thumb" | "card" | "hero";

/**
 * Transforms Amazon CDN image URLs to an appropriate resolution for the slot
 * (_SL200_ for thumbnails, _SL500_ for cards, _SL1500_ for hero/quick-view zoom).
 */
export function getResponsiveAmazonImage(url?: string | null, preset: ImageSizePreset = "card"): string {
  if (!url || !url.trim()) {
    return getBrandedCategoryPlaceholder("Deals");
  }
  const trimmed = url.trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("/images/")) {
    return trimmed;
  }

  const targetToken = preset === "thumb" ? "_SL200_" : preset === "hero" ? "_SL1500_" : "_SL500_";

  if (/m\.media-amazon\.com\/images\/I\//i.test(trimmed) || /images-eu\.ssl-images-amazon\.com\/images\/I\//i.test(trimmed)) {
    if (/\._[A-Za-z0-9_,-]+_\.(jpg|jpeg|png|webp)$/i.test(trimmed)) {
      return trimmed.replace(/\._[A-Za-z0-9_,-]+_(\.(jpg|jpeg|png|webp))$/i, `.${targetToken}$1`);
    }
    if (/\.(jpg|jpeg|png|webp)$/i.test(trimmed)) {
      return trimmed.replace(/\.(jpg|jpeg|png|webp)$/i, `.${targetToken}.$1`);
    }
  }

  return trimmed;
}

/**
 * Clean branded inline SVG placeholder used if a product image fails to load.
 * Never substitutes another unrelated product photo.
 */
export function getBrandedCategoryPlaceholder(category = "Amazon Deal"): string {
  const safeLabel = (category || "Amazon Deal").replace(/[<>&"']/g, "").slice(0, 22).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#f1f5f9"/>
    <rect x="24" y="24" width="352" height="252" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
    <circle cx="200" cy="126" r="32" fill="#fef2f2" stroke="#e02b20" stroke-width="2"/>
    <path d="M188 122h24l-2 16h-20z" fill="none" stroke="#e02b20" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M194 122v-5a6 6 0 0 1 12 0v5" fill="none" stroke="#e02b20" stroke-width="2.2" stroke-linecap="round"/>
    <text x="200" y="186" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="700" fill="#0f172a" letter-spacing="1.4">${safeLabel}</text>
    <text x="200" y="206" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="11" fill="#64748b">WorldNewzs Verified Deal</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Strictly returns verified discount percent ONLY when originalPrice > price > 0.
 * Returns null otherwise — never fabricates a discount or renders "0% OFF".
 */
export function getVerifiedDiscountPercent(price?: number, originalPrice?: number): number | null {
  if (!price || !originalPrice || price <= 0 || originalPrice <= price) {
    return null;
  }
  const pct = Math.round(((originalPrice - price) / originalPrice) * 100);
  if (pct <= 0) return null;
  return Math.min(pct, 95);
}

/**
 * Strictly returns verified savings amount in INR ONLY when originalPrice > price > 0.
 */
export function getVerifiedSavingsAmount(price?: number, originalPrice?: number): number {
  if (!price || !originalPrice || price <= 0 || originalPrice <= price) {
    return 0;
  }
  return Math.round((originalPrice - price) * 100) / 100;
}

export function formatINR(val?: number | null): string {
  if (val == null || Number.isNaN(val) || val <= 0) return "Check Price";
  if (val % 1 !== 0) {
    return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${val.toLocaleString("en-IN")}`;
}

export function getAffiliateUrl(product?: Partial<AmazonProduct> | null): string {
  if (!product) return `${SITE_URL}/amazon-products`;
  const asin = (product.asin || "").trim().toUpperCase();
  const rawUrl = (product.productUrl || "").trim();

  if (rawUrl && rawUrl.includes(`tag=${AFFILIATE_TAG}`) && !rawUrl.includes("amzn.to")) {
    return rawUrl;
  }
  if (asin && /^[A-Z0-9]{10}$/i.test(asin)) {
    return `https://www.amazon.in/dp/${asin}?tag=${AFFILIATE_TAG}&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl`;
  }
  return rawUrl || `${SITE_URL}/amazon-products`;
}

export function formatCategoryLabel(category = ""): string {
  const cat = category.trim();
  if (!cat) return "Verified Deal";
  const lower = cat.toLowerCase();
  if (lower.includes("electronic") || lower === "technology") return "Tech & Electronics";
  if (lower.includes("kitchen") || lower.includes("home")) return "Home & Kitchen";
  if (lower.includes("fashion")) return "Fashion";
  if (lower.includes("beauty")) return "Beauty & Care";
  if (lower.includes("health") || lower.includes("fitness")) return "Health & Fitness";
  if (lower.includes("grocery") || lower.includes("gourmet")) return "Grocery & Foods";
  if (lower.includes("toy")) return "Toys & Games";
  return cat;
}

const KNOWN_BRANDS = [
  "ANNI DESIGNER", "AMERICAN CREW", "VAN HEUSEN", "ALLEN SOLLY", "PETER ENGLAND",
  "U.S. POLO ASSN.", "U.S. POLO ASSN", "LEVI'S", "LOUIS PHILIPPE", "LONDON HILLS",
  "JBL", "BOAT", "SONY", "APPLE", "SAMSUNG", "ONEPLUS", "NOISE", "BOULT", "REALME",
  "XIAOMI", "REDMI", "VIVO", "OPPO", "IQOO", "PHILIPS", "BAJAJ", "PIGEON", "PRESTIGE",
  "MILTON", "CELLO", "PUMA", "ADIDAS", "NIKE", "REEBOK", "RED TAPE", "CAMPUS", "SPARX",
  "BATA", "WOODLAND", "FASTRACK", "TITAN", "CASIO", "TIMEX", "FOSSIL", "FIRE-BOLTT",
  "AMAZFIT", "ZEBRONICS", "PORTRONICS", "SANDISK", "HP", "DELL", "LENOVO", "ACER", "ASUS",
  "JOCKEY", "RAYMOND", "ARROW", "PARKER", "BOROSIL", "HAWKINS", "HAVELLS", "CROMPTON",
  "LAKME", "L'OREAL", "NIVEA", "MINIMALIST", "DOT & KEY", "MAMA EARTH", "MAMAEARTH",
  "PLUM", "CETAPHIL", "GARNIER", "MAYBELLINE", "HIMALAYA", "DABUR", "TATA", "NESTLE",
];

export function parseBrandAndTitle(rawTitle = "", category = ""): { brand: string; cleanTitle: string } {
  const trimmed = (rawTitle || "").trim();
  if (!trimmed) {
    return { brand: formatCategoryLabel(category).toUpperCase(), cleanTitle: "Amazon Verified Deal" };
  }

  for (const kb of KNOWN_BRANDS) {
    const escaped = kb.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^${escaped}\\b[:\\-\\s.,|]*`, "i");
    if (regex.test(trimmed)) {
      const rest = trimmed.replace(regex, "").replace(/^[:\-\s.,|]+/, "").trim();
      return { brand: kb.toUpperCase(), cleanTitle: rest || trimmed };
    }
  }

  const firstWord = trimmed.split(/\s+/)[0];
  const genericWords = new Set(["THE", "NEW", "ALL", "SET", "PACK", "BEST", "TOP", "MEN", "WOMEN", "MEN'S", "WOMEN'S", "BUY", "COMBO", "COTTON", "PREMIUM"]);
  if (firstWord && firstWord.length >= 2 && firstWord.length <= 14 && !genericWords.has(firstWord.toUpperCase())) {
    return { brand: firstWord.toUpperCase(), cleanTitle: trimmed };
  }

  return { brand: formatCategoryLabel(category).toUpperCase(), cleanTitle: trimmed };
}

const SAVED_DEALS_STORAGE_KEY = "wn_saved_amazon_deals_v2";

export function useSavedDeals() {
  const [savedDeals, setSavedDeals] = useState<AmazonProduct[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_DEALS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SAVED_DEALS_STORAGE_KEY) {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : [];
          if (Array.isArray(parsed)) setSavedDeals(parsed);
        } catch {
          // ignore malformed storage value
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: AmazonProduct[]) => {
    try {
      localStorage.setItem(SAVED_DEALS_STORAGE_KEY, JSON.stringify(next.slice(0, 60)));
    } catch {
      // ignore quota/privacy errors
    }
  }, []);

  const toggleSave = useCallback(
    (product: AmazonProduct) => {
      setSavedDeals((prev) => {
        const exists = prev.some((item) => item.asin === product.asin);
        const next = exists
          ? prev.filter((item) => item.asin !== product.asin)
          : [product, ...prev.filter((item) => item.asin !== product.asin)].slice(0, 60);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const removeSaved = useCallback(
    (asin: string) => {
      setSavedDeals((prev) => {
        const next = prev.filter((item) => item.asin !== asin);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clearSaved = useCallback(() => {
    setSavedDeals([]);
    persist([]);
  }, [persist]);

  const savedAsinSet = useMemo(() => new Set(savedDeals.map((d) => d.asin)), [savedDeals]);
  const isSaved = useCallback((asin: string) => savedAsinSet.has(asin), [savedAsinSet]);

  return { savedDeals, toggleSave, removeSaved, clearSaved, isSaved };
}
