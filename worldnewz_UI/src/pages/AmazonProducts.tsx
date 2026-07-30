import React, { useState, useEffect, useRef } from "react";
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
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Rating from "@mui/material/Rating";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import TimerIcon from "@mui/icons-material/Timer";
import StarIcon from "@mui/icons-material/Star";
import InfoIcon from "@mui/icons-material/Info";
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
import { Link as RouterLink } from "react-router-dom";

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

const AmazonProducts: React.FC = () => {
  const { mode } = useColorMode();
  const isDark = mode === "dark";

  const currentMonthYear = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  const AMAZON_PLACEHOLDER = "/images/amazon_placeholder.png";

  const getAbsoluteImageUrl = (url: string | undefined | null) => {
    if (!url || !url.trim()) return AMAZON_PLACEHOLDER;
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/images/")) {
      return trimmed;
    }
    return `https://images-eu.ssl-images-amazon.com/images/I/${trimmed}`;
  };

  const [products, setProducts] = useState<AmazonProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("All");
  
  // Timer for deals
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Parser / search states
  const [urlInput, setUrlInput] = useState<string>("");
  const [parsedProduct, setParsedProduct] = useState<AmazonProduct | null>(null);
  const [parseLoading, setParseLoading] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [activeVerificationStep, setActiveVerificationStep] = useState<number>(0);
  const [copiedAsin, setCopiedAsin] = useState<string | null>(null);

  const handleCopyLink = (url: string, asin: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopiedAsin(asin);
        setTimeout(() => setCopiedAsin(null), 2000);
      })
      .catch(() => {});
  };

  const handleParseUrl = async () => {
    if (!urlInput.trim()) {
      setParseError("Please enter a valid Amazon URL.");
      return;
    }
    try {
      setParseLoading(true);
      setParseError(null);
      setParsedProduct(null);
      setActiveVerificationStep(1); // Step 1: Resolving redirect

      const timer1 = setTimeout(() => setActiveVerificationStep(2), 1000); // Step 2: Extracting ASIN
      const timer2 = setTimeout(() => setActiveVerificationStep(3), 2000); // Step 3: Scraping details
      const timer3 = setTimeout(() => setActiveVerificationStep(4), 3000); // Step 4: Generating AI product mockup

      const res = await parseAmazonProductUrl(urlInput);

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (res.data && res.data.product) {
        setActiveVerificationStep(5); // Step 5: Storing permanently
        await new Promise(resolve => setTimeout(resolve, 800));

        setParsedProduct(res.data.product);
        setProducts(prev => {
          if (prev.some(p => p.asin === res.data.product.asin)) {
            return prev;
          }
          return [res.data.product, ...prev];
        });
      } else {
        setParseError("Failed to parse product. Verify link and try again.");
      }
    } catch (err: any) {
      setParseError(err.response?.data?.error || "Error connecting to server.");
    } finally {
      setParseLoading(false);
      setActiveVerificationStep(0);
    }
  };

  // Scratch Card States
  const [scratchRevealed, setScratchRevealed] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const scratchDealProduct = products.length > 0 ? products[0] : null;

  // Countdown timer logic
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const diff = midnight.getTime() - now.getTime();
      if (diff <= 0) return "00:00:00";

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (num: number) => num.toString().padStart(2, "0");
      return `${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch products on load
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchAmazonProducts();
        if (res.data && res.data.products) {
          setProducts(res.data.products);
        } else {
          setError("Failed to load deals. Please try again.");
        }
      } catch (err: any) {
        console.error("Error fetching amazon products:", err);
        setError("Error connecting to server. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Initialize Scratch Canvas
  useEffect(() => {
    if (loading || products.length === 0 || !canvasRef.current) return;
    initCanvas();
  }, [loading, products, scratchRevealed]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#cccccc");
    grad.addColorStop(0.3, "#e0e0e0");
    grad.addColorStop(0.5, "#b0b0b0");
    grad.addColorStop(0.8, "#f0f0f0");
    grad.addColorStop(1, "#999999");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 15 + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "#111111";
    ctx.font = "bold 16px Outfit, Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255,255,255,0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText("SCRATCH HERE WITH MOUSE/TOUCH", canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText("TO REVEAL SECRET DEAL! 🎁", canvas.width / 2, canvas.height / 2 + 15);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawingRef.current = true;
    handleDraw(e);
  };

  const handleDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || scratchRevealed || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercentage();
  };

  const handleEnd = () => {
    isDrawingRef.current = false;
  };

  const checkScratchPercentage = () => {
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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
  };

  // Categories list
  const categories = ["All", "Electronics", "Kitchen & Home", "Home & Decor", "Home Appliances", "Gadgets", "Lifestyle", "Services", "Shopping", "Gift Cards", "Education"];

  // Deduplicate products by ASIN to ensure no duplicate cards are displayed in grid
  const uniqueProducts = Array.from(new Map(products.map(p => [p.asin, p])).values());

  // Filter products based on selected category tab
  const filteredProducts = selectedTab === "All"
    ? uniqueProducts
    : uniqueProducts.filter(p => p.category.toLowerCase().trim() === selectedTab.toLowerCase().trim());

  return (
    <>
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

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* E-E-A-T FTC Affiliate Disclosure Banner */}
        <Alert 
          severity="info" 
          icon={<SecurityIcon sx={{ color: "#FF9900" }} />}
          sx={{ 
            mb: 3, 
            borderRadius: 3.5, 
            bgcolor: isDark ? "rgba(255, 153, 0, 0.08)" : "#FFF9F2", 
            border: "1px solid",
            borderColor: isDark ? "rgba(255, 153, 0, 0.3)" : "#FFE0B2",
            color: "text.primary",
            fontWeight: 500,
            fontSize: "0.85rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
          }}
        >
          <strong>Affiliate Disclosure:</strong> WorldNewzs participates in the Amazon Services LLC Associates Program. When you purchase through our verified referral links, we may earn an affiliate commission at no additional cost to you. All prices, discount percentages, and availability are verified daily by the WorldNewzs Shopping Editorial Desk.
        </Alert>

        {/* Header Hero Section */}
        <Box 
          sx={{
            background: isDark 
              ? "linear-gradient(135deg, #1f2937 0%, #111827 100%)" 
              : "linear-gradient(135deg, #FFF9F2 0%, #FFE9D1 100%)",
            borderRadius: 6,
            p: { xs: 3, md: 5 },
            textAlign: "center",
            mb: 4,
            border: "1px solid",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255, 153, 0, 0.15)",
            boxShadow: isDark 
              ? "0 10px 30px rgba(0,0,0,0.5)" 
              : "0 10px 30px rgba(255, 153, 0, 0.08)"
          }}
        >
          <Chip 
            icon={<FlashOnIcon sx={{ color: "#FF9900 !important" }} />}
            label={`LIGHTNING DEALS HUB • ${currentMonthYear.toUpperCase()}`}
            sx={{
              fontWeight: 800,
              fontSize: "0.85rem",
              mb: 2,
              background: isDark ? "#374151" : "#FFE5C9",
              color: isDark ? "#FF9900" : "#E27B00",
              border: "1px solid",
              borderColor: isDark ? "#4B5563" : "#FFC17A"
            }}
          />
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 900,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: -1,
              mb: 1.5,
              background: "linear-gradient(90deg, #ff8a00 0%, #ff5500 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: { xs: "2.2rem", md: "3.2rem" }
            }}
          >
            Amazon Deals of the Day ({currentMonthYear})
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ maxWidth: 700, mx: "auto", mb: 3, fontWeight: 500, lineHeight: 1.6 }}
          >
            Get verified, hand-picked Amazon products and massive discounts updated every single day. Grab flash sales before they expire!
          </Typography>

          {/* Countdown Clock */}
          <Paper
            elevation={0}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1.5,
              px: 3,
              py: 1.25,
              borderRadius: 4,
              backgroundColor: isDark ? "#111827" : "#FFFFFF",
              border: "1.5px solid",
              borderColor: isDark ? "#374151" : "#FFD8A8",
              boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
            }}
          >
            <TimerIcon sx={{ color: "#E27B00" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary" }}>
              Today's offers end in:{" "}
              <Box component="span" sx={{ fontFamily: "monospace", fontSize: "1.1rem", color: "#FF5500", ml: 1 }}>
                {timeLeft || "Loading..."}
              </Box>
            </Typography>
          </Paper>
        </Box>

        {/* ─── QUICK AMAZON DEAL GENERATOR & SHARE HUB (USER INTERACTION) ─── */}
        <Paper
          elevation={0}
          id="deals-generator-hub"
          sx={{
            p: { xs: 3, md: 4 },
            mb: 5,
            borderRadius: 5,
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
            border: "1px solid",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
            boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.2)" : "0 8px 32px rgba(0,0,0,0.05)"
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 800,
              mb: 1.5,
              color: "#FF9900",
              fontFamily: "'Outfit', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 1.5
            }}
          >
            <ShareIcon /> 🔍 Quick Amazon Deal Generator & Share Hub
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
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
                  borderRadius: 3.5,
                  "&.Mui-focused fieldset": {
                    borderColor: "#FF9900"
                  }
                }
              }}
            />
            <Button
              id="generate-deal-btn"
              variant="contained"
              disabled={parseLoading}
              onClick={handleParseUrl}
              sx={{
                borderRadius: 3.5,
                px: 4,
                py: 1.5,
                fontWeight: 800,
                textTransform: "none",
                fontSize: "0.95rem",
                bgcolor: "#FF9900",
                color: "white",
                "&:hover": {
                  bgcolor: "#E27B00"
                }
              }}
            >
              {parseLoading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Generate Preview"}
            </Button>
          </Box>

          {/* Background URL Verification Panel */}
          {activeVerificationStep > 0 && (
            <Box
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 4,
                bgcolor: isDark ? "rgba(255, 153, 0, 0.05)" : "#FFFBF7",
                border: "1px solid",
                borderColor: isDark ? "rgba(255, 153, 0, 0.15)" : "#FFE8D1",
                display: "flex",
                flexDirection: "column",
                gap: 2
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "text.primary", display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={18} sx={{ color: "#FF9900" }} /> Background URL Verification in Progress...
              </Typography>
              
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pl: 1 }}>
                {[
                  { id: 1, label: "Resolving short link & checking destination security" },
                  { id: 2, label: "Extracting product ASIN & validating store parameters" },
                  { id: 3, label: "Verifying and scraping product title, description & pricing details" },
                  { id: 4, label: "Generating custom AI product mockup based on title & description" },
                  { id: 5, label: "Storing product permanently in Deals Database" }
                ].map((step) => {
                  const isCompleted = activeVerificationStep > step.id;
                  const isActive = activeVerificationStep === step.id;
                  
                  return (
                    <Box key={step.id} sx={{ display: "flex", alignItems: "center", gap: 2, opacity: isCompleted || isActive ? 1 : 0.4 }}>
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          bgcolor: isCompleted ? "#22c55e" : (isActive ? "#FF9900" : "action.disabledBackground"),
                          color: isCompleted || isActive ? "#fff" : "text.secondary"
                        }}
                      >
                        {isCompleted ? "✓" : step.id}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? "#FF9900" : "text.primary"
                        }}
                      >
                        {step.label} {isActive && "..."}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {parseError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
              {parseError}
            </Alert>
          )}

          {/* Resolved Preview Card */}
          {parsedProduct && (
            <Card
              sx={{
                borderRadius: 4,
                border: "1.5px solid",
                borderColor: "#FF9900",
                overflow: "hidden",
                mt: 2,
                backgroundColor: isDark ? "#111827" : "#fafafa",
                transition: "all 0.3s"
              }}
            >
              <Grid container>
                <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#fff", p: 3 }}>
                  <Box
                    component="img"
                    src={getAbsoluteImageUrl(parsedProduct.imageUrl)}
                    alt={`${parsedProduct.title} - Amazon Deal India`}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = AMAZON_PLACEHOLDER;
                    }}
                    sx={{ maxHeight: 180, maxWidth: "100%", objectFit: "contain" }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <CardContent sx={{ p: 4, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 1.5 }}>
                        <Chip label={parsedProduct.category} color="warning" size="small" sx={{ fontWeight: 800, height: 22 }} />
                        <Chip label={`ASIN: ${parsedProduct.asin}`} variant="outlined" size="small" sx={{ height: 22 }} />
                      </Box>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 800, mb: 1, fontSize: "1.15rem" }}>
                        {parsedProduct.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                        {parsedProduct.description}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: "#22c55e" }}>
                          ₹{parsedProduct.price.toLocaleString("en-IN")}
                        </Typography>
                        {parsedProduct.originalPrice > parsedProduct.price && (
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                              ₹{parsedProduct.originalPrice.toLocaleString("en-IN")}
                            </Typography>
                            <Chip
                              label={`${Math.round((1 - (parsedProduct.price / parsedProduct.originalPrice)) * 100)}% OFF`}
                              size="small"
                              sx={{ backgroundColor: "#ef4444", color: "white", fontWeight: 800, height: 20, fontSize: "0.7rem" }}
                            />
                          </>
                        )}
                      </Box>

                      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                        {/* Social Share Buttons */}
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <IconButton
                            id="share-fb-btn"
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(parsedProduct.productUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: "#1877F2", border: "1px solid", borderColor: "divider", "&:hover": { bgcolor: "rgba(24,119,242,0.08)" } }}
                          >
                            <FacebookIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            id="share-twitter-btn"
                            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(parsedProduct.productUrl)}&text=${encodeURIComponent("Check out this amazing deal: " + parsedProduct.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: "text.primary", border: "1px solid", borderColor: "divider", "&:hover": { bgcolor: "action.hover" } }}
                          >
                            <TwitterIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            id="share-linkedin-btn"
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(parsedProduct.productUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: "#0A66C2", border: "1px solid", borderColor: "divider", "&:hover": { bgcolor: "rgba(10,102,194,0.08)" } }}
                          >
                            <LinkedInIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            id="share-pin-btn"
                            href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent("https://worldnewzs.in/amazon-products")}&media=${encodeURIComponent(getAbsoluteImageUrl(parsedProduct.imageUrl))}&description=${encodeURIComponent((parsedProduct.title || "").substring(0, 180))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: "#BD081C", border: "1px solid", borderColor: "divider", "&:hover": { bgcolor: "rgba(189,8,28,0.08)" } }}
                          >
                            <PinterestIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            id="share-wa-btn"
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Check out this amazing deal: " + parsedProduct.title + " " + parsedProduct.productUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: "#25D366", border: "1px solid", borderColor: "divider", "&:hover": { bgcolor: "rgba(37,211,102,0.08)" } }}
                          >
                            <WhatsAppIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            id="share-copy-btn"
                            onClick={() => handleCopyLink(parsedProduct.productUrl, parsedProduct.asin)}
                            sx={{ 
                              color: copiedAsin === parsedProduct.asin ? "#22c55e" : "text.secondary", 
                              border: "1px solid", 
                              borderColor: copiedAsin === parsedProduct.asin ? "#22c55e" : "divider", 
                              "&:hover": { bgcolor: "action.hover" } 
                            }}
                            title="Copy link to clipboard"
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        <Button
                          id={`parsed-buy-btn-${parsedProduct.asin}`}
                          variant="contained"
                          href={parsedProduct.productUrl}
                          target="_blank"
                          rel="sponsored noopener noreferrer"
                          startIcon={<ShoppingBagIcon />}
                          sx={{
                            borderRadius: 2.5,
                            fontWeight: 800,
                            textTransform: "none",
                            fontSize: "0.85rem",
                            px: 3,
                            py: 1,
                            background: "linear-gradient(135deg, #FF9900 0%, #FF5500 100%)",
                            "&:hover": {
                              background: "linear-gradient(135deg, #FFAA22 0%, #FF6611 100%)"
                            }
                          }}
                        >
                          Grab Deal ↗
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Grid>
              </Grid>
            </Card>
          )}
        </Paper>

        {/* ─── RICH PAGE INTRODUCTION SECTION (SEO THIN CONTENT FIX) ─── */}
        <Paper
          elevation={0}
          id="deals-editorial-intro"
          sx={{
            p: { xs: 3, md: 4 },
            mb: 5,
            borderRadius: 5,
            backgroundColor: isDark ? "#161b22" : "#fdfbf7",
            border: "1px solid",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,153,0,0.2)"
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 800,
              mb: 2,
              color: "#FF9900",
              fontFamily: "'Outfit', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 1
            }}
          >
            <VerifiedUserIcon sx={{ color: "#FF9900" }} /> How We Hand-Pick & Verify Amazon India Deals Every Day
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary" sx={{ lineHeight: 1.7, fontSize: "0.95rem" }}>
            Welcome to the <strong>WorldNewzs Amazon Deals Hub</strong> for {currentMonthYear}. In a fast-paced online shopping landscape flooded with artificial discount badges and misleading promotional claims, finding genuine price drops on Amazon India requires rigorous price tracking. Every single product featured on this page undergoes a multi-stage editorial verification process to ensure maximum savings and authentic merchant quality.
          </Typography>
          <Typography variant="body1" paragraph color="text.secondary" sx={{ lineHeight: 1.7, fontSize: "0.95rem" }}>
            Our specialized shopping desk actively monitors price fluctuations across major product categories including{" "}
            <Box component={RouterLink} to="/technology" sx={{ color: "#FF9900", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
              Technology & Electronics
            </Box>
            ,{" "}
            <Box component={RouterLink} to="/shopping" sx={{ color: "#FF9900", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
              Home & Kitchen Appliances
            </Box>
            ,{" "}
            <Box component={RouterLink} to="/lifestyle" sx={{ color: "#FF9900", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
              Lifestyle & Fashion
            </Box>
            , and{" "}
            <Box component={RouterLink} to="/business" sx={{ color: "#FF9900", fontWeight: 700, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
              Business Utilities
            </Box>
            . We cross-reference listed prices against 30-day historical averages to verify that every discount—ranging from 15% to over 70% OFF—represents a legitimate price drop rather than a temporary price inflation.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: "0.95rem" }}>
            Furthermore, we enforce strict seller quality controls: only products with a minimum customer rating of <strong>4.0 out of 5 stars</strong> and backed by Amazon Fulfilled logistics or certified brand stores are selected. Whether you are looking for flagship 5G smartphones, smart home projectors, ergonomic diwan cushions, or daily lifestyle essentials, our daily hand-picked collection brings you instant savings without the noise.
          </Typography>
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#FF9900" }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>
        ) : (
          <>
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
                    borderRadius: 5,
                    overflow: "hidden",
                    border: "2px dashed",
                    borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(255,153,0,0.4)",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
                  }}
                >
                  {/* Underneath: The Actual Deal content */}
                  <CardContent sx={{ p: 4, textAlign: "center" }}>
                    <Chip 
                      label="SECRET MEGA DEAL REVEALED" 
                      color="success" 
                      size="small" 
                      sx={{ fontWeight: 800, mb: 2 }}
                    />
                    
                    <Box 
                      component="img" 
                      src={getAbsoluteImageUrl(scratchDealProduct.imageUrl)} 
                      alt={`${scratchDealProduct.title} - Amazon Deal India`}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = AMAZON_PLACEHOLDER;
                      }}
                      sx={{ 
                        maxHeight: 180, 
                        objectFit: "contain", 
                        mb: 2,
                        filter: scratchRevealed ? "none" : "blur(8px)",
                        transition: "filter 0.5s ease"
                      }}
                    />

                    <Typography variant="h6" component="h3" sx={{ fontWeight: 800, mb: 1, px: 2 }}>
                      {scratchDealProduct.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, px: 2 }}>
                      {scratchDealProduct.description}
                    </Typography>

                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 1.5, mb: 3 }}>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: "#22c55e" }}>
                        ₹{scratchDealProduct.price.toLocaleString("en-IN")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                        ₹{scratchDealProduct.originalPrice.toLocaleString("en-IN")}
                      </Typography>
                      <Chip 
                        label={`${Math.round((1 - (scratchDealProduct.price / scratchDealProduct.originalPrice)) * 100)}% OFF`}
                        size="small"
                        sx={{ 
                          backgroundColor: "#ef4444", 
                          color: "white", 
                          fontWeight: 800, 
                          height: 20, 
                          fontSize: "0.75rem" 
                        }}
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
                        borderRadius: 3.5,
                        py: 1.5,
                        fontWeight: 900,
                        textTransform: "none",
                        fontSize: "1rem",
                        boxShadow: "0 6px 20px rgba(255, 153, 0, 0.2)",
                        background: "linear-gradient(135deg, #FF9900 0%, #FF5500 100%)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #FFAA22 0%, #FF6611 100%)",
                        }
                      }}
                    >
                      Buy Secret Deal on Amazon ↗
                    </Button>
                  </CardContent>

                  {/* Overneath: The Scratch Layer canvas (only if not revealed) */}
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
                          backgroundColor: "rgba(0,0,0,0.65)",
                          color: "white",
                          fontWeight: 800,
                          fontSize: "0.7rem",
                          borderRadius: 2,
                          "&:hover": { backgroundColor: "rgba(0,0,0,0.85)" }
                        }}
                      >
                        Quick Reveal
                      </Button>
                    </Box>
                  )}
                </Card>
              </Box>
            )}

            {/* ─── GOOGLE ADSENSE COMPLIANT SPOT ─── */}
            <Box 
              sx={{ 
                my: 4, 
                py: 2, 
                borderTop: "1px solid", 
                borderBottom: "1px solid", 
                borderColor: "divider",
                textAlign: "center" 
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, letterSpacing: 1.5, fontWeight: 700 }}>
                SPONSORED ADVERTISEMENT
              </Typography>
              <Box 
                sx={{ 
                  height: 90, 
                  backgroundColor: isDark ? "#1f2937" : "#f3f4f6", 
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed",
                  borderColor: "divider"
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <InfoIcon fontSize="small" /> Google AdSense Placeholder Slot
                </Typography>
              </Box>
            </Box>

            {/* ─── PRODUCTS CATEGORY HEADING & TABS GRID ─── */}
            <Box sx={{ mb: 6 }}>
              <Typography 
                variant="h5" 
                component="h2" 
                sx={{ fontWeight: 800, mb: 2, fontFamily: "'Outfit', sans-serif" }}
              >
                Explore Today's Hand-Picked Flash Offers & Discounts
              </Typography>

              <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  mb: 4,
                  "& .MuiTabs-indicator": { backgroundColor: "#FF9900" },
                  "& .MuiTab-root": {
                    fontWeight: 700,
                    textTransform: "none",
                    fontSize: "0.95rem",
                    "&.Mui-selected": { color: "#FF9900" }
                  }
                }}
              >
                {categories.map((cat) => (
                  <Tab key={cat} label={cat} value={cat} />
                ))}
              </Tabs>

              {filteredProducts.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", py: 6 }}>
                  No deals found in this category today. Check back tomorrow!
                </Typography>
              ) : (
                <Grid container spacing={4}>
                  {filteredProducts.map((product) => {
                    const discount = Math.round((1 - (product.price / product.originalPrice)) * 100);
                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id}>
                        <Card 
                          sx={{ 
                            height: "100%", 
                            display: "flex", 
                            flexDirection: "column",
                            borderRadius: 4,
                            overflow: "hidden",
                            transition: "all 0.3s ease-in-out",
                            border: "1px solid",
                            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              boxShadow: isDark 
                                ? "0 12px 30px rgba(0,0,0,0.4)" 
                                : "0 12px 30px rgba(255, 153, 0, 0.12)",
                              borderColor: "#FF9900"
                            }
                          }}
                        >
                          <Box sx={{ position: "relative", p: 3, pt: 4, backgroundColor: isDark ? "#161b22" : "#fafafa", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <Box 
                              component="img" 
                              src={getAbsoluteImageUrl(product.imageUrl)} 
                              alt={`${product.title} - Amazon Deal India`}
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = AMAZON_PLACEHOLDER;
                              }}
                              sx={{ 
                                height: 160, 
                                objectFit: "contain",
                                transition: "transform 0.3s",
                                "&:hover": { transform: "scale(1.05)" }
                              }}
                            />
                            
                            <Chip 
                              label={`${discount}% OFF`}
                              sx={{ 
                                position: "absolute",
                                top: 12,
                                left: 12,
                                backgroundColor: "#ef4444",
                                color: "white",
                                fontWeight: 900,
                                fontSize: "0.75rem",
                                borderRadius: "8px",
                                height: 22
                              }}
                            />

                            <Chip 
                              label={product.category}
                              sx={{ 
                                position: "absolute",
                                top: 12,
                                right: 12,
                                backgroundColor: isDark ? "#374151" : "#f3f4f6",
                                color: "text.primary",
                                fontWeight: 700,
                                fontSize: "0.65rem",
                                textTransform: "uppercase",
                                height: 22
                              }}
                            />
                          </Box>

                          <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1.5 }}>
                              <Rating 
                                value={product.rating} 
                                readOnly 
                                precision={0.1} 
                                size="small"
                                emptyIcon={<StarIcon style={{ opacity: 0.2 }} fontSize="inherit" />}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                ({product.reviewCount.toLocaleString()})
                              </Typography>
                            </Box>

                            <Typography 
                              variant="h6" 
                              component="h3"
                              sx={{ 
                                fontWeight: 800, 
                                mb: 1, 
                                fontSize: "1.05rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                minHeight: "2.7rem"
                              }}
                            >
                              {product.title}
                            </Typography>

                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                mb: 2.5,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                flexGrow: 1,
                                minHeight: "3.2rem"
                              }}
                            >
                              {product.description}
                            </Typography>

                            {/* Card Share Hub */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
                                Share:
                              </Typography>
                              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                                <IconButton
                                  size="small"
                                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(product.productUrl || "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ color: "#1877F2", border: "1px solid", borderColor: "divider", p: 0.5, "&:hover": { bgcolor: "rgba(24,119,242,0.08)" } }}
                                  title="Share on Facebook"
                                >
                                  <FacebookIcon sx={{ fontSize: "0.95rem" }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(product.productUrl || "")}&text=${encodeURIComponent("Check out this deal on WorldNewzs: " + product.title)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ color: "text.primary", border: "1px solid", borderColor: "divider", p: 0.5, "&:hover": { bgcolor: "action.hover" } }}
                                  title="Share on X"
                                >
                                  <TwitterIcon sx={{ fontSize: "0.95rem" }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(product.productUrl || "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ color: "#0A66C2", border: "1px solid", borderColor: "divider", p: 0.5, "&:hover": { bgcolor: "rgba(10,102,194,0.08)" } }}
                                  title="Share on LinkedIn"
                                >
                                  <LinkedInIcon sx={{ fontSize: "0.95rem" }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent("https://worldnewzs.in/amazon-products")}&media=${encodeURIComponent(getAbsoluteImageUrl(product.imageUrl))}&description=${encodeURIComponent((product.title || "").substring(0, 180))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ color: "#BD081C", border: "1px solid", borderColor: "divider", p: 0.5, "&:hover": { bgcolor: "rgba(189,8,28,0.08)" } }}
                                  title="Share on Pinterest"
                                >
                                  <PinterestIcon sx={{ fontSize: "0.95rem" }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Check out this amazing deal: " + product.title + " " + (product.productUrl || ""))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  sx={{ color: "#25D366", border: "1px solid", borderColor: "divider", p: 0.5, "&:hover": { bgcolor: "rgba(37,211,102,0.08)" } }}
                                  title="Share on WhatsApp"
                                >
                                  <WhatsAppIcon sx={{ fontSize: "0.95rem" }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleCopyLink(product.productUrl || "", product.asin)}
                                  sx={{ 
                                    color: copiedAsin === product.asin ? "#22c55e" : "text.secondary", 
                                    border: "1px solid", 
                                    borderColor: copiedAsin === product.asin ? "#22c55e" : "divider", 
                                    p: 0.5,
                                    "&:hover": { bgcolor: "action.hover" } 
                                  }}
                                  title="Copy link to clipboard"
                                >
                                  <ContentCopyIcon sx={{ fontSize: "0.95rem" }} />
                                </IconButton>
                              </Box>
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: "text.primary", display: "flex", alignItems: "baseline" }}>
                                  ₹{product.price.toLocaleString("en-IN")}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                                  M.R.P: ₹{product.originalPrice.toLocaleString("en-IN")}
                                </Typography>
                              </Box>

                              <Button
                                id={`buy-btn-${product.asin}`}
                                variant="contained"
                                href={product.productUrl}
                                target="_blank"
                                rel="sponsored noopener noreferrer"
                                startIcon={<ShoppingBagIcon />}
                                sx={{
                                  borderRadius: 2.5,
                                  fontWeight: 800,
                                  textTransform: "none",
                                  fontSize: "0.85rem",
                                  px: 2.5,
                                  py: 1,
                                  boxShadow: "none",
                                  background: "linear-gradient(135deg, #FF9900 0%, #FF5500 100%)",
                                  "&:hover": {
                                    background: "linear-gradient(135deg, #FFAA22 0%, #FF6611 100%)",
                                    boxShadow: "0 4px 12px rgba(255, 153, 0, 0.25)"
                                  }
                                }}
                              >
                                Grab Deal ↗
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>

            {/* ─── FREQUENTLY ASKED QUESTIONS (FAQS) SECTION ─── */}
            <Box id="deals-faq-section" sx={{ mt: 8, mb: 4 }}>
              <Typography 
                variant="h5" 
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
                <HelpOutlineIcon sx={{ color: "#FF9900" }} /> Frequently Asked Questions (FAQs)
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {amazonDealsFaqs.map((faq, index) => (
                  <Accordion 
                    key={index}
                    elevation={0}
                    sx={{
                      borderRadius: "16px !important",
                      border: "1px solid",
                      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                      backgroundColor: isDark ? "#161b22" : "#ffffff",
                      overflow: "hidden",
                      "&:before": { display: "none" }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: "#FF9900" }} />}
                      id={`faq-summary-${index}`}
                      sx={{ px: 3, py: 1 }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {faq.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
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
    </>
  );
};

export default AmazonProducts;
