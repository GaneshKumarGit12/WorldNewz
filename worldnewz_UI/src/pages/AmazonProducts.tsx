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
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import TimerIcon from "@mui/icons-material/Timer";
import StarIcon from "@mui/icons-material/Star";
import InfoIcon from "@mui/icons-material/Info";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { fetchAmazonProducts } from "../api/apiClient";
import type { AmazonProduct } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useColorMode } from "../context/ThemeContext";

const SITE_URL = "https://worldnewzs.in";

const AmazonProducts: React.FC = () => {
  const { mode } = useColorMode();
  const isDark = mode === "dark";

  const getAbsoluteImageUrl = (url: string | undefined | null) => {
    if (!url) return "https://via.placeholder.com/600x400?text=Amazon+Product";
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
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

  // Scratch Card States
  const [scratchRevealed, setScratchRevealed] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const scratchDealProduct = products.length > 0 ? products[0] : null; // Use the first product as the secret scratch deal

  // Countdown timer logic
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Next midnight
      
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

    // Reset canvas dimensions based on client bounding rect
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Paint Glittery Scratch Area
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#cccccc");
    grad.addColorStop(0.3, "#e0e0e0");
    grad.addColorStop(0.5, "#b0b0b0");
    grad.addColorStop(0.8, "#f0f0f0");
    grad.addColorStop(1, "#999999");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pattern details / stars
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 15 + 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Add Scratch Text Instructions
    ctx.fillStyle = "#111111";
    ctx.font = "bold 16px Outfit, Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255,255,255,0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText("SCRATCH HERE WITH MOUSE/TOUCH", canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText("TO REVEAL SECRET DEAL! 🎁", canvas.width / 2, canvas.height / 2 + 15);
  };

  // Scratch Drawing Functions
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support mouse & touch events
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

    // Erase circular path
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Check transparency ratio periodically
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

    // Sample pixels to calculate transparent percentage
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

    // If 45% or more is scratched, auto-reveal the whole card
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
  const categories = ["All", "Smartwatches", "Electronics", "Kitchen & Home", "Travel Bags", "Gadgets"];

  // Filter products based on selected category tab
  const filteredProducts = selectedTab === "All"
    ? products
    : products.filter(p => p.category.toLowerCase().trim() === selectedTab.toLowerCase().trim());

  return (
    <>
      <SEOMeta
        title="Amazon Deals of the Day | Best Affiliate Offers"
        description="Browse today's exclusive Amazon deals on electronics, smartwatches, gadgets, and home appliances. Grab discount links updated daily."
        canonical={`${SITE_URL}/amazon-products`}
      />
      <JSONLDBreadcrumb crumbs={[
        { name: "Home", url: SITE_URL },
        { name: "Amazon Deals", url: `${SITE_URL}/amazon-products` }
      ]} />

      <Container maxWidth="lg" sx={{ py: 4 }}>
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
            label="LIGHTNING DEALS HUB"
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
            Amazon Deals of the Day
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ maxWidth: 650, mx: "auto", mb: 3, fontWeight: 500 }}
          >
            Get verified, hand-picked Amazon products and massive discounts updated every single day. Grab them before they expire!
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
                      alt={scratchDealProduct.title}
                      loading="lazy"
                      sx={{ 
                        maxHeight: 180, 
                        objectFit: "contain", 
                        mb: 2,
                        filter: scratchRevealed ? "none" : "blur(8px)",
                        transition: "filter 0.5s ease"
                      }}
                    />

                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, px: 2 }}>
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
                      variant="contained"
                      href={scratchDealProduct.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
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
                      
                      {/* Emergency Quick-Reveal Button */}
                      <Button
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
              {/* AdSense slot placeholder - complies with clear margins and distinct labels */}
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

            {/* ─── PRODUCTS TABS & GRID ─── */}
            <Box sx={{ mb: 4 }}>
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
                          {/* Image box with Discount Tag */}
                          <Box sx={{ position: "relative", p: 3, pt: 4, backgroundColor: isDark ? "#161b22" : "#fafafa", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <Box 
                              component="img" 
                              src={getAbsoluteImageUrl(product.imageUrl)} 
                              alt={product.title}
                              loading="lazy" // SEO Performance lazy loading requirement
                              sx={{ 
                                height: 160, 
                                objectFit: "contain",
                                transition: "transform 0.3s",
                                "&:hover": { transform: "scale(1.05)" }
                              }}
                            />
                            
                            {/* Floating Discount Tag */}
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

                            {/* Floating category Tag */}
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

                          {/* Card details */}
                          <CardContent sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                            {/* Stars rating */}
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
                              component="h2"
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

                            <Divider sx={{ mb: 2 }} />

                            {/* Price details and Buy CTA */}
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
                                variant="contained"
                                href={product.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
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
          </>
        )}
      </Container>
    </>
  );
};

export default AmazonProducts;
