import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, Card, CardMedia, CardContent, Button, Chip, Grid } from "@mui/material";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { AmazonProduct } from "../api/apiClient";
import { getCachedWidgetDeals, getCurrentFourHourBlock } from "../api/dealsCache";
import {
  getBrandedCategoryPlaceholder,
  getResponsiveAmazonImage,
  getVerifiedDiscountPercent,
} from "./deals/dealsUtils";

interface ContextualDealsWidgetProps {
  category?: string;
}

const fallbackDeals: Partial<AmazonProduct>[] = [
  {
    asin: "tech1",
    title: "Noise ColorFit Pulse 2 Max Smart Watch",
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
  }
];

export const ContextualDealsWidget: React.FC<ContextualDealsWidgetProps> = ({ category = "general" }) => {
  const [products, setProducts] = useState<Partial<AmazonProduct>[]>(fallbackDeals);
  const [fourHourBlock] = useState<number>(() => getCurrentFourHourBlock());

  useEffect(() => {
    let active = true;
    const queryCat = category && category.toLowerCase() !== "general" ? category : undefined;
    getCachedWidgetDeals(queryCat, 6)
      .then((data) => {
        if (!active) return;
        if (data && data.products && data.products.length > 0) {
          const clean = data.products.filter(
            (p: Partial<AmazonProduct>) =>
              p.asin !== "B0GR1YWWQ6" &&
              !p.title?.toLowerCase().includes("d-force vitamin d3 60000 iu")
          );
          if (clean.length > 0) setProducts(clean);
        }
      })
      .catch(() => {
        // Silently keep fallbacks
      });
    return () => {
      active = false;
    };
  }, [category]);

  const deals = useMemo(() => {
    if (!products || products.length === 0) return [];
    const startIndex = fourHourBlock % products.length;
    const rotated: Partial<AmazonProduct>[] = [];
    for (let i = 0; i < Math.min(2, products.length); i++) {
      rotated.push(products[(startIndex + i) % products.length]);
    }
    return rotated;
  }, [products, fourHourBlock]);

  if (deals.length === 0) return null;

  return (
    <Box
      component="section"
      aria-label="Shopping Recommendations"
      sx={{
        my: 4,
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ShoppingBagIcon color="secondary" />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Featured Deals & Shopping Recommendations
          </Typography>
        </Box>
        <Chip label="Handpicked" color="secondary" size="small" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />
      </Box>

      {/* FTC Affiliate Disclosure */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 2.5, p: 1, borderRadius: 1.5, bgcolor: "action.hover" }}>
        <InfoOutlinedIcon sx={{ fontSize: "0.9rem", color: "text.secondary" }} />
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500, fontSize: "0.75rem" }}>
          <strong>FTC Disclosure:</strong> WorldNewzs may earn an affiliate commission when you purchase through links on our site.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {deals.map((deal: Partial<AmazonProduct>) => {
          const discountPercent = getVerifiedDiscountPercent(deal.price, deal.originalPrice);

          return (
            <Grid key={deal.asin} size={{ xs: 12, sm: 6 }}>
              <Card variant="outlined" sx={{ display: "flex", borderRadius: 2, overflow: "hidden", height: "100%" }}>
                <CardMedia
                  component="img"
                  sx={{ width: 110, height: 110, objectFit: "contain", p: 1, bgcolor: "#ffffff" }}
                  image={getResponsiveAmazonImage(deal.imageUrl, "thumb")}
                  alt={deal.title}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.dataset.hasFailed) {
                      target.dataset.hasFailed = "true";
                      target.src = getBrandedCategoryPlaceholder(deal.category);
                    }
                  }}
                />
                <CardContent sx={{ flex: 1, p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.25, mb: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {deal.title}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "error.main" }}>
                      ₹{(deal.price)?.toLocaleString("en-IN")}
                    </Typography>
                    {discountPercent !== null && deal.originalPrice && deal.originalPrice > (deal.price || 0) && (
                      <Typography variant="caption" sx={{ textDecoration: "line-through", color: "text.secondary" }}>
                        ₹{deal.originalPrice.toLocaleString("en-IN")}
                      </Typography>
                    )}
                    {discountPercent !== null && discountPercent > 0 && (
                      <Chip label={`${discountPercent}% OFF`} size="small" color="error" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }} />
                    )}
                  </Box>

                  <Button
                    id={`btn-buy-amazon-${deal.asin}`}
                    component="a"
                    href={deal.productUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    variant="contained"
                    color="secondary"
                    size="small"
                    endIcon={<OpenInNewIcon sx={{ fontSize: "0.85rem !important" }} />}
                    sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.4, fontWeight: 700 }}
                  >
                    View on Amazon
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};
