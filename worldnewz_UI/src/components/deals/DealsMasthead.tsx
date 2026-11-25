import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";

interface DealsMastheadProps {
  totalActiveDeals: number;
  topVerifiedDiscount: number;
  savedCount: number;
  activeCategoryLabel?: string;
  onOpenSavedDrawer: () => void;
  onOpenUrlPreviewMobile?: () => void;
}

export const DealsMasthead: React.FC<DealsMastheadProps> = ({
  totalActiveDeals,
  topVerifiedDiscount,
  savedCount,
  activeCategoryLabel,
  onOpenSavedDrawer,
  onOpenUrlPreviewMobile,
}) => {
  const formattedCount = totalActiveDeals > 0 ? totalActiveDeals.toLocaleString("en-IN") : "4,000+";

  return (
    <Box
      component="header"
      sx={{
        py: { xs: 2.5, md: 3.5 },
        mb: 3,
        borderBottom: "1px solid var(--color-border-divider)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "flex-end" },
          gap: 2,
        }}
      >
        {/* Left: Editorial Masthead & Single H1 */}
        <Box sx={{ maxWidth: 780 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.6,
                px: 1.1,
                py: 0.3,
                borderRadius: "4px",
                bgcolor: "var(--color-brand-accent)",
                color: "#ffffff",
                fontFamily: "var(--font-mono-telemetry)",
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <VerifiedUserOutlinedIcon sx={{ fontSize: 13 }} />
              Verified Shopping Desk
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
              Updated Daily • Amazon India
            </Typography>
          </Box>

          <Typography
            component="h1"
            sx={{
              fontFamily: "var(--font-serif-headline)",
              fontSize: { xs: "1.85rem", sm: "2.25rem", md: "2.6rem" },
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--color-ink-primary)",
              m: 0,
              mb: 1,
            }}
          >
            {activeCategoryLabel && activeCategoryLabel !== "All Deals"
              ? `${activeCategoryLabel} — Amazon Deals Hub`
              : "Amazon India Deals Hub"}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "var(--color-ink-secondary)",
              fontSize: { xs: "0.92rem", sm: "0.98rem" },
              lineHeight: 1.55,
              m: 0,
            }}
          >
            Hand-vetted price drops, verified MRP savings, and daily flash offers across electronics, home essentials, fashion, and lifestyle.
          </Typography>
        </Box>

        {/* Right: Live Telemetry Pills + Saved Drawer CTA */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.25,
            width: { xs: "100%", md: "auto" },
          }}
        >
          <Chip
            label={`${formattedCount} Active Deals`}
            size="small"
            sx={{
              height: 34,
              px: 0.75,
              borderRadius: "8px",
              bgcolor: "var(--color-surface-container)",
              border: "1px solid var(--color-border-divider)",
              color: "var(--color-ink-primary)",
              fontFamily: "var(--font-mono-telemetry)",
              fontWeight: 700,
              fontSize: "0.76rem",
            }}
          />

          {topVerifiedDiscount > 0 && (
            <Chip
              icon={<LocalOfferOutlinedIcon sx={{ fontSize: "15px !important", color: "var(--color-brand-accent) !important" }} />}
              label={`Up to ${topVerifiedDiscount}% Off`}
              size="small"
              sx={{
                height: 34,
                px: 0.75,
                borderRadius: "8px",
                bgcolor: "rgba(224, 43, 32, 0.1)",
                border: "1px solid rgba(224, 43, 32, 0.28)",
                color: "var(--color-brand-accent)",
                fontFamily: "var(--font-mono-telemetry)",
                fontWeight: 700,
                fontSize: "0.76rem",
              }}
            />
          )}

          {onOpenUrlPreviewMobile && (
            <Button
              id="btn-open-url-preview-mobile"
              variant="outlined"
              size="small"
              startIcon={<LinkOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={onOpenUrlPreviewMobile}
              sx={{
                display: { xs: "inline-flex", lg: "none" },
                height: 36,
                px: 1.5,
                borderRadius: "8px",
                borderColor: "var(--color-border-divider)",
                color: "var(--color-ink-primary)",
                fontWeight: 600,
                fontSize: "0.78rem",
                "&:hover": {
                  borderColor: "var(--color-brand-accent)",
                  color: "var(--color-brand-accent)",
                },
              }}
            >
              Check URL
            </Button>
          )}

          <Button
            id="btn-open-saved-deals"
            variant={savedCount > 0 ? "contained" : "outlined"}
            size="small"
            startIcon={savedCount > 0 ? <BookmarkIcon sx={{ fontSize: 17 }} /> : <BookmarkBorderIcon sx={{ fontSize: 17 }} />}
            onClick={onOpenSavedDrawer}
            sx={{
              height: 36,
              px: 1.75,
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.8rem",
              ...(savedCount > 0
                ? {
                    bgcolor: "var(--color-brand-accent)",
                    color: "#ffffff",
                    "&:hover": { bgcolor: "var(--color-brand-accent-hover)" },
                  }
                : {
                    borderColor: "var(--color-border-divider)",
                    color: "var(--color-ink-primary)",
                    bgcolor: "var(--color-surface-container)",
                    "&:hover": {
                      borderColor: "var(--color-brand-accent)",
                      color: "var(--color-brand-accent)",
                    },
                  }),
            }}
          >
            Saved ({savedCount})
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
