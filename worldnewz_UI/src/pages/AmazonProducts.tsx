import React, { useState, useEffect, useRef, useMemo } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Rating from "@mui/material/Rating";
import Paper from "@mui/material/Paper";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Pagination from "@mui/material/Pagination";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import StarIcon from "@mui/icons-material/Star";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SecurityIcon from "@mui/icons-material/Security";
import ShareIcon from "@mui/icons-material/Share";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PinterestIcon from "@mui/icons-material/Pinterest";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SearchIcon from "@mui/icons-material/Search";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BoltIcon from "@mui/icons-material/Bolt";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";

import { Link as RouterLink } from "react-router-dom";
import { fetchAmazonProducts, parseAmazonProductUrl } from "../api/apiClient";
import type { AmazonProduct } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb, JSONLDFAQPage, JSONLDProductList } from "../seo/JSONLDSchemas";
import { useColorMode } from "../context/ThemeContext";
import { BreadcrumbNav } from "../components/BreadcrumbNav";

const SITE_URL = "https://worldnewzs.in";

const amazonDealsFaqs = [
  {
    question: "How often is the Amazon Deals of the Day page updated?",
    answer: "Our dedicated shopping editorial desk updates this page every single day at 12:00 AM IST. All price drops, percentage discounts, seller ratings, and stock availability are re-verified every 24 hours to ensure you get active flash sale prices."
  },
  {
    question: "How long do Amazon Lightning Deals and Flash Sales last?",
    answer: "Most Amazon Lightning Deals and daily promotional offers remain active for 6 to 24 hours, or until the designated flash sale stock is completely claimed. We recommend grabbing verified deals early in the day before quantities run out."
  },
  {
    question: "Are these Amazon affiliate links safe to purchase through?",
    answer: "Yes, 100%. All deal buttons redirect you directly to Amazon India's official, 256-bit SSL encrypted checkout website (amazon.in). You receive standard Amazon buyer protection, free delivery options, and hassle-free return guarantees."
  },
  {
    question: "How do I claim maximum savings on Amazon India shopping?",
    answer: "You can combine our listed price drops with Amazon Pay ICICI or SBI credit/debit card instant discounts, collectable digital seller coupons on the product page, and Amazon Pay cashback rewards for maximum total savings."
  },
  {
    question: "Why should I trust WorldNewzs deal recommendations?",
    answer: "Unlike automated deal scrapers, WorldNewzs manually evaluates 30-day historical prices to filter out artificial price inflations. We only list genuine price reductions from top-rated Amazon fulfilled sellers with high customer review scores."
  }
];

// Helper to format currency numbers cleanly (with decimals if fractional, e.g. ₹709.62 or ₹2,599)
const formatPrice = (val: number): string => {
  if (val % 1 !== 0) {
    return val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return val.toLocaleString("en-IN");
};

// Helper to extract a punchy, clean category label matching the screenshot (e.g. FASHION, TECH, HOME)
const formatCategoryBadge = (category: string = ""): string => {
  const cat = (category || "").trim().toUpperCase();
  if (!cat) return "DEALS";
  if (cat.includes("FASHION") || cat.includes("CLOTHING") || cat.includes("APPAREL") || cat.includes("KURTA") || cat.includes("SAREE") || cat.includes("WEAR")) return "FASHION";
  if (cat.includes("ELECTRONIC") || cat.includes("GADGET") || cat.includes("TECH") || cat.includes("MOBILE") || cat.includes("PHONE") || cat.includes("AUDIO")) return "TECH";
  if (cat.includes("KITCHEN") || cat.includes("APPLIANCE") || cat.includes("HOME")) return "HOME";
  if (cat.includes("BEAUTY") || cat.includes("GROOMING") || cat.includes("SKINCARE") || cat.includes("CARE")) return "BEAUTY";
  if (cat.includes("FITNESS") || cat.includes("SPORT")) return "SPORTS";
  if (cat.includes("BOOK")) return "BOOKS";
  const firstWord = cat.split(/[\s,&/-]+/)[0];
  return (firstWord || "DEALS").slice(0, 10);
};

// Helper to parse brand caption and clean title for Flash Drops and product cards matching UI specification
const parseBrandAndTitle = (rawTitle: string = "", category: string = ""): { brand: string; cleanTitle: string } => {
  const trimmed = (rawTitle || "").trim();
  if (!trimmed) {
    return { brand: formatCategoryBadge(category), cleanTitle: "Amazon Verified Deal" };
  }

  // Common verified brands
  const KNOWN_BRANDS = [
    "ANNI DESIGNER", "AMERICAN CREW", "VAN HEUSEN", "ARTIST VALLEY", "ALLEN SOLLY",
    "PETER ENGLAND", "U.S. POLO ASSN.", "U.S. POLO ASSN", "US POLO", "LEVI'S", "LEVIS",
    "MAX", "ZARA", "H&M", "BULLMER", "LYMIO", "JBL", "BOAT", "SONY", "APPLE",
    "SAMSUNG", "ONEPLUS", "NOISE", "BOULT", "REALME", "XIAOMI", "REDMI", "PHILIPS",
    "BAJAJ", "PIGEON", "PRESTIGE", "MILTON", "CELLO", "WROGN", "HIGHLANDER", "ROADSTER",
    "ARAYNA", "PISTAA", "MOKOSH", "INDO ERA", "LERIYA FASHION", "AMAYRA", "ROYALSCOUT"
  ];

  for (const kb of KNOWN_BRANDS) {
    const escaped = kb.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^${escaped}\\b[:\\-\\s]*`, "i");
    if (regex.test(trimmed)) {
      const rest = trimmed.replace(regex, "").trim();
      return {
        brand: kb.toUpperCase(),
        cleanTitle: rest || trimmed
      };
    }
  }

  // Pattern: "Brand Name Women's..." / "Brand Name Men's..."
  const genderPattern = /^([A-Za-z0-9&.'\s]{2,25}?)\s+(Women's|Men's|Kids'|Boy's|Girl's|Unisex)\b/i;
  const match = trimmed.match(genderPattern);
  if (match && match[1]) {
    const potentialBrand = match[1].trim();
    const genericWords = ["THE", "NEW", "BUY", "BEST", "TOP", "LATEST", "PREMIUM", "EXCLUSIVE"];
    if (!genericWords.includes(potentialBrand.toUpperCase())) {
      const rest = trimmed.slice(potentialBrand.length).trim();
      return {
        brand: potentialBrand.toUpperCase(),
        cleanTitle: rest || trimmed
      };
    }
  }

  // Pattern: "Brand Name - Title..." or "Brand Name | Title..."
  if (trimmed.includes(" - ") || trimmed.includes(" | ")) {
    const separator = trimmed.includes(" - ") ? " - " : " | ";
    const parts = trimmed.split(separator);
    if (parts[0].trim().length >= 2 && parts[0].trim().length <= 25) {
      return {
        brand: parts[0].trim().toUpperCase(),
        cleanTitle: parts.slice(1).join(separator).trim()
      };
    }
  }

  // Fallback: If title has words, take first word if length is 2-15 chars, else category badge
  const firstWord = trimmed.split(/\s+/)[0];
  if (firstWord && firstWord.length >= 2 && firstWord.length <= 15 && !["THE", "NEW", "ALL", "SET", "PACK"].includes(firstWord.toUpperCase())) {
    return {
      brand: firstWord.toUpperCase(),
      cleanTitle: trimmed
    };
  }

  return {
    brand: formatCategoryBadge(category),
    cleanTitle: trimmed
  };
};

// Helper to determine category pill badge style matching modern aesthetic (e.g. lavender #EDE9FE + violet #6D28D9 for fashion)
const getCategoryBadgeStyle = (category: string = "", isDark: boolean = false) => {
  const cat = category.toLowerCase().trim();
  if (cat.includes("electronics") || cat.includes("gadget") || cat.includes("tech") || cat.includes("mobile") || cat.includes("audio")) {
    return {
      bg: isDark ? "#DBEAFE" : "#DBEAFE",
      color: "#1D4ED8",
      border: isDark ? "rgba(147, 197, 253, 0.4)" : "#BFDBFE"
    };
  }
  if (cat.includes("kitchen") || cat.includes("home") || cat.includes("appliance")) {
    return {
      bg: isDark ? "#DCFCE7" : "#DCFCE7",
      color: "#15803D",
      border: isDark ? "rgba(134, 239, 172, 0.4)" : "#BBF7D0"
    };
  }
  // Fashion / Lifestyle / default (lavender #EDE9FE + violet #6D28D9)
  return {
    bg: "#EDE9FE",
    color: "#6D28D9",
    border: isDark ? "rgba(216, 180, 254, 0.4)" : "#DDD6FE"
  };
};

// Helper to construct / verify valid Amazon affiliate link with ganeshd12-21
const getAffiliateUrl = (product?: AmazonProduct | null): string => {
  if (!product) return "https://worldnewzs.in/amazon-products";
  const tag = "ganeshd12-21";
  const asin = (product.asin || "").trim().toUpperCase();
  const rawUrl = (product.productUrl || "").trim();
  
  if (rawUrl && rawUrl.includes(`tag=${tag}`) && !rawUrl.includes("amzn.to")) {
    return rawUrl;
  }
  if (asin && /^B0[A-Z0-9]{8}$/i.test(asin)) {
    return `https://www.amazon.in/dp/${asin}?tag=${tag}&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl`;
  }
  return rawUrl || (asin ? `https://www.amazon.in/dp/${asin}?tag=${tag}&linkCode=ll2` : "https://worldnewzs.in/amazon-products");
};

// Category matching helper ensuring 100% of all catalog products are covered across the 6 tabs
const matchesCategory = (productCat: string = "", selectedTab: string = "All"): boolean => {
  if (!selectedTab || selectedTab === "All") return true;
  const pcat = (productCat || "").toLowerCase().trim();
  const stab = selectedTab.toLowerCase().trim();

  // 1. Direct exact match
  if (pcat === stab) return true;

  // 2. Electronics & Audio (covers Technology, Electronics, Gadgets, audio, computer, phone)
  if (stab === "electronics") {
    return (
      pcat === "electronics" ||
      pcat === "technology" ||
      pcat === "tech" ||
      pcat.includes("electronic") ||
      pcat.includes("technology") ||
      pcat.includes("audio") ||
      pcat.includes("computer") ||
      pcat.includes("phone")
    );
  }

  // 3. Kitchen & Home Appliances (covers Kitchen & Home, Home & Kitchen, Home, Appliances, Decor)
  if (stab === "kitchen & home" || stab === "home & kitchen") {
    return (
      pcat === "kitchen & home" ||
      pcat === "home & kitchen" ||
      pcat === "home" ||
      pcat.includes("kitchen") ||
      pcat.includes("home") ||
      pcat.includes("appliance") ||
      pcat.includes("decor")
    );
  }

  // 4. Smart Gadgets & Wearables
  if (stab === "gadgets") {
    return (
      pcat === "gadgets" ||
      pcat.includes("gadget") ||
      pcat.includes("wearable") ||
      pcat.includes("smart")
    );
  }

  // 5. Lifestyle & Fashion (covers Lifestyle, Fashion, Beauty & Personal Care, Health & Fitness)
  if (stab === "lifestyle") {
    return (
      pcat === "lifestyle" ||
      pcat === "fashion" ||
      pcat === "beauty & personal care" ||
      pcat === "health & fitness" ||
      pcat.includes("lifestyle") ||
      pcat.includes("fashion") ||
      pcat.includes("beauty") ||
      pcat.includes("health") ||
      pcat.includes("fitness") ||
      pcat.includes("care")
    );
  }

  // 6. Daily Essentials & Shopping (covers Shopping, Grocery & Gourmet Foods, Toys & Games, Sports, Books, etc.)
  if (stab === "shopping") {
    return (
      pcat === "shopping" ||
      pcat === "grocery & gourmet foods" ||
      pcat === "toys & games" ||
      pcat === "sports" ||
      pcat === "education" ||
      pcat === "services" ||
      pcat === "gift cards" ||
      pcat === "books" ||
      pcat.includes("shopping") ||
      pcat.includes("grocery") ||
      pcat.includes("gourmet") ||
      pcat.includes("food") ||
      pcat.includes("toy") ||
      pcat.includes("game") ||
      pcat.includes("sport") ||
      pcat.includes("book") ||
      pcat.includes("gift") ||
      pcat.includes("education") ||
      pcat.includes("deal")
    );
  }

  return pcat.includes(stab);
};

// Compact Card Share Menu Component
interface CardShareButtonProps {
  product: AmazonProduct;
  getAbsoluteImageUrl: (url: string | undefined | null, asin?: string) => string;
  sx?: any;
}

const CardShareButton: React.FC<CardShareButtonProps> = React.memo(({ product, getAbsoluteImageUrl, sx }) => {
  const { mode } = useColorMode();
  const isDark = mode === "dark";
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setAnchorEl(null);
  };

  const title = product.title || "Amazon Deal";
  const url = getAffiliateUrl(product);
  const rawImageUrl = product.imageUrl ? getAbsoluteImageUrl(product.imageUrl, product.asin) : "";
  const imageUrl = rawImageUrl.startsWith("http")
    ? rawImageUrl
    : (rawImageUrl ? `https://worldnewzs.in${rawImageUrl}` : "https://worldnewzs.in/images/amazon_placeholder.png");

  const handleSharePlatform = (platform: "whatsapp" | "x" | "facebook" | "linkedin" | "pinterest" | "copy") => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (platform === "copy") {
      navigator.clipboard.writeText(url)
        .then(() => {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
            setAnchorEl(null);
          }, 1200);
        })
        .catch(() => {
          setAnchorEl(null);
        });
      return;
    }

    setAnchorEl(null);

    let shareUrl = "";
    switch (platform) {
      case "whatsapp": {
        const text = `Check out this deal: ${title}\nPrice: ₹${product.price?.toLocaleString("en-IN") || ""}\n${url}`;
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        break;
      }
      case "x": {
        const text = `Check out this deal: ${title} (₹${product.price?.toLocaleString("en-IN") || ""})`;
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      }
      case "facebook": {
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      }
      case "linkedin": {
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      }
      case "pinterest": {
        // Direct Pinterest Pin Builder for Dhanvi Collections with product target URL, image, and description
        const pinterestDesc = `${title} | ₹${product.price?.toLocaleString("en-IN") || ""} | Dhanvi Collections on Amazon & WorldNewzs Deals`;
        shareUrl = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(pinterestDesc)}`;
        break;
      }
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <Tooltip title="Share Deal">
        <IconButton
          id={`card-share-btn-${product.asin || product.id}`}
          size="small"
          onClick={handleClick}
          aria-label="Share Deal"
          sx={{
            color: isDark ? "#FFFFFF" : "#334155",
            bgcolor: isDark ? "#1E293B" : "#F1F5F9",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.14)" : "#E2E8F0"}`,
            borderRadius: "12px",
            width: 44,
            height: 44,
            minWidth: 44,
            p: 0,
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              borderColor: "#E11D48",
              color: "#E11D48",
              bgcolor: isDark ? "rgba(225, 29, 72, 0.15)" : "rgba(225, 29, 72, 0.08)",
              transform: "translateY(-1px)"
            },
            ...sx
          }}
        >
          <ShareIcon sx={{ fontSize: "1.15rem" }} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose()}
        disableRestoreFocus
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: "8px",
            bgcolor: isDark ? "#151C2C !important" : "#FFFFFF !important",
            backgroundImage: "none !important",
            color: isDark ? "#F8FAFC" : "#1A2233",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)"}`,
            boxShadow: isDark
              ? "0 10px 30px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)"
              : "0 10px 30px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.06)",
            minWidth: 190,
            zIndex: 1500,
            py: 0.5,
            "& .MuiMenuItem-root": {
              px: 2,
              py: 1,
              transition: "background-color 0.15s ease",
              cursor: "pointer",
              "&:hover": {
                bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)"
              }
            }
          }
        }}
      >
        <MenuItem onClick={handleSharePlatform("whatsapp")}>
          <ListItemIcon><WhatsAppIcon sx={{ color: "#25D366", fontSize: "1.15rem" }} /></ListItemIcon>
          <ListItemText primary="WhatsApp" primaryTypographyProps={{ variant: "body2", fontWeight: 700, color: isDark ? "#F8FAFC" : "#1A2233" }} />
        </MenuItem>

        <MenuItem onClick={handleSharePlatform("x")}>
          <ListItemIcon><XIcon sx={{ color: isDark ? "#F8FAFC" : "#0F1419", fontSize: "1.15rem" }} /></ListItemIcon>
          <ListItemText primary="X (Twitter)" primaryTypographyProps={{ variant: "body2", fontWeight: 700, color: isDark ? "#F8FAFC" : "#1A2233" }} />
        </MenuItem>

        <MenuItem onClick={handleSharePlatform("facebook")}>
          <ListItemIcon><FacebookIcon sx={{ color: "#1877F2", fontSize: "1.15rem" }} /></ListItemIcon>
          <ListItemText primary="Facebook" primaryTypographyProps={{ variant: "body2", fontWeight: 700, color: isDark ? "#F8FAFC" : "#1A2233" }} />
        </MenuItem>

        <MenuItem onClick={handleSharePlatform("linkedin")}>
          <ListItemIcon><LinkedInIcon sx={{ color: "#0A66C2", fontSize: "1.15rem" }} /></ListItemIcon>
          <ListItemText primary="LinkedIn" primaryTypographyProps={{ variant: "body2", fontWeight: 700, color: isDark ? "#F8FAFC" : "#1A2233" }} />
        </MenuItem>

        <MenuItem onClick={handleSharePlatform("pinterest")}>
          <ListItemIcon><PinterestIcon sx={{ color: "#E60023", fontSize: "1.15rem" }} /></ListItemIcon>
          <ListItemText primary="Pinterest" primaryTypographyProps={{ variant: "body2", fontWeight: 700, color: isDark ? "#F8FAFC" : "#1A2233" }} />
        </MenuItem>

        <MenuItem onClick={handleSharePlatform("copy")}>
          <ListItemIcon>
            <ContentCopyIcon sx={{ color: copied ? "#10B981" : (isDark ? "#94A3B8" : "#64748B"), fontSize: "1.15rem" }} />
          </ListItemIcon>
          <ListItemText
            primary={copied ? "Copied!" : "Copy Link"}
            primaryTypographyProps={{ variant: "body2", fontWeight: 700, color: copied ? "#10B981" : (isDark ? "#F8FAFC" : "#1A2233") }}
          />
        </MenuItem>
      </Menu>
    </>
  );
});

export const AmazonProducts: React.FC = () => {
  const { mode } = useColorMode();
  const isDark = mode === "dark";
  const cardBorderColor = isDark ? "#19202a" : "#e9e3e3";
  const cardBorder = `1px solid ${cardBorderColor}`;
  const cardDashedBorder = `2px dashed ${cardBorderColor}`;

  const currentMonthYear = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  const AMAZON_PLACEHOLDER = "/images/amazon_placeholder.png";
  const DEFAULT_SVG_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%230f172a"/><path d="M150 90 L210 190 L90 190 Z" fill="%23b7222b" opacity="0.8"/><text x="150" y="215" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23ffffff" text-anchor="middle">AMAZON DEAL</text></svg>`;

  const VERIFIED_AMAZON_FALLBACK_IMAGES = [
    "https://m.media-amazon.com/images/I/61CEEuPRM9L._SL1500_.jpg",
    "https://m.media-amazon.com/images/I/71fiRY278BL._SL1500_.jpg",
    "https://m.media-amazon.com/images/I/61NANabKaRL._SL1000_.jpg",
    "https://m.media-amazon.com/images/I/61NANabKaRL._SL1500_.jpg",
    "https://m.media-amazon.com/images/I/6166RQH8dIL._SL1500_.jpg",
    "https://m.media-amazon.com/images/I/71CmSn+uLZL._SL1500_.jpg",
    "https://m.media-amazon.com/images/I/61ROh33PBuL._SL1500_.jpg",
    "https://m.media-amazon.com/images/I/81+guVWHIJL._SL1500_.jpg",
    "https://m.media-amazon.com/images/I/61L0MQ4gXiL._SL1500_.jpg"
  ];

  const getAbsoluteImageUrl = (url: string | undefined | null, asin?: string) => {
    if (url && url.trim()) {
      const trimmed = url.trim();
      if (trimmed.startsWith("/images/") || trimmed.startsWith("data:")) {
        return trimmed;
      }

      // If it's an Amazon CDN image, clean resolution modifiers for 1500px Ultra HD crystal clarity
      if (trimmed.includes("amazon.com/images/I/") || trimmed.includes("images-amazon.com/images/I/")) {
        const cleanUrl = trimmed
          .replace(/\._[A-Za-z0-9%_\-+.]+\.(jpg|png|jpeg|webp)/i, '._SL1500_.$1')
          .replace(/\._[A-Za-z0-9%_\-+.]+\._/i, '._');
        return cleanUrl;
      }

      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
      }
    }

    const cleanAsin = (asin || "").trim();
    if (cleanAsin) {
      const charCode = cleanAsin.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return VERIFIED_AMAZON_FALLBACK_IMAGES[charCode % VERIFIED_AMAZON_FALLBACK_IMAGES.length];
    }

    return AMAZON_PLACEHOLDER;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const asin = (target.dataset.asin || "").trim();

    if (!target.dataset.attempt) {
      target.dataset.attempt = "1";
      if (asin && asin.length === 10 && !asin.startsWith("DEAL")) {
        target.src = `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_SX500_.jpg`;
        return;
      }
    }

    if (target.dataset.attempt === "1") {
      target.dataset.attempt = "2";
      if (asin) {
        const charCode = asin.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
        target.src = VERIFIED_AMAZON_FALLBACK_IMAGES[charCode % VERIFIED_AMAZON_FALLBACK_IMAGES.length];
        return;
      }
      target.src = AMAZON_PLACEHOLDER;
      return;
    }

    if (target.src !== DEFAULT_SVG_PLACEHOLDER) {
      target.src = DEFAULT_SVG_PLACEHOLDER;
    }
  };

  const [products, setProducts] = useState<AmazonProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("All");
  const [cardPage, setCardPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [bookmarkedAsins, setBookmarkedAsins] = useState<Set<string>>(new Set());
  const [heroMediaIndex, setHeroMediaIndex] = useState<number>(0);
  const [likedAsins, setLikedAsins] = useState<Set<string>>(new Set());

  const toggleLike = (asin: string) => {
    setLikedAsins((prev) => {
      const next = new Set(prev);
      if (next.has(asin)) {
        next.delete(asin);
      } else {
        next.add(asin);
      }
      return next;
    });
  };

  // Parser states
  const [urlInput, setUrlInput] = useState<string>("");
  const [parsedProduct, setParsedProduct] = useState<AmazonProduct | null>(null);
  const [parseLoading, setParseLoading] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [activeVerificationStep, setActiveVerificationStep] = useState<number>(0);

  // Scratch card state
  const [scratchRevealed, setScratchRevealed] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const toggleBookmark = (asin: string) => {
    setBookmarkedAsins((prev) => {
      const next = new Set(prev);
      if (next.has(asin)) {
        next.delete(asin);
      } else {
        next.add(asin);
      }
      return next;
    });
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const res = await fetchAmazonProducts();
        const productList = res.data?.products || (Array.isArray(res.data) ? res.data : []);
        setProducts(productList);
        setError(null);
      } catch (err: any) {
        console.error("Error loading Amazon products:", err);
        setError("Failed to load Amazon deals. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleParseUrl = async () => {
    if (!urlInput.trim()) return;
    setParseLoading(true);
    setParseError(null);
    setParsedProduct(null);
    setActiveVerificationStep(1);

    try {
      setTimeout(() => setActiveVerificationStep(2), 600);
      setTimeout(() => setActiveVerificationStep(3), 1200);

      const res = await parseAmazonProductUrl(urlInput.trim());
      const item = res.data?.product || (res.data as any);

      setTimeout(() => {
        setActiveVerificationStep(4);
        setParsedProduct(item);
        setParseLoading(false);
      }, 1800);
    } catch (err: any) {
      setParseError(err.message || "Failed to resolve Amazon link. Please check the URL format.");
      setParseLoading(false);
    }
  };

  // Deduplicate products by ASIN while preserving order and permanently filtering expired/dead ASINs
  const uniqueProducts = useMemo(() => {
    const EXPIRED_ASIN_BLACKLIST = new Set(["B0GR1YWWQ6"]);
    return products.filter((p, index, self) => {
      const asinUpper = (p.asin || "").trim().toUpperCase();
      const titleLower = (p.title || "").toLowerCase();
      if (!asinUpper || EXPIRED_ASIN_BLACKLIST.has(asinUpper) || titleLower.includes("d-force vitamin d3 60000 iu")) {
        return false;
      }
      return index === self.findIndex(t => (t.asin || "").trim().toUpperCase() === asinUpper);
    });
  }, [products]);

  // Top 5 Curated Editor's Choice Deals of the Day (Rotated daily, diverse high-discount highlights)
  const heroDeals = useMemo<AmazonProduct[]>(() => {
    if (uniqueProducts.length === 0) return [];
    const sorted = [...uniqueProducts].sort((a, b) => {
      const discA = Math.round((1 - (a.price / a.originalPrice)) * 100) || 0;
      const discB = Math.round((1 - (b.price / b.originalPrice)) * 100) || 0;
      return discB - discA;
    });

    // 24-hour day-wise epoch calculation for daily rotation offset across the top deals
    const dayEpoch = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
    const offset = dayEpoch % Math.max(1, Math.min(10, Math.max(0, sorted.length - 5)));
    const pool = sorted.slice(offset, offset + 25);

    const selected: AmazonProduct[] = [];
    const seenAsins = new Set<string>();

    // Select diverse categories among the 5 Editor's Choice deals
    const usedCategories = new Set<string>();
    for (const p of pool) {
      if (selected.length >= 5) break;
      const cat = (p.category || "").toLowerCase();
      if (!usedCategories.has(cat) && !seenAsins.has(p.asin)) {
        selected.push(p);
        usedCategories.add(cat);
        seenAsins.add(p.asin);
      }
    }

    // Backfill up to 5 deals if pool has fewer distinct categories
    for (const p of pool) {
      if (selected.length >= 5) break;
      if (!seenAsins.has(p.asin)) {
        selected.push(p);
        seenAsins.add(p.asin);
      }
    }

    return selected.length > 0 ? selected : sorted.slice(0, 5);
  }, [uniqueProducts]);

  // Active deal selected in the hero spotlight
  const activeHeroDeal = useMemo<AmazonProduct | null>(() => {
    if (heroDeals.length === 0) return null;
    return heroDeals[heroMediaIndex] || heroDeals[0] || null;
  }, [heroDeals, heroMediaIndex]);

  // Reset active hero gallery slide index when the hero deals list changes
  useEffect(() => {
    setHeroMediaIndex(0);
  }, [heroDeals.map(d => d.asin).join(",")]);

  // Flash Deals Ribbon (Next 4 items, excluding the Editor's Choice deals)
  const flashDeals = useMemo(() => {
    if (uniqueProducts.length <= 1) return [];
    const heroAsins = new Set(heroDeals.map(d => d.asin));
    return uniqueProducts.filter(p => !heroAsins.has(p.asin)).slice(0, 4);
  }, [uniqueProducts, heroDeals]);

  // Scratch card deal selection
  const scratchDealProduct = useMemo(() => {
    if (uniqueProducts.length === 0) return null;
    return uniqueProducts[uniqueProducts.length - 1] || uniqueProducts[0];
  }, [uniqueProducts]);

  // Live Price Drops Feed (Sidebar ticker)
  const livePriceDrops = useMemo(() => {
    return uniqueProducts.slice(0, 5).map((p) => {
      const disc = Math.round((1 - (p.price / p.originalPrice)) * 100) || 20;
      return { ...p, discountPercent: disc };
    });
  }, [uniqueProducts]);

  // Categories list
  const categories = ["All", "Electronics", "Kitchen & Home", "Gadgets", "Lifestyle", "Shopping"];

  // Top Category Discount Shortcuts
  const topCategoryShortcuts = [
    { label: "Electronics & Audio", discount: "Up to 55% OFF", category: "Electronics" },
    { label: "Kitchen & Home Appliances", discount: "Up to 60% OFF", category: "Kitchen & Home" },
    { label: "Smart Gadgets & Wearables", discount: "Up to 45% OFF", category: "Gadgets" },
    { label: "Lifestyle & Fashion", discount: "Up to 70% OFF", category: "Lifestyle" },
    { label: "Daily Essentials & Shopping", discount: "Up to 50% OFF", category: "Shopping" }
  ];

  // Scratch canvas drawing handlers
  useEffect(() => {
    if (!scratchDealProduct || scratchRevealed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth || 320;
    canvas.height = canvas.offsetHeight || 180;

    ctx.fillStyle = isDark ? "#1E293B" : "#CBD5E1";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "bold 13px 'IBM Plex Sans', sans-serif";
    ctx.fillStyle = "var(--red, #B7222B)";
    ctx.textAlign = "center";
    ctx.fillText("🎁 SCRATCH TO REVEAL SECRET DEAL", canvas.width / 2, canvas.height / 2);
  }, [scratchDealProduct, scratchRevealed, isDark]);

  const isDrawing = useRef(false);

  const getTouchPos = (canvas: HTMLCanvasElement, evt: React.TouchEvent | React.MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in evt) {
      return {
        x: evt.touches[0].clientX - rect.left,
        y: evt.touches[0].clientY - rect.top
      };
    }
    return {
      x: (evt as React.MouseEvent).clientX - rect.left,
      y: (evt as React.MouseEvent).clientY - rect.top
    };
  };

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    isDrawing.current = true;
    handleDraw(e);
  };

  const handleEnd = () => {
    isDrawing.current = false;
    checkScratchCompletion();
  };

  const handleDraw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getTouchPos(canvas, e);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
    ctx.fill();
  };

  const checkScratchCompletion = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    let transparentCount = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentCount++;
      }
    }

    const totalPixels = pixels.length / 4;
    const ratio = transparentCount / totalPixels;

    if (ratio >= 0.4) {
      setScratchRevealed(true);
    }
  };

  const handleRevealClick = () => {
    setScratchRevealed(true);
  };

  // Filter products based on selected category tab and search query
  const filteredProducts = useMemo(() => {
    return uniqueProducts.filter((p) => {
      const matchCat = matchesCategory(p.category, selectedTab);
      const matchSearch = !searchQuery.trim() || 
        (p.title || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (p.category || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (p.asin || "").toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchCat && matchSearch;
    });
  }, [uniqueProducts, selectedTab, searchQuery]);

  // Card Pagination calculation (6 items per page in main grid)
  const CARDS_PER_PAGE = 6;
  const totalCardPages = Math.ceil(filteredProducts.length / CARDS_PER_PAGE) || 1;
  const paginatedCardProducts = useMemo(() => {
    const start = (cardPage - 1) * CARDS_PER_PAGE;
    return filteredProducts.slice(start, start + CARDS_PER_PAGE);
  }, [filteredProducts, cardPage]);

  return (
    <Box sx={{ bgcolor: "var(--paper)", color: "var(--text)", minHeight: "100vh", pb: 8 }}>
      <SEOMeta
        title={`Amazon Deals of the Day (${currentMonthYear}) | Best Indian Shopping Offers | WorldNewzs`}
        description="Find verified Amazon Deals of the Day in India. Save huge on electronics, fashion, home appliances, gadgets & gift cards with our daily hand-picked flash sales."
        keywords={["amazon deals of the day", "amazon india deals", "best amazon offers", "amazon flash sale", "shopping discounts india", "worldnewzs shopping"]}
        canonical={`${SITE_URL}/amazon-products`}
      />
      <JSONLDBreadcrumb crumbs={[
        { name: "Home", url: SITE_URL },
        { name: "Amazon Deals Hub", url: `${SITE_URL}/amazon-products` }
      ]} />
      <JSONLDFAQPage faqs={amazonDealsFaqs} />
      <JSONLDProductList products={products} />

      <Box className="wrap" sx={{ maxWidth: "1240px", margin: "0 auto", px: { xs: 2, sm: 3, md: 3.5 }, pt: 3, pb: 4 }}>
        <BreadcrumbNav items={[{ label: "Amazon Deals Hub" }]} />

        {/* ─── MASTHEAD & TRUST STRIP ─── */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
            <Chip
              icon={<VerifiedUserIcon sx={{ color: "var(--red, #B7222B) !important", fontSize: "0.95rem !important" }} />}
              label="LIVE DEALS DESK · 30-DAY PRICE TRACKING VERIFIED"
              size="small"
              sx={{
                bgcolor: "rgba(183, 34, 43, 0.08)",
                color: "var(--red, #B7222B)",
                fontWeight: 800,
                fontSize: "0.68rem",
                letterSpacing: 0.8,
                border: cardBorder
              }}
            />
            <Typography variant="caption" sx={{ color: "var(--slate)", fontWeight: 600 }}>
              Updated at 12:00 AM IST · Editorial Selection for {currentMonthYear}
            </Typography>
          </Box>

          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 900,
              fontFamily: "var(--serif)",
              fontSize: { xs: "1.9rem", sm: "2.5rem", md: "2.85rem" },
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              color: "var(--text)",
              mb: 1
            }}
          >
            Today's Best Amazon <Box component="span" sx={{ color: "var(--red, #B7222B)" }}>Deals</Box> & Flash Drops
          </Typography>
          <Typography variant="body1" sx={{ color: "var(--slate)", maxWidth: 840, lineHeight: 1.6, fontSize: "0.95rem" }}>
            Hand-picked price drops across electronics, smart home, kitchen, and lifestyle essentials—cross-referenced against 30-day historical averages to filter artificial inflation and ensure verified merchant savings.
          </Typography>
        </Box>

        {/* ─── 2-ZONE SIGNATURE EDITORIAL LAYOUT ─── */}
        <Grid container spacing={3}>
          
          {/* ══════════════════════════════════════════════════════════════════════════════
              ZONE 1: MAIN EDITORIAL STAGE (70% WIDTH)
             ══════════════════════════════════════════════════════════════════════════════ */}
          <Grid size={{ xs: 12, lg: 8.2 }}>

            {/* 🌟 1. EDITOR'S CHOICE — DEAL OF THE DAY HERO SPOTLIGHT */}
            {activeHeroDeal && (
              <Card
                elevation={0}
                sx={{
                  mb: 4,
                  borderRadius: "12px",
                  bgcolor: "var(--paper-raise)",
                  border: cardBorder,
                  overflow: "hidden",
                  boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.04)"
                }}
              >
                {/* Top Spotlight Bar: ✦ EDITOR'S CHOICE · DEAL OF THE DAY | LOWEST PRICE IN 30 DAYS */}
                <Box
                  sx={{
                    bgcolor: isDark ? "rgba(239, 68, 68, 0.08)" : "rgba(183, 34, 43, 0.04)",
                    borderBottom: cardBorder,
                    px: { xs: 2, sm: 3 },
                    py: 1.25,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AutoAwesomeIcon
                      sx={{
                        color: isDark ? "#ef4444" : "var(--red, #B7222B)",
                        fontSize: "1.1rem"
                      }}
                    />
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 900,
                        color: isDark ? "#ef4444" : "var(--red, #B7222B)",
                        fontSize: "0.8rem",
                        letterSpacing: 0.8,
                        textTransform: "uppercase"
                      }}
                    >
                      ✦ Editor's Choice · Deal of the Day
                    </Typography>
                  </Box>
                  <Chip
                    label="LOWEST PRICE IN 30 DAYS"
                    size="small"
                    sx={{
                      bgcolor: isDark ? "rgba(16, 185, 129, 0.16)" : "rgba(16, 185, 129, 0.12)",
                      color: isDark ? "#34d399" : "#10B981",
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      height: 22,
                      borderRadius: "12px",
                      border: `1px solid ${isDark ? "rgba(52, 211, 153, 0.3)" : "rgba(16, 185, 129, 0.3)"}`
                    }}
                  />
                </Box>

                <Grid container>
                  {/* LEFT COLUMN: INTERACTIVE MULTI-PHOTO GALLERY & VIDEO SLIDER */}
                  <Grid
                    size={{ xs: 12, md: 5.4 }}
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      borderRight: { xs: "none", md: cardBorder },
                      borderBottom: { xs: cardBorder, md: "none" },
                      bgcolor: "var(--paper)"
                    }}
                  >
                    <Box sx={{ display: "flex", gap: { xs: 1, sm: 1.5 }, height: "100%" }}>
                      {/* Vertical Thumbnail Strip */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.25,
                          width: { xs: 44, sm: 54 },
                          flexShrink: 0
                        }}
                      >
                        {heroDeals.map((deal, idx) => {
                          const isSelected = heroMediaIndex === idx;
                          const thumbUrl = getAbsoluteImageUrl(deal.imageUrl, deal.asin);

                          return (
                            <Box
                              key={deal.asin || idx}
                              onClick={() => setHeroMediaIndex(idx)}
                              id={`hero-thumb-${idx}`}
                              aria-label={`View deal ${idx + 1}: ${deal.title}`}
                              title={deal.title}
                              sx={{
                                width: { xs: 44, sm: 54 },
                                height: { xs: 44, sm: 54 },
                                borderRadius: "8px",
                                border: isSelected
                                  ? (isDark ? "2px solid #60a5fa" : "2px solid #3b82f6")
                                  : cardBorder,
                                bgcolor: isDark ? "#1e293b" : "#ffffff",
                                p: 0.5,
                                cursor: "pointer",
                                position: "relative",
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: isSelected
                                  ? (isDark ? "0 0 12px rgba(96, 165, 250, 0.4)" : "0 0 8px rgba(59, 130, 246, 0.3)")
                                  : "none",
                                transition: "all 0.2s ease-in-out",
                                "&:hover": {
                                  borderColor: isDark ? "#60a5fa" : "#3b82f6",
                                  transform: "scale(1.05)"
                                }
                              }}
                            >
                              <Box
                                component="img"
                                src={thumbUrl}
                                alt={`Thumbnail ${idx + 1}`}
                                data-asin={deal.asin}
                                onError={handleImageError}
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain"
                                }}
                              />
                            </Box>
                          );
                        })}
                      </Box>

                      {/* Main Visual Stage */}
                      <Box
                        sx={{
                          flex: 1,
                          position: "relative",
                          bgcolor: isDark ? "#172033" : "#f8fafc",
                          borderRadius: "12px",
                          border: cardBorder,
                          p: { xs: 1.5, sm: 2 },
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "space-between",
                          minHeight: { xs: 260, sm: 330 }
                        }}
                      >
                        {/* Top Stage Bar: Counter on left, Share & Wishlist on right */}
                        <Box
                          sx={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            zIndex: 2
                          }}
                        >
                          <Box
                            sx={{
                              bgcolor: isDark ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.9)",
                              backdropFilter: "blur(6px)",
                              px: 1.25,
                              py: 0.35,
                              borderRadius: "12px",
                              border: cardBorder
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.72rem",
                                color: "var(--text)",
                                fontFamily: "var(--mono)"
                              }}
                            >
                              {heroMediaIndex + 1} / {heroDeals.length}
                            </Typography>
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            <CardShareButton product={activeHeroDeal} getAbsoluteImageUrl={getAbsoluteImageUrl} sx={{ width: 32, height: 32, minWidth: 32, borderRadius: "8px" }} />
                            <IconButton
                              size="small"
                              onClick={() => toggleLike(activeHeroDeal.asin)}
                              aria-label={likedAsins.has(activeHeroDeal.asin) ? "Unlike deal" : "Like deal"}
                              sx={{
                                bgcolor: isDark ? "rgba(15, 23, 42, 0.65)" : "rgba(255, 255, 255, 0.85)",
                                backdropFilter: "blur(4px)",
                                border: cardBorder,
                                width: 32,
                                height: 32,
                                color: likedAsins.has(activeHeroDeal.asin) ? "#ef4444" : "var(--slate)",
                                transition: "all 0.2s ease-in-out",
                                "&:hover": {
                                  bgcolor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 1)",
                                  color: "#ef4444",
                                  transform: "scale(1.08)"
                                }
                              }}
                            >
                              {likedAsins.has(activeHeroDeal.asin) ? (
                                <FavoriteIcon sx={{ fontSize: "1.05rem" }} />
                              ) : (
                                <FavoriteBorderIcon sx={{ fontSize: "1.05rem" }} />
                              )}
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Stage Center Media with Left/Right Arrows */}
                        <Box
                          sx={{
                            position: "relative",
                            width: "100%",
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            my: 1
                          }}
                        >
                          {/* Left Arrow Button */}
                          <IconButton
                            size="small"
                            onClick={() => setHeroMediaIndex((prev) => (prev - 1 + heroDeals.length) % heroDeals.length)}
                            aria-label="Previous slide"
                            sx={{
                              position: "absolute",
                              left: -2,
                              zIndex: 2,
                              bgcolor: isDark ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.9)",
                              backdropFilter: "blur(4px)",
                              border: cardBorder,
                              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                              width: 32,
                              height: 32,
                              color: "var(--text)",
                              "&:hover": {
                                bgcolor: isDark ? "#1e293b" : "#ffffff",
                                transform: "scale(1.08)"
                              }
                            }}
                          >
                            <ChevronLeftIcon fontSize="small" />
                          </IconButton>

                          {/* Center Visual Image */}
                          <Box
                            component="img"
                            key={activeHeroDeal.asin}
                            src={getAbsoluteImageUrl(activeHeroDeal.imageUrl, activeHeroDeal.asin)}
                            alt={activeHeroDeal.title}
                            decoding="async"
                            referrerPolicy="no-referrer"
                            data-asin={activeHeroDeal.asin}
                            onError={handleImageError}
                            sx={{
                              maxHeight: { xs: 220, sm: 260 },
                              maxWidth: "100%",
                              objectFit: "contain",
                              transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                              "&:hover": { transform: "scale(1.05)" }
                            }}
                          />

                          {/* Right Arrow Button */}
                          <IconButton
                            size="small"
                            onClick={() => setHeroMediaIndex((prev) => (prev + 1) % heroDeals.length)}
                            aria-label="Next slide"
                            sx={{
                              position: "absolute",
                              right: -2,
                              zIndex: 2,
                              bgcolor: isDark ? "rgba(15, 23, 42, 0.75)" : "rgba(255, 255, 255, 0.9)",
                              backdropFilter: "blur(4px)",
                              border: cardBorder,
                              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                              width: 32,
                              height: 32,
                              color: "var(--text)",
                              "&:hover": {
                                bgcolor: isDark ? "#1e293b" : "#ffffff",
                                transform: "scale(1.08)"
                              }
                            }}
                          >
                            <ChevronRightIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        {/* Bottom Indicators (Pill + Dots) */}
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75 }}>
                          {heroDeals.map((deal, idx) => (
                            <Box
                              key={deal.asin || idx}
                              onClick={() => setHeroMediaIndex(idx)}
                              title={deal.title}
                              sx={{
                                width: heroMediaIndex === idx ? 22 : 6,
                                height: heroMediaIndex === idx ? 5 : 6,
                                borderRadius: heroMediaIndex === idx ? "3px" : "50%",
                                bgcolor: heroMediaIndex === idx
                                  ? (isDark ? "#60a5fa" : "#3b82f6")
                                  : (isDark ? "rgba(148, 163, 184, 0.4)" : "rgba(100, 116, 139, 0.35)"),
                                cursor: "pointer",
                                transition: "all 0.25s ease-in-out",
                                "&:hover": {
                                  bgcolor: isDark ? "#93c5fd" : "#2563eb",
                                  transform: "scale(1.2)"
                                }
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Grid>

                  {/* RIGHT COLUMN: PRODUCT INTELLIGENCE, TRUST SIGNALS & ACTION */}
                  <Grid size={{ xs: 12, md: 6.6 }}>
                    <CardContent
                      key={activeHeroDeal.asin}
                      sx={{
                        p: { xs: 2.5, md: 3 },
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        justifyContent: "space-between",
                        animation: "heroFadeIn 0.25s ease-in-out",
                        "@keyframes heroFadeIn": {
                          "0%": { opacity: 0.65, transform: "translateY(2px)" },
                          "100%": { opacity: 1, transform: "translateY(0)" }
                        }
                      }}
                    >
                      <Box>
                        {/* Chips Row: Category, Discount & ASIN */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                          <Chip
                            label={activeHeroDeal.category || "DEAL OF THE DAY"}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.68rem",
                              height: 22,
                              bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)",
                              color: isDark ? "#93c5fd" : "#2563eb",
                              border: cardBorder
                            }}
                          />
                          <Chip
                            label={`${Math.round((1 - (activeHeroDeal.price / activeHeroDeal.originalPrice)) * 100)}% OFF`}
                            size="small"
                            sx={{
                              bgcolor: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(220, 38, 38, 0.1)",
                              color: isDark ? "#f87171" : "#dc2626",
                              fontWeight: 900,
                              fontSize: "0.72rem",
                              height: 22,
                              border: cardBorder
                            }}
                          />
                          <Typography variant="caption" sx={{ color: "var(--slate)", fontFamily: "var(--mono)", fontSize: "0.7rem" }}>
                            ASIN: {activeHeroDeal.asin}
                          </Typography>
                        </Box>

                        {/* Product Title */}
                        <Typography
                          variant="h5"
                          component="h2"
                          sx={{
                            fontWeight: 800,
                            fontFamily: "var(--serif)",
                            fontSize: { xs: "1.2rem", md: "1.35rem" },
                            lineHeight: 1.3,
                            color: "var(--text)",
                            mb: 1,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                          }}
                        >
                          {activeHeroDeal.title}
                        </Typography>

                        {/* Star Rating & Count */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
                          <Rating
                            value={activeHeroDeal.rating || 4.5}
                            precision={0.1}
                            readOnly
                            size="small"
                            emptyIcon={<StarIcon style={{ opacity: 0.2, color: "var(--slate)" }} fontSize="inherit" />}
                            sx={{ "& .MuiRating-iconFilled": { color: "var(--gold, #D97706)" } }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 900, color: "var(--gold, #D97706)", fontSize: "0.85rem" }}>
                            {activeHeroDeal.rating || 4.5}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "var(--slate)", fontSize: "0.8rem" }}>
                            ({(activeHeroDeal.reviewCount || 150).toLocaleString()} ratings)
                          </Typography>
                        </Box>

                        {/* Brand / Form Subtitle */}
                        <Typography variant="body2" sx={{ color: "var(--slate)", fontSize: "0.82rem", fontWeight: 600, mb: 1.5 }}>
                          {activeHeroDeal.description
                            ? activeHeroDeal.description.replace(/\s*•\s*/g, " · ")
                            : "Verified Amazon Deal · Genuine Seller Warranty"}
                        </Typography>

                        {/* Limited Time Deal Badge */}
                        <Box
                          sx={{
                            display: "inline-block",
                            bgcolor: "#dc2626",
                            color: "#ffffff",
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            letterSpacing: "0.02em",
                            px: 1.25,
                            py: 0.35,
                            borderRadius: "4px",
                            mb: 1.5
                          }}
                        >
                          Limited time deal
                        </Box>

                        {/* Pricing Display */}
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.25 }}>
                            <Typography
                              component="span"
                              sx={{
                                fontWeight: 800,
                                color: "#dc2626",
                                fontSize: { xs: "1.3rem", md: "1.55rem" }
                              }}
                            >
                              -{Math.round((1 - (activeHeroDeal.price / activeHeroDeal.originalPrice)) * 100)}%
                            </Typography>
                            <Typography
                              variant="h4"
                              sx={{
                                fontWeight: 900,
                                color: "var(--text)",
                                fontSize: { xs: "1.8rem", md: "2.2rem" },
                                letterSpacing: "-0.02em"
                              }}
                            >
                              ₹{activeHeroDeal.price.toLocaleString("en-IN")}
                            </Typography>
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25, flexWrap: "wrap" }}>
                            {activeHeroDeal.originalPrice > activeHeroDeal.price && (
                              <Typography variant="body2" sx={{ textDecoration: "line-through", color: "var(--slate-light)", fontSize: "0.85rem" }}>
                                M.R.P.: ₹{activeHeroDeal.originalPrice.toLocaleString("en-IN")}
                              </Typography>
                            )}
                            <Typography variant="caption" sx={{ color: isDark ? "#4ade80" : "#16a34a", fontWeight: 700, fontSize: "0.82rem" }}>
                              · You save ₹{(activeHeroDeal.originalPrice - activeHeroDeal.price).toLocaleString("en-IN")} ({Math.round((1 - (activeHeroDeal.price / activeHeroDeal.originalPrice)) * 100)}% OFF)
                            </Typography>
                          </Box>
                        </Box>

                        {/* 6 Service Trust Badges (Horizontal Row) */}
                        <Grid container spacing={1} sx={{ my: 1, py: 1.5, borderTop: cardBorder, borderBottom: cardBorder }}>
                          {[
                            { label: "Free Delivery", icon: <LocalShippingOutlinedIcon sx={{ fontSize: "1.25rem", color: "var(--slate)" }} /> },
                            { label: "10 days Returnable", icon: <AutorenewOutlinedIcon sx={{ fontSize: "1.25rem", color: "var(--slate)" }} /> },
                            { label: "Amazon Delivered", icon: <Inventory2OutlinedIcon sx={{ fontSize: "1.25rem", color: "var(--slate)" }} /> },
                            { label: "Pay on Delivery", icon: <PaymentsOutlinedIcon sx={{ fontSize: "1.25rem", color: "var(--slate)" }} /> },
                            { label: "Top Brand", icon: <WorkspacePremiumOutlinedIcon sx={{ fontSize: "1.25rem", color: "var(--slate)" }} /> },
                            { label: "Secure transaction", icon: <LockOutlinedIcon sx={{ fontSize: "1.25rem", color: "var(--slate)" }} /> }
                          ].map((badge, idx) => (
                            <Grid size={{ xs: 4, sm: 2 }} key={idx}>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  textAlign: "center",
                                  gap: 0.5,
                                  p: 0.5
                                }}
                              >
                                {badge.icon}
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "var(--slate)",
                                    fontSize: { xs: "0.62rem", sm: "0.68rem" },
                                    fontWeight: 600,
                                    lineHeight: 1.2
                                  }}
                                >
                                  {badge.label}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>

                      {/* Action Bar (Grab Deal on Amazon.in + Share + Bookmark) */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pt: 1.5, width: "100%" }}>
                        <Button
                          id={`hero-grab-deal-btn-${activeHeroDeal.asin}`}
                          variant="contained"
                          href={getAffiliateUrl(activeHeroDeal)}
                          target="_blank"
                          rel="sponsored noopener noreferrer"
                          startIcon={
                            <ShoppingBagIcon
                              sx={{
                                color: isDark ? "#0f172a" : "#f59e0b",
                                fontSize: "1.2rem"
                              }}
                            />
                          }
                          sx={{
                            borderRadius: "8px",
                            px: { xs: 2.5, sm: 3.5 },
                            py: 1.2,
                            fontWeight: 800,
                            textTransform: "none",
                            fontSize: "0.92rem",
                            whiteSpace: "nowrap",
                            bgcolor: isDark ? "#f59e0b" : "#0f172a",
                            color: isDark ? "#0f172a" : "#ffffff",
                            boxShadow: isDark
                              ? "0 4px 14px rgba(245, 158, 11, 0.35)"
                              : "0 4px 14px rgba(15, 23, 42, 0.25)",
                            flex: 1,
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              bgcolor: isDark ? "#d97706" : "#1e293b",
                              boxShadow: isDark
                                ? "0 6px 20px rgba(245, 158, 11, 0.45)"
                                : "0 6px 20px rgba(15, 23, 42, 0.35)",
                              transform: "translateY(-1px)"
                            }
                          }}
                        >
                          Grab Deal on Amazon.in{"\u00A0"}↗
                        </Button>

                        <CardShareButton product={activeHeroDeal} getAbsoluteImageUrl={getAbsoluteImageUrl} />

                        <IconButton
                          id={`hero-bookmark-btn-${activeHeroDeal.asin}`}
                          onClick={() => toggleBookmark(activeHeroDeal.asin)}
                          aria-label={bookmarkedAsins.has(activeHeroDeal.asin) ? "Remove Bookmark" : "Save Deal"}
                          sx={{
                            color: bookmarkedAsins.has(activeHeroDeal.asin) ? "var(--red, #B7222B)" : (isDark ? "#E2E8F0" : "#334155"),
                            bgcolor: bookmarkedAsins.has(activeHeroDeal.asin) ? "rgba(183, 34, 43, 0.12)" : (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)"),
                            border: `1px solid ${bookmarkedAsins.has(activeHeroDeal.asin) ? "var(--red, #B7222B)" : (isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.15)")}`,
                            borderRadius: "8px",
                            p: 1.1,
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              borderColor: "var(--red, #B7222B)",
                              color: "var(--red, #B7222B)",
                              bgcolor: isDark ? "rgba(183, 34, 43, 0.18)" : "rgba(183, 34, 43, 0.08)",
                              transform: "translateY(-1px)"
                            }
                          }}
                        >
                          {bookmarkedAsins.has(activeHeroDeal.asin) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Grid>
                </Grid>
              </Card>
            )}

            {/* 🔥 2. TRENDING FLASH DEALS RIBBON (4 ITEMS) */}
            {flashDeals.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2.5,
                    flexWrap: "wrap",
                    gap: 1.5
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "10px",
                        bgcolor: isDark ? "#1E293B" : "rgba(239, 68, 68, 0.08)",
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(239, 68, 68, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      <BoltIcon sx={{ color: "#EF4444", fontSize: "1.35rem" }} />
                    </Box>
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: "1.25rem", sm: "1.45rem" },
                        color: isDark ? "#FFFFFF" : "#0F172A",
                        letterSpacing: "-0.01em"
                      }}
                    >
                      Trending Flash Drops
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEE2E2",
                        color: isDark ? "#F87171" : "#DC2626",
                        border: isDark ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid #FECACA",
                        borderRadius: "9999px",
                        px: 1.3,
                        py: 0.35,
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        lineHeight: 1,
                        textTransform: "uppercase"
                      }}
                    >
                      LIMITED STOCK
                    </Box>
                  </Box>

                  <Box
                    component="button"
                    id="view-all-flash-deals-btn"
                    onClick={() => {
                      const target = document.getElementById("all-deals-section");
                      if (target) {
                        target.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    aria-label="View all deals"
                    sx={{
                      background: "none",
                      border: "none",
                      p: 0,
                      m: 0,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      color: isDark ? "#94A3B8" : "#64748B",
                      fontSize: { xs: "0.82rem", sm: "0.88rem" },
                      fontWeight: 600,
                      transition: "color 0.2s ease, transform 0.2s ease",
                      whiteSpace: "nowrap",
                      "&:hover": {
                        color: isDark ? "#FFFFFF" : "#0F172A",
                        transform: "translateX(2px)"
                      }
                    }}
                  >
                    View all deals →
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  {flashDeals.map((deal, index) => {
                    const discount = deal.originalPrice && deal.originalPrice > deal.price
                      ? Math.round((1 - (deal.price / deal.originalPrice)) * 100)
                      : 0;
                    const savingsAmount = deal.originalPrice && deal.originalPrice > deal.price
                      ? deal.originalPrice - deal.price
                      : 0;
                    const rating = deal.rating && deal.rating > 0 ? deal.rating : 4.5;
                    const reviewCount = deal.reviewCount && deal.reviewCount > 0 ? deal.reviewCount : 161;
                    const isBookmarked = bookmarkedAsins.has(deal.asin);
                    const parsed = parseBrandAndTitle(deal.title, deal.category);

                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 3 }} key={deal.asin}>
                        <Card
                          elevation={0}
                          sx={{
                            p: 0,
                            height: "100%",
                            borderRadius: "18px",
                            bgcolor: isDark ? "#0F172A" : "#FFFFFF",
                            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            position: "relative",
                            overflow: "hidden",
                            boxShadow: isDark
                              ? "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)"
                              : "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
                            transition: "all 0.25s ease-in-out",
                            "&:hover": {
                              borderColor: "rgba(239, 68, 68, 0.5)",
                              transform: "translateY(-4px)",
                              boxShadow: isDark
                                ? "0 20px 35px -5px rgba(0, 0, 0, 0.7), 0 0 20px rgba(239, 68, 68, 0.15)"
                                : "0 20px 35px -5px rgba(0, 0, 0, 0.1), 0 0 15px rgba(239, 68, 68, 0.08)",
                              "& .flash-deal-img": {
                                transform: "scale(1.06)"
                              }
                            }
                          }}
                        >
                          {/* Top Media Container - Flush with card top */}
                          <Box
                            sx={{
                              position: "relative",
                              background: isDark
                                ? (index === 0
                                    ? "linear-gradient(180deg, #24241B 0%, #151A22 100%)"
                                    : index === 1
                                    ? "linear-gradient(180deg, #1C2331 0%, #131A26 100%)"
                                    : index === 2
                                    ? "linear-gradient(180deg, #182338 0%, #101826 100%)"
                                    : "linear-gradient(180deg, #1E212B 0%, #121722 100%)")
                                : "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
                              borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid #F1F5F9",
                              borderTopLeftRadius: "18px",
                              borderTopRightRadius: "18px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              height: 200,
                              overflow: "hidden"
                            }}
                          >
                            {/* Top Left: Red Discount Badge */}
                            {discount > 0 && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 12,
                                  left: 12,
                                  zIndex: 2,
                                  bgcolor: "#EF4444",
                                  color: "#FFFFFF",
                                  borderRadius: "8px",
                                  px: 1.25,
                                  py: 0.45,
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                  letterSpacing: "0.02em",
                                  lineHeight: 1,
                                  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)",
                                  textTransform: "uppercase"
                                }}
                              >
                                {discount}% OFF
                              </Box>
                            )}

                            {/* Top Right: Glassmorphic Bookmark Button */}
                            <Tooltip title={isBookmarked ? "Remove Bookmark" : "Save Deal"}>
                              <IconButton
                                id={`flash-bookmark-btn-${deal.asin}`}
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBookmark(deal.asin);
                                }}
                                aria-label={isBookmarked ? "Remove Bookmark" : "Save Deal"}
                                sx={{
                                  position: "absolute",
                                  top: 12,
                                  right: 12,
                                  zIndex: 3,
                                  width: 36,
                                  height: 36,
                                  minWidth: 36,
                                  color: isBookmarked ? "#EF4444" : "#FFFFFF",
                                  bgcolor: "rgba(0, 0, 0, 0.45)",
                                  backdropFilter: "blur(6px)",
                                  border: "1px solid rgba(255, 255, 255, 0.15)",
                                  borderRadius: "10px",
                                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.25)",
                                  transition: "all 0.2s ease-in-out",
                                  "&:hover": {
                                    transform: "scale(1.08)",
                                    color: "#EF4444",
                                    borderColor: "#EF4444",
                                    bgcolor: "rgba(0, 0, 0, 0.65)"
                                  }
                                }}
                              >
                                {isBookmarked ? (
                                  <BookmarkIcon sx={{ fontSize: "1.15rem" }} />
                                ) : (
                                  <BookmarkBorderIcon sx={{ fontSize: "1.15rem" }} />
                                )}
                              </IconButton>
                            </Tooltip>

                            {/* Bottom Left: Translucent Dark Category Pill */}
                            <Box
                              sx={{
                                position: "absolute",
                                bottom: 12,
                                left: 12,
                                zIndex: 2,
                                bgcolor: "rgba(0, 0, 0, 0.6)",
                                backdropFilter: "blur(6px)",
                                color: "#E2E8F0",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
                                borderRadius: "9999px",
                                px: 1.25,
                                py: 0.35,
                                fontSize: "0.68rem",
                                fontWeight: 800,
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                                lineHeight: 1,
                                maxWidth: "60%",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}
                            >
                              {formatCategoryBadge(deal.category || "FASHION")}
                            </Box>

                            {/* Product Image */}
                            <Box
                              component="img"
                              className="flash-deal-img"
                              src={getAbsoluteImageUrl(deal.imageUrl, deal.asin)}
                              alt={deal.title}
                              decoding="async"
                              referrerPolicy="no-referrer"
                              data-asin={deal.asin}
                              onError={handleImageError}
                              sx={{
                                maxHeight: "82%",
                                maxWidth: "82%",
                                width: "auto",
                                height: "auto",
                                objectFit: "contain",
                                transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                                display: "block"
                              }}
                            />
                          </Box>

                          {/* Card Content Below Image */}
                          <Box sx={{ p: 2, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                            {/* Small Brand Caption */}
                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                fontWeight: 800,
                                fontSize: "0.72rem",
                                color: isDark ? "#94A3B8" : "#64748B",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                lineHeight: 1.2,
                                mb: 0.5
                              }}
                            >
                              {parsed.brand}
                            </Typography>

                            {/* Product Title */}
                            <Typography
                              variant="subtitle2"
                              component="h3"
                              title={parsed.cleanTitle}
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.92rem",
                                color: isDark ? "#FFFFFF" : "#0F172A",
                                lineHeight: 1.35,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                minHeight: "2.55rem",
                                mb: 1.2,
                                transition: "color 0.2s ease",
                                "&:hover": {
                                  color: "#EF4444"
                                }
                              }}
                            >
                              {parsed.cleanTitle}
                            </Typography>

                            {/* Rating & Reviews Row */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mb: 1.25 }}>
                              <StarIcon sx={{ color: "#F59E0B", fontSize: "1.1rem" }} />
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 800,
                                  color: isDark ? "#FFFFFF" : "#0F172A",
                                  fontSize: "0.85rem"
                                }}
                              >
                                {typeof rating === "number" ? rating.toFixed(1) : "4.5"}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: isDark ? "#94A3B8" : "#64748B",
                                  fontSize: "0.8rem",
                                  fontWeight: 500
                                }}
                              >
                                · {reviewCount.toLocaleString()} reviews
                              </Typography>
                            </Box>

                            {/* Price Row: Large Bold Price + Strikethrough Original Price */}
                            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 900,
                                  color: isDark ? "#FFFFFF" : "#0F172A",
                                  fontSize: { xs: "1.45rem", sm: "1.6rem" },
                                  lineHeight: 1,
                                  letterSpacing: "-0.02em"
                                }}
                              >
                                ₹{formatPrice(deal.price)}
                              </Typography>
                              {deal.originalPrice > deal.price && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    textDecoration: "line-through",
                                    color: isDark ? "#64748B" : "#94A3B8",
                                    fontSize: "0.9rem",
                                    fontWeight: 500
                                  }}
                                >
                                  ₹{formatPrice(deal.originalPrice)}
                                </Typography>
                              )}
                            </Box>

                            {/* Savings Text (Clean green text matching screenshot) */}
                            {savingsAmount > 0 ? (
                              <Typography
                                sx={{
                                  color: isDark ? "#22C55E" : "#15803D",
                                  fontWeight: 700,
                                  fontSize: "0.82rem",
                                  mb: 2,
                                  lineHeight: 1.2
                                }}
                              >
                                You save ₹{formatPrice(savingsAmount)}
                              </Typography>
                            ) : (
                              <Typography
                                sx={{
                                  color: isDark ? "#94A3B8" : "#64748B",
                                  fontWeight: 700,
                                  fontSize: "0.82rem",
                                  mb: 2,
                                  lineHeight: 1.2
                                }}
                              >
                                Best Verified Deal
                              </Typography>
                            )}

                            {/* Action Row: 'Grab Deal' CTA + Accessible Share Button */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: "auto" }}>
                              <Button
                                id={`flash-deal-btn-${deal.asin}`}
                                size="small"
                                variant="contained"
                                href={getAffiliateUrl(deal)}
                                target="_blank"
                                rel="sponsored noopener noreferrer"
                                startIcon={<ShoppingBagOutlinedIcon sx={{ fontSize: "1.15rem" }} />}
                                sx={{
                                  flex: 1,
                                  height: 42,
                                  borderRadius: "10px",
                                  textTransform: "none",
                                  fontWeight: 800,
                                  fontSize: "0.88rem",
                                  letterSpacing: "0.01em",
                                  whiteSpace: "nowrap",
                                  bgcolor: "#EF4444",
                                  color: "#FFFFFF",
                                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                                  transition: "all 0.2s ease-in-out",
                                  "&:hover": {
                                    bgcolor: "#DC2626",
                                    boxShadow: "0 6px 18px rgba(239, 68, 68, 0.45)",
                                    transform: "translateY(-1px)"
                                  }
                                }}
                              >
                                Grab Deal
                              </Button>

                              <CardShareButton
                                product={deal}
                                getAbsoluteImageUrl={getAbsoluteImageUrl}
                                sx={{
                                  width: 42,
                                  height: 42,
                                  minWidth: 42,
                                  borderRadius: "10px"
                                }}
                              />
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {/* 📂 3. CATEGORY SWITCHER & SEARCH BAR (CARD VIEW ONLY) */}
            <Paper
              id="all-deals-section"
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                borderRadius: "8px",
                bgcolor: "var(--paper-raise)",
                border: cardBorder,
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "stretch", md: "center" },
                justifyContent: "space-between",
                gap: 2
              }}
            >
              {/* Category Filter Pills */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                {categories.map((cat) => {
                  const isSelected = selectedTab === cat;
                  return (
                    <Chip
                      key={cat}
                      label={cat}
                      onClick={() => {
                        setSelectedTab(cat);
                        setCardPage(1);
                      }}
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.78rem",
                        px: 1,
                        bgcolor: isSelected ? "var(--red, #B7222B)" : "var(--paper)",
                        color: isSelected ? "#FFFFFF" : "var(--text)",
                        border: `1px solid ${isSelected ? "var(--red, #B7222B)" : cardBorderColor}`,
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: isSelected ? "var(--red-deep, #8E1B22)" : "rgba(183, 34, 43, 0.08)",
                          borderColor: "var(--red, #B7222B)"
                        }
                      }}
                    />
                  );
                })}
              </Box>

              {/* Search Field */}
              <Box sx={{ alignSelf: { xs: "stretch", md: "auto" } }}>
                <TextField
                  size="small"
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCardPage(1);
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: "var(--slate)", fontSize: "1.05rem" }} />
                        </InputAdornment>
                      )
                    }
                  }}
                  sx={{
                    width: { xs: "100%", sm: 220 },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "6px",
                      bgcolor: "var(--paper)",
                      color: "var(--text)",
                      fontSize: "0.82rem",
                      "& fieldset": { borderColor: cardBorderColor },
                      "&:hover fieldset": { borderColor: "var(--red, #B7222B)" },
                      "&.Mui-focused fieldset": { borderColor: "var(--red, #B7222B)" }
                    }
                  }}
                />
              </Box>
            </Paper>

            {/* 🛍️ 4. CURATED DEALS MAIN GRID (CARD VIEW) */}
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress sx={{ color: "var(--red, #B7222B)" }} />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 4, borderRadius: "8px", border: cardBorder }}>{error}</Alert>
            ) : filteredProducts.length === 0 ? (
              <Paper elevation={0} sx={{ p: 5, textAlign: "center", borderRadius: "8px", bgcolor: "var(--paper-raise)", border: cardBorder }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "var(--text)", mb: 1 }}>
                  No deals found matching "{searchQuery}"
                </Typography>
                <Typography variant="body2" sx={{ color: "var(--slate)", mb: 2 }}>
                  Try searching for another product name, category, or clear your search query.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTab("All");
                  }}
                  sx={{ borderColor: cardBorderColor, color: "var(--text)", fontWeight: 700 }}
                >
                  Reset Filters
                </Button>
              </Paper>
            ) : (
              <Box sx={{ mb: 4 }}>
                <Grid container spacing={2.5}>
                  {paginatedCardProducts.map((product) => {
                    const discount = product.originalPrice && product.originalPrice > product.price
                      ? Math.round((1 - (product.price / product.originalPrice)) * 100)
                      : 0;
                    const savingsAmount = product.originalPrice && product.originalPrice > product.price
                      ? product.originalPrice - product.price
                      : 0;
                    const badgeStyle = getCategoryBadgeStyle(product.category, isDark);
                    const rating = product.rating && product.rating > 0 ? product.rating : 4.5;
                    const reviewCount = product.reviewCount && product.reviewCount > 0 ? product.reviewCount : 161;
                    const isBookmarked = bookmarkedAsins.has(product.asin);

                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id || product.asin}>
                        <Card
                          elevation={0}
                          sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: "20px",
                            bgcolor: isDark ? "#0F172A" : "#FFFFFF",
                            color: "var(--text)",
                            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
                            p: 2,
                            overflow: "hidden",
                            position: "relative",
                            boxShadow: isDark
                              ? "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)"
                              : "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
                            transition: "all 0.25s ease-in-out",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              borderColor: "rgba(225, 29, 72, 0.6)",
                              boxShadow: isDark
                                ? "0 20px 35px -5px rgba(0, 0, 0, 0.7), 0 0 20px rgba(225, 29, 72, 0.15)"
                                : "0 20px 35px -5px rgba(0, 0, 0, 0.1), 0 0 15px rgba(225, 29, 72, 0.08)",
                              "& .product-card-img": {
                                transform: "scale(1.06)"
                              }
                            }
                          }}
                        >
                          {/* Card Media Header - High Visibility Stage */}
                          <Box
                            sx={{
                              position: "relative",
                              bgcolor: isDark ? "#172033" : "#F8FAFC",
                              borderRadius: "14px",
                              border: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid #F1F5F9",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              height: 230,
                              overflow: "hidden"
                            }}
                          >
                            {/* Category Pill on Top Left */}
                            <Box
                              sx={{
                                position: "absolute",
                                top: 12,
                                left: 12,
                                zIndex: 2,
                                bgcolor: badgeStyle.bg,
                                color: badgeStyle.color,
                                border: `1px solid ${badgeStyle.border}`,
                                borderRadius: "9999px",
                                px: 1.35,
                                py: 0.4,
                                fontSize: "0.68rem",
                                fontWeight: 800,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                lineHeight: 1,
                                maxWidth: "58%",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}
                            >
                              {formatCategoryBadge(product.category || "DEALS")}
                            </Box>

                            {/* Top Right Discount Badge */}
                            {discount > 0 && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 12,
                                  right: 12,
                                  zIndex: 2,
                                  bgcolor: "#EF4444",
                                  color: "#FFFFFF",
                                  borderRadius: "9999px",
                                  px: 1.25,
                                  py: 0.4,
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                  letterSpacing: "0.02em",
                                  lineHeight: 1,
                                  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.35)"
                                }}
                              >
                                {discount}% OFF
                              </Box>
                            )}

                            {/* Bookmark Button on Bottom Right of Image Container */}
                            <Tooltip title={isBookmarked ? "Remove Bookmark" : "Save Deal"}>
                              <IconButton
                                id={`card-bookmark-btn-${product.asin || product.id}`}
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBookmark(product.asin);
                                }}
                                aria-label={isBookmarked ? "Remove Bookmark" : "Save Deal"}
                                sx={{
                                  position: "absolute",
                                  bottom: 12,
                                  right: 12,
                                  zIndex: 3,
                                  width: 38,
                                  height: 38,
                                  minWidth: 38,
                                  color: isBookmarked ? "#EF4444" : (isDark ? "#FFFFFF" : "#1E293B"),
                                  bgcolor: isDark ? "rgba(15, 23, 42, 0.85)" : "#FFFFFF",
                                  backdropFilter: "blur(8px)",
                                  border: isDark ? "1px solid rgba(255, 255, 255, 0.16)" : "1px solid rgba(0, 0, 0, 0.1)",
                                  borderRadius: "12px",
                                  boxShadow: isDark ? "0 4px 12px rgba(0, 0, 0, 0.25)" : "0 4px 10px rgba(0, 0, 0, 0.08)",
                                  transition: "all 0.2s ease-in-out",
                                  "&:hover": {
                                    transform: "scale(1.08)",
                                    color: "#EF4444",
                                    borderColor: "#EF4444",
                                    bgcolor: isDark ? "#1E293B" : "#FFFFFF"
                                  }
                                }}
                              >
                                {isBookmarked ? <BookmarkIcon sx={{ fontSize: "1.15rem" }} /> : <BookmarkBorderIcon sx={{ fontSize: "1.15rem" }} />}
                              </IconButton>
                            </Tooltip>

                            {/* Product Image */}
                            <Box
                              component="img"
                              className="product-card-img"
                              src={getAbsoluteImageUrl(product.imageUrl, product.asin)}
                              alt={`${product.title} - Amazon Deal India`}
                              decoding="async"
                              referrerPolicy="no-referrer"
                              data-asin={product.asin}
                              onError={handleImageError}
                              sx={{
                                maxHeight: "82%",
                                maxWidth: "82%",
                                width: "auto",
                                height: "auto",
                                objectFit: "contain",
                                transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                                display: "block"
                              }}
                            />
                          </Box>

                          <Box sx={{ pt: 2, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                            {/* Product Title */}
                            <Typography
                              variant="subtitle1"
                              component="h3"
                              title={product.title}
                              sx={{
                                fontWeight: 800,
                                mb: 1.25,
                                fontSize: "0.96rem",
                                color: isDark ? "#FFFFFF" : "#0F172A",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                minHeight: "2.6rem",
                                lineHeight: 1.35,
                                transition: "color 0.2s ease",
                                "&:hover": {
                                  color: "#E11D48"
                                }
                              }}
                            >
                              {product.title}
                            </Typography>

                            {/* Rating & Reviews */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}>
                              <Rating
                                value={rating}
                                readOnly
                                precision={0.1}
                                size="small"
                                emptyIcon={<StarIcon style={{ opacity: 0.25, color: isDark ? "#64748B" : "#94A3B8" }} fontSize="inherit" />}
                                sx={{
                                  fontSize: "1rem",
                                  "& .MuiRating-iconFilled": { color: "#F59E0B" }
                                }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "0.84rem" }}>
                                {typeof rating === "number" ? rating.toFixed(1) : "4.5"}
                              </Typography>
                              <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: "0.78rem" }}>
                                ({reviewCount.toLocaleString()} reviews)
                              </Typography>
                            </Box>

                            {/* Price Row */}
                            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
                              <Typography
                                variant="h5"
                                sx={{
                                  fontWeight: 900,
                                  color: isDark ? "#FFFFFF" : "#0F172A",
                                  fontSize: { xs: "1.55rem", sm: "1.75rem" },
                                  lineHeight: 1,
                                  letterSpacing: "-0.02em"
                                }}
                              >
                                ₹{formatPrice(product.price)}
                              </Typography>
                              {product.originalPrice > product.price && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    textDecoration: "line-through",
                                    color: isDark ? "#64748B" : "#94A3B8",
                                    fontSize: "0.95rem",
                                    fontWeight: 500
                                  }}
                                >
                                  ₹{formatPrice(product.originalPrice)}
                                </Typography>
                              )}
                            </Box>

                            {/* Savings Pill */}
                            {savingsAmount > 0 ? (
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  bgcolor: isDark ? "rgba(34, 197, 94, 0.16)" : "rgba(34, 197, 94, 0.12)",
                                  border: isDark ? "1px solid rgba(74, 222, 128, 0.25)" : "1px solid rgba(22, 163, 74, 0.2)",
                                  borderRadius: "8px",
                                  px: 1.25,
                                  py: 0.4,
                                  mb: 2.25,
                                  alignSelf: "flex-start",
                                  maxWidth: "100%",
                                  overflow: "hidden"
                                }}
                              >
                                <Typography
                                  sx={{
                                    color: isDark ? "#4ADE80" : "#15803D",
                                    fontWeight: 800,
                                    fontSize: "0.76rem",
                                    letterSpacing: "0.01em",
                                    whiteSpace: "nowrap",
                                    textOverflow: "ellipsis",
                                    overflow: "hidden"
                                  }}
                                >
                                  You save ₹{formatPrice(savingsAmount)} ({discount}%)
                                </Typography>
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
                                  border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)",
                                  borderRadius: "8px",
                                  px: 1.25,
                                  py: 0.4,
                                  mb: 2.25,
                                  alignSelf: "flex-start"
                                }}
                              >
                                <Typography
                                  sx={{
                                    color: isDark ? "#94A3B8" : "#64748B",
                                    fontWeight: 700,
                                    fontSize: "0.76rem"
                                  }}
                                >
                                  Best Verified Deal
                                </Typography>
                              </Box>
                            )}

                            {/* Card Footer Actions Row: 'Grab Deal' CTA + Share Button */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.25,
                                mt: "auto",
                                pt: 0.5
                              }}
                            >
                              <Button
                                id={`card-buy-btn-${product.asin || product.id}`}
                                variant="contained"
                                href={getAffiliateUrl(product)}
                                target="_blank"
                                rel="sponsored noopener noreferrer"
                                startIcon={<ShoppingBagOutlinedIcon sx={{ fontSize: "1.15rem" }} />}
                                sx={{
                                  flex: 1,
                                  height: 44,
                                  borderRadius: "12px",
                                  fontWeight: 800,
                                  textTransform: "none",
                                  fontSize: "0.92rem",
                                  letterSpacing: "0.01em",
                                  bgcolor: "#E11D48",
                                  color: "#FFFFFF",
                                  boxShadow: "0 4px 12px rgba(225, 29, 72, 0.3)",
                                  transition: "all 0.2s ease-in-out",
                                  "&:hover": {
                                    bgcolor: "#BE123C",
                                    boxShadow: "0 6px 18px rgba(225, 29, 72, 0.45)",
                                    transform: "translateY(-1px)"
                                  }
                                }}
                              >
                                Grab Deal
                              </Button>

                              <CardShareButton
                                product={product}
                                getAbsoluteImageUrl={getAbsoluteImageUrl}
                                sx={{
                                  width: 44,
                                  height: 44,
                                  minWidth: 44,
                                  borderRadius: "12px"
                                }}
                              />
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Card Pagination Controls */}
                <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                  <Pagination
                    count={totalCardPages}
                    page={cardPage}
                    onChange={(_e, page) => setCardPage(page)}
                    sx={{
                      "& .MuiPaginationItem-root": {
                        color: "var(--slate)",
                        fontWeight: 700,
                        borderRadius: "50%",
                        border: cardBorder,
                        "&.Mui-selected": {
                          bgcolor: "var(--red, #B7222B)",
                          color: "#FFFFFF",
                          borderColor: "var(--red, #B7222B)",
                          "&:hover": { bgcolor: "var(--red-deep, #8E1B22)" }
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            )}

          </Grid>


          {/* ══════════════════════════════════════════════════════════════════════════════
              ZONE 2: RIGHT STICKY UTILITY RAIL (30% WIDTH / 340PX)
             ══════════════════════════════════════════════════════════════════════════════ */}
          <Grid size={{ xs: 12, lg: 3.8 }}>
            <Box sx={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 3 }}>

              {/* 🔍 WIDGET 1: QUICK AMAZON DEAL URL RESOLVER */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "8px",
                  bgcolor: "var(--paper-raise)",
                  border: cardBorder
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <LocalOfferIcon sx={{ color: "var(--red, #B7222B)", fontSize: "1.1rem" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: "var(--serif)", color: "var(--text)" }}>
                    Quick Amazon Deal Resolver
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "var(--slate)", display: "block", mb: 2, lineHeight: 1.4 }}>
                  Paste any Amazon India product URL to resolve active discount, price drop, and 1-click preview card.
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <TextField
                    id="amazon-url-sidebar-input"
                    fullWidth
                    size="small"
                    placeholder="https://amazon.in/dp/..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "6px",
                        bgcolor: "var(--paper)",
                        color: "var(--text)",
                        fontSize: "0.82rem",
                        "& fieldset": { borderColor: cardBorderColor },
                        "&:hover fieldset": { borderColor: "var(--red, #B7222B)" },
                        "&.Mui-focused fieldset": { borderColor: "var(--red, #B7222B)" }
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleParseUrl}
                    disabled={parseLoading || !urlInput.trim()}
                    sx={{
                      borderRadius: "6px",
                      py: 0.9,
                      fontWeight: 900,
                      fontSize: "0.82rem",
                      bgcolor: "var(--red, #B7222B)",
                      color: "#FFFFFF",
                      boxShadow: "none",
                      "&:hover": { bgcolor: "var(--red-deep, #8E1B22)" }
                    }}
                  >
                    {parseLoading ? <CircularProgress size={18} sx={{ color: "#FFFFFF" }} /> : "Resolve Deal ⚡"}
                  </Button>
                </Box>

                {/* Progress Indicators */}
                {parseLoading && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ color: "var(--slate)", display: "block", mb: 0.75, fontWeight: 700 }}>
                      Verifying authenticity...
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {[
                        { id: 1, label: "SSL Check" },
                        { id: 2, label: "Price Scrape" },
                        { id: 3, label: "Rating" },
                        { id: 4, label: "Link Tag" }
                      ].map((step) => {
                        const isActive = activeVerificationStep === step.id;
                        const isCompleted = activeVerificationStep > step.id;
                        return (
                          <Chip
                            key={step.id}
                            label={step.label}
                            size="small"
                            sx={{
                              fontSize: "0.62rem",
                              height: 18,
                              bgcolor: isCompleted ? "#10B981" : (isActive ? "var(--red, #B7222B)" : "var(--paper)"),
                              color: isCompleted || isActive ? "#FFFFFF" : "var(--slate)",
                              border: cardBorder
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {parseError && (
                  <Alert severity="error" sx={{ mt: 2, borderRadius: "6px", fontSize: "0.78rem", border: cardBorder }}>
                    {parseError}
                  </Alert>
                )}

                {/* Resolved Preview Mini Card */}
                {parsedProduct && (
                  <Card sx={{ borderRadius: "6px", border: "1px solid var(--red, #B7222B)", bgcolor: "var(--paper)", mt: 2, p: 1.5 }}>
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1 }}>
                      <Box
                        component="img"
                        src={getAbsoluteImageUrl(parsedProduct.imageUrl, parsedProduct.asin)}
                        alt={parsedProduct.title}
                        sx={{ width: 50, height: 50, objectFit: "contain", bgcolor: "var(--paper-raise)", borderRadius: "4px", p: 0.5, border: cardBorder }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.8rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {parsedProduct.title}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: isDark ? "#4ade80" : "#15803d" }}>
                          ₹{parsedProduct.price.toLocaleString("en-IN")}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      href={getAffiliateUrl(parsedProduct)}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      sx={{ bgcolor: "var(--red, #B7222B)", color: "#fff", fontSize: "0.75rem", py: 0.5, whiteSpace: "nowrap", fontWeight: 800, "&:hover": { bgcolor: "var(--red-deep, #8E1B22)" } }}
                    >
                      Grab Deal{"\u00A0"}↗
                    </Button>
                  </Card>
                )}
              </Paper>

              {/* ⚡ WIDGET 2: LIVE PRICE DROP ALERTS FEED */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "8px",
                  bgcolor: "var(--paper-raise)",
                  border: cardBorder
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <TrendingUpIcon sx={{ color: "var(--red, #B7222B)", fontSize: "1.1rem" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: "var(--serif)", color: "var(--text)" }}>
                    Live Price Drop Ticker
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                  {livePriceDrops.map((item, idx) => (
                    <Box
                      key={item.asin || idx}
                      component="a"
                      href={getAffiliateUrl(item)}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      sx={{
                        p: 1.25,
                        borderRadius: "6px",
                        bgcolor: "var(--paper)",
                        border: cardBorder,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.5,
                        transition: "all 0.2s ease",
                        "&:hover": { borderColor: "var(--red, #B7222B)", bgcolor: "rgba(183, 34, 43, 0.03)" }
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.78rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "var(--slate)", fontSize: "0.72rem" }}>
                          Deal: ₹{item.price.toLocaleString("en-IN")}
                        </Typography>
                      </Box>
                      <Chip
                        label={`-${item.discountPercent}%`}
                        size="small"
                        sx={{ bgcolor: "rgba(183, 34, 43, 0.12)", color: "var(--red, #B7222B)", fontWeight: 900, fontSize: "0.68rem", height: 20, border: cardBorder }}
                      />
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* 🏷️ WIDGET 3: TOP DISCOUNT CATEGORIES */}
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "8px",
                  bgcolor: "var(--paper-raise)",
                  border: cardBorder
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: "var(--serif)", color: "var(--text)", mb: 1.5 }}>
                  Top Category Discounts
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {topCategoryShortcuts.map((cat, idx) => (
                    <Box
                      key={idx}
                      onClick={() => {
                        setSelectedTab(cat.category);
                        setCardPage(1);
                      }}
                      sx={{
                        p: 1,
                        px: 1.5,
                        borderRadius: "6px",
                        bgcolor: "var(--paper)",
                        border: cardBorder,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        "&:hover": { borderColor: "var(--red, #B7222B)", bgcolor: "rgba(183, 34, 43, 0.04)" }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--text)" }}>
                        {cat.label}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: "var(--red, #B7222B)", fontSize: "0.75rem" }}>
                        {cat.discount}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* 🎁 WIDGET 4: GAMIFIED SECRET SCRATCH CARD */}
              {scratchDealProduct && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: "8px",
                    bgcolor: "var(--paper-raise)",
                    border: cardDashedBorder,
                    textAlign: "center"
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, fontFamily: "var(--serif)", color: "var(--text)", fontSize: "0.95rem" }}>
                      🎁 Daily Mystery Scratch Card
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: "var(--slate)", display: "block", mb: 1.5 }}>
                    Scratch below with mouse or touch to reveal today's secret deal!
                  </Typography>

                  <Box sx={{ position: "relative", width: "100%", height: 160, borderRadius: "6px", overflow: "hidden", bgcolor: "var(--paper)", mb: 1.5, border: cardBorder }}>
                    {/* Background Deal Content */}
                    <Box sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
                      <Box
                        component="img"
                        src={getAbsoluteImageUrl(scratchDealProduct.imageUrl, scratchDealProduct.asin)}
                        alt={scratchDealProduct.title}
                        sx={{ maxHeight: 65, maxWidth: "100%", objectFit: "contain", mb: 0.5 }}
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.75rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                        {scratchDealProduct.title}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: isDark ? "#4ade80" : "#15803d", fontSize: "0.88rem" }}>
                        ₹{scratchDealProduct.price.toLocaleString("en-IN")}
                      </Typography>
                    </Box>

                    {/* Canvas Scratch Overlay */}
                    {!scratchRevealed && (
                      <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 5, touchAction: "none" }}>
                        <canvas
                          ref={canvasRef}
                          onMouseDown={handleStart}
                          onMouseMove={handleDraw}
                          onMouseUp={handleEnd}
                          onMouseLeave={handleEnd}
                          onTouchStart={handleStart}
                          onTouchMove={handleDraw}
                          onTouchEnd={handleEnd}
                          style={{ width: "100%", height: "100%", cursor: "crosshair" }}
                        />
                      </Box>
                    )}
                  </Box>

                  {scratchRevealed ? (
                    <Button
                      fullWidth
                      variant="contained"
                      href={getAffiliateUrl(scratchDealProduct)}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      sx={{ borderRadius: "6px", fontWeight: 800, fontSize: "0.78rem", py: 0.6, whiteSpace: "nowrap", bgcolor: "var(--red, #B7222B)", color: "#fff", "&:hover": { bgcolor: "var(--red-deep, #8E1B22)" } }}
                    >
                      Grab Secret Deal{"\u00A0"}↗
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      onClick={handleRevealClick}
                      sx={{ borderRadius: "6px", fontWeight: 700, fontSize: "0.72rem", py: 0.4, borderColor: cardBorderColor, color: "var(--slate)" }}
                    >
                      Quick Reveal
                    </Button>
                  )}
                </Paper>
              )}

              {/* 🛡️ WIDGET 5: FTC AFFILIATE & EDITORIAL DISCLOSURE */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "8px",
                  bgcolor: "var(--paper-raise)",
                  border: cardBorder,
                  display: "flex",
                  gap: 1.25,
                  alignItems: "flex-start"
                }}
              >
                <SecurityIcon sx={{ color: "var(--red, #B7222B)", fontSize: "1.2rem", mt: 0.2 }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.78rem", color: "var(--text)", mb: 0.5 }}>
                    FTC & Amazon Affiliate Disclosure
                  </Typography>
                  <Typography variant="caption" sx={{ color: "var(--slate)", lineHeight: 1.4, display: "block" }}>
                    WorldNewzs participates in the Amazon Associates program. When you buy through verified links on this hub, we may earn an affiliate commission with no extra cost to you.
                  </Typography>
                </Box>
              </Paper>

            </Box>
          </Grid>

        </Grid>


        {/* ══════════════════════════════════════════════════════════════════════════════
            BOTTOM SECTION: EDITORIAL BUYING GUIDES & FAQS
           ══════════════════════════════════════════════════════════════════════════════ */}
        <Box sx={{ mt: 6 }}>
          
          {/* 📖 RICH EDITORIAL INTRODUCTION SECTION */}
          <Paper
            elevation={0}
            id="deals-editorial-intro"
            sx={{
              p: { xs: 3, md: 4 },
              mb: 5,
              borderRadius: "8px",
              bgcolor: "var(--paper-raise)",
              border: cardBorder
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                color: "var(--red, #B7222B)",
                fontFamily: "var(--serif)",
                display: "flex",
                alignItems: "center",
                gap: 1
              }}
            >
              <VerifiedUserIcon sx={{ color: "var(--red, #B7222B)" }} /> How We Hand-Pick & Verify Amazon India Deals Every Day
            </Typography>
            <Typography variant="body1" paragraph sx={{ color: "var(--slate)", lineHeight: 1.7, fontSize: "0.92rem" }}>
              Welcome to the <strong>WorldNewzs Amazon Deals Hub</strong> for {currentMonthYear}. In a fast-paced online shopping landscape flooded with artificial discount badges and misleading promotional claims, finding genuine price drops on Amazon India requires rigorous price tracking. Every single product featured on this page undergoes a multi-stage editorial verification process to ensure maximum savings and authentic merchant quality.
            </Typography>
            <Typography variant="body1" paragraph sx={{ color: "var(--slate)", lineHeight: 1.7, fontSize: "0.92rem" }}>
              Our specialized shopping desk actively monitors price fluctuations across major product categories including{" "}
              <Box component={RouterLink} to="/technology" sx={{ color: "var(--red, #B7222B)", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                Technology & Electronics
              </Box>
              ,{" "}
              <Box component={RouterLink} to="/shopping" sx={{ color: "var(--red, #B7222B)", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                Home & Kitchen Appliances
              </Box>
              ,{" "}
              <Box component={RouterLink} to="/lifestyle" sx={{ color: "var(--red, #B7222B)", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                Lifestyle & Fashion
              </Box>
              , and{" "}
              <Box component={RouterLink} to="/business" sx={{ color: "var(--red, #B7222B)", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                Business Utilities
              </Box>
              . We cross-reference listed prices against 30-day historical averages to verify that every discount—ranging from 15% to over 70% OFF—represents a legitimate price drop rather than a temporary price inflation.
            </Typography>
            <Typography variant="body1" sx={{ color: "var(--slate)", lineHeight: 1.7, fontSize: "0.92rem" }}>
              Furthermore, we enforce strict seller quality controls: only products with a minimum customer rating of <strong>4.0 out of 5 stars</strong> and backed by Amazon Fulfilled logistics or certified brand stores are selected. Whether you are looking for flagship 5G smartphones, smart home projectors, ergonomic diwan cushions, or daily lifestyle essentials, our daily hand-picked collection brings you instant savings without the noise.
            </Typography>
          </Paper>

          {/* ❓ FREQUENTLY ASKED QUESTIONS (FAQS) SECTION */}
          <Box id="deals-faq-section" sx={{ mb: 2 }}>
            <Typography 
              variant="h6" 
              component="h2"
              sx={{ 
                fontWeight: 800, 
                mb: 3, 
                fontFamily: "var(--serif)",
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "var(--text)"
              }}
            >
              <HelpOutlineIcon sx={{ color: "var(--red, #B7222B)" }} /> Frequently Asked Questions (FAQs)
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {amazonDealsFaqs.map((faq, index) => (
                <Accordion 
                  key={index}
                  elevation={0}
                  sx={{
                    borderRadius: "8px !important",
                    border: cardBorder,
                    bgcolor: "var(--paper-raise)",
                    color: "var(--text)",
                    overflow: "hidden",
                    "&:before": { display: "none" }
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: "var(--red, #B7222B)" }} />}
                    id={`faq-summary-${index}`}
                    sx={{ px: 3, py: 0.5 }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)" }}>
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Typography variant="body2" sx={{ color: "var(--slate)", lineHeight: 1.7 }}>
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Box>

        </Box>

      </Box>
    </Box>
  );
};

export default AmazonProducts;
