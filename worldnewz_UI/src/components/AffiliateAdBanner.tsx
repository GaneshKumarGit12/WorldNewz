import React, { useState, useEffect, useMemo } from "react";
import { Card, Box, Typography, Button, Chip } from "@mui/material";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link } from "react-router-dom";
import type { AmazonProduct } from "../api/apiClient";
import { getCachedWidgetDeals, getCurrentFourHourBlock } from "../api/dealsCache";
import {
  getBrandedCategoryPlaceholder,
  getResponsiveAmazonImage,
  getVerifiedDiscountPercent,
} from "./deals/dealsUtils";

interface AffiliateAdBannerProps {
  category?: string;
}

const fallbackProducts: Partial<AmazonProduct>[] = [
  {
    asin: "tech1",
    title: "Noise ColorFit Pulse 2 Max Smart Watch with 1.85'' Display",
    price: 1499.0,
    originalPrice: 5999.0,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60",
    productUrl: "https://www.amazon.in/dp/B0B6BLG2SM?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    category: "Technology"
  },
  {
    asin: "tech2",
    title: "boAt Airdopes 141 Bluetooth Truly Wireless Earbuds",
    price: 1299.0,
    originalPrice: 4490.0,
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=60",
    productUrl: "https://www.amazon.in/dp/B09N3ZLB3T?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    category: "Technology"
  },
  {
    asin: "general1",
    title: "Echo Dot (5th Gen) Smart Speaker with Alexa",
    price: 4499.0,
    originalPrice: 5499.0,
    imageUrl: "https://images.unsplash.com/photo-1543512214-318c7553f230?w=500&auto=format&fit=crop&q=60",
    productUrl: "https://www.amazon.in/dp/B09B8VGCR8?tag=ganeshd12-21&linkCode=ll2&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl",
    category: "General"
  }
];

export const AffiliateAdBanner: React.FC<AffiliateAdBannerProps> = ({ category = "general" }) => {
  const [products, setProducts] = useState<Partial<AmazonProduct>[]>(fallbackProducts);
  const [fourHourBlock] = useState<number>(() => getCurrentFourHourBlock());

  useEffect(() => {
    let active = true;
    const queryCat = category && category.toLowerCase() !== "general" ? category : undefined;
    getCachedWidgetDeals(queryCat, 6)
      .then((data) => {
        if (!active) return;
        if (data && data.products && data.products.length > 0) {
          setProducts(data.products);
        }
      })
      .catch(() => {
        // Fail silently to fallback deals
      });
    return () => {
      active = false;
    };
  }, [category]);

  const activeProduct = useMemo(() => {
    if (!products || products.length === 0) return fallbackProducts[0];
    return products[fourHourBlock % products.length] || products[0];
  }, [products, fourHourBlock]);

  const price = activeProduct.price || 999;
  const originalPrice = activeProduct.originalPrice || 0;
  const discountPercent = getVerifiedDiscountPercent(price, originalPrice);

  return (
    <Card
      component="aside"
      aria-label="Featured affiliate deal"
      id="affiliate-deal-banner"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        minHeight: 360,
        bgcolor: (theme) => (theme.palette.mode === "light" ? "#ffffff" : "#1e222b"),
        border: (theme) => `1px solid ${theme.palette.mode === "light" ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)"}`,
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
        p: 2.5,
        justifyContent: "space-between",
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: "#ff9900",
          boxShadow: (theme) =>
            theme.palette.mode === "light" ? "0 8px 24px rgba(255, 153, 0, 0.15)" : "0 8px 24px rgba(0,0,0,0.5)",
        },
      }}
    >
      {/* Header Badges */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", mb: 1.5 }}>
        <Chip
          icon={<ShoppingBagIcon sx={{ fontSize: "14px !important", color: "#ff9900 !important" }} />}
          label="FEATURED DEAL"
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: "0.65rem",
            bgcolor: "rgba(255, 153, 0, 0.12)",
            color: "#ff9900",
            border: "1px solid rgba(255, 153, 0, 0.3)",
          }}
        />
        {discountPercent !== null && discountPercent > 0 && (
          <Chip
            label={`${discountPercent}% OFF`}
            size="small"
            color="error"
            sx={{ fontWeight: 800, fontSize: "0.65rem", height: 22 }}
          />
        )}
      </Box>

      {/* Product Media / Image */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 140,
          my: 1,
          p: 1,
          bgcolor: (theme) => (theme.palette.mode === "light" ? "#f8fafc" : "#15181f"),
          borderRadius: 1.5,
        }}
      >
        <Box
          component="img"
          src={getResponsiveAmazonImage(activeProduct.imageUrl, "card")}
          alt={activeProduct.title || "Amazon Product"}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.currentTarget as HTMLImageElement;
            if (!target.dataset.hasFailed) {
              target.dataset.hasFailed = "true";
              target.src = getBrandedCategoryPlaceholder(activeProduct.category);
            }
          }}
          sx={{
            maxHeight: "100%",
            maxWidth: "100%",
            objectFit: "contain",
            transition: "transform 0.3s ease",
            "&:hover": { transform: "scale(1.05)" },
          }}
        />
      </Box>

      {/* Content Details */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, my: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: "text.primary",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: "2.8em",
          }}
        >
          {activeProduct.title}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#ff9900" }}>
            ₹{price.toLocaleString("en-IN")}
          </Typography>
          {originalPrice > price && (
            <Typography variant="caption" sx={{ textDecoration: "line-through", color: "text.secondary" }}>
              ₹{originalPrice.toLocaleString("en-IN")}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Actions & Interlinks */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
        <Button
          id="btn-buy-amazon-deal"
          variant="contained"
          endIcon={<OpenInNewIcon />}
          component="a"
          href={activeProduct.productUrl || "https://www.amazon.in?tag=ganeshd12-21"}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            width: "100%",
            py: 1,
            fontWeight: 800,
            fontSize: "0.82rem",
            bgcolor: "#ff9900",
            color: "#111",
            textTransform: "none",
            borderRadius: 1.5,
            boxShadow: "0 2px 8px rgba(255, 153, 0, 0.3)",
            "&:hover": {
              bgcolor: "#e68a00",
              color: "#000",
            },
          }}
        >
          Buy on Amazon
        </Button>

        <Button
          id="btn-explore-amazon-hub"
          component={Link}
          to="/amazon-products"
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: "14px !important" }} />}
          sx={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "text.secondary",
            textTransform: "none",
            py: 0.2,
            "&:hover": { color: "#ff9900" },
          }}
        >
          Explore All Amazon Deals Hub
        </Button>
      </Box>
    </Card>
  );
};

export default AffiliateAdBanner;
