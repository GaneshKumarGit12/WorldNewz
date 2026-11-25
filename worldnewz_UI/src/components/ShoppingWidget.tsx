import React, { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router-dom";
import type { AmazonProduct } from "../api/apiClient";
import { getCachedWidgetDeals, getCurrentFourHourBlock } from "../api/dealsCache";
import { getBrandedCategoryPlaceholder, getResponsiveAmazonImage } from "./deals/dealsUtils";

export interface ParsedProductInfo {
  categoryLabel: string;
  mainTitle: string;
  tags: string[];
}

export const parseProductInfo = (product: Partial<AmazonProduct>): ParsedProductInfo => {
  const rawTitle = product.title || "Featured Amazon Deal";
  let mainTitle = rawTitle;
  let tags: string[] = [];

  // Parse pipe-delimited titles: "Main Title | Feature 1 | Feature 2 | Feature 3"
  if (rawTitle.includes("|")) {
    const parts = rawTitle.split("|").map((p) => p.trim()).filter(Boolean);
    mainTitle = parts[0];
    tags = parts.slice(1, 5).map((tag) => {
      return tag
        .replace(/^Ink Color\s*-\s*/i, "Ink: ")
        .replace(/^Pack of\s*/i, "Pack of ")
        .trim();
    });
  } else if (rawTitle.includes(" - ")) {
    const parts = rawTitle.split(" - ").map((p) => p.trim()).filter(Boolean);
    mainTitle = parts[0];
    tags = parts.slice(1, 4);
  }

  // If no or few tags were extracted from title, use category and smart highlights
  if (tags.length === 0) {
    if (product.category) tags.push(product.category);
    tags.push("Prime Delivery", "Limited Deal");
  }

  const categoryLabel = (product.category || "Gift Set").toUpperCase();

  return { categoryLabel, mainTitle, tags };
};

const fallbackProducts: Partial<AmazonProduct>[] = [
  {
    id: 1,
    asin: "B01LYU1Z7N",
    title: "Parker Gift Set Frontier Matte Black Gold Trim Roller Ball Pen With Card Holder | 1 Pen + 1 Card Holder | Ink: Blue | Perfect for employees | Unique gifts for entrepreneurs",
    imageUrl: "https://m.media-amazon.com/images/I/714FlBly4UL._SL1500_.jpg",
    price: 810,
    originalPrice: 1299,
    productUrl: "https://www.amazon.in/dp/B01LYU1Z7N?tag=ganeshd12-21&linkCode=ll1&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    category: "Gift Set",
  },
  {
    id: 2,
    asin: "B08H88N2N9",
    title: "Cubelelo Drift 3x3 Stickerless Warrior Speed Cube | Fast Smooth Turning | Puzzle Brain Teaser",
    imageUrl: "/images/cubelelo_cube.png",
    price: 249,
    originalPrice: 399,
    productUrl: "https://amzn.to/4w4F7Gc",
    category: "Gadgets",
  },
  {
    id: 3,
    asin: "B07QBBV15F",
    title: "Little Angel Baby Diaper Pants (X-Large, Pack of 4) | High Absorption Core | 12 Hours Protection",
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=60",
    price: 699,
    originalPrice: 999,
    productUrl: "https://amzn.to/4eKLuaC",
    category: "Shopping",
  },
  {
    id: 4,
    asin: "B09RNDHW8G",
    title: "Homerz Diwan Cushion Bolster Set | Vacuum Packed | Soft Microfiber Filling | Home Décor",
    imageUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=300&auto=format&fit=crop&q=60",
    price: 1299,
    originalPrice: 2499,
    productUrl: "https://amzn.to/3SG4QGF",
    category: "Home & Decor",
  },
  {
    id: 5,
    asin: "B0DZDXCFYX",
    title: "Conair Handheld Compact Garment Steamer | Quick Heat-Up | Wrinkle Remover",
    imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&auto=format&fit=crop&q=60",
    price: 2499,
    originalPrice: 3999,
    productUrl: "https://amzn.to/4apYj99",
    category: "Home Appliances",
  },
  {
    id: 6,
    asin: "B00QWV6MTE",
    title: "PremiumAV Mini Speaker Plug & Play | USB 2.0 Stereo Audio | Portable Desktop",
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&auto=format&fit=crop&q=60",
    price: 249,
    originalPrice: 499,
    productUrl: "https://amzn.to/3QjU889",
    category: "Electronics",
  },
  {
    id: 7,
    asin: "B0DSKNHX1T",
    title: "Samsung Galaxy S25+ 5G AI Smartphone | 12GB RAM 256GB Storage | AMOLED Display",
    imageUrl: "/images/galaxy_phone.png",
    price: 79999,
    originalPrice: 89999,
    productUrl: "https://amzn.to/4gOPB8j",
    category: "Electronics",
  },
  {
    id: 8,
    asin: "B0FLD3V5BZ",
    title: "DALUCI Wooden Piggy Bank Money Saving Box | 1 Lakh Target Challenge | Handcrafted Wood",
    imageUrl: "/images/piggy_bank.png",
    price: 399,
    originalPrice: 799,
    productUrl: "https://amzn.to/4eEZGU1",
    category: "Gadgets",
  },
  {
    id: 9,
    asin: "B0CFYPQVXH",
    title: "Zilloquil 4-in-1 Star Galaxy Aurora Night Lamp & Speaker | Bluetooth Remote Control",
    imageUrl: "/images/galaxy_lamp.png",
    price: 1499,
    originalPrice: 2999,
    productUrl: "https://amzn.to/4eZTFQR",
    category: "Electronics",
  },
  {
    id: 10,
    asin: "B00FLYWNYQ",
    title: "Instant Pot Multi-Use Programmable Pressure Cooker | 7-in-1 Smart Cooker",
    imageUrl: "/images/pressure_cooker.png",
    price: 5999,
    originalPrice: 8999,
    productUrl: "https://amzn.to/4az7jZE",
    category: "Home Appliances",
  },
  {
    id: 11,
    asin: "B0DXQH1DBS",
    title: "Apple iPhone 16e (128 GB) - Ultramarine Blue | A18 Bionic Chip | OLED Super Retina",
    imageUrl: "/images/iphone_16e.png",
    price: 59900,
    originalPrice: 64900,
    productUrl: "https://amzn.to/4p8p5ZC",
    category: "Electronics",
  }
];

export const ShoppingWidget: React.FC = () => {
  const [products, setProducts] = useState<Partial<AmazonProduct>[]>(fallbackProducts);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [fourHourBlock] = useState<number>(() => getCurrentFourHourBlock());

  useEffect(() => {
    let active = true;
    getCachedWidgetDeals(undefined, 8)
      .then((data) => {
        if (!active) return;
        if (data && data.products && data.products.length > 0) {
          const clean = data.products.filter(
            (p: Partial<AmazonProduct>) =>
              p.asin !== "B0GR1YWWQ6" &&
              !p.title?.toLowerCase().includes("d-force vitamin d3 60000 iu")
          );
          if (clean.length > 0) {
            const hero = fallbackProducts[0];
            const hasHero = clean.some((p: Partial<AmazonProduct>) => p.asin === hero.asin);
            const merged = hasHero ? clean : [hero, ...clean];
            setProducts(merged);
          }
        }
      })
      .catch(() => {
        // Silently keep curated fallbacks
      });
    return () => {
      active = false;
    };
  }, []);

  // Memoized 4-hour rotated deck (prevents array reallocation every 4.5s carousel tick)
  const dailyProducts = useMemo(() => {
    if (products.length <= 4) return products;

    const hero = products.find((p) => p.asin === fallbackProducts[0].asin) || products[0];
    const otherProducts = products.filter((p) => p.asin !== hero.asin);

    const startIndex = fourHourBlock % otherProducts.length;

    const daily: Partial<AmazonProduct>[] = [hero];
    for (let i = 0; i < Math.min(3, otherProducts.length); i++) {
      daily.push(otherProducts[(startIndex + i) % otherProducts.length]);
    }
    return daily;
  }, [products, fourHourBlock]);

  // Auto rotate products every 4.5 seconds (pauses on mouse hover)
  useEffect(() => {
    if (dailyProducts.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % dailyProducts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [dailyProducts.length, isHovered]);

  const activeProduct = dailyProducts[currentIndex] || dailyProducts[0] || fallbackProducts[0];
  const { categoryLabel, mainTitle, tags } = parseProductInfo(activeProduct);

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        containerType: "inline-size",
        backgroundColor: (theme) =>
          theme.palette.mode === "dark" ? "#0f172a" : "#ffffff",
        border: "1px solid",
        borderColor: (theme) =>
          theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "0 4px 20px rgba(0, 0, 0, 0.3)"
            : "0 2px 12px rgba(0, 0, 0, 0.04)",
        transition: "all 0.25s ease",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, pb: { xs: "16px !important", sm: "20px !important" } }}>
        {/* Header Row */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LocalMallOutlinedIcon sx={{ color: "#2563eb", fontSize: 19 }} />
            <Typography
              component="span"
              sx={{
                fontFamily: "var(--font-sans-body)",
                fontWeight: 800,
                fontSize: "12.5px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#ffffff" : "#0f172a",
              }}
            >
              Shopping
            </Typography>
          </Box>
          <IconButton
            size="small"
            id="shopping-menu-btn"
            aria-label="Shopping options"
            sx={{
              color: (theme) =>
                theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)",
              p: 0.5,
            }}
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Product Showcase (Two-Column Horizontal Split Layout) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 2,
            "@container (min-width: 480px)": {
              gridTemplateColumns: "190px 1fr",
              gap: 2.5,
              alignItems: "center",
            },
            "@container (min-width: 640px)": {
              gridTemplateColumns: "220px 1fr",
              gap: 3,
            },
          }}
        >
          {/* Product Image Frame */}
          <Box
            component="a"
            href={activeProduct.productUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
            id={`shopping-product-img-${activeProduct.id}`}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "radial-gradient(circle at center, #243046 0%, #111827 100%)"
                  : "radial-gradient(circle at center, #ffffff 0%, #f1f5f9 100%)",
              border: "1px solid",
              borderColor: (theme) =>
                theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
              borderRadius: "14px",
              p: 2,
              height: 175,
              overflow: "hidden",
              position: "relative",
              textDecoration: "none",
              transition: "transform 0.25s ease, background-color 0.2s ease",
              "&:hover img": {
                transform: "scale(1.05)",
              },
            }}
          >
            <img
              key={activeProduct.asin || activeProduct.id}
              src={getResponsiveAmazonImage(activeProduct.imageUrl, "card")}
              alt={mainTitle}
              width={240}
              height={180}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              style={{
                maxHeight: "140px",
                maxWidth: "100%",
                objectFit: "contain",
                transition: "transform 0.3s ease",
              }}
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.fallbackApplied) {
                  target.dataset.fallbackApplied = "true";
                  target.src = getBrandedCategoryPlaceholder(activeProduct.category);
                }
              }}
            />
          </Box>

          {/* Right Column: Intelligence & Action Controls */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            {/* Category Badge */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  px: 1.2,
                  py: 0.35,
                  borderRadius: "5px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono-telemetry)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.18)" : "#eff6ff",
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#60a5fa" : "#2563eb",
                  border: "1px solid",
                  borderColor: (theme) =>
                    theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.3)" : "#dbeafe",
                }}
              >
                {categoryLabel}
              </Box>
            </Box>

            {/* Product Headline */}
            <Typography
              component="a"
              href={activeProduct.productUrl}
              target="_blank"
              rel="sponsored noopener noreferrer"
              sx={{
                fontFamily: "var(--font-sans-body)",
                fontWeight: 800,
                fontSize: { xs: "15px", sm: "16px", md: "17.5px" },
                lineHeight: 1.3,
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#ffffff" : "#0f172a",
                textDecoration: "none",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                transition: "color 0.18s ease",
                "&:hover": {
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#f59e0b" : "#2563eb",
                },
              }}
            >
              {mainTitle}
            </Typography>

            {/* Feature & Specification Chips */}
            {tags.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                {tags.map((tag, i) => (
                  <Box
                    key={i}
                    component="span"
                    sx={{
                      px: 1,
                      py: 0.35,
                      borderRadius: "5px",
                      fontSize: "11px",
                      fontWeight: 600,
                      fontFamily: "var(--font-sans-body)",
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark" ? "#1e293b" : "#f1f5f9",
                      color: (theme) =>
                        theme.palette.mode === "dark" ? "#94a3b8" : "#334155",
                      border: "1px solid",
                      borderColor: (theme) =>
                        theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tag}
                  </Box>
                ))}
              </Box>
            )}

            {/* Price & CTA Row */}
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1.5,
                mt: 0.8,
              }}
            >
              {/* Price Column */}
              <Box>
                <Typography
                  component="div"
                  sx={{
                    fontFamily: "var(--font-sans-body)",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "#64748b",
                    letterSpacing: "0.02em",
                    mb: 0.2,
                  }}
                >
                  Price
                </Typography>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "var(--font-sans-body)",
                      fontSize: { xs: "24px", sm: "26px", md: "28px" },
                      fontWeight: 900,
                      color: (theme) =>
                        theme.palette.mode === "dark" ? "#f97316" : "#ea580c",
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    ₹{activeProduct.price ? activeProduct.price.toLocaleString("en-IN") : "810"}
                  </Typography>
                  {activeProduct.originalPrice && activeProduct.originalPrice > (activeProduct.price || 0) && (
                    <Typography
                      component="span"
                      sx={{
                        fontSize: "12px",
                        textDecoration: "line-through",
                        color: (theme) =>
                          theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.35)" : "#94a3b8",
                      }}
                    >
                      ₹{activeProduct.originalPrice.toLocaleString("en-IN")}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* View on Amazon Button */}
              <Box
                component="a"
                href={activeProduct.productUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                id={`shopping-product-btn-${activeProduct.id}`}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.8,
                  px: 2.4,
                  py: 1,
                  borderRadius: "9px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  fontFamily: "var(--font-sans-body)",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? "#f59e0b" : "#0f172a",
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#0f172a" : "#ffffff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  "&:hover": {
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark" ? "#d97706" : "#1e293b",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
                  },
                }}
              >
                <span>View on Amazon.in</span>
                <ArrowForwardIcon sx={{ fontSize: 14 }} />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Footer Carousel Dots & Deals Link */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: 2.5,
            pt: 1.5,
            borderTop: "1px solid",
            borderColor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Active Carousel Indicator Pill + Inactive Dots */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            {dailyProducts.map((_, idx) => {
              const isActive = currentIndex === idx;
              return (
                <Box
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  role="button"
                  tabIndex={0}
                  sx={{
                    width: isActive ? 22 : 6,
                    height: 6,
                    borderRadius: "3px",
                    backgroundColor: isActive
                      ? "#3b82f6"
                      : (theme) =>
                          theme.palette.mode === "dark" ? "#334155" : "#cbd5e1",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      backgroundColor: isActive ? "#2563eb" : "#94a3b8",
                    },
                  }}
                />
              );
            })}
          </Box>

          {/* Shop Deals Hub Deep Link */}
          <Link
            component={RouterLink}
            to="/amazon-products"
            id="shopping-deals-link"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "var(--font-sans-body)",
              color: (theme) =>
                theme.palette.mode === "dark" ? "#94a3b8" : "#0f172a",
              textDecoration: "none",
              transition: "color 0.18s ease",
              "&:hover": {
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#ffffff" : "#2563eb",
                textDecoration: "underline",
              },
            }}
          >
            <span>Shop Deals Hub</span>
            <ArrowForwardIcon sx={{ fontSize: 13 }} />
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
};
