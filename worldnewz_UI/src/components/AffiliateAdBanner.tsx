import React, { useState, useEffect } from "react";
import { Card, Box, Typography, Button, Chip } from "@mui/material";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link } from "react-router-dom";
import { fetchAmazonProducts } from "../api/apiClient";
import type { AmazonProduct } from "../api/apiClient";

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
  const [activeProduct, setActiveProduct] = useState<Partial<AmazonProduct>>(fallbackProducts[0]);

  useEffect(() => {
    fetchAmazonProducts()
      .then((res) => {
        if (res.data && res.data.products && res.data.products.length > 0) {
          setProducts(res.data.products);
        }
      })
      .catch(() => {
        // Fail silently to fallback deals
      });
  }, []);

  useEffect(() => {
    if (!products || products.length === 0) return;

    const catKey = category.toLowerCase().trim();
    const matching = products.filter((p) => {
      const pCat = (p.category || "").toLowerCase();
      return pCat === catKey || (catKey === "technology" && pCat === "electronics");
    });

    const pool = matching.length > 0 ? matching : products;
    const randomPick = pool[Math.floor(Math.random() * pool.length)];
    setActiveProduct(randomPick);
  }, [category, products]);

  const price = activeProduct.price || 999;
  const originalPrice = activeProduct.originalPrice || price * 1.5;
  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);

  return (
    <Card
      component="article"
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
        {discountPercent > 0 && (
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
          src={activeProduct.imageUrl || "/images/amazon_placeholder.png"}
          alt={activeProduct.title || "Amazon Product"}
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            (e.currentTarget as HTMLImageElement).src = "/images/amazon_placeholder.png";
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
