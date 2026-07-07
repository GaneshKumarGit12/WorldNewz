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

const AMAZON_PLACEHOLDER = "/images/amazon_placeholder.png";

const fallbackProducts: Partial<AmazonProduct>[] = [
  {
    id: 1,
    asin: "B08H88N2N9",
    title: "Cubelelo Drift 3x3 Stickerless Warrior Speed Cube",
    imageUrl: "/images/cubelelo_cube.png",
    price: 249,
    originalPrice: 399,
    productUrl: "https://amzn.to/4w4F7Gc",
    category: "Gadgets",
  },
  {
    id: 2,
    asin: "B07QBBV15F",
    title: "Little Angel Baby Diaper Pants (X-Large, Pack of 4)",
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=60",
    price: 699,
    originalPrice: 999,
    productUrl: "https://amzn.to/4eKLuaC",
    category: "Shopping",
  },
  {
    id: 3,
    asin: "B09RNDHW8G",
    title: "Homerz Diwan Cushion Bolster Set (Vacuum Packed)",
    imageUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=300&auto=format&fit=crop&q=60",
    price: 1299,
    originalPrice: 2499,
    productUrl: "https://amzn.to/3SG4QGF",
    category: "Home & Decor",
  },
  {
    id: 4,
    asin: "B0DZDXCFYX",
    title: "Conair Handheld Compact Garment Steamer",
    imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&auto=format&fit=crop&q=60",
    price: 2499,
    originalPrice: 3999,
    productUrl: "https://amzn.to/4apYj99",
    category: "Home Appliances",
  },
  {
    id: 5,
    asin: "B00QWV6MTE",
    title: "PremiumAV Mini Speaker Plug & Play",
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&auto=format&fit=crop&q=60",
    price: 249,
    originalPrice: 499,
    productUrl: "https://amzn.to/3QjU889",
    category: "Electronics",
  },
  {
    id: 6,
    asin: "B0821XB1Q6",
    title: "Amazon Pay Insurance Premium Payment",
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&auto=format&fit=crop&q=60",
    price: 499,
    originalPrice: 599,
    productUrl: "https://amzn.to/4oUWYNF",
    category: "Services",
  },
  {
    id: 7,
    asin: "B07JJ5TFY1",
    title: "MMR Making Marvelous Ultimate Cockroach Gel",
    imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop&q=60",
    price: 199,
    originalPrice: 299,
    productUrl: "https://amzn.to/3SwQ7xR",
    category: "Kitchen & Home",
  },
  {
    id: 8,
    asin: "B07G8BVF7X",
    title: "VIP Ultima Cotton Briefs (Pack of 4)",
    imageUrl: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=300&auto=format&fit=crop&q=60",
    price: 688,
    originalPrice: 899,
    productUrl: "https://amzn.to/4f6C36U",
    category: "Lifestyle",
  },
  {
    id: 9,
    asin: "B07QP9PTZP",
    title: "Amazon Pay LPG Cylinder Booking & Bill Payment",
    imageUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=300&auto=format&fit=crop&q=60",
    price: 850,
    originalPrice: 850,
    productUrl: "https://amzn.to/4xWBX9y",
    category: "Services",
  },
  {
    id: 10,
    asin: "B07FFQG8GT",
    title: "Milan Jewellers 99.5% OM Silver Coin",
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=300&auto=format&fit=crop&q=60",
    price: 499,
    originalPrice: 999,
    productUrl: "https://amzn.to/4oPQsb1",
    category: "Lifestyle",
  },
  {
    id: 11,
    asin: "B0DSKNHX1T",
    title: "Samsung Galaxy S25+ 5G AI Smartphone",
    imageUrl: "/images/galaxy_phone.png",
    price: 79999,
    originalPrice: 89999,
    productUrl: "https://amzn.to/4gOPB8j",
    category: "Electronics",
  },
  {
    id: 12,
    asin: "B0C8SZJ4DR",
    title: "Amazon Pay eGift Card - Office & Workplace Celebrations",
    imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&auto=format&fit=crop&q=60",
    price: 1000,
    originalPrice: 1000,
    productUrl: "https://amzn.to/4p3pGfl",
    category: "Gift Cards",
  },
  {
    id: 13,
    asin: "B0FLD3V5BZ",
    title: "DALUCI Wooden Piggy Bank Money Saving Box (1 Lakh Challenge)",
    imageUrl: "/images/piggy_bank.png",
    price: 399,
    originalPrice: 799,
    productUrl: "https://amzn.to/4eEZGU1",
    category: "Gadgets",
  },
  {
    id: 14,
    asin: "B0CFYPQVXH",
    title: "Zilloquil 4-in-1 Star Galaxy Aurora Night Lamp & Speaker",
    imageUrl: "/images/galaxy_lamp.png",
    price: 1499,
    originalPrice: 2999,
    productUrl: "https://amzn.to/4eZTFQR",
    category: "Electronics",
  },
  {
    id: 15,
    asin: "B0D6ZCLZZV",
    title: "Crystomist CM Acrylic Crystal Beads Curtain (4 Feet Height)",
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=300&auto=format&fit=crop&q=60",
    price: 899,
    originalPrice: 1599,
    productUrl: "https://amzn.to/4gLPtGI",
    category: "Home & Decor",
  },
  {
    id: 16,
    asin: "9360232688",
    title: "MTG Olympiad Prep-Guide Mathematics Class - 4 Book",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=60",
    price: 299,
    originalPrice: 450,
    productUrl: "https://amzn.to/4vMKEBG",
    category: "Education",
  },
  {
    id: 17,
    asin: "B00FLYWNYQ",
    title: "Instant Pot Multi-Use Programmable Pressure Cooker",
    imageUrl: "/images/pressure_cooker.png",
    price: 5999,
    originalPrice: 8999,
    productUrl: "https://amzn.to/4az7jZE",
    category: "Home Appliances",
  },
  {
    id: 18,
    asin: "B0DSQ7F2YR",
    title: "Divyakosh Toran Entrance Bandanwar Festival Decor",
    imageUrl: "/images/toran_decor.png",
    price: 499,
    originalPrice: 999,
    productUrl: "https://amzn.to/4v9MqLS",
    category: "Home & Decor",
  }
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

  // Daily products helper: select exactly 4 products, rotated daily
  const getDailyProducts = (list: Partial<AmazonProduct>[]) => {
    if (list.length <= 4) return list;
    
    // Compute day of year index
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const startIndex = dayOfYear % list.length;
    const daily: Partial<AmazonProduct>[] = [];
    
    for (let i = 0; i < 4; i++) {
      daily.push(list[(startIndex + i) % list.length]);
    }
    return daily;
  };

  const dailyProducts = getDailyProducts(products);

  // Auto rotate products every 4 seconds
  useEffect(() => {
    if (dailyProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % dailyProducts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [dailyProducts.length]);

  const activeProduct = dailyProducts[currentIndex] || dailyProducts[0] || fallbackProducts[0];

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
            rel="sponsored noopener noreferrer"
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
                src={activeProduct.imageUrl || AMAZON_PLACEHOLDER}
                alt={activeProduct.title}
                style={{
                  maxHeight: "100%",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = AMAZON_PLACEHOLDER;
                }}
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
            {dailyProducts.map((_, idx) => (
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
