import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import BoltIcon from "@mui/icons-material/Bolt";

import type { AmazonProduct } from "../../api/apiClient";
import { DealCard } from "./DealCard";

interface FlashDropsStripProps {
  deals: AmazonProduct[];
  isSaved: (asin: string) => boolean;
  onToggleSave: (product: AmazonProduct) => void;
  onQuickView: (product: AmazonProduct) => void;
}

export const FlashDropsStrip: React.FC<FlashDropsStripProps> = ({
  deals,
  isSaved,
  onToggleSave,
  onQuickView,
}) => {
  if (!deals || deals.length === 0) return null;

  return (
    <Box component="section" aria-label="Trending Flash Drops" sx={{ mb: 4.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "6px",
              bgcolor: "rgba(224, 43, 32, 0.12)",
              color: "var(--color-brand-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BoltIcon sx={{ fontSize: 18 }} />
          </Box>
          <Typography
            component="h2"
            sx={{
              fontFamily: "var(--font-serif-headline)",
              fontSize: { xs: "1.3rem", sm: "1.5rem" },
              fontWeight: 700,
              color: "var(--color-ink-primary)",
              m: 0,
            }}
          >
            Trending Flash Drops
          </Typography>
        </Box>
        <Typography
          component="span"
          sx={{
            fontFamily: "var(--font-mono-telemetry)",
            fontSize: "0.72rem",
            color: "var(--color-ink-secondary)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Distinct Picks • Live Inventory
        </Typography>
      </Box>

      {/* Full-width 4-up desktop / 2-up tablet / 1-up mobile (~325px per card at 1440px) */}
      <Grid container spacing={2.5}>
        {deals.slice(0, 4).map((product) => (
          <Grid key={product.asin || product.id} size={{ xs: 12, sm: 6, lg: 3 }}>
            <DealCard
              product={product}
              isSaved={isSaved(product.asin)}
              onToggleSave={onToggleSave}
              onQuickView={onQuickView}
              variant="flash"
              idPrefix="flash"
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
