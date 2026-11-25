import React, { useState, useEffect, useRef } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Rating from "@mui/material/Rating";
import Divider from "@mui/material/Divider";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import ShareIcon from "@mui/icons-material/Share";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

import type { AmazonProduct } from "../../api/apiClient";
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

interface DealQuickViewModalProps {
  product: AmazonProduct | null;
  open: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (product: AmazonProduct) => void;
  onShare: (product: AmazonProduct) => void;
}

export const DealQuickViewModal: React.FC<DealQuickViewModalProps> = ({
  product,
  open,
  onClose,
  isSaved,
  onToggleSave,
  onShare,
}) => {
  const [copiedAsinValue, setCopiedAsinValue] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  if (!product) return null;

  const copiedAsin = copiedAsinValue !== null && copiedAsinValue === product.asin;
  const affiliateUrl = getAffiliateUrl(product);
  const heroImg = getResponsiveAmazonImage(product.imageUrl, "hero");
  const discount = getVerifiedDiscountPercent(product.price, product.originalPrice);
  const savings = getVerifiedSavingsAmount(product.price, product.originalPrice);
  const { brand } = parseBrandAndTitle(product.title, product.category);
  const categoryLabel = formatCategoryLabel(product.category);

  const handleCopyAsin = () => {
    if (!product.asin) return;
    const asinToCopy = product.asin;
    navigator.clipboard?.writeText(asinToCopy).then(() => {
      setCopiedAsinValue(asinToCopy);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedAsinValue(null);
        copyTimerRef.current = null;
      }, 1800);
    }).catch(() => {});
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="quickview-modal-title"
      PaperProps={{
        sx: {
          borderRadius: "12px",
          bgcolor: "var(--color-surface-container)",
          border: "1px solid var(--color-border-divider)",
          color: "var(--color-ink-primary)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        id="quickview-modal-header"
        component="div"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1.5,
          px: 2.5,
          borderBottom: "1px solid var(--color-border-divider)",
          bgcolor: "var(--color-surface-container-low)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label={brand}
            size="small"
            sx={{
              bgcolor: "rgba(224, 43, 32, 0.12)",
              color: "var(--color-brand-accent)",
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
        <IconButton
          id="btn-close-quickview-modal"
          onClick={onClose}
          size="small"
          aria-label="Close quick view"
          sx={{ color: "var(--color-ink-secondary)" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Grid container spacing={3} alignItems="flex-start">
          {/* High-res image stage */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                aspectRatio: "1 / 1",
                bgcolor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid var(--color-border-divider)",
                p: 2.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
                    px: 1.2,
                    py: 0.4,
                    borderRadius: "6px",
                    bgcolor: "var(--color-brand-accent)",
                    color: "#ffffff",
                    fontFamily: "var(--font-mono-telemetry)",
                    fontSize: "0.76rem",
                    fontWeight: 800,
                  }}
                >
                  -{discount}% OFF
                </Box>
              )}
              <img
                key={product.asin || product.id}
                src={heroImg}
                alt={product.title}
                referrerPolicy="no-referrer"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
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
          </Grid>

          {/* Details & CTA */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography
              id="quickview-modal-title"
              variant="h5"
              component="h2"
              sx={{
                fontFamily: "var(--font-serif-headline)",
                fontWeight: 700,
                fontSize: { xs: "1.2rem", sm: "1.38rem" },
                lineHeight: 1.3,
                color: "var(--color-ink-primary)",
                mb: 1.5,
              }}
            >
              {product.title}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Rating
                  value={product.rating > 0 ? product.rating : 4.4}
                  precision={0.1}
                  size="small"
                  readOnly
                  sx={{ "& .MuiRating-iconFilled": { color: "#f59e0b" } }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "var(--font-mono-telemetry)", fontWeight: 700, color: "var(--color-ink-primary)" }}
                >
                  {(product.rating > 0 ? product.rating : 4.4).toFixed(1)}
                </Typography>
              </Box>
              {product.reviewCount > 0 && (
                <Typography variant="caption" sx={{ color: "var(--color-ink-secondary)" }}>
                  ({product.reviewCount.toLocaleString("en-IN")} ratings)
                </Typography>
              )}
              {product.asin && (
                <Chip
                  id="btn-copy-asin-modal"
                  icon={copiedAsin ? <CheckIcon sx={{ fontSize: "14px !important" }} /> : <ContentCopyIcon sx={{ fontSize: "13px !important" }} />}
                  label={copiedAsin ? "ASIN Copied" : `ASIN: ${product.asin}`}
                  size="small"
                  onClick={handleCopyAsin}
                  sx={{
                    cursor: "pointer",
                    fontFamily: "var(--font-mono-telemetry)",
                    fontSize: "0.7rem",
                    bgcolor: "var(--color-surface-container-high)",
                    color: "var(--color-ink-secondary)",
                  }}
                />
              )}
            </Box>

            {/* Verified Pricing Panel */}
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                bgcolor: "var(--color-surface-container-low)",
                border: "1px solid var(--color-border-divider)",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, flexWrap: "wrap" }}>
                <Typography
                  sx={{
                    fontSize: "1.85rem",
                    fontWeight: 900,
                    color: "var(--color-ink-primary)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {formatINR(product.price)}
                </Typography>
                {discount !== null && product.originalPrice > product.price && (
                  <>
                    <Typography
                      sx={{
                        fontSize: "1rem",
                        color: "var(--color-ink-tertiary)",
                        textDecoration: "line-through",
                      }}
                    >
                      M.R.P.: {formatINR(product.originalPrice)}
                    </Typography>
                    <Chip
                      label={`Save ${formatINR(savings)} (${discount}%)`}
                      size="small"
                      sx={{
                        bgcolor: "rgba(22, 163, 74, 0.14)",
                        color: "var(--color-telemetry-positive)",
                        fontWeight: 800,
                        fontSize: "0.74rem",
                      }}
                    />
                  </>
                )}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1 }}>
                <VerifiedUserOutlinedIcon sx={{ fontSize: 15, color: "var(--color-telemetry-positive)" }} />
                <Typography variant="caption" sx={{ color: "var(--color-ink-secondary)" }}>
                  Direct Amazon India checkout • Standard Amazon buyer protection & return policy
                </Typography>
              </Box>
            </Box>

            {/* Full Product Description */}
            {product.description && (
              <Box sx={{ mb: 2.5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: "var(--color-ink-primary)",
                    mb: 0.75,
                    fontSize: "0.84rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Highlights & Details
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--color-ink-secondary)",
                    lineHeight: 1.65,
                    fontSize: "0.9rem",
                  }}
                >
                  {product.description}
                </Typography>
              </Box>
            )}

            <Divider sx={{ borderColor: "var(--color-border-divider)", mb: 2 }} />

            {/* Action Buttons */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
              <Button
                id={`btn-modal-buy-${product.asin}`}
                component="a"
                href={affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                variant="contained"
                size="large"
                endIcon={<OpenInNewIcon />}
                sx={{
                  flex: "1 1 200px",
                  borderRadius: "8px",
                  py: 1.15,
                  bgcolor: "var(--color-brand-accent)",
                  color: "#ffffff",
                  fontWeight: 800,
                  "&:hover": {
                    bgcolor: "var(--color-brand-accent-hover)",
                    color: "#ffffff",
                  },
                }}
              >
                Buy on Amazon.in
              </Button>

              <Button
                id={`btn-modal-save-${product.asin}`}
                variant="outlined"
                onClick={() => onToggleSave(product)}
                startIcon={isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                sx={{
                  borderRadius: "8px",
                  borderColor: isSaved ? "var(--color-brand-accent)" : "var(--color-border-divider)",
                  color: isSaved ? "var(--color-brand-accent)" : "var(--color-ink-primary)",
                  fontWeight: 700,
                }}
              >
                {isSaved ? "Saved" : "Save"}
              </Button>

              <Button
                id="btn-share-modal"
                variant="outlined"
                onClick={() => onShare(product)}
                startIcon={<ShareIcon />}
                sx={{
                  borderRadius: "8px",
                  borderColor: "var(--color-border-divider)",
                  color: "var(--color-ink-primary)",
                  fontWeight: 700,
                }}
              >
                Share
              </Button>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};
