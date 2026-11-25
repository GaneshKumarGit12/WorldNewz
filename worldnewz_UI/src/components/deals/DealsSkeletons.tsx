import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";

export const HeroSpotlightSkeleton: React.FC = () => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2, sm: 3 },
      borderRadius: "10px",
      bgcolor: "var(--color-surface-container)",
      border: "1px solid var(--color-border-divider)",
      mb: 4,
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Skeleton variant="rounded" width={180} height={26} />
      <Skeleton variant="rounded" width={110} height={28} />
    </Box>
    <Grid container spacing={3} alignItems="center">
      <Grid size={{ xs: 12, lg: 5 }}>
        <Skeleton variant="rounded" sx={{ width: "100%", height: "auto", aspectRatio: "5 / 4", borderRadius: "10px" }} />
        <Box sx={{ display: "flex", gap: 1, mt: 1.5, justifyContent: "center" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" width={54} height={54} sx={{ borderRadius: "6px" }} />
          ))}
        </Box>
      </Grid>
      <Grid size={{ xs: 12, lg: 7 }}>
        <Skeleton variant="rounded" width={140} height={24} sx={{ mb: 1.5 }} />
        <Skeleton variant="text" height={38} width="92%" />
        <Skeleton variant="text" height={38} width="70%" sx={{ mb: 1.5 }} />
        <Skeleton variant="text" height={22} width="85%" />
        <Skeleton variant="text" height={22} width="65%" sx={{ mb: 2 }} />
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 2, mb: 2.5 }}>
          <Skeleton variant="rounded" width={130} height={40} />
          <Skeleton variant="text" width={80} height={24} />
          <Skeleton variant="rounded" width={90} height={26} />
        </Box>
        <Grid container spacing={1} sx={{ mb: 2.5 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Grid key={i} size={{ xs: 6, sm: 4 }}>
              <Skeleton variant="rounded" height={34} />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Skeleton variant="rounded" width={210} height={44} />
          <Skeleton variant="rounded" width={120} height={44} />
        </Box>
      </Grid>
    </Grid>
  </Paper>
);

export const FlashDropsSkeleton: React.FC = () => (
  <Box sx={{ mb: 4 }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Skeleton variant="rounded" width={220} height={28} />
      <Skeleton variant="rounded" width={120} height={22} />
    </Box>
    <Grid container spacing={2.5}>
      {[0, 1, 2, 3].map((i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
          <DealCardSkeleton />
        </Grid>
      ))}
    </Grid>
  </Box>
);

export const DealCardSkeleton: React.FC = () => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: "10px",
      bgcolor: "var(--color-surface-container)",
      border: "1px solid var(--color-border-divider)",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 1.25,
    }}
  >
    <Skeleton variant="rounded" sx={{ width: "100%", height: "auto", aspectRatio: "4 / 3", borderRadius: "8px" }} />
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Skeleton variant="text" width="38%" height={18} />
      <Skeleton variant="text" width="26%" height={18} />
    </Box>
    <Skeleton variant="text" width="95%" height={22} />
    <Skeleton variant="text" width="75%" height={22} />
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mt: "auto", pt: 0.5 }}>
      <Skeleton variant="text" width={80} height={28} />
      <Skeleton variant="text" width={54} height={18} />
    </Box>
    <Skeleton variant="rounded" width="100%" height={38} sx={{ borderRadius: "8px" }} />
  </Paper>
);

export const CatalogGridSkeleton: React.FC<{ count?: number }> = ({ count = 12 }) => (
  <Grid container spacing={2.5}>
    {Array.from({ length: count }).map((_, idx) => (
      <Grid key={idx} size={{ xs: 12, sm: 6, lg: 4 }}>
        <DealCardSkeleton />
      </Grid>
    ))}
  </Grid>
);

export const SidebarSkeleton: React.FC = () => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
    {[240, 220, 260, 180].map((h, i) => (
      <Paper
        key={i}
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: "10px",
          bgcolor: "var(--color-surface-container)",
          border: "1px solid var(--color-border-divider)",
        }}
      >
        <Skeleton variant="text" width="60%" height={26} sx={{ mb: 1.5 }} />
        <Skeleton variant="rounded" height={h - 60} sx={{ borderRadius: "8px" }} />
      </Paper>
    ))}
  </Box>
);
