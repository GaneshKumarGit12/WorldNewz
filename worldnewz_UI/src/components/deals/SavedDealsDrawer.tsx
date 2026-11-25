import React from "react";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";

import type { AmazonProduct } from "../../api/apiClient";
import {
  formatINR,
  getAffiliateUrl,
  getBrandedCategoryPlaceholder,
  getResponsiveAmazonImage,
  getVerifiedDiscountPercent,
} from "./dealsUtils";

interface SavedDealsDrawerProps {
  open: boolean;
  onClose: () => void;
  savedDeals: AmazonProduct[];
  onRemove: (asin: string) => void;
  onClearAll: () => void;
  onQuickView: (product: AmazonProduct) => void;
}

export const SavedDealsDrawer: React.FC<SavedDealsDrawerProps> = ({
  open,
  onClose,
  savedDeals,
  onRemove,
  onClearAll,
  onQuickView,
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 400 },
          bgcolor: "var(--color-surface-container)",
          color: "var(--color-ink-primary)",
          borderLeft: "1px solid var(--color-border-divider)",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--color-border-divider)",
          bgcolor: "var(--color-surface-container-low)",
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontFamily: "var(--font-serif-headline)", fontWeight: 700, fontSize: "1.15rem" }}
          >
            Saved Deals ({savedDeals.length})
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--color-ink-secondary)" }}>
            Stored locally in your browser
          </Typography>
        </Box>
        <IconButton
          id="btn-close-saved-drawer"
          onClick={onClose}
          size="small"
          aria-label="Close saved deals drawer"
          sx={{ color: "var(--color-ink-secondary)" }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {savedDeals.length === 0 ? (
          <Box
            sx={{
              py: 8,
              px: 2,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <BookmarkBorderIcon sx={{ fontSize: 44, color: "var(--color-ink-tertiary)" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              No saved deals yet
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--color-ink-secondary)", maxWidth: 260 }}>
              Click the bookmark icon on any deal card to track prices and jump back later.
            </Typography>
          </Box>
        ) : (
          savedDeals.map((deal) => {
            const discount = getVerifiedDiscountPercent(deal.price, deal.originalPrice);
            return (
              <Box
                key={deal.asin}
                sx={{
                  p: 1.5,
                  borderRadius: "10px",
                  bgcolor: "var(--color-surface-container-low)",
                  border: "1px solid var(--color-border-divider)",
                  display: "flex",
                  gap: 1.5,
                  alignItems: "center",
                }}
              >
                <Box
                  onClick={() => {
                    onClose();
                    onQuickView(deal);
                  }}
                  sx={{
                    width: 68,
                    height: 68,
                    flexShrink: 0,
                    borderRadius: "8px",
                    bgcolor: "#ffffff",
                    border: "1px solid var(--color-border-subtle)",
                    p: 0.75,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={getResponsiveAmazonImage(deal.imageUrl, "thumb")}
                    alt={deal.title}
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

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    onClick={() => {
                      onClose();
                      onQuickView(deal);
                    }}
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.84rem",
                      lineHeight: 1.3,
                      color: "var(--color-ink-primary)",
                      cursor: "pointer",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      mb: 0.5,
                      "&:hover": { color: "var(--color-brand-accent)" },
                    }}
                  >
                    {deal.title}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, mb: 0.75 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-ink-primary)" }}>
                      {formatINR(deal.price)}
                    </Typography>
                    {discount !== null && (
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: "var(--font-mono-telemetry)",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          color: "var(--color-brand-accent)",
                        }}
                      >
                        -{discount}%
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Button
                      id={`btn-saved-buy-${deal.asin}`}
                      component="a"
                      href={getAffiliateUrl(deal)}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      size="small"
                      variant="contained"
                      endIcon={<OpenInNewIcon sx={{ fontSize: "13px !important" }} />}
                      sx={{
                        py: 0.35,
                        px: 1.25,
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        borderRadius: "6px",
                        bgcolor: "var(--color-brand-accent)",
                        color: "#ffffff",
                        "&:hover": { bgcolor: "var(--color-brand-accent-hover)", color: "#ffffff" },
                      }}
                    >
                      Buy
                    </Button>
                    <IconButton
                      id={`btn-saved-remove-${deal.asin}`}
                      size="small"
                      aria-label={`Remove ${deal.title}`}
                      onClick={() => onRemove(deal.asin)}
                      sx={{ color: "var(--color-ink-secondary)", "&:hover": { color: "var(--color-brand-accent)" } }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {savedDeals.length > 0 && (
        <>
          <Divider sx={{ borderColor: "var(--color-border-divider)" }} />
          <Box sx={{ p: 2 }}>
            <Button
              id="btn-clear-all-saved"
              fullWidth
              variant="outlined"
              size="small"
              onClick={onClearAll}
              sx={{
                borderRadius: "8px",
                borderColor: "var(--color-border-divider)",
                color: "var(--color-ink-secondary)",
                fontWeight: 700,
                "&:hover": {
                  borderColor: "var(--color-brand-accent)",
                  color: "var(--color-brand-accent)",
                },
              }}
            >
              Clear All Saved Deals
            </Button>
          </Box>
        </>
      )}
    </Drawer>
  );
};
