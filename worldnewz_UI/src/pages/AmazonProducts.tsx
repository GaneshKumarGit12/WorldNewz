import React, { useState, useEffect, useRef, useMemo } from "react";
import Container from "@mui/material/Container";
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
import Divider from "@mui/material/Divider";
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
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SecurityIcon from "@mui/icons-material/Security";
import ShareIcon from "@mui/icons-material/Share";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PinterestIcon from "@mui/icons-material/Pinterest";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SearchIcon from "@mui/icons-material/Search";
import TableChartIcon from "@mui/icons-material/TableChart";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import FilterListIcon from "@mui/icons-material/FilterList";
import TuneIcon from "@mui/icons-material/Tune";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

import { Link as RouterLink } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import { fetchAmazonProducts, parseAmazonProductUrl } from "../api/apiClient";
import type { AmazonProduct } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb, JSONLDFAQPage, JSONLDProductList } from "../seo/JSONLDSchemas";
import { useColorMode } from "../context/ThemeContext";

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
const getCategoryBadgeStyle = (category: string = "") => {
  const cat = category.toLowerCase().trim();
  if (cat.includes("electronics") || cat.includes("gadget")) {
    return { bg: "rgba(59, 130, 246, 0.15)", color: "#60A5FA", border: "rgba(59, 130, 246, 0.3)" };
  }
  if (cat.includes("kitchen") || cat.includes("home")) {
    return { bg: "rgba(16, 185, 129, 0.15)", color: "#34D399", border: "rgba(16, 185, 129, 0.3)" };
  }
  if (cat.includes("lifestyle") || cat.includes("fashion")) {
    return { bg: "rgba(168, 85, 247, 0.15)", color: "#C084FC", border: "rgba(168, 85, 247, 0.3)" };
  }
  return { bg: "rgba(245, 158, 11, 0.15)", color: "#FBBF24", border: "rgba(245, 158, 11, 0.3)" };
};

interface DataGridShareCellProps {
  row: AmazonProduct;
  copiedAsin: string | null;
  onCopy: (url: string, asin: string) => void;
  getAbsoluteImageUrl: (url: string | undefined | null, asin?: string) => string;
}

const DataGridShareCell: React.FC<DataGridShareCellProps> = React.memo(({ row, copiedAsin, onCopy, getAbsoluteImageUrl }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    setAnchorEl(null);
  };

  const isCopied = copiedAsin === row.asin;
  const title = row.title || "Amazon Deal";
  const productUrl = row.productUrl || "";
  const imageUrl = getAbsoluteImageUrl(row.imageUrl, row.asin);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, height: "100%" }} onClick={(e) => e.stopPropagation()}>
      <Tooltip title="Facebook">
        <IconButton
          size="small"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          sx={{ color: "#3B82F6", p: 0.4, "&:hover": { bgcolor: "rgba(59, 130, 246, 0.15)" } }}
        >
          <FacebookIcon sx={{ fontSize: "0.95rem" }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="X (Twitter)">
        <IconButton
          size="small"
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent("Check out this deal: " + title)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          sx={{ color: "#9CA3AF", p: 0.4, "&:hover": { bgcolor: "rgba(156, 163, 175, 0.15)" } }}
        >
          <TwitterIcon sx={{ fontSize: "0.95rem" }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Pinterest">
        <IconButton
          size="small"
          href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(productUrl)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent((title + " - " + (row.description || "")).substring(0, 200))}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          sx={{ color: "#EF4444", p: 0.4, "&:hover": { bgcolor: "rgba(239, 68, 68, 0.15)" } }}
        >
          <PinterestIcon sx={{ fontSize: "0.95rem" }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="WhatsApp">
        <IconButton
          size="small"
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Check out this deal: " + title + " " + productUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          sx={{ color: "#10B981", p: 0.4, "&:hover": { bgcolor: "rgba(16, 185, 129, 0.15)" } }}
        >
          <WhatsAppIcon sx={{ fontSize: "0.95rem" }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="Copy Link">
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onCopy(productUrl, row.asin);
          }}
          sx={{
            color: isCopied ? "#10B981" : "#6B7280",
            p: 0.4,
            "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" }
          }}
        >
          <ContentCopyIcon sx={{ fontSize: "0.95rem" }} />
        </IconButton>
      </Tooltip>

      <Tooltip title="More Options">
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{
            color: "#F59E0B",
            p: 0.4,
            bgcolor: "rgba(245, 158, 11, 0.1)",
            "&:hover": { bgcolor: "rgba(245, 158, 11, 0.2)" }
          }}
        >
          <ShareIcon sx={{ fontSize: "0.95rem" }} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose()}
        disableRestoreFocus
        slotProps={{ root: { onClick: (e: React.MouseEvent) => e.stopPropagation() } }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          onClick: (e: React.MouseEvent) => e.stopPropagation(),
          sx: {
            borderRadius: 2,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            bgcolor: "#1E293B",
            color: "#F8FAFC",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            minWidth: 195,
            zIndex: 1400
          }
        }}
      >
        <MenuItem
          component="a"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => handleClose(e)}
        >
          <ListItemIcon><FacebookIcon sx={{ color: "#3B82F6", fontSize: "1.1rem" }} /></ListItemIcon>
          <ListItemText primary="Facebook" primaryTypographyProps={{ variant: "body2", fontWeight: 700 }} />
        </MenuItem>

        <MenuItem
          component="a"
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent("Check out this deal: " + title)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => handleClose(e)}
        >
          <ListItemIcon><TwitterIcon sx={{ color: "#9CA3AF", fontSize: "1.1rem" }} /></ListItemIcon>
          <ListItemText primary="X (Twitter)" primaryTypographyProps={{ variant: "body2", fontWeight: 700 }} />
        </MenuItem>

        <MenuItem
          component="a"
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => handleClose(e)}
        >
          <ListItemIcon><LinkedInIcon sx={{ color: "#0A66C2", fontSize: "1.1rem" }} /></ListItemIcon>
          <ListItemText primary="LinkedIn" primaryTypographyProps={{ variant: "body2", fontWeight: 700 }} />
        </MenuItem>

        <MenuItem
          component="a"
          href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(productUrl)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent((title + " - " + (row.description || "")).substring(0, 200))}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => handleClose(e)}
        >
          <ListItemIcon><PinterestIcon sx={{ color: "#EF4444", fontSize: "1.1rem" }} /></ListItemIcon>
          <ListItemText primary="Pinterest" primaryTypographyProps={{ variant: "body2", fontWeight: 700 }} />
        </MenuItem>

        <MenuItem
          component="a"
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Check out this deal: " + title + " " + productUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => handleClose(e)}
        >
          <ListItemIcon><WhatsAppIcon sx={{ color: "#10B981", fontSize: "1.1rem" }} /></ListItemIcon>
          <ListItemText primary="WhatsApp" primaryTypographyProps={{ variant: "body2", fontWeight: 700 }} />
        </MenuItem>

        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />

        <MenuItem
          onClick={(e) => {
            onCopy(productUrl, row.asin);
            handleClose(e);
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon sx={{ color: isCopied ? "#10B981" : "#9CA3AF", fontSize: "1.1rem" }} />
          </ListItemIcon>
          <ListItemText
            primary={isCopied ? "Copied!" : "Copy Deal Link"}
            primaryTypographyProps={{ variant: "body2", fontWeight: 700, color: isCopied ? "#10B981" : "#F8FAFC" }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
});

const AmazonProducts: React.FC = () => {
  const { mode } = useColorMode();
  const isDark = mode === "dark";

  const currentMonthYear = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  const AMAZON_PLACEHOLDER = "/images/amazon_placeholder.png";
  const DEFAULT_SVG_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%230f172a"/><path d="M150 90 L210 190 L90 190 Z" fill="%23ff7700" opacity="0.8"/><text x="150" y="215" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23ffffff" text-anchor="middle">AMAZON DEAL</text></svg>`;

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
  const [viewMode, setViewMode] = useState<"datagrid" | "grid">("datagrid");
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [cardPage, setCardPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [bookmarkedAsins, setBookmarkedAsins] = useState<Set<string>>(new Set());

  // Parser / search states
  const [urlInput, setUrlInput] = useState<string>("");
  const [parsedProduct, setParsedProduct] = useState<AmazonProduct | null>(null);
  const [parseLoading, setParseLoading] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [activeVerificationStep, setActiveVerificationStep] = useState<number>(0);
  const [copiedAsin, setCopiedAsin] = useState<string | null>(null);

  // Scratch card state
  const [scratchRevealed, setScratchRevealed] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleCopyLink = (url: string, asin: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopiedAsin(asin);
        setTimeout(() => setCopiedAsin(null), 2000);
      })
      .catch(() => {});
  };

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
      setTimeout(() => setActiveVerificationStep(2), 700);
      setTimeout(() => setActiveVerificationStep(3), 1400);

      const res = await parseAmazonProductUrl(urlInput.trim());
      const item = res.data?.product || (res.data as any);

      setTimeout(() => {
        setActiveVerificationStep(4);
        setParsedProduct(item);
        setParseLoading(false);
      }, 2100);
    } catch (err: any) {
      setParseError(err.message || "Failed to resolve Amazon link. Please check the URL format.");
      setParseLoading(false);
    }
  };

  // Scratch card logic
  const scratchDealProduct = useMemo(() => {
    if (products.length === 0) return null;
    return products[0];
  }, [products]);

  useEffect(() => {
    if (!scratchDealProduct || scratchRevealed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth || 500;
    canvas.height = canvas.offsetHeight || 300;

    ctx.fillStyle = isDark ? "#1e293b" : "#cbd5e1";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "bold 20px 'Outfit', sans-serif";
    ctx.fillStyle = "#ff7700";
    ctx.textAlign = "center";
    ctx.fillText("🎁 SCRATCH HERE TO REVEAL SECRET DEAL", canvas.width / 2, canvas.height / 2);
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
    ctx.arc(pos.x, pos.y, 24, 0, Math.PI * 2);
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

    if (ratio >= 0.45) {
      setScratchRevealed(true);
    }
  };

  const handleRevealClick = () => {
    setScratchRevealed(true);
  };

  // Categories list
  const categories = ["All", "Electronics", "Kitchen & Home", "Gadgets", "Lifestyle", "Shopping"];

  // Deduplicate products by ASIN while preserving newest-first API order
  const uniqueProducts = useMemo(() => {
    return products.filter((p, index, self) =>
      Boolean(p.asin) && index === self.findIndex(t => (t.asin || "").trim().toUpperCase() === (p.asin || "").trim().toUpperCase())
    );
  }, [products]);

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

  // Card Pagination calculation
  const CARDS_PER_PAGE = 6;
  const totalCardPages = Math.ceil(filteredProducts.length / CARDS_PER_PAGE) || 1;
  const paginatedCardProducts = useMemo(() => {
    const start = (cardPage - 1) * CARDS_PER_PAGE;
    return filteredProducts.slice(start, start + CARDS_PER_PAGE);
  }, [filteredProducts, cardPage]);

  // MUI DataGrid Columns Definition
  const columns: GridColDef<AmazonProduct>[] = [
    {
      field: "imageUrl",
      headerName: "IMAGE",
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<AmazonProduct>) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", py: 0.5 }}>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 2,
              bgcolor: "#0F172A",
              border: "1px solid #1E293B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 0.5
            }}
          >
            <Box
              component="img"
              src={getAbsoluteImageUrl(params.row.imageUrl, params.row.asin)}
              alt={params.row.title || "Amazon Deal"}
              decoding="async"
              referrerPolicy="no-referrer"
              data-asin={params.row.asin}
              onError={handleImageError}
              sx={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain"
              }}
            />
          </Box>
        </Box>
      )
    },
    {
      field: "title",
      headerName: "PRODUCT & CATEGORY",
      flex: 2,
      minWidth: 260,
      renderCell: (params: GridRenderCellParams<AmazonProduct>) => {
        const badgeStyle = getCategoryBadgeStyle(params.row.category);
        return (
          <Box sx={{ py: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Chip
                label={params.row.category || "ELECTRONICS"}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.62rem",
                  fontWeight: 900,
                  bgcolor: badgeStyle.bg,
                  color: badgeStyle.color,
                  border: `1px solid ${badgeStyle.border}`,
                  textTransform: "uppercase",
                  letterSpacing: 0.5
                }}
              />
              {params.row.asin && (
                <Typography variant="caption" sx={{ fontSize: "0.68rem", fontFamily: "monospace", color: "#64748B" }}>
                  ASIN: {params.row.asin}
                </Typography>
              )}
            </Box>
            <Typography
              variant="subtitle2"
              component="a"
              href={params.row.productUrl}
              target="_blank"
              rel="sponsored noopener noreferrer"
              sx={{
                fontWeight: 800,
                color: "#F8FAFC",
                textDecoration: "none",
                fontSize: "0.88rem",
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                "&:hover": { color: "#FF7700" }
              }}
            >
              {params.row.title}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: "rating",
      headerName: "RATING",
      width: 140,
      renderCell: (params: GridRenderCellParams<AmazonProduct>) => (
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Rating
              value={params.row.rating || 4.5}
              readOnly
              precision={0.1}
              size="small"
              emptyIcon={<StarIcon style={{ opacity: 0.2, color: "#64748B" }} fontSize="inherit" />}
              sx={{ "& .MuiRating-iconFilled": { color: "#F59E0B" } }}
            />
            <Typography variant="caption" sx={{ fontWeight: 900, color: "#F59E0B" }}>
              {params.row.rating || 4.5}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748B" }}>
            {(params.row.reviewCount || 100).toLocaleString()} reviews
          </Typography>
        </Box>
      )
    },
    {
      field: "price",
      headerName: "DEAL PRICE",
      width: 135,
      renderCell: (params: GridRenderCellParams<AmazonProduct>) => (
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#F8FAFC", lineHeight: 1.2 }}>
            ₹{(params.row.price || 0).toLocaleString("en-IN")}
          </Typography>
          {params.row.originalPrice > params.row.price && (
            <Typography variant="caption" sx={{ textDecoration: "line-through", fontSize: "0.72rem", color: "#64748B" }}>
              M.R.P. ₹{params.row.originalPrice.toLocaleString("en-IN")}
            </Typography>
          )}
        </Box>
      )
    },
    {
      field: "discount",
      headerName: "DISCOUNT",
      width: 110,
      valueGetter: (_value, row) => Math.round((1 - (row.price / row.originalPrice)) * 100),
      renderCell: (params: GridRenderCellParams<AmazonProduct>) => {
        const discount = Math.round((1 - (params.row.price / params.row.originalPrice)) * 100);
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Chip
              label={`${isNaN(discount) || discount < 0 ? 0 : discount}% OFF`}
              sx={{
                bgcolor: "#3B1119",
                color: "#FF4D4D",
                fontWeight: 900,
                fontSize: "0.72rem",
                borderRadius: "6px",
                height: 22,
                px: 0.5,
                border: "1px solid rgba(239, 68, 68, 0.3)"
              }}
            />
          </Box>
        );
      }
    },
    {
      field: "share",
      headerName: "SHARE DEAL",
      width: 220,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<AmazonProduct>) => (
        <DataGridShareCell
          row={params.row}
          copiedAsin={copiedAsin}
          onCopy={handleCopyLink}
          getAbsoluteImageUrl={getAbsoluteImageUrl}
        />
      )
    },
    {
      field: "action",
      headerName: "ACTION",
      width: 165,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<AmazonProduct>) => {
        const isBookmarked = bookmarkedAsins.has(params.row.asin);
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, height: "100%" }} onClick={(e) => e.stopPropagation()}>
            <Button
              variant="contained"
              href={params.row.productUrl}
              target="_blank"
              rel="sponsored noopener noreferrer"
              size="small"
              sx={{
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
                fontSize: "0.78rem",
                px: 1.75,
                py: 0.6,
                bgcolor: "#FF7700",
                color: "#FFFFFF",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#E66A00",
                  boxShadow: "0 4px 12px rgba(255, 119, 0, 0.3)"
                }
              }}
            >
              Grab Deal ↗
            </Button>
            <IconButton
              size="small"
              onClick={() => toggleBookmark(params.row.asin)}
              sx={{ color: isBookmarked ? "#FF7700" : "#64748B" }}
            >
              {isBookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
            </IconButton>
          </Box>
        );
      }
    }
  ];

  return (
    <Box sx={{ bgcolor: isDark ? "#0B0F19" : "#0F172A", color: "#F8FAFC", minHeight: "100vh", pb: 8 }}>
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

      <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
        {/* E-E-A-T FTC Affiliate Disclosure Banner */}
        <Alert 
          severity="info" 
          icon={<SecurityIcon sx={{ color: "#FF7700" }} />}
          sx={{ 
            mb: 4, 
            borderRadius: 3, 
            bgcolor: "#131C2E",
            border: "1px solid #1E2A44",
            color: "#94A3B8",
            fontWeight: 500,
            fontSize: "0.85rem",
            "& .MuiAlert-message": { color: "#CBD5E1" }
          }}
        >
          <strong style={{ color: "#FF7700" }}>Affiliate Disclosure:</strong> WorldNewzs participates in the Amazon Services LLC Associates Program. When you purchase through our verified referral links, we may earn an affiliate commission at no additional cost to you. All prices, discount percentages, and availability are verified daily by the WorldNewzs Shopping Editorial Desk.
        </Alert>

        {/* Header / UI Mockup Title Bar */}
        <Box 
          sx={{ 
            display: "flex", 
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            mb: 5
          }}
        >
          <Box>
            <Chip 
              label="● PRODUCT EXPLORER — UI/UX MOCKUP" 
              size="small"
              sx={{ 
                bgcolor: "rgba(255, 119, 0, 0.15)", 
                color: "#FF7700", 
                fontWeight: 900, 
                fontSize: "0.68rem", 
                letterSpacing: 1,
                mb: 1.5,
                border: "1px solid rgba(255, 119, 0, 0.3)" 
              }} 
            />
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 900, 
                fontFamily: "'Outfit', sans-serif",
                fontSize: { xs: "1.8rem", md: "2.5rem" },
                letterSpacing: "-0.02em"
              }}
            >
              Explore Amazon <Box component="span" sx={{ color: "#FF7700" }}>Deals</Box>, two ways
            </Typography>
            <Typography variant="body2" sx={{ color: "#94A3B8", maxWidth: 720, mt: 1, lineHeight: 1.6 }}>
              A dense, sortable DataGrid for power-browsing and a visual Card view for quick scanning — both wired to the same live discount feed, one-tap sharing, and lightweight pagination.
            </Typography>
          </Box>

          {/* Top Right View Mode Toggle Buttons */}
          <Box sx={{ display: "flex", gap: 1, bgcolor: "#131C2E", p: 0.75, borderRadius: 3, border: "1px solid #1E2A44" }}>
            <Button
              variant={viewMode === "datagrid" ? "contained" : "text"}
              onClick={() => setViewMode("datagrid")}
              startIcon={<TableChartIcon fontSize="small" />}
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                textTransform: "none",
                fontSize: "0.82rem",
                px: 2,
                py: 0.75,
                bgcolor: viewMode === "datagrid" ? "#FF7700" : "transparent",
                color: viewMode === "datagrid" ? "#FFFFFF" : "#94A3B8",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: viewMode === "datagrid" ? "#E66A00" : "rgba(255, 255, 255, 0.05)"
                }
              }}
            >
              DataGrid View
            </Button>
            <Button
              variant={viewMode === "grid" ? "contained" : "text"}
              onClick={() => setViewMode("grid")}
              startIcon={<ViewModuleIcon fontSize="small" />}
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                textTransform: "none",
                fontSize: "0.82rem",
                px: 2,
                py: 0.75,
                bgcolor: viewMode === "grid" ? "#FF7700" : "transparent",
                color: viewMode === "grid" ? "#FFFFFF" : "#94A3B8",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: viewMode === "grid" ? "#E66A00" : "rgba(255, 255, 255, 0.05)"
                }
              }}
            >
              Card View
            </Button>
          </Box>
        </Box>

        {/* ─── QUICK AMAZON DEAL GENERATOR & SHARE HUB (USER INTERACTION) ─── */}
        <Paper
          elevation={0}
          id="deals-generator-hub"
          sx={{
            p: { xs: 3, md: 4 },
            mb: 5,
            borderRadius: 4,
            bgcolor: "#131C2E",
            border: "1px solid #1E2A44"
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 800,
              mb: 1,
              color: "#FF7700",
              fontFamily: "'Outfit', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 1.5
            }}
          >
            <ShareIcon /> 🔍 Quick Amazon Deal Generator & Share Hub
          </Typography>
          <Typography variant="body2" sx={{ color: "#94A3B8", mb: 3 }}>
            Paste any Amazon India product link below to automatically resolve its title, description, and preview. Generate professional referral links instantly with integrated one-click social sharing!
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" }, mb: 3 }}>
            <TextField
              id="amazon-url-input"
              fullWidth
              placeholder="Paste Amazon product URL (e.g. https://www.amazon.in/dp/B0DSKNHX1T)"
              variant="outlined"
              size="medium"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "#0F172A",
                  color: "#F8FAFC",
                  "& fieldset": { borderColor: "#1E2A44" },
                  "&:hover fieldset": { borderColor: "#FF7700" },
                  "&.Mui-focused fieldset": { borderColor: "#FF7700" }
                }
              }}
            />
            <Button
              id="resolve-deal-btn"
              variant="contained"
              onClick={handleParseUrl}
              disabled={parseLoading || !urlInput.trim()}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                fontWeight: 900,
                whiteSpace: "nowrap",
                bgcolor: "#FF7700",
                color: "#FFFFFF",
                boxShadow: "none",
                "&:hover": { bgcolor: "#E66A00" }
              }}
            >
              {parseLoading ? <CircularProgress size={24} sx={{ color: "#FFFFFF" }} /> : "Resolve Deal ⚡"}
            </Button>
          </Box>

          {/* Verification Progress */}
          {parseLoading && (
            <Box sx={{ my: 3 }}>
              <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mb: 1, fontWeight: 700 }}>
                Verifying Deal Authenticity...
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {[
                  { id: 1, label: "Validating SSL Link" },
                  { id: 2, label: "Scraping Price & Image" },
                  { id: 3, label: "Checking Seller Rating" },
                  { id: 4, label: "Generating Tag" }
                ].map((step) => {
                  const isActive = activeVerificationStep === step.id;
                  const isCompleted = activeVerificationStep > step.id;
                  return (
                    <Box key={step.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.72rem",
                          fontWeight: 900,
                          bgcolor: isCompleted ? "#10B981" : (isActive ? "#FF7700" : "#1E2A44"),
                          color: "#FFFFFF"
                        }}
                      >
                        {isCompleted ? "✓" : step.id}
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: isActive ? 700 : 500, color: isActive ? "#FF7700" : "#94A3B8" }}>
                        {step.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {parseError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3, bgcolor: "#3B1119", color: "#FF4D4D", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
              {parseError}
            </Alert>
          )}

          {/* Resolved Preview Card */}
          {parsedProduct && (
            <Card sx={{ borderRadius: 3, border: "1.5px solid #FF7700", bgcolor: "#0F172A", color: "#F8FAFC", overflow: "hidden", mt: 2 }}>
              <Grid container>
                <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#1E293B", p: 3 }}>
                  <Box
                    component="img"
                    src={getAbsoluteImageUrl(parsedProduct.imageUrl, parsedProduct.asin)}
                    alt={`${parsedProduct.title} - Amazon Deal India`}
                    decoding="async"
                    referrerPolicy="no-referrer"
                    data-asin={parsedProduct.asin}
                    onError={handleImageError}
                    sx={{ maxHeight: 160, maxWidth: "100%", objectFit: "contain" }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 1.5 }}>
                        <Chip label={parsedProduct.category} color="warning" size="small" sx={{ fontWeight: 800, height: 22 }} />
                        <Chip label={`ASIN: ${parsedProduct.asin}`} variant="outlined" size="small" sx={{ height: 22, color: "#94A3B8", borderColor: "#1E2A44" }} />
                      </Box>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 800, mb: 1, fontSize: "1.1rem" }}>
                        {parsedProduct.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#94A3B8", mb: 2, lineHeight: 1.6 }}>
                        {parsedProduct.description}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: "#10B981" }}>
                          ₹{parsedProduct.price.toLocaleString("en-IN")}
                        </Typography>
                        {parsedProduct.originalPrice > parsedProduct.price && (
                          <>
                            <Typography variant="body2" sx={{ textDecoration: "line-through", color: "#64748B" }}>
                              ₹{parsedProduct.originalPrice.toLocaleString("en-IN")}
                            </Typography>
                            <Chip
                              label={`${Math.round((1 - (parsedProduct.price / parsedProduct.originalPrice)) * 100)}% OFF`}
                              size="small"
                              sx={{ bgcolor: "#3B1119", color: "#FF4D4D", fontWeight: 800, height: 20, fontSize: "0.7rem", border: "1px solid rgba(239, 68, 68, 0.3)" }}
                            />
                          </>
                        )}
                      </Box>

                      <Button
                        id={`parsed-buy-btn-${parsedProduct.asin}`}
                        variant="contained"
                        href={parsedProduct.productUrl}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                        startIcon={<ShoppingBagIcon />}
                        sx={{
                          borderRadius: 2,
                          fontWeight: 800,
                          textTransform: "none",
                          fontSize: "0.85rem",
                          px: 3,
                          py: 1,
                          bgcolor: "#FF7700",
                          color: "#FFFFFF",
                          "&:hover": { bgcolor: "#E66A00" }
                        }}
                      >
                        Grab Deal ↗
                      </Button>
                    </Box>
                  </CardContent>
                </Grid>
              </Grid>
            </Card>
          )}
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#FF7700" }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>
        ) : (
          <>
            {/* ─── DATAGRID VIEW CONTAINER ─── */}
            {viewMode === "datagrid" && (
              <Box sx={{ mb: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    bgcolor: "#131C2E",
                    border: "1px solid #1E2A44",
                    overflow: "hidden"
                  }}
                >
                  {/* Top Bar inside DataGrid Header */}
                  <Box
                    sx={{
                      p: 2.5,
                      px: 3,
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: { xs: "flex-start", sm: "center" },
                      justifyContent: "space-between",
                      gap: 2,
                      borderBottom: "1px solid #1E2A44"
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
                        DataGrid View
                      </Typography>
                      <Chip 
                        label="<datagrid />" 
                        size="small"
                        sx={{ bgcolor: "rgba(59, 130, 246, 0.15)", color: "#60A5FA", fontWeight: 800, fontSize: "0.7rem", height: 22, border: "1px solid rgba(59, 130, 246, 0.3)" }} 
                      />
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: "100%", sm: "auto" } }}>
                      <TextField
                        size="small"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon sx={{ color: "#64748B", fontSize: "1.1rem" }} />
                              </InputAdornment>
                            )
                          }
                        }}
                        sx={{
                          width: { xs: "100%", sm: 220 },
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            bgcolor: "#0F172A",
                            color: "#F8FAFC",
                            fontSize: "0.82rem",
                            "& fieldset": { borderColor: "#1E2A44" },
                            "&:hover fieldset": { borderColor: "#FF7700" },
                            "&.Mui-focused fieldset": { borderColor: "#FF7700" }
                          }
                        }}
                      />
                      <IconButton size="small" sx={{ color: "#9CA3AF", border: "1px solid #1E2A44", bgcolor: "#0F172A", p: 0.75 }}>
                        <FilterListIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" sx={{ color: "#9CA3AF", border: "1px solid #1E2A44", bgcolor: "#0F172A", p: 0.75 }}>
                        <TuneIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" sx={{ color: "#9CA3AF", border: "1px solid #1E2A44", bgcolor: "#0F172A", p: 0.75 }}>
                        <FileDownloadIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* DataGrid Component */}
                  <Box sx={{ height: 680, width: "100%" }}>
                    <DataGrid
                      rows={filteredProducts}
                      columns={columns}
                      getRowId={(row) => row.id || row.asin || `prod-${row.title}`}
                      rowHeight={72}
                      paginationModel={paginationModel}
                      onPaginationModelChange={setPaginationModel}
                      pageSizeOptions={[10, 20, 30]}
                      disableRowSelectionOnClick
                      sx={{
                        border: "none",
                        color: "#F8FAFC",
                        fontFamily: "inherit",
                        "& .MuiDataGrid-columnHeaders": {
                          backgroundColor: "#162238",
                          borderBottom: "1px solid #1E2A44"
                        },
                        "& .MuiDataGrid-columnHeaderTitle": {
                          fontWeight: 900,
                          fontSize: "0.72rem",
                          color: "#94A3B8",
                          textTransform: "uppercase",
                          letterSpacing: 1
                        },
                        "& .MuiDataGrid-row": {
                          borderBottom: "1px solid #1E2A44",
                          "&:hover": {
                            backgroundColor: "rgba(255, 119, 0, 0.04)"
                          }
                        },
                        "& .MuiDataGrid-cell": {
                          borderBottom: "none"
                        },
                        "& .MuiDataGrid-footerContainer": {
                          borderTop: "1px solid #1E2A44",
                          backgroundColor: "#0F172A",
                          color: "#94A3B8"
                        },
                        "& .MuiTablePagination-root": {
                          color: "#94A3B8"
                        },
                        "& .MuiTablePagination-selectIcon": {
                          color: "#94A3B8"
                        }
                      }}
                    />
                  </Box>
                </Paper>
              </Box>
            )}

            {/* ─── CARD VIEW CONTAINER ─── */}
            {viewMode === "grid" && (
              <Box sx={{ mb: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    bgcolor: "#131C2E",
                    border: "1px solid #1E2A44"
                  }}
                >
                  {/* Card Header & Filter Chips */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
                        Card View
                      </Typography>
                      <Chip 
                        label="<grid container />" 
                        size="small"
                        sx={{ bgcolor: "rgba(59, 130, 246, 0.15)", color: "#60A5FA", fontWeight: 800, fontSize: "0.7rem", height: 22, border: "1px solid rgba(59, 130, 246, 0.3)" }} 
                      />
                    </Box>

                    {/* Category Pills */}
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
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
                              bgcolor: isSelected ? "#FF7700" : "#0F172A",
                              color: isSelected ? "#FFFFFF" : "#94A3B8",
                              border: "1px solid",
                              borderColor: isSelected ? "#FF7700" : "#1E2A44",
                              cursor: "pointer",
                              "&:hover": {
                                bgcolor: isSelected ? "#E66A00" : "rgba(255, 255, 255, 0.08)"
                              }
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>

                  {/* Cards Grid (3 Columns Desktop) */}
                  <Grid container spacing={3}>
                    {paginatedCardProducts.map((product) => {
                      const discount = Math.round((1 - (product.price / product.originalPrice)) * 100);
                      const badgeStyle = getCategoryBadgeStyle(product.category);
                      const isBookmarked = bookmarkedAsins.has(product.asin);

                      return (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id || product.asin}>
                          <Card
                            sx={{
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              borderRadius: 3,
                              bgcolor: "#0F172A",
                              color: "#F8FAFC",
                              border: "1px solid #1E2A44",
                              overflow: "hidden",
                              transition: "all 0.25s ease-in-out",
                              "&:hover": {
                                transform: "translateY(-4px)",
                                borderColor: "#FF7700",
                                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.5)"
                              }
                            }}
                          >
                            {/* Card Media Header */}
                            <Box sx={{ position: "relative", p: 3, pt: 4, bgcolor: "#162238", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 180 }}>
                              <Chip
                                label={product.category || "ELECTRONICS"}
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 12,
                                  left: 12,
                                  bgcolor: badgeStyle.bg,
                                  color: badgeStyle.color,
                                  fontWeight: 900,
                                  fontSize: "0.62rem",
                                  border: `1px solid ${badgeStyle.border}`,
                                  height: 20,
                                  textTransform: "uppercase"
                                }}
                              />

                              <Chip
                                label={`${discount}% OFF`}
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 12,
                                  right: 12,
                                  bgcolor: "#3B1119",
                                  color: "#FF4D4D",
                                  fontWeight: 900,
                                  fontSize: "0.68rem",
                                  border: "1px solid rgba(239, 68, 68, 0.3)",
                                  height: 20
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
                                sx={{
                                  height: 140,
                                  objectFit: "contain",
                                  transition: "transform 0.3s",
                                  "&:hover": { transform: "scale(1.05)" }
                                }}
                              />
                            </Box>

                            <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                              <Box>
                                <Typography
                                  variant="subtitle1"
                                  component="h3"
                                  sx={{
                                    fontWeight: 800,
                                    mb: 1,
                                    fontSize: "0.95rem",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    minHeight: "2.6rem"
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
                                    emptyIcon={<StarIcon style={{ opacity: 0.2, color: "#64748B" }} fontSize="inherit" />}
                                    sx={{ "& .MuiRating-iconFilled": { color: "#F59E0B" } }}
                                  />
                                  <Typography variant="caption" sx={{ fontWeight: 900, color: "#F59E0B" }}>
                                    {product.rating || 4.5}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: "#64748B", ml: 0.5 }}>
                                    ({(product.reviewCount || 100).toLocaleString()} reviews)
                                  </Typography>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 900, color: "#F8FAFC" }}>
                                      ₹{product.price.toLocaleString("en-IN")}
                                    </Typography>
                                    <Typography variant="caption" sx={{ textDecoration: "line-through", color: "#64748B" }}>
                                      ₹{product.originalPrice.toLocaleString("en-IN")}
                                    </Typography>
                                  </Box>
                                  <Typography variant="caption" sx={{ color: "#10B981", fontWeight: 700, display: "block" }}>
                                    You save {discount}% OFF
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Card Bottom Social Bar & Action */}
                              <Box>
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                                  <Box sx={{ display: "flex", gap: 0.5 }}>
                                    <IconButton
                                      size="small"
                                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(product.productUrl || "")}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{ color: "#3B82F6", p: 0.35, "&:hover": { bgcolor: "rgba(59, 130, 246, 0.15)" } }}
                                    >
                                      <FacebookIcon sx={{ fontSize: "0.85rem" }} />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(product.productUrl || "")}&text=${encodeURIComponent("Check out this deal: " + product.title)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{ color: "#9CA3AF", p: 0.35, "&:hover": { bgcolor: "rgba(156, 163, 175, 0.15)" } }}
                                    >
                                      <TwitterIcon sx={{ fontSize: "0.85rem" }} />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(product.productUrl || "")}&media=${encodeURIComponent(getAbsoluteImageUrl(product.imageUrl, product.asin))}&description=${encodeURIComponent(((product.title || "") + " - " + (product.description || "")).substring(0, 200))}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{ color: "#EF4444", p: 0.35, "&:hover": { bgcolor: "rgba(239, 68, 68, 0.15)" } }}
                                    >
                                      <PinterestIcon sx={{ fontSize: "0.85rem" }} />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Check out this deal: " + product.title + " " + (product.productUrl || ""))}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{ color: "#10B981", p: 0.35, "&:hover": { bgcolor: "rgba(16, 185, 129, 0.15)" } }}
                                    >
                                      <WhatsAppIcon sx={{ fontSize: "0.85rem" }} />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleCopyLink(product.productUrl || "", product.asin)}
                                      sx={{ color: copiedAsin === product.asin ? "#10B981" : "#6B7280", p: 0.35 }}
                                    >
                                      <ContentCopyIcon sx={{ fontSize: "0.85rem" }} />
                                    </IconButton>
                                  </Box>
                                </Box>

                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <Button
                                    id={`card-buy-btn-${product.asin}`}
                                    variant="contained"
                                    href={product.productUrl}
                                    target="_blank"
                                    rel="sponsored noopener noreferrer"
                                    fullWidth
                                    startIcon={<ShoppingBagIcon fontSize="small" />}
                                    sx={{
                                      borderRadius: 2,
                                      fontWeight: 900,
                                      textTransform: "none",
                                      fontSize: "0.82rem",
                                      py: 1,
                                      bgcolor: "#FF7700",
                                      color: "#FFFFFF",
                                      boxShadow: "none",
                                      "&:hover": { bgcolor: "#E66A00" }
                                    }}
                                  >
                                    Grab Deal ↗
                                  </Button>
                                  <IconButton
                                    size="small"
                                    onClick={() => toggleBookmark(product.asin)}
                                    sx={{ color: isBookmarked ? "#FF7700" : "#64748B", border: "1px solid #1E2A44", borderRadius: 2 }}
                                  >
                                    {isBookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                                  </IconButton>
                                </Box>
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
                          color: "#94A3B8",
                          fontWeight: 700,
                          borderRadius: "50%",
                          border: "1px solid #1E2A44",
                          "&.Mui-selected": {
                            bgcolor: "#FF7700",
                            color: "#FFFFFF",
                            borderColor: "#FF7700",
                            "&:hover": { bgcolor: "#E66A00" }
                          }
                        }
                      }}
                    />
                  </Box>
                </Paper>
              </Box>
            )}

            {/* ─── FEATURE HIGHLIGHTS LEGEND FOOTER ─── */}
            <Grid container spacing={2} sx={{ mt: 4, mb: 6 }}>
              {[
                { id: 1, title: "View Switcher", desc: "Jump between the dense DataGrid and the visual Card view instantly — same data, no reload." },
                { id: 2, title: "Sortable Columns", desc: "Click any header to sort; the toolbar search filters rows live as you type." },
                { id: 3, title: "Verified Discount Badge", desc: "Auto-calculated against the 30-day price history, shown on every row and card." },
                { id: 4, title: "One-Tap Share", desc: "Direct social icons plus a native share sheet — no extra clicks to send a deal." },
                { id: 5, title: "Smart Pagination", desc: "MUI-powered paging keeps 1,000+ SKUs fast, with adjustable rows-per-page." }
              ].map((feat) => (
                <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={feat.id}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: "#131C2E",
                      border: "1px solid #1E2A44",
                      height: "100%",
                      display: "flex",
                      gap: 1.5
                    }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        border: "1.5px solid #FF7700",
                        color: "#FF7700",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: "0.72rem",
                        flexShrink: 0
                      }}
                    >
                      {feat.id}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.82rem", color: "#F8FAFC" }}>
                        {feat.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748B", display: "block", mt: 0.5, lineHeight: 1.4 }}>
                        {feat.desc}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* ─── GAMIFIED INTERACTIVE SCRATCH CARD ─── */}
            {scratchDealProduct && (
              <Box sx={{ mb: 6 }}>
                <Typography 
                  variant="h5" 
                  component="h2"
                  sx={{ 
                    fontWeight: 800, 
                    mb: 2.5, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 1,
                    fontFamily: "'Outfit', sans-serif" 
                  }}
                >
                  🎁 Scratch Card of the Day
                </Typography>
                
                <Card 
                  sx={{ 
                    maxWidth: 550, 
                    mx: "auto", 
                    position: "relative", 
                    borderRadius: 4,
                    overflow: "hidden",
                    bgcolor: "#131C2E",
                    border: "2px dashed rgba(255,119,0,0.4)"
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: "center" }}>
                    <Chip 
                      label="SECRET MEGA DEAL REVEALED" 
                      color="success" 
                      size="small" 
                      sx={{ fontWeight: 800, mb: 2 }}
                    />
                    
                    <Box 
                      component="img" 
                      src={getAbsoluteImageUrl(scratchDealProduct.imageUrl, scratchDealProduct.asin)} 
                      alt={`${scratchDealProduct.title} - Amazon Deal India`}
                      decoding="async"
                      referrerPolicy="no-referrer"
                      data-asin={scratchDealProduct.asin}
                      onError={handleImageError}
                      sx={{ 
                        maxHeight: 180, 
                        objectFit: "contain", 
                        mb: 2,
                        filter: scratchRevealed ? "none" : "blur(8px)",
                        transition: "filter 0.5s ease"
                      }}
                    />

                    <Typography variant="h6" component="h3" sx={{ fontWeight: 800, mb: 1, px: 2, color: "#F8FAFC" }}>
                      {scratchDealProduct.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: "#94A3B8", mb: 2, px: 2 }}>
                      {scratchDealProduct.description}
                    </Typography>

                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 1.5, mb: 3 }}>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: "#10B981" }}>
                        ₹{scratchDealProduct.price.toLocaleString("en-IN")}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#64748B", textDecoration: "line-through" }}>
                        ₹{scratchDealProduct.originalPrice.toLocaleString("en-IN")}
                      </Typography>
                      <Chip 
                        label={`${Math.round((1 - (scratchDealProduct.price / scratchDealProduct.originalPrice)) * 100)}% OFF`}
                        size="small"
                        sx={{ bgcolor: "#3B1119", color: "#FF4D4D", fontWeight: 800, height: 20, fontSize: "0.75rem", border: "1px solid rgba(239, 68, 68, 0.3)" }}
                      />
                    </Box>

                    <Button
                      id={`scratch-buy-btn-${scratchDealProduct.asin}`}
                      variant="contained"
                      href={scratchDealProduct.productUrl}
                      target="_blank"
                      rel="sponsored noopener noreferrer"
                      fullWidth
                      endIcon={<ArrowForwardIcon />}
                      sx={{
                        borderRadius: 3,
                        py: 1.5,
                        fontWeight: 900,
                        textTransform: "none",
                        fontSize: "1rem",
                        bgcolor: "#FF7700",
                        color: "#FFFFFF",
                        "&:hover": { bgcolor: "#E66A00" }
                      }}
                    >
                      Buy Secret Deal on Amazon ↗
                    </Button>
                  </CardContent>

                  {!scratchRevealed && (
                    <Box 
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 10,
                        touchAction: "none"
                      }}
                    >
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
                      
                      <Button
                        id="quick-reveal-btn"
                        size="small"
                        onClick={handleRevealClick}
                        sx={{
                          position: "absolute",
                          bottom: 15,
                          right: 15,
                          backgroundColor: "rgba(0,0,0,0.75)",
                          color: "white",
                          fontWeight: 800,
                          fontSize: "0.7rem",
                          borderRadius: 2,
                          "&:hover": { backgroundColor: "rgba(0,0,0,0.95)" }
                        }}
                      >
                        Quick Reveal
                      </Button>
                    </Box>
                  )}
                </Card>
              </Box>
            )}

            {/* ─── RICH PAGE INTRODUCTION SECTION ─── */}
            <Paper
              elevation={0}
              id="deals-editorial-intro"
              sx={{
                p: { xs: 3, md: 4 },
                mb: 6,
                borderRadius: 4,
                bgcolor: "#131C2E",
                border: "1px solid #1E2A44"
              }}
            >
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  color: "#FF7700",
                  fontFamily: "'Outfit', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}
              >
                <VerifiedUserIcon sx={{ color: "#FF7700" }} /> How We Hand-Pick & Verify Amazon India Deals Every Day
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: "#94A3B8", lineHeight: 1.7, fontSize: "0.92rem" }}>
                Welcome to the <strong>WorldNewzs Amazon Deals Hub</strong> for {currentMonthYear}. In a fast-paced online shopping landscape flooded with artificial discount badges and misleading promotional claims, finding genuine price drops on Amazon India requires rigorous price tracking. Every single product featured on this page undergoes a multi-stage editorial verification process to ensure maximum savings and authentic merchant quality.
              </Typography>
              <Typography variant="body1" paragraph sx={{ color: "#94A3B8", lineHeight: 1.7, fontSize: "0.92rem" }}>
                Our specialized shopping desk actively monitors price fluctuations across major product categories including{" "}
                <Box component={RouterLink} to="/technology" sx={{ color: "#FF7700", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                  Technology & Electronics
                </Box>
                ,{" "}
                <Box component={RouterLink} to="/shopping" sx={{ color: "#FF7700", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                  Home & Kitchen Appliances
                </Box>
                ,{" "}
                <Box component={RouterLink} to="/lifestyle" sx={{ color: "#FF7700", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                  Lifestyle & Fashion
                </Box>
                , and{" "}
                <Box component={RouterLink} to="/business" sx={{ color: "#FF7700", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                  Business Utilities
                </Box>
                . We cross-reference listed prices against 30-day historical averages to verify that every discount—ranging from 15% to over 70% OFF—represents a legitimate price drop rather than a temporary price inflation.
              </Typography>
              <Typography variant="body1" sx={{ color: "#94A3B8", lineHeight: 1.7, fontSize: "0.92rem" }}>
                Furthermore, we enforce strict seller quality controls: only products with a minimum customer rating of <strong>4.0 out of 5 stars</strong> and backed by Amazon Fulfilled logistics or certified brand stores are selected. Whether you are looking for flagship 5G smartphones, smart home projectors, ergonomic diwan cushions, or daily lifestyle essentials, our daily hand-picked collection brings you instant savings without the noise.
              </Typography>
            </Paper>

            {/* ─── FREQUENTLY ASKED QUESTIONS (FAQS) SECTION ─── */}
            <Box id="deals-faq-section" sx={{ mb: 4 }}>
              <Typography 
                variant="h6" 
                component="h2"
                sx={{ 
                  fontWeight: 800, 
                  mb: 3, 
                  fontFamily: "'Outfit', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 1
                }}
              >
                <HelpOutlineIcon sx={{ color: "#FF7700" }} /> Frequently Asked Questions (FAQs)
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {amazonDealsFaqs.map((faq, index) => (
                  <Accordion 
                    key={index}
                    elevation={0}
                    sx={{
                      borderRadius: "12px !important",
                      border: "1px solid #1E2A44",
                      bgcolor: "#131C2E",
                      color: "#F8FAFC",
                      overflow: "hidden",
                      "&:before": { display: "none" }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: "#FF7700" }} />}
                      id={`faq-summary-${index}`}
                      sx={{ px: 3, py: 0.5 }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
                        {faq.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                      <Typography variant="body2" sx={{ color: "#94A3B8", lineHeight: 1.7 }}>
                        {faq.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default AmazonProducts;
