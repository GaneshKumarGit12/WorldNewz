import React, { memo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Rating from "@mui/material/Rating";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import BoltIcon from "@mui/icons-material/Bolt";

import type { AmazonProduct } from "../../api/apiClient";
import {
  formatCategoryLabel,
  formatINR,
  getAffiliateUrl,
  getBrandedCategoryPlaceholder,
  getResponsiveAmazonImage,
  getVerifiedDiscountPercent,
  parseBrandAndTitle,
} from "./dealsUtils";

interface DealCardProps {
  product: AmazonProduct;
  isSaved: boolean;
  onToggleSave: (product: AmazonProduct) => void;
  onQuickView: (product: AmazonProduct) => void;
  variant?: "catalog" | "flash";
  idPrefix?: string;
}

export const DealCard: React.FC<DealCardProps> = memo(
  ({ product, isSaved, onToggleSave, onQuickView, variant = "catalog", idPrefix = "" }) => {
    const affiliateUrl = getAffiliateUrl(product);
    const verifiedDiscount = getVerifiedDiscountPercent(product.price, product.originalPrice);
    const { brand, cleanTitle } = parseBrandAndTitle(product.title, product.category);
    const categoryLabel = formatCategoryLabel(product.category);
    const cardImg = getResponsiveAmazonImage(product.imageUrl, "card");
    const safeAsin = (product.asin || String(product.id)).replace(/[^a-zA-Z0-9_-]/g, "");
    const domSuffix = idPrefix ? `${idPrefix}-${safeAsin}` : safeAsin;

    return (
      <Box
        component="article"
        aria-label={product.title}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          borderRadius: "10px",
          bgcolor: "var(--color-surface-container)",
          border: "1px solid var(--color-border-divider)",
          overflow: "hidden",
          transition: "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
          "&:hover": {
            transform: "translateY(-3px)",
            borderColor: "var(--color-brand-accent)",
            boxShadow: "var(--shadow-elevation-2)",
          },
        }}
      >
        {/* Product Image Stage (Fixed 4:3 aspect ratio for zero CLS) */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: "4 / 3",
            bgcolor: "#ffffff",
            borderBottom: "1px solid var(--color-border-subtle)",
            overflow: "hidden",
          }}
        >
          {/* Clickable Semantic Image Link */}
          <Box
            component="a"
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label={`View ${product.title} on Amazon India`}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              p: 2,
              boxSizing: "border-box",
              "&:hover img": {
                transform: "scale(1.04)",
              },
            }}
          >
            <img
              src={cardImg}
              alt={product.title}
              loading="lazy"
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

          {/* Top-Left Badges (Verified Discount / Flash Drop) */}
          <Box
            sx={{
              position: "absolute",
              top: 10,
              left: 10,
              display: "flex",
              flexDirection: "column",
              gap: 0.6,
              pointerEvents: "none",
            }}
          >
            {verifiedDiscount !== null && (
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 1,
                  py: 0.3,
                  borderRadius: "6px",
                  bgcolor: "var(--color-brand-accent)",
                  color: "#ffffff",
                  fontFamily: "var(--font-mono-telemetry)",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                  boxShadow: "0 2px 6px rgba(224, 43, 32, 0.32)",
                }}
              >
                -{verifiedDiscount}% OFF
              </Box>
            )}
            {variant === "flash" && (
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.3,
                  px: 0.9,
                  py: 0.25,
                  borderRadius: "6px",
                  bgcolor: "#0f172a",
                  color: "#f59e0b",
                  fontFamily: "var(--font-mono-telemetry)",
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                <BoltIcon sx={{ fontSize: 12 }} />
                Flash
              </Box>
            )}
          </Box>

          {/* Top-Right Quick Actions (Quick View & Bookmark) */}
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              flexDirection: "column",
              gap: 0.6,
            }}
          >
            <Tooltip title={isSaved ? "Remove from Saved Deals" : "Save Deal"}>
              <IconButton
                id={`btn-save-${domSuffix}`}
                size="small"
                aria-label={isSaved ? `Remove ${product.title} from saved deals` : `Save ${product.title}`}
                onClick={() => onToggleSave(product)}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "rgba(255,255,255,0.92)",
                  color: isSaved ? "var(--color-brand-accent)" : "#334155",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 6px rgba(15,23,42,0.08)",
                  "&:hover": {
                    bgcolor: "#ffffff",
                    color: "var(--color-brand-accent)",
                  },
                }}
              >
                {isSaved ? <BookmarkIcon sx={{ fontSize: 17 }} /> : <BookmarkBorderIcon sx={{ fontSize: 17 }} />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Quick View & Specs">
              <IconButton
                id={`btn-quickview-${domSuffix}`}
                size="small"
                aria-label={`Quick view ${product.title}`}
                onClick={() => onQuickView(product)}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "rgba(255,255,255,0.92)",
                  color: "#334155",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 6px rgba(15,23,42,0.08)",
                  "&:hover": {
                    bgcolor: "#ffffff",
                    color: "var(--color-brand-accent)",
                  },
                }}
              >
                <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Card Content */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            gap: 1,
          }}
        >
          {/* Brand + Category Row */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Typography
              component="span"
              sx={{
                fontFamily: "var(--font-mono-telemetry)",
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-brand-accent)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {brand}
            </Typography>
            <Typography
              component="span"
              sx={{
                fontSize: "0.68rem",
                fontWeight: 600,
                color: "var(--color-ink-secondary)",
                px: 0.85,
                py: 0.2,
                borderRadius: "4px",
                bgcolor: "var(--color-surface-container-high)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {categoryLabel}
            </Typography>
          </Box>

          {/* Clickable Semantic Title */}
          <Typography
            component="a"
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            title={product.title}
            sx={{
              fontFamily: "var(--font-sans-body)",
              fontSize: "0.92rem",
              fontWeight: 700,
              lineHeight: 1.38,
              color: "var(--color-ink-primary)",
              textDecoration: "none",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.76em",
              "&:hover": {
                color: "var(--color-brand-accent)",
              },
            }}
          >
            {cleanTitle}
          </Typography>

          {/* Rating Row */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
            <Rating
              value={product.rating > 0 ? product.rating : 4.4}
              precision={0.1}
              size="small"
              readOnly
              sx={{
                fontSize: "0.95rem",
                "& .MuiRating-iconFilled": { color: "#f59e0b" },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontFamily: "var(--font-mono-telemetry)",
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "var(--color-ink-secondary)",
              }}
            >
              {(product.rating > 0 ? product.rating : 4.4).toFixed(1)}
              {product.reviewCount > 0 ? ` (${product.reviewCount.toLocaleString("en-IN")})` : ""}
            </Typography>
          </Box>

          {/* Price Row (Strictly guarded MRP — never fabricated) */}
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap", mt: "auto", pt: 0.5 }}>
            <Typography
              component="span"
              sx={{
                fontFamily: "var(--font-sans-body)",
                fontSize: "1.22rem",
                fontWeight: 800,
                color: "var(--color-ink-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              {formatINR(product.price)}
            </Typography>

            {verifiedDiscount !== null && product.originalPrice > product.price && (
              <Typography
                component="span"
                sx={{
                  fontSize: "0.82rem",
                  color: "var(--color-ink-tertiary)",
                  textDecoration: "line-through",
                }}
              >
                {formatINR(product.originalPrice)}
              </Typography>
            )}
          </Box>

          {/* Primary CTA Row */}
          <Box sx={{ display: "flex", gap: 1, pt: 0.5 }}>
            <Button
              id={`btn-buy-amazon-${domSuffix}`}
              component="a"
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              variant="contained"
              fullWidth
              size="small"
              endIcon={<OpenInNewIcon sx={{ fontSize: "14px !important" }} />}
              sx={{
                py: 0.85,
                borderRadius: "8px",
                bgcolor: "var(--color-brand-accent)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.82rem",
                whiteSpace: "nowrap",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "var(--color-brand-accent-hover)",
                  color: "#ffffff",
                  boxShadow: "0 4px 12px rgba(224, 43, 32, 0.28)",
                },
              }}
            >
              Grab Deal
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }
);

DealCard.displayName = "DealCard";
