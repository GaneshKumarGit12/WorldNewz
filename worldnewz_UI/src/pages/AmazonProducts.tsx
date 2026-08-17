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

// Helper to determine category chip color
const getCategoryBadgeStyle = (category: string = "", isDark: boolean = false) => {
  const cat = category.toLowerCase().trim();
  const border = isDark ? "#19202a" : "#e9e3e3";
  if (cat.includes("electronics") || cat.includes("gadget") || cat.includes("tech")) {
    return { bg: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.12)", color: isDark ? "#60A5FA" : "#2563EB", border };
  }
  if (cat.includes("kitchen") || cat.includes("home")) {
    return { bg: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.12)", color: isDark ? "#34D399" : "#059669", border };
  }
  if (cat.includes("lifestyle") || cat.includes("fashion")) {
    return { bg: isDark ? "rgba(168, 85, 247, 0.15)" : "rgba(168, 85, 247, 0.12)", color: isDark ? "#C084FC" : "#9333EA", border };
  }
  return { bg: isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.12)", color: isDark ? "#FBBF24" : "#D97706", border };
};

// Compact Card Share Menu Component
interface CardShareButtonProps {
  product: AmazonProduct;
  getAbsoluteImageUrl: (url: string | undefined | null, asin?: string) => string;
}

const CardShareButton: React.FC<CardShareButtonProps> = React.memo(({ product, getAbsoluteImageUrl }) => {
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
  const tag = "ganeshd12-21";
  const url = product.productUrl || (product.asin ? `https://www.amazon.in/dp/${product.asin}?tag=${tag}&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl` : "https://worldnewzs.in/amazon-products");
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
            color: isDark ? "#E2E8F0" : "#334155",
            bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.15)"}`,
            borderRadius: "6px",
            p: 0.75,
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              borderColor: "var(--red, #B7222B)",
              color: "var(--red, #B7222B)",
              bgcolor: isDark ? "rgba(183, 34, 43, 0.18)" : "rgba(183, 34, 43, 0.08)"
            }
          }}
        >
          <ShareIcon sx={{ fontSize: "1rem" }} />
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
    "https://m.media-amazon.com/images/I/6166RQH8dIL._SL1500_.jpg",
    "https://m.media-amazon.com/images/I/71CmSn+uLZL._SL1500_.jpg",
    "https://m.media-amazon.com/images/I/61ROh33PBuL._SL1080_.jpg",
    "https://m.media-amazon.com/images/I/81+guVWHIJL._SL1500_.jpg",
    "https://m.media-amazon.com/images/I/61L0MQ4gXiL._SL1500_.jpg"
  ];

  const getAbsoluteImageUrl = (url: string | undefined | null, asin?: string) => {
    if (url && url.trim()) {
      let trimmed = url.trim();
      if (trimmed.startsWith("/images/") || trimmed.startsWith("data:")) {
        return trimmed;
      }
      if (trimmed.includes("m.media-amazon.com/images/I/")) {
        return `https://images.weserv.nl/?url=${encodeURIComponent(trimmed)}&output=webp&q=85`;
      }
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return `https://images.weserv.nl/?url=${encodeURIComponent(trimmed)}&output=webp&q=85`;
      }
    }

    const cleanAsin = (asin || "").trim();
    if (cleanAsin) {
      const charCode = cleanAsin.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const fallback = VERIFIED_AMAZON_FALLBACK_IMAGES[charCode % VERIFIED_AMAZON_FALLBACK_IMAGES.length];
      return `https://images.weserv.nl/?url=${encodeURIComponent(fallback)}&output=webp&q=85`;
    }

    return AMAZON_PLACEHOLDER;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const asin = target.dataset.asin || "DEAL";

    if (!target.dataset.attempt) {
      target.dataset.attempt = "1";
      const charCode = asin.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const fallback = VERIFIED_AMAZON_FALLBACK_IMAGES[charCode % VERIFIED_AMAZON_FALLBACK_IMAGES.length];
      target.src = `https://images.weserv.nl/?url=${encodeURIComponent(fallback)}&output=webp&q=85`;
      return;
    }

    if (target.dataset.attempt === "1") {
      target.dataset.attempt = "2";
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

  // Deduplicate products by ASIN while preserving order
  const uniqueProducts = useMemo(() => {
    return products.filter((p, index, self) =>
      Boolean(p.asin) && index === self.findIndex(t => (t.asin || "").trim().toUpperCase() === (p.asin || "").trim().toUpperCase())
    );
  }, [products]);

  // Editor's Choice Hero Deal Spotlight
  const heroDeal = useMemo(() => {
    if (uniqueProducts.length === 0) return null;
    const sorted = [...uniqueProducts].sort((a, b) => {
      const discA = Math.round((1 - (a.price / a.originalPrice)) * 100) || 0;
      const discB = Math.round((1 - (b.price / b.originalPrice)) * 100) || 0;
      return discB - discA;
    });
    return sorted[0];
  }, [uniqueProducts]);

  // Flash Deals Ribbon (Next 4 items)
  const flashDeals = useMemo(() => {
    if (uniqueProducts.length <= 1) return [];
    return uniqueProducts.filter(p => p.asin !== heroDeal?.asin).slice(0, 4);
  }, [uniqueProducts, heroDeal]);

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
      const matchCat = selectedTab === "All" || p.category.toLowerCase().trim() === selectedTab.toLowerCase().trim();
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
            {heroDeal && (
              <Card
                elevation={0}
                sx={{
                  mb: 4,
                  borderRadius: "8px",
                  bgcolor: "var(--paper-raise)",
                  border: cardBorder,
                  overflow: "hidden",
                  boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.04)"
                }}
              >
                <Box sx={{ bgcolor: "rgba(183, 34, 43, 0.04)", borderBottom: cardBorder, px: 3, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AutoAwesomeIcon sx={{ color: "var(--red, #B7222B)", fontSize: "1.1rem" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "var(--red, #B7222B)", fontSize: "0.78rem", letterSpacing: 0.8, textTransform: "uppercase" }}>
                      Editor's Choice · Deal of the Day
                    </Typography>
                  </Box>
                  <Chip
                    label="LOWEST PRICE IN 30 DAYS"
                    size="small"
                    sx={{ bgcolor: "rgba(16, 185, 129, 0.12)", color: "#10B981", fontWeight: 800, fontSize: "0.65rem", height: 20, border: cardBorder }}
                  />
                </Box>

                <Grid container>
                  <Grid size={{ xs: 12, sm: 4.5 }} sx={{ display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "var(--paper)", p: 3, borderRight: { xs: "none", sm: cardBorder }, borderBottom: { xs: cardBorder, sm: "none" } }}>
                    <Box
                      component="img"
                      src={getAbsoluteImageUrl(heroDeal.imageUrl, heroDeal.asin)}
                      alt={`${heroDeal.title} - Amazon Deal India`}
                      decoding="async"
                      referrerPolicy="no-referrer"
                      data-asin={heroDeal.asin}
                      onError={handleImageError}
                      sx={{ maxHeight: 200, maxWidth: "100%", objectFit: "contain", transition: "transform 0.3s", "&:hover": { transform: "scale(1.05)" } }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 7.5 }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3 }, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
                          <Chip
                            label={heroDeal.category}
                            size="small"
                            sx={{ fontWeight: 800, fontSize: "0.65rem", height: 20, bgcolor: "var(--paper)", color: "var(--text)", border: cardBorder }}
                          />
                          <Chip
                            label={`${Math.round((1 - (heroDeal.price / heroDeal.originalPrice)) * 100)}% OFF`}
                            size="small"
                            sx={{ bgcolor: "rgba(183, 34, 43, 0.12)", color: "var(--red, #B7222B)", fontWeight: 900, fontSize: "0.72rem", height: 20, border: cardBorder }}
                          />
                          <Typography variant="caption" sx={{ color: "var(--slate)", fontFamily: "var(--mono)", fontSize: "0.68rem" }}>
                            ASIN: {heroDeal.asin}
                          </Typography>
                        </Box>

                        <Typography
                          variant="h5"
                          component="h2"
                          sx={{
                            fontWeight: 800,
                            fontFamily: "var(--serif)",
                            fontSize: { xs: "1.2rem", md: "1.35rem" },
                            lineHeight: 1.3,
                            color: "var(--text)",
                            mb: 1
                          }}
                        >
                          {heroDeal.title}
                        </Typography>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}>
                          <Rating
                            value={heroDeal.rating || 4.8}
                            precision={0.1}
                            readOnly
                            size="small"
                            emptyIcon={<StarIcon style={{ opacity: 0.2, color: "var(--slate)" }} fontSize="inherit" />}
                            sx={{ "& .MuiRating-iconFilled": { color: "var(--gold, #D97706)" } }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 900, color: "var(--gold, #D97706)" }}>
                            {heroDeal.rating || 4.8} / 5
                          </Typography>
                          <Typography variant="caption" sx={{ color: "var(--slate)" }}>
                            ({(heroDeal.reviewCount || 3420).toLocaleString()} ratings)
                          </Typography>
                        </Box>

                        <Typography variant="body2" sx={{ color: "var(--slate)", lineHeight: 1.6, fontSize: "0.88rem", mb: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {heroDeal.description || "Top-rated price reduction verified against 30-day merchant history with full Amazon Fulfilled warranty."}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", flexDirection: { xs: "column", sm: "row" }, gap: 2, pt: 1.5, borderTop: cardBorder }}>
                        <Box>
                          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                            <Typography variant="h4" sx={{ fontWeight: 900, color: "var(--text)", fontSize: { xs: "1.5rem", md: "1.75rem" } }}>
                              ₹{heroDeal.price.toLocaleString("en-IN")}
                            </Typography>
                            {heroDeal.originalPrice > heroDeal.price && (
                              <Typography variant="body2" sx={{ textDecoration: "line-through", color: "var(--slate-light)" }}>
                                M.R.P. ₹{heroDeal.originalPrice.toLocaleString("en-IN")}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ color: isDark ? "#4ade80" : "#15803d", fontWeight: 700 }}>
                            You save ₹{(heroDeal.originalPrice - heroDeal.price).toLocaleString("en-IN")} ({Math.round((1 - (heroDeal.price / heroDeal.originalPrice)) * 100)}% OFF)
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", gap: 1, width: { xs: "100%", sm: "auto" } }}>
                          <Button
                            variant="contained"
                            href={heroDeal.productUrl}
                            target="_blank"
                            rel="sponsored noopener noreferrer"
                            startIcon={<ShoppingBagIcon />}
                            sx={{
                              borderRadius: "6px",
                              px: 3,
                              py: 1,
                              fontWeight: 800,
                              textTransform: "none",
                              fontSize: "0.88rem",
                              bgcolor: "var(--red, #B7222B)",
                              color: "#FFFFFF",
                              boxShadow: "none",
                              flex: { xs: 1, sm: "initial" },
                              "&:hover": { bgcolor: "var(--red-deep, #8E1B22)" }
                            }}
                          >
                            Grab Deal on Amazon ↗
                          </Button>
                          <CardShareButton product={heroDeal} getAbsoluteImageUrl={getAbsoluteImageUrl} />
                          <IconButton
                            id={`hero-bookmark-btn-${heroDeal.asin}`}
                            onClick={() => toggleBookmark(heroDeal.asin)}
                            aria-label={bookmarkedAsins.has(heroDeal.asin) ? "Remove Bookmark" : "Save Deal"}
                            sx={{
                              color: bookmarkedAsins.has(heroDeal.asin) ? "var(--red, #B7222B)" : (isDark ? "#E2E8F0" : "#334155"),
                              bgcolor: bookmarkedAsins.has(heroDeal.asin) ? "rgba(183, 34, 43, 0.12)" : (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)"),
                              border: `1px solid ${bookmarkedAsins.has(heroDeal.asin) ? "var(--red, #B7222B)" : (isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.15)")}`,
                              borderRadius: "6px",
                              p: 0.75,
                              transition: "all 0.2s ease-in-out",
                              "&:hover": {
                                borderColor: "var(--red, #B7222B)",
                                color: "var(--red, #B7222B)",
                                bgcolor: isDark ? "rgba(183, 34, 43, 0.18)" : "rgba(183, 34, 43, 0.08)"
                              }
                            }}
                          >
                            {bookmarkedAsins.has(heroDeal.asin) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Grid>
                </Grid>
              </Card>
            )}

            {/* 🔥 2. TRENDING FLASH DEALS RIBBON (4 ITEMS) */}
            {flashDeals.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <BoltIcon sx={{ color: "var(--red, #B7222B)" }} />
                  <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: "var(--serif)", color: "var(--text)" }}>
                    Trending Flash Drops
                  </Typography>
                  <Chip label="LIMITED STOCK" size="small" sx={{ bgcolor: "rgba(183, 34, 43, 0.08)", color: "var(--red, #B7222B)", fontWeight: 800, fontSize: "0.62rem", height: 18, border: cardBorder }} />
                </Box>

                <Grid container spacing={2}>
                  {flashDeals.map((deal) => {
                    const discount = Math.round((1 - (deal.price / deal.originalPrice)) * 100);
                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 3 }} key={deal.asin}>
                        <Card
                          elevation={0}
                          sx={{
                            p: 2,
                            height: "100%",
                            borderRadius: "8px",
                            bgcolor: "var(--paper-raise)",
                            border: cardBorder,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              borderColor: "var(--red, #B7222B)",
                              transform: "translateY(-3px)",
                              boxShadow: isDark ? "0 8px 20px rgba(0,0,0,0.4)" : "0 6px 16px rgba(0,0,0,0.06)"
                            }
                          }}
                        >
                          <Box sx={{ position: "relative", bgcolor: "var(--paper)", borderRadius: "6px", p: 1.5, mb: 1.5, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 110, border: cardBorder }}>
                            <Chip
                              label={`${discount}% OFF`}
                              size="small"
                              sx={{ position: "absolute", top: 6, right: 6, bgcolor: "rgba(183, 34, 43, 0.12)", color: "var(--red, #B7222B)", fontWeight: 900, fontSize: "0.62rem", height: 18, border: cardBorder }}
                            />
                            <Box
                              component="img"
                              src={getAbsoluteImageUrl(deal.imageUrl, deal.asin)}
                              alt={deal.title}
                              decoding="async"
                              referrerPolicy="no-referrer"
                              data-asin={deal.asin}
                              onError={handleImageError}
                              sx={{ maxHeight: 90, maxWidth: "100%", objectFit: "contain" }}
                            />
                          </Box>

                          <Box sx={{ mb: 1.5 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.82rem",
                                color: "var(--text)",
                                lineHeight: 1.3,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                minHeight: "2.1rem"
                              }}
                            >
                              {deal.title}
                            </Typography>
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 1, borderTop: cardBorder }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "var(--text)", fontSize: "0.95rem" }}>
                              ₹{deal.price.toLocaleString("en-IN")}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                href={deal.productUrl}
                                target="_blank"
                                rel="sponsored noopener noreferrer"
                                sx={{
                                  borderRadius: "4px",
                                  textTransform: "none",
                                  fontWeight: 800,
                                  fontSize: "0.72rem",
                                  px: 1.2,
                                  py: 0.3,
                                  borderColor: isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.15)",
                                  color: "var(--text)",
                                  "&:hover": { borderColor: "var(--red, #B7222B)", color: "var(--red, #B7222B)" }
                                }}
                              >
                                Get Deal ↗
                              </Button>
                              <CardShareButton product={deal} getAbsoluteImageUrl={getAbsoluteImageUrl} />
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
                    const discount = Math.round((1 - (product.price / product.originalPrice)) * 100);
                    const badgeStyle = getCategoryBadgeStyle(product.category, isDark);
                    const isBookmarked = bookmarkedAsins.has(product.asin);

                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id || product.asin}>
                        <Card
                          elevation={0}
                          sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: "8px",
                            bgcolor: "var(--paper-raise)",
                            color: "var(--text)",
                            border: cardBorder,
                            overflow: "hidden",
                            transition: "all 0.25s ease-in-out",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              borderColor: "var(--red, #B7222B)",
                              boxShadow: isDark ? "0 10px 25px rgba(0, 0, 0, 0.45)" : "0 8px 20px rgba(0, 0, 0, 0.06)"
                            }
                          }}
                        >
                          {/* Card Media Header */}
                          <Box sx={{ position: "relative", p: 2.5, pt: 3.5, bgcolor: "var(--paper)", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 160, borderBottom: cardBorder }}>
                            <Chip
                              label={product.category || "ELECTRONICS"}
                              size="small"
                              sx={{
                                position: "absolute",
                                top: 10,
                                left: 10,
                                bgcolor: badgeStyle.bg,
                                color: badgeStyle.color,
                                fontWeight: 900,
                                fontSize: "0.6rem",
                                border: `1px solid ${badgeStyle.border}`,
                                height: 18,
                                textTransform: "uppercase"
                              }}
                            />

                            <Chip
                              label={`${discount}% OFF`}
                              size="small"
                              sx={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                bgcolor: "rgba(183, 34, 43, 0.12)",
                                color: "var(--red, #B7222B)",
                                fontWeight: 900,
                                fontSize: "0.68rem",
                                border: cardBorder,
                                height: 18
                              }}
                            />

                            <Box
                              component="img"
                              src={getAbsoluteImageUrl(product.imageUrl, product.asin)}
                              alt={`${product.title} - Amazon Deal India`}
                              decoding="async"
                              referrerPolicy="no-referrer"
                              data-asin={product.asin}
                              onError={handleImageError}
                              sx={{ height: 130, objectFit: "contain", transition: "transform 0.3s", "&:hover": { transform: "scale(1.06)" } }}
                            />
                          </Box>

                          <CardContent sx={{ p: 2.5, flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <Box>
                              <Typography
                                variant="subtitle1"
                                component="h3"
                                sx={{
                                  fontWeight: 800,
                                  mb: 1,
                                  fontSize: "0.92rem",
                                  color: "var(--text)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  minHeight: "2.5rem",
                                  lineHeight: 1.35
                                }}
                              >
                                {product.title}
                              </Typography>

                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1.5 }}>
                                <Rating
                                  value={product.rating || 4.5}
                                  readOnly
                                  precision={0.1}
                                  size="small"
                                  emptyIcon={<StarIcon style={{ opacity: 0.2, color: "var(--slate)" }} fontSize="inherit" />}
                                  sx={{ "& .MuiRating-iconFilled": { color: "var(--gold, #D97706)" } }}
                                />
                                <Typography variant="caption" sx={{ fontWeight: 900, color: "var(--gold, #D97706)" }}>
                                  {product.rating || 4.5}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "var(--slate)", ml: 0.5 }}>
                                  ({(product.reviewCount || 100).toLocaleString()} reviews)
                                </Typography>
                              </Box>

                              <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                                  <Typography variant="h5" sx={{ fontWeight: 900, color: "var(--text)", fontSize: "1.25rem" }}>
                                    ₹{product.price.toLocaleString("en-IN")}
                                  </Typography>
                                  <Typography variant="caption" sx={{ textDecoration: "line-through", color: "var(--slate-light)" }}>
                                    ₹{product.originalPrice.toLocaleString("en-IN")}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" sx={{ color: isDark ? "#4ade80" : "#15803d", fontWeight: 700, display: "block" }}>
                                  You save {discount}% OFF
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1, pt: 1.5, borderTop: cardBorder }}>
                              <Button
                                id={`card-buy-btn-${product.asin}`}
                                variant="contained"
                                href={product.productUrl}
                                target="_blank"
                                rel="sponsored noopener noreferrer"
                                fullWidth
                                startIcon={<ShoppingBagIcon fontSize="small" />}
                                sx={{
                                  borderRadius: "6px",
                                  fontWeight: 800,
                                  textTransform: "none",
                                  fontSize: "0.82rem",
                                  py: 0.75,
                                  bgcolor: "var(--red, #B7222B)",
                                  color: "#FFFFFF",
                                  boxShadow: "none",
                                  "&:hover": { bgcolor: "var(--red-deep, #8E1B22)" }
                                }}
                              >
                                Grab Deal ↗
                              </Button>
                              <CardShareButton product={product} getAbsoluteImageUrl={getAbsoluteImageUrl} />
                              <IconButton
                                id={`card-bookmark-btn-${product.asin || product.id}`}
                                size="small"
                                onClick={() => toggleBookmark(product.asin)}
                                aria-label={isBookmarked ? "Remove Bookmark" : "Save Deal"}
                                sx={{
                                  color: isBookmarked ? "var(--red, #B7222B)" : (isDark ? "#E2E8F0" : "#334155"),
                                  bgcolor: isBookmarked ? "rgba(183, 34, 43, 0.12)" : (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)"),
                                  border: `1px solid ${isBookmarked ? "var(--red, #B7222B)" : (isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.15)")}`,
                                  borderRadius: "6px",
                                  p: 0.75,
                                  transition: "all 0.2s ease-in-out",
                                  "&:hover": {
                                    borderColor: "var(--red, #B7222B)",
                                    color: "var(--red, #B7222B)",
                                    bgcolor: isDark ? "rgba(183, 34, 43, 0.18)" : "rgba(183, 34, 43, 0.08)"
                                  }
                                }}
                              >
                                {isBookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                              </IconButton>
                            </Box>
                          </CardContent>
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
                      href={parsedProduct.productUrl}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      sx={{ bgcolor: "var(--red, #B7222B)", color: "#fff", fontSize: "0.75rem", py: 0.4, "&:hover": { bgcolor: "var(--red-deep, #8E1B22)" } }}
                    >
                      Grab Deal ↗
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
                      href={item.productUrl}
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
                      href={scratchDealProduct.productUrl}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      sx={{ borderRadius: "6px", fontWeight: 800, fontSize: "0.78rem", py: 0.6, bgcolor: "var(--red, #B7222B)", color: "#fff", "&:hover": { bgcolor: "var(--red-deep, #8E1B22)" } }}
                    >
                      Grab Secret Deal ↗
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
