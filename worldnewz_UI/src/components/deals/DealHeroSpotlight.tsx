import React, { useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Rating from "@mui/material/Rating";
import Tooltip from "@mui/material/Tooltip";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

import type { AmazonProduct } from "../../api/apiClient";
import { DealShareMenu } from "./DealShareMenu";
import {
  formatCategoryLabel,
  formatINR,
  getAffiliateUrl,
  getBrandedCategoryPlaceholder,
  getResponsiveAmazonImage,
  getVerifiedDiscountPercent,
  getVerifiedSavingsAmount,
  parseBrandAndTitle,
} from "./dealsUtils";

interface DealHeroSpotlightProps {
  deals: AmazonProduct[];
  isSaved: (asin: string) => boolean;
  onToggleSave: (product: AmazonProduct) => void;
  onQuickView: (product: AmazonProduct) => void;
  onNotify?: (message: string) => void;
  onActiveDealChange?: (product: AmazonProduct) => void;
}

const TRUST_PILLS = [
  { icon: LocalShippingOutlinedIcon, label: "Amazon Fulfilled" },
  { icon: LockOutlinedIcon, label: "256-bit SSL Checkout" },
  { icon: VerifiedUserOutlinedIcon, label: "Verified Seller" },
  { icon: AutorenewOutlinedIcon, label: "Easy Returns" },
  { icon: WorkspacePremiumOutlinedIcon, label: "Brand Warranty" },
  { icon: LocalOfferOutlinedIcon, label: "Daily Price Check" },
];

export const DealHeroSpotlight: React.FC<DealHeroSpotlightProps> = ({
  deals,
  isSaved,
  onToggleSave,
  onQuickView,
  onNotify,
  onActiveDealChange,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!deals || deals.length === 0) return null;

  const safeIndex = activeIndex % deals.length;
  const activeDeal = deals[safeIndex];
  const affiliateUrl = getAffiliateUrl(activeDeal);
  const discount = getVerifiedDiscountPercent(activeDeal.price, activeDeal.originalPrice);
  const savings = getVerifiedSavingsAmount(activeDeal.price, activeDeal.originalPrice);
  const { brand } = parseBrandAndTitle(activeDeal.title, activeDeal.category);
  const categoryLabel = formatCategoryLabel(activeDeal.category);
  const heroImage = getResponsiveAmazonImage(activeDeal.imageUrl, "hero");
  const saved = isSaved(activeDeal.asin);

  const selectIndex = (nextIndex: number) => {
    const wrapped = (nextIndex + deals.length) % deals.length;
    setActiveIndex(wrapped);
    onActiveDealChange?.(deals[wrapped]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      selectIndex(safeIndex - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      selectIndex(safeIndex + 1);
    }
  };

  return (
    <Paper
      component="section"
      aria-label="Deal of the Day Spotlight"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 3.5 },
        mb: 4,
        borderRadius: "10px",
        bgcolor: "var(--color-surface-container)",
        border: "1px solid var(--color-border-divider)",
        boxShadow: "var(--shadow-elevation-1)",
        outline: "none",
        "&:focus-visible": {
          borderColor: "var(--color-brand-accent)",
        },
      }}
    >
      {/* Top Spotlight Header Bar (Arrows live here — zero collision with image or thumbnails) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          pb: 2,
          mb: 2.5,
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: "var(--color-brand-accent)", fontSize: 18 }} />
          <Typography
            component="h2"
            sx={{
              fontFamily: "var(--font-mono-telemetry)",
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-ink-primary)",
              m: 0,
            }}
          >
            Deal of the Day Spotlight
          </Typography>
        </Box>

        {deals.length > 1 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              component="span"
              sx={{
                fontFamily: "var(--font-mono-telemetry)",
                fontSize: "0.74rem",
                fontWeight: 700,
                color: "var(--color-ink-secondary)",
                mr: 0.5,
              }}
            >
              {safeIndex + 1} / {deals.length}
            </Typography>
            <IconButton
              id="btn-hero-prev"
              size="small"
              aria-label="Previous spotlight deal"
              onClick={() => selectIndex(safeIndex - 1)}
              sx={{
                width: 30,
                height: 30,
                border: "1px solid var(--color-border-divider)",
                bgcolor: "var(--color-surface-container-low)",
                color: "var(--color-ink-primary)",
                "&:hover": { borderColor: "var(--color-brand-accent)", color: "var(--color-brand-accent)" },
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <IconButton
              id="btn-hero-next"
              size="small"
              aria-label="Next spotlight deal"
              onClick={() => selectIndex(safeIndex + 1)}
              sx={{
                width: 30,
                height: 30,
                border: "1px solid var(--color-border-divider)",
                bgcolor: "var(--color-surface-container-low)",
                color: "var(--color-ink-primary)",
                "&:hover": { borderColor: "var(--color-brand-accent)", color: "var(--color-brand-accent)" },
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Main 5 / 7 Split */}
      <Grid container spacing={{ xs: 2.5, lg: 4 }} alignItems="center">
        {/* Left: Product Image Stage + Clean Thumbnail Selector */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: { xs: "4 / 3", md: "5 / 4" },
              bgcolor: "#ffffff",
              borderRadius: "10px",
              border: "1px solid var(--color-border-divider)",
              overflow: "hidden",
            }}
          >
            {discount !== null && (
              <Box
                component="span"
                sx={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  zIndex: 2,
                  px: 1.25,
                  py: 0.4,
                  borderRadius: "6px",
                  bgcolor: "var(--color-brand-accent)",
                  color: "#ffffff",
                  fontFamily: "var(--font-mono-telemetry)",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  boxShadow: "0 2px 8px rgba(224, 43, 32, 0.35)",
                }}
              >
                -{discount}% OFF
              </Box>
            )}

            <Box
              component="a"
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              aria-label={`Open ${activeDeal.title} on Amazon India`}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                p: { xs: 2, sm: 3 },
                boxSizing: "border-box",
                "&:hover img": { transform: "scale(1.03)" },
              }}
            >
              <img
                key={activeDeal.asin || safeIndex}
                src={heroImage}
                alt={activeDeal.title}
                fetchPriority="high"
                decoding="async"
                referrerPolicy="no-referrer"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  transition: "transform 220ms ease",
                }}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.dataset.fallbackApplied) {
                    img.dataset.fallbackApplied = "true";
                    img.src = getBrandedCategoryPlaceholder(categoryLabel);
                  }
                }}
              />
            </Box>
          </Box>

          {/* Clean Thumbnail Selector Rail */}
          {deals.length > 1 && (
            <Box
              role="tablist"
              aria-label="Spotlight deal thumbnails"
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1,
                mt: 1.5,
                flexWrap: "wrap",
              }}
            >
              {deals.map((deal, idx) => {
                const isSelected = idx === safeIndex;
                return (
                  <Box
                    key={deal.asin || idx}
                    component="button"
                    type="button"
                    id={`btn-hero-thumb-${idx}`}
                    role="tab"
                    aria-selected={isSelected}
                    aria-label={`View spotlight deal ${idx + 1}: ${deal.title}`}
                    onClick={() => selectIndex(idx)}
                    sx={{
                      width: 56,
                      height: 56,
                      p: 0.6,
                      borderRadius: "8px",
                      bgcolor: "#ffffff",
                      border: "2px solid",
                      borderColor: isSelected ? "var(--color-brand-accent)" : "var(--color-border-divider)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: isSelected ? 1 : 0.72,
                      transition: "border-color 150ms ease, opacity 150ms ease, transform 150ms ease",
                      "&:hover": { opacity: 1, transform: "translateY(-1px)" },
                    }}
                  >
                    <img
                      src={getResponsiveAmazonImage(deal.imageUrl, "thumb")}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallbackApplied) {
                          img.dataset.fallbackApplied = "true";
                          img.src = getBrandedCategoryPlaceholder(deal.category);
                        }
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </Grid>

        {/* Right: Editorial Details, Guarded Pricing & CTAs */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
            {/* Category + Brand */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label={brand}
                size="small"
                sx={{
                  bgcolor: "rgba(224, 43, 32, 0.1)",
                  color: "var(--color-brand-accent)",
                  border: "1px solid rgba(224, 43, 32, 0.25)",
                  fontFamily: "var(--font-mono-telemetry)",
                  fontWeight: 800,
                  fontSize: "0.7rem",
                }}
              />
              <Chip
                label={categoryLabel}
                size="small"
                sx={{
                  bgcolor: "var(--color-surface-container-high)",
                  color: "var(--color-ink-secondary)",
                  fontWeight: 600,
                  fontSize: "0.72rem",
                }}
              />
            </Box>

            {/* Clickable Title */}
            <Typography
              component="a"
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              sx={{
                fontFamily: "var(--font-serif-headline)",
                fontSize: { xs: "1.35rem", sm: "1.6rem", md: "1.78rem" },
                fontWeight: 700,
                lineHeight: 1.26,
                color: "var(--color-ink-primary)",
                textDecoration: "none",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                "&:hover": { color: "var(--color-brand-accent)" },
              }}
            >
              {activeDeal.title}
            </Typography>

            {/* Rating */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Rating
                value={activeDeal.rating > 0 ? activeDeal.rating : 4.4}
                precision={0.1}
                size="small"
                readOnly
                sx={{ "& .MuiRating-iconFilled": { color: "#f59e0b" } }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "var(--font-mono-telemetry)",
                  fontWeight: 700,
                  color: "var(--color-ink-primary)",
                }}
              >
                {(activeDeal.rating > 0 ? activeDeal.rating : 4.4).toFixed(1)}
              </Typography>
              {activeDeal.reviewCount > 0 && (
                <Typography variant="caption" sx={{ color: "var(--color-ink-secondary)" }}>
                  • {activeDeal.reviewCount.toLocaleString("en-IN")} verified ratings
                </Typography>
              )}
            </Box>

            {/* Description Snippet */}
            {activeDeal.description && (
              <Typography
                variant="body2"
                sx={{
                  color: "var(--color-ink-secondary)",
                  lineHeight: 1.6,
                  fontSize: "0.92rem",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  m: 0,
                }}
              >
                {activeDeal.description}
              </Typography>
            )}

            {/* Verified Pricing Breakdown */}
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                bgcolor: "var(--color-surface-container-low)",
                border: "1px solid var(--color-border-divider)",
                display: "flex",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Typography
                component="span"
                sx={{
                  fontFamily: "var(--font-sans-body)",
                  fontSize: { xs: "1.75rem", sm: "2.1rem" },
                  fontWeight: 900,
                  color: "var(--color-ink-primary)",
                  letterSpacing: "-0.025em",
                  lineHeight: 1,
                }}
              >
                {formatINR(activeDeal.price)}
              </Typography>

              {discount !== null && activeDeal.originalPrice > activeDeal.price && (
                <>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "1rem",
                      color: "var(--color-ink-tertiary)",
                      textDecoration: "line-through",
                    }}
                  >
                    M.R.P. {formatINR(activeDeal.originalPrice)}
                  </Typography>
                  <Chip
                    label={`You Save ${formatINR(savings)} (${discount}%)`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(22, 163, 74, 0.14)",
                      color: "var(--color-telemetry-positive)",
                      fontWeight: 800,
                      fontSize: "0.75rem",
                    }}
                  />
                </>
              )}
            </Box>

            {/* Clean 2x3 Trust Indicators */}
            <Grid container spacing={1}>
              {TRUST_PILLS.map(({ icon: Icon, label }) => (
                <Grid key={label} size={{ xs: 6, sm: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      px: 1.1,
                      py: 0.65,
                      borderRadius: "6px",
                      bgcolor: "var(--color-surface-container-low)",
                      border: "1px solid var(--color-border-subtle)",
                    }}
                  >
                    <Icon sx={{ fontSize: 15, color: "var(--color-brand-accent)", flexShrink: 0 }} />
                    <Typography
                      component="span"
                      sx={{
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        color: "var(--color-ink-secondary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* CTA Bar (Single unique Share + Bookmark + Quick View + Primary Buy) */}
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25, pt: 0.5 }}>
              <Button
                id={`btn-hero-buy-${activeDeal.asin}`}
                component="a"
                href={affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                variant="contained"
                size="large"
                endIcon={<OpenInNewIcon sx={{ fontSize: "17px !important" }} />}
                sx={{
                  px: 3,
                  py: 1.2,
                  borderRadius: "8px",
                  bgcolor: "var(--color-brand-accent)",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.92rem",
                  flex: { xs: "1 1 100%", sm: "0 1 auto" },
                  boxShadow: "0 4px 14px rgba(224, 43, 32, 0.28)",
                  "&:hover": {
                    bgcolor: "var(--color-brand-accent-hover)",
                    color: "#ffffff",
                  },
                }}
              >
                Grab Deal on Amazon.in
              </Button>

              <Button
                id={`btn-hero-quickview-${activeDeal.asin}`}
                variant="outlined"
                onClick={() => onQuickView(activeDeal)}
                startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 17 }} />}
                sx={{
                  py: 1.15,
                  px: 2,
                  borderRadius: "8px",
                  borderColor: "var(--color-border-divider)",
                  color: "var(--color-ink-primary)",
                  fontWeight: 700,
                  fontSize: "0.84rem",
                  "&:hover": { borderColor: "var(--color-brand-accent)", color: "var(--color-brand-accent)" },
                }}
              >
                Quick View
              </Button>

              <Tooltip title={saved ? "Remove from Saved Deals" : "Save Deal"}>
                <IconButton
                  id={`btn-hero-save-${activeDeal.asin}`}
                  aria-label={saved ? "Remove spotlight deal from saved" : "Save spotlight deal"}
                  onClick={() => onToggleSave(activeDeal)}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: saved ? "var(--color-brand-accent)" : "var(--color-border-divider)",
                    color: saved ? "var(--color-brand-accent)" : "var(--color-ink-primary)",
                    bgcolor: "var(--color-surface-container-low)",
                  }}
                >
                  {saved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                </IconButton>
              </Tooltip>

              <DealShareMenu
                product={activeDeal}
                buttonId={`btn-hero-share-${activeDeal.asin}`}
                variant="hero"
                onNotify={onNotify}
              />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
