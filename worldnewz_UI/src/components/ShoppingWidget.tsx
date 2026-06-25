import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import LocalMallIcon from "@mui/icons-material/LocalMall";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router-dom";
import { fetchAmazonProducts } from "../api/apiClient";
import type { AmazonProduct } from "../api/apiClient";

const fallbackProducts: Partial<AmazonProduct>[] = [
  {
    id: 1,
    title: "Amazon Pay Gift Card - Birthday Theme (Physical Card)",
    imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&auto=format&fit=crop&q=60",
    price: 1000,
    originalPrice: 1000,
    productUrl: "https://www.amazon.in/dp/B085MFR763?tag=ganeshd12-21",
    category: "Gift Cards",
  },
  {
    id: 2,
    title: "Echo Dot (5th Gen) - Deep Ocean Blue Smart Speaker",
    imageUrl: "https://images.unsplash.com/photo-1543512214-318c7553f230?w=300&auto=format&fit=crop&q=60",
    price: 4499,
    originalPrice: 5499,
    productUrl: "https://www.amazon.in/dp/B09B8VF151?tag=ganeshd12-21",
    category: "Electronics",
  },
  {
    id: 3,
    title: "Kindle Paperwhite (16 GB) - 6.8\" Display with Adjustable Warm Light",
    imageUrl: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=300&auto=format&fit=crop&q=60",
    price: 13999,
    originalPrice: 14999,
    productUrl: "https://www.amazon.in/dp/B08N36XNTT?tag=ganeshd12-21",
    category: "Devices",
  },
];

export const ShoppingWidget: React.FC = () => {
  const [products, setProducts] = useState<Partial<AmazonProduct>[]>(fallbackProducts);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchAmazonProducts()
      .then((res) => {
        if (res.data && res.data.products && res.data.products.length > 0) {
          setProducts(res.data.products);
        }
      })
      .catch((err) => {
        console.warn("Could not retrieve Amazon products for widget, falling back.", err);
      });
  }, []);

  // Auto rotate products every 4 seconds
  useEffect(() => {
    if (products.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [products]);

  const activeProduct = products[currentIndex] || fallbackProducts[0];

  return (
    <Card
      sx={{
        background: (theme) =>
          theme.palette.mode === "dark" ? "#161b22" : "#ffffff",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        height: 380,
        boxShadow: "none",
        "&:hover": { transform: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" },
      }}
    >
      <CardContent sx={{ p: 2.5, pb: "16px !important", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LocalMallIcon sx={{ color: "#2563eb" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Shopping
            </Typography>
          </Box>
          <IconButton size="small" id="shopping-menu-btn">
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Product Carousel Display */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            width: "100%",
            overflow: "hidden",
          }}
        >
          {/* Product Image Card Container */}
          <Box
            component="a"
            href={activeProduct.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            id={`shopping-product-link-${activeProduct.id}`}
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              textDecoration: "none",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "background.paper",
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
              position: "relative",
              transition: "opacity 0.5s ease-in-out",
            }}
          >
            {/* Image */}
            <Box
              sx={{
                width: "100%",
                height: 140,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#fff",
                p: 1,
              }}
            >
              <img
                src={activeProduct.imageUrl}
                alt={activeProduct.title}
                style={{
                  maxHeight: "100%",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
                loading="lazy"
              />
            </Box>

            {/* Content overlay / info */}
            <Box sx={{ p: 1.5, width: "100%", textAlign: "left", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", bgcolor: "action.hover" }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color: "text.primary",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.3,
                }}
              >
                {activeProduct.title}
              </Typography>

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mt: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 900, color: "primary.main" }}>
                  ₹{activeProduct.price?.toLocaleString()}
                </Typography>
                {activeProduct.originalPrice && activeProduct.originalPrice > (activeProduct.price || 0) && (
                  <Typography variant="caption" sx={{ textDecoration: "line-through", color: "text.secondary", ml: 1 }}>
                    ₹{activeProduct.originalPrice.toLocaleString()}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Amazon Badge */}
            <Box
              sx={{
                position: "absolute",
                bottom: 12,
                right: 12,
                bgcolor: "#000",
                color: "#ff9900",
                fontSize: "0.65rem",
                fontWeight: "bold",
                px: 1.2,
                py: 0.4,
                borderRadius: 1,
                border: "1.5px solid #ff9900",
              }}
            >
              Amazon.in
            </Box>
          </Box>
        </Box>

        {/* Carousel indicators & shop link */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
          {/* Dot navigation */}
          <Box sx={{ display: "flex", gap: 0.75 }}>
            {products.map((_, idx) => (
              <Box
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: currentIndex === idx ? "text.primary" : "text.disabled",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
              />
            ))}
          </Box>

          <Link
            component={RouterLink}
            to="/amazon-products"
            id="shopping-deals-link"
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "primary.main",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Shop Deals Hub
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
};
