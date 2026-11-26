import React, { memo, useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import ShareIcon from "@mui/icons-material/Share";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import PinterestIcon from "@mui/icons-material/Pinterest";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

import type { AmazonProduct } from "../../api/apiClient";
import { SITE_URL, getAffiliateUrl, getResponsiveAmazonImage } from "./dealsUtils";

type SharePlatform = "whatsapp" | "facebook" | "x" | "linkedin" | "instagram" | "pinterest" | "copy";

interface DealShareMenuProps {
  product: AmazonProduct;
  buttonId: string;
  variant?: "card" | "hero" | "modal";
  onNotify?: (message: string) => void;
}

const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/ganeshkumard12/";

export const DealShareMenu: React.FC<DealShareMenuProps> = memo(
  ({ product, buttonId, variant = "card", onNotify }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [copied, setCopied] = useState(false);
    const copyTimerRef = useRef<number | null>(null);
    const open = Boolean(anchorEl);

    useEffect(() => {
      return () => {
        if (copyTimerRef.current !== null) {
          window.clearTimeout(copyTimerRef.current);
          copyTimerRef.current = null;
        }
      };
    }, []);

    const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      e.preventDefault();
      setAnchorEl(e.currentTarget);
    };

    const handleClose = (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }
      setAnchorEl(null);
    };

    const title = product.title || "Amazon Deal";
    const url = getAffiliateUrl(product);
    const priceLabel = product.price > 0 ? `₹${product.price.toLocaleString("en-IN")}` : "";
    const resolvedImg = product.imageUrl ? getResponsiveAmazonImage(product.imageUrl, "hero") : "";
    const absoluteImageUrl = resolvedImg.startsWith("http")
      ? resolvedImg
      : resolvedImg
      ? `${SITE_URL}${resolvedImg.startsWith("/") ? "" : "/"}${resolvedImg}`
      : `${SITE_URL}/og-image.png`;

    const handleSharePlatform = (platform: SharePlatform) => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (platform === "copy") {
        navigator.clipboard
          ?.writeText(url)
          .then(() => {
            setCopied(true);
            onNotify?.("Deal link copied to clipboard!");
            if (copyTimerRef.current !== null) {
              window.clearTimeout(copyTimerRef.current);
            }
            copyTimerRef.current = window.setTimeout(() => {
              setCopied(false);
              setAnchorEl(null);
              copyTimerRef.current = null;
            }, 1000);
          })
          .catch(() => {
            setAnchorEl(null);
          });
        return;
      }

      setAnchorEl(null);

      let shareUrl = "";
      switch (platform) {
        case "whatsapp": {
          const text = `Check out this deal: ${title}${priceLabel ? `\nPrice: ${priceLabel}` : ""}\n${url}`;
          shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
          break;
        }
        case "facebook": {
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
          break;
        }
        case "x": {
          const text = `Check out this deal: ${title}${priceLabel ? ` (${priceLabel})` : ""}`;
          shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
          break;
        }
        case "linkedin": {
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
          break;
        }
        case "instagram": {
          const caption = `${title}${priceLabel ? ` | ${priceLabel}` : ""} | Dhanvi Collection on Amazon & WorldNewzs Deals\n${url}`;
          navigator.clipboard
            ?.writeText(caption)
            .then(() => onNotify?.("Deal caption & link copied — paste on Instagram!"))
            .catch(() => {});
          shareUrl = INSTAGRAM_PROFILE_URL;
          break;
        }
        case "pinterest": {
          // Direct Pinterest Pin Builder for Dhanvi Collections with product URL, HD image, and description
          const pinterestDesc = `${title}${priceLabel ? ` | ${priceLabel}` : ""} | Dhanvi Collections on Amazon & WorldNewzs Deals`;
          shareUrl = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(absoluteImageUrl)}&description=${encodeURIComponent(pinterestDesc)}`;
          break;
        }
      }

      if (shareUrl) {
        window.open(shareUrl, "_blank", "noopener,noreferrer");
      }
    };

    const menuId = `${buttonId}-menu`;

    return (
      <>
        {variant === "modal" ? (
          <Button
            id={buttonId}
            variant="outlined"
            onClick={handleOpen}
            startIcon={<ShareIcon />}
            aria-label={`Share ${title}`}
            aria-controls={open ? menuId : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            sx={{
              borderRadius: "8px",
              borderColor: "var(--color-border-divider)",
              color: "var(--color-ink-primary)",
              fontWeight: 700,
              "&:hover": {
                borderColor: "var(--color-brand-accent)",
                color: "var(--color-brand-accent)",
              },
            }}
          >
            Share
          </Button>
        ) : (
          <Tooltip title="Share Deal">
            <IconButton
              id={buttonId}
              size="small"
              onClick={handleOpen}
              aria-label={`Share ${title}`}
              aria-controls={open ? menuId : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
              sx={
                variant === "hero"
                  ? {
                      width: 44,
                      height: 44,
                      borderRadius: "8px",
                      border: "1px solid var(--color-border-divider)",
                      color: "var(--color-ink-primary)",
                      bgcolor: "var(--color-surface-container-low)",
                      "&:hover": {
                        borderColor: "var(--color-brand-accent)",
                        color: "var(--color-brand-accent)",
                      },
                    }
                  : {
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
                    }
              }
            >
              <ShareIcon sx={{ fontSize: variant === "hero" ? 20 : 16 }} />
            </IconButton>
          </Tooltip>
        )}

        <Menu
          id={menuId}
          anchorEl={anchorEl}
          open={open}
          onClose={() => handleClose()}
          onClick={(e) => e.stopPropagation()}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                mt: 0.75,
                minWidth: 224,
                borderRadius: "10px",
                bgcolor: "var(--color-surface-container)",
                color: "var(--color-ink-primary)",
                border: "1px solid var(--color-border-divider)",
                boxShadow: "var(--shadow-elevation-3)",
                "& .MuiMenuItem-root": {
                  py: 0.9,
                  px: 1.5,
                  gap: 0.5,
                  fontSize: "0.84rem",
                  "&:hover": {
                    bgcolor: "var(--color-surface-container-high)",
                  },
                },
              },
            },
          }}
        >
          <MenuItem onClick={handleSharePlatform("whatsapp")}>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <WhatsAppIcon sx={{ color: "#25D366", fontSize: "1.12rem" }} />
            </ListItemIcon>
            <ListItemText
              primary="WhatsApp"
              primaryTypographyProps={{ variant: "body2", fontWeight: 700, color: "var(--color-ink-primary)" }}
            />
          </MenuItem>

          <MenuItem onClick={handleSharePlatform("facebook")}>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <FacebookIcon sx={{ color: "#1877F2", fontSize: "1.12rem" }} />
            </ListItemIcon>
            <ListItemText
              primary="Facebook"
              primaryTypographyProps={{ variant: "body2", fontWeight: 700, color: "var(--color-ink-primary)" }}
            />
          </MenuItem>

          <MenuItem onClick={handleSharePlatform("x")}>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <XIcon sx={{ color: "var(--color-ink-primary)", fontSize: "1.05rem" }} />
            </ListItemIcon>
            <ListItemText
              primary="X (Twitter)"
              primaryTypographyProps={{ variant: "body2", fontWeight: 700, color: "var(--color-ink-primary)" }}
            />
          </MenuItem>

          <MenuItem onClick={handleSharePlatform("linkedin")}>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <LinkedInIcon sx={{ color: "#0A66C2", fontSize: "1.12rem" }} />
            </ListItemIcon>
            <ListItemText
              primary="LinkedIn"
              primaryTypographyProps={{ variant: "body2", fontWeight: 700, color: "var(--color-ink-primary)" }}
            />
          </MenuItem>

          <MenuItem onClick={handleSharePlatform("instagram")}>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <InstagramIcon sx={{ color: "#E4405F", fontSize: "1.12rem" }} />
            </ListItemIcon>
            <ListItemText
              primary="Instagram"
              secondary="Copies caption & opens profile"
              primaryTypographyProps={{ variant: "body2", fontWeight: 700, color: "var(--color-ink-primary)" }}
              secondaryTypographyProps={{ variant: "caption", color: "var(--color-ink-secondary)", fontSize: "0.68rem" }}
            />
          </MenuItem>

          <MenuItem onClick={handleSharePlatform("pinterest")}>
            <ListItemIcon sx={{ minWidth: 30 }}>
              <PinterestIcon sx={{ color: "#E60023", fontSize: "1.12rem" }} />
            </ListItemIcon>
            <ListItemText
              primary="Pinterest"
              secondary="Pin to Dhanvi Collection"
              primaryTypographyProps={{ variant: "body2", fontWeight: 700, color: "var(--color-ink-primary)" }}
              secondaryTypographyProps={{ variant: "caption", color: "var(--color-ink-secondary)", fontSize: "0.68rem" }}
            />
          </MenuItem>

          <Divider sx={{ my: 0.5, borderColor: "var(--color-border-divider)" }} />

          <MenuItem onClick={handleSharePlatform("copy")}>
            <ListItemIcon sx={{ minWidth: 30 }}>
              {copied ? (
                <CheckIcon sx={{ color: "#10B981", fontSize: "1.12rem" }} />
              ) : (
                <ContentCopyIcon sx={{ color: "var(--color-ink-secondary)", fontSize: "1.08rem" }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={copied ? "Copied!" : "Copy Link"}
              primaryTypographyProps={{
                variant: "body2",
                fontWeight: 700,
                color: copied ? "#10B981" : "var(--color-ink-primary)",
              }}
            />
          </MenuItem>
        </Menu>
      </>
    );
  }
);

DealShareMenu.displayName = "DealShareMenu";
