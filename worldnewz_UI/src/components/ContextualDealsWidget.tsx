import React from "react";
import { Box, Typography, Card, CardMedia, CardContent, Button, Chip, Grid } from "@mui/material";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface ProductDeal {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  imageUrl: string;
  affiliateUrl: string;
  category: string;
}

interface ContextualDealsWidgetProps {
  category?: string;
}

const SAMPLE_DEALS: Record<string, ProductDeal[]> = {
  technology: [
    {
      id: "tech1",
      title: "Noise ColorFit Pulse 2 Max Smart Watch",
      price: "₹1,499",
      originalPrice: "₹5,999",
      discount: "75% OFF",
      imageUrl: "https://m.media-amazon.com/images/I/61SSVxTSs3L._SL1500_.jpg",
      affiliateUrl: "https://www.amazon.in/dp/B0B6BLG2SM?tag=worldnewzs-21",
      category: "Technology"
    },
    {
      id: "tech2",
      title: "boAt Airdopes 141 Bluetooth Truly Wireless Earbuds",
      price: "₹1,299",
      originalPrice: "₹4,490",
      discount: "71% OFF",
      imageUrl: "https://m.media-amazon.com/images/I/510+-8yADYL._SL1500_.jpg",
      affiliateUrl: "https://www.amazon.in/dp/B09N3ZLB3T?tag=worldnewzs-21",
      category: "Technology"
    }
  ],
  sports: [
    {
      id: "sport1",
      title: "Vector X Cricket Leather Ball & Grip Set",
      price: "₹499",
      originalPrice: "₹999",
      discount: "50% OFF",
      imageUrl: "https://m.media-amazon.com/images/I/61k1jY042BL._SL1500_.jpg",
      affiliateUrl: "https://www.amazon.in/dp/B07N18L2X2?tag=worldnewzs-21",
      category: "Sports"
    }
  ],
  default: [
    {
      id: "promo1",
      title: "Exclusive Partner Offer: Claim Your Rewards & Special Deals",
      price: "FREE",
      originalPrice: "₹9,999",
      discount: "100% OFF",
      imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&auto=format&fit=crop&q=60",
      affiliateUrl: "https://servicessitclaims.com/adjy687gk?key=bc72885b3b812917f1e35083ca18d3a5",
      category: "Exclusive"
    },
    {
      id: "gen1",
      title: "Echo Dot (5th Gen) Smart Speaker with Alexa",
      price: "₹4,499",
      originalPrice: "₹5,499",
      discount: "18% OFF",
      imageUrl: "https://m.media-amazon.com/images/I/61MbLLagiVL._SL1000_.jpg",
      affiliateUrl: "https://www.amazon.in/dp/B09B8VGCR8?tag=worldnewzs-21",
      category: "Deals"
    }
  ]
};

export const ContextualDealsWidget: React.FC<ContextualDealsWidgetProps> = ({ category = "general" }) => {
  const catKey = category.toLowerCase();
  const deals = SAMPLE_DEALS[catKey] || SAMPLE_DEALS["default"];

  return (
    <Box
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
        {deals.map((deal) => (
          <Grid key={deal.id} size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined" sx={{ display: "flex", borderRadius: 2, overflow: "hidden", height: "100%" }}>
              <CardMedia
                component="img"
                sx={{ width: 110, height: 110, objectFit: "contain", p: 1, bgcolor: "#ffffff" }}
                image={deal.imageUrl}
                alt={deal.title}
              />
              <CardContent sx={{ flex: 1, p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.25, mb: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {deal.title}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "error.main" }}>
                    {deal.price}
                  </Typography>
                  {deal.originalPrice && (
                    <Typography variant="caption" sx={{ textDecoration: "line-through", color: "text.secondary" }}>
                      {deal.originalPrice}
                    </Typography>
                  )}
                  {deal.discount && (
                    <Chip label={deal.discount} size="small" color="error" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }} />
                  )}
                </Box>

                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  endIcon={<OpenInNewIcon sx={{ fontSize: "0.85rem !important" }} />}
                  onClick={() => window.open(deal.affiliateUrl, "_blank", "noopener,noreferrer")}
                  sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.4, fontWeight: 700 }}
                >
                  View on Amazon
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
