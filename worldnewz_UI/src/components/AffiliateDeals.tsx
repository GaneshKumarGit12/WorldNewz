import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Rating from "@mui/material/Rating";
import LaunchIcon from "@mui/icons-material/Launch";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { useColorMode } from "../context/ThemeContext";

interface Deal {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  rating: number;
  price: string;
  originalPrice: string;
  discount: string;
  link: string;
  badge?: string;
}

interface AffiliateDealsProps {
  category: string;
}

const DEALS_DATA: Record<string, Deal[]> = {
  technology: [
    {
      id: "tech1",
      title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
      description: "Industry-leading noise cancellation with auto optimizer, crystal clear hands-free calling, and 30-hour battery life.",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
      rating: 4.8,
      price: "$348.00",
      originalPrice: "$399.99",
      discount: "13% OFF",
      link: "https://amzn.to/3TchTech",
      badge: "Best Seller"
    },
    {
      id: "tech2",
      title: "Keychron K2 Version 2 Mechanical Keyboard",
      description: "Compact 75% layout wireless keyboard with RGB backlighting, Gateron G Pro switches, and broad cross-platform compatibility.",
      imageUrl: "https://images.unsplash.com/photo-1618384887929-16ec33faf9c1?w=500&auto=format&fit=crop&q=60",
      rating: 4.6,
      price: "$79.99",
      originalPrice: "$99.99",
      discount: "20% OFF",
      link: "https://amzn.to/3Keychron",
      badge: "Top Choice"
    }
  ],
  money: [
    {
      id: "money1",
      title: "The Intelligent Investor by Benjamin Graham",
      description: "The classic text on value investing, providing time-tested strategies for shielding portfolios and achieving long-term wealth.",
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60",
      rating: 4.7,
      price: "$14.79",
      originalPrice: "$24.99",
      discount: "41% OFF",
      link: "https://amzn.to/3InvestorBook",
      badge: "Must Read"
    },
    {
      id: "money2",
      title: "Ledger Nano X Crypto Hardware Wallet",
      description: "Secure your crypto assets and NFTs offline with this Bluetooth-enabled hardware wallet. Supports over 5,500+ digital tokens.",
      imageUrl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=500&auto=format&fit=crop&q=60",
      rating: 4.5,
      price: "$149.00",
      originalPrice: "$175.00",
      discount: "15% OFF",
      link: "https://amzn.to/3LedgerX",
      badge: "Crypto Safe"
    }
  ],
  shopping: [
    {
      id: "shop1",
      title: "PremiumAV Mini Speaker Plug & Play",
      description: "Mini USB 2.0 speaker for laptops and computers. Rich stereo sound, compact portable design, and easy plug-and-play setup.",
      imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=60",
      rating: 4.0,
      price: "₹249",
      originalPrice: "₹499",
      discount: "50% OFF",
      link: "https://amzn.to/3QjU889",
      badge: "50% Off"
    },
    {
      id: "shop2",
      title: "Homerz Diwan Cushion Bolster Set",
      description: "Premium microfiber fillers with bolster cushions. Soft comfort, hypoallergenic material, and durable support for home styling.",
      imageUrl: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&auto=format&fit=crop&q=60",
      rating: 4.2,
      price: "₹1,299",
      originalPrice: "₹2,499",
      discount: "48% OFF",
      link: "https://amzn.to/3SG4QGF",
      badge: "Comfort Pack"
    }
  ]
};

// Fallback generic deals
const GENERIC_DEALS: Deal[] = [
  {
    id: "gen1",
    title: "Kindle Paperwhite (16 GB) - 6.8\" Display",
    description: "Now with a larger display, adjustable warm light, up to 10 weeks of battery life, and 20% faster page turns.",
    imageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60",
    rating: 4.7,
    price: "$139.99",
    originalPrice: "$149.99",
    discount: "7% OFF",
    link: "https://amzn.to/3KindlePaper",
    badge: "Staff Pick"
  },
  {
    id: "gen2",
    title: "Anker Soundcore 2 Portable Bluetooth Speaker",
    description: "Outdoor speaker with 12W audio power, intense bass, IPX7 waterproof rating, and a legendary 24-hour battery life.",
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=60",
    rating: 4.6,
    price: "$39.99",
    originalPrice: "$49.99",
    discount: "20% OFF",
    link: "https://amzn.to/3AnkerSpeaker",
    badge: "Best Value"
  }
];

export const AffiliateDeals: React.FC<AffiliateDealsProps> = ({ category }) => {
  const { mode } = useColorMode();
  const isDark = mode === "dark";

  // Map backend or path keys to our deal categories
  const key = category.toLowerCase().trim();
  let selectedDeals = GENERIC_DEALS;
  if (key === "technology" || key === "tech") {
    selectedDeals = DEALS_DATA.technology;
  } else if (key === "money" || key === "business") {
    selectedDeals = DEALS_DATA.money;
  } else if (key === "shopping") {
    selectedDeals = DEALS_DATA.shopping;
  }

  return (
    <Box sx={{ mb: 5, mt: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <LocalOfferIcon sx={{ color: "var(--red, #B7222B)" }} />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            fontSize: "0.95rem",
            color: "var(--text)"
          }}
        >
          Trending Deals & Recommendations
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'var(--slate)', fontStyle: 'italic' }}>
        Affiliate Disclosure: WorldNewzs may earn a small commission on qualifying purchases made through links on our site.
      </Typography>

      <Grid container spacing={3}>
        {selectedDeals.map((deal) => (
          <Grid size={{ xs: 12, md: 6 }} key={deal.id}>
            <Card
              elevation={0}
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                borderRadius: "8px",
                border: "1px solid var(--line)",
                backgroundColor: "var(--paper-raise)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                overflow: "hidden",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: isDark
                    ? "0 10px 25px rgba(0,0,0,0.4)"
                    : "0 10px 25px rgba(0,0,0,0.06)",
                  borderColor: "var(--red, #B7222B)"
                }
              }}
            >
              {/* Media Section */}
              <Box sx={{ position: "relative", width: { xs: "100%", sm: 160 }, minWidth: { sm: 160 }, height: { xs: 180, sm: "auto" } }}>
                <CardMedia
                  component="img"
                  image={deal.imageUrl}
                  alt={deal.title}
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                {deal.badge && (
                  <Chip
                    label={deal.badge}
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      bgcolor: "var(--red, #B7222B)",
                      color: "#FFFFFF",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      borderRadius: 1.5,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                    }}
                  />
                )}
              </Box>

              {/* Content Section */}
              <CardContent sx={{ flex: 1, p: 3, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box>
                  <Typography
                    variant="h6"
                    component="h4"
                    sx={{
                      fontWeight: 800,
                      fontSize: "1.05rem",
                      lineHeight: 1.3,
                      mb: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      color: "var(--text)"
                    }}
                  >
                    {deal.title}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <Rating value={deal.rating} precision={0.1} readOnly size="small" />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "var(--slate)" }}>
                      {deal.rating}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.85rem",
                      lineHeight: 1.5,
                      mb: 2,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      color: "var(--slate)"
                    }}
                  >
                    {deal.description}
                  </Typography>
                </Box>

                {/* Bottom Pricing & CTA */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: "auto", pt: 1, gap: 1 }}>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.2rem", color: isDark ? "#4ade80" : "#15803d" }}>
                        {deal.price}
                      </Typography>
                      <Typography variant="caption" sx={{ textDecoration: "line-through", color: "var(--slate-light)" }}>
                        {deal.originalPrice}
                      </Typography>
                    </Box>
                    <Chip
                      label={deal.discount}
                      size="small"
                      sx={{
                        fontSize: "0.65rem",
                        height: 18,
                        fontWeight: 700,
                        borderColor: isDark ? "#4ade80" : "#15803d",
                        color: isDark ? "#4ade80" : "#15803d",
                        bgcolor: isDark ? "rgba(74, 222, 128, 0.1)" : "rgba(21, 128, 61, 0.08)",
                        border: "1px solid",
                        mt: 0.5
                      }}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    size="small"
                    component="a"
                    href={deal.link}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    endIcon={<LaunchIcon sx={{ fontSize: "0.9rem !important" }} />}
                    sx={{
                      borderRadius: "6px",
                      textTransform: "none",
                      fontWeight: 700,
                      px: 2,
                      py: 0.75,
                      bgcolor: "var(--red, #B7222B)",
                      color: "#ffffff",
                      boxShadow: "none",
                      "&:hover": {
                        bgcolor: "var(--red-deep, #8E1B22)"
                      }
                    }}
                  >
                    Get Deal
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
