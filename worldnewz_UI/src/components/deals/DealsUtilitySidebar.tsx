import React, { useState, useRef, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { parseAmazonProductUrl, type AmazonProduct, type CategoryStat } from "../../api/apiClient";
import {
  formatINR,
  getAffiliateUrl,
  getBrandedCategoryPlaceholder,
  getResponsiveAmazonImage,
  getVerifiedDiscountPercent,
} from "./dealsUtils";

interface DealsUtilitySidebarProps {
  priceDrops: AmazonProduct[];
  categoryStats: CategoryStat[];
  mysteryDeal: AmazonProduct | null;
  selectedCategory: string;
  onSelectCategory: (categoryKey: string) => void;
  urlPreviewInputRef?: React.RefObject<HTMLInputElement | null>;
}

const ALLOWED_AMAZON_REGEX = /^https?:\/\/([a-z0-9-]+\.)?(amazon\.in|amazon\.com|amazon\.co\.in|amzn\.to|amzn\.in|link\.amazon)(\/|$)/i;

export const DealsUtilitySidebar: React.FC<DealsUtilitySidebarProps> = ({
  priceDrops,
  categoryStats,
  mysteryDeal,
  selectedCategory,
  onSelectCategory,
  urlPreviewInputRef,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Dynamically track global SearchBar height so sticky sidebar never slides under it
  const [stickyTop, setStickyTop] = useState(148);
  useEffect(() => {
    const navEl = document.getElementById("collapsible-global-search-nav");
    if (!navEl) return;

    const updateOffset = () => {
      const rect = navEl.getBoundingClientRect();
      setStickyTop(Math.max(72, Math.ceil(rect.height) + 16));
    };

    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(navEl);
    return () => observer.disconnect();
  }, []);

  // --- DPR-Aware Scratch Card State & Canvas Setup ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastCanvasWidthRef = useRef<number>(0);
  const isDrawingRef = useRef(false);
  const scratchedPixelsRef = useRef(0);
  const [scratchRevealed, setScratchRevealed] = useState(false);

  const initScratchCanvas = useCallback((force = false) => {
    const canvas = canvasRef.current;
    if (!canvas || scratchRevealed) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const roundedW = Math.round(rect.width);
    if (!force && lastCanvasWidthRef.current === roundedW) {
      return;
    }
    lastCanvasWidthRef.current = roundedW;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";

    // Use explicit hex colors (never var(--...) in Canvas 2D)
    const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    if (isDark) {
      grad.addColorStop(0, "#1e293b");
      grad.addColorStop(0.5, "#334155");
      grad.addColorStop(1, "#0f172a");
    } else {
      grad.addColorStop(0, "#e2e8f0");
      grad.addColorStop(0.5, "#cbd5e1");
      grad.addColorStop(1, "#94a3b8");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Subtle diagonal foil stripes
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.35)";
    ctx.lineWidth = 6;
    for (let x = -rect.height; x < rect.width + rect.height; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + rect.height, rect.height);
      ctx.stroke();
    }

    // Center prompt label
    ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
    ctx.font = "700 13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SCRATCH TO REVEAL", rect.width / 2, rect.height / 2 - 9);

    ctx.fillStyle = "#e02b20";
    ctx.font = "700 11px Inter, sans-serif";
    ctx.fillText("TODAY'S MYSTERY DEAL", rect.width / 2, rect.height / 2 + 12);

    scratchedPixelsRef.current = 0;
  }, [isDark, scratchRevealed]);

  useEffect(() => {
    if (!mysteryDeal || scratchRevealed) return;
    const raf = requestAnimationFrame(() => initScratchCanvas(true));
    const onResize = () => initScratchCanvas(false);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [mysteryDeal, scratchRevealed, initScratchCanvas]);

  const scratchAtPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || scratchRevealed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    scratchedPixelsRef.current += 1;
    if (scratchedPixelsRef.current >= 28) {
      setScratchRevealed(true);
      isDrawingRef.current = false;
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    scratchAtPoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    scratchAtPoint(e.clientX, e.clientY);
  };

  const handlePointerEnd = () => {
    isDrawingRef.current = false;
  };

  // --- Quick Amazon URL Previewer State (Read-Only, Properly Cleaned Up) ---
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<AmazonProduct | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handlePreviewUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError("Paste an Amazon India URL (e.g. https://www.amazon.in/dp/...)");
      return;
    }
    if (!ALLOWED_AMAZON_REGEX.test(trimmed)) {
      setUrlError("Only official Amazon domains (amazon.in, amzn.to, amzn.in, link.amazon) are supported.");
      return;
    }

    setUrlLoading(true);
    setUrlError(null);
    setPreviewProduct(null);

    try {
      const res = await parseAmazonProductUrl(trimmed);
      if (!mountedRef.current) return;
      if (res.data?.product) {
        setPreviewProduct(res.data.product);
      } else {
        setUrlError("Could not resolve deal metadata for this Amazon link.");
      }
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      const msg = axiosErr?.response?.data?.error || (err instanceof Error ? err.message : "Failed to preview Amazon link.");
      setUrlError(msg);
    } finally {
      if (mountedRef.current) {
        setUrlLoading(false);
      }
    }
  };

  const mysteryDiscount = mysteryDeal
    ? getVerifiedDiscountPercent(mysteryDeal.price, mysteryDeal.originalPrice)
    : null;

  return (
    <Box
      component="aside"
      aria-label="Deals Utilities and Insights"
      sx={{
        position: { lg: "sticky" },
        top: { lg: `${stickyTop}px` },
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      {/* 1. LIVE VERIFIED PRICE DROPS */}
      {priceDrops.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            borderRadius: "10px",
            bgcolor: "var(--color-surface-container)",
            border: "1px solid var(--color-border-divider)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.75 }}>
            <TrendingDownIcon sx={{ color: "var(--color-brand-accent)", fontSize: 20 }} />
            <Typography
              component="h3"
              sx={{
                fontFamily: "var(--font-serif-headline)",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--color-ink-primary)",
                m: 0,
              }}
            >
              Verified Price Drops
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {priceDrops.map((item) => {
              const disc = getVerifiedDiscountPercent(item.price, item.originalPrice);
              if (disc === null) return null;
              return (
                <Box
                  key={item.asin}
                  component="a"
                  href={getAffiliateUrl(item)}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  sx={{
                    p: 1.15,
                    borderRadius: "8px",
                    bgcolor: "var(--color-surface-container-low)",
                    border: "1px solid var(--color-border-subtle)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    transition: "border-color 150ms ease, transform 150ms ease",
                    "&:hover": {
                      borderColor: "var(--color-brand-accent)",
                      transform: "translateX(2px)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "6px",
                      bgcolor: "#ffffff",
                      border: "1px solid var(--color-border-subtle)",
                      p: 0.4,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={getResponsiveAmazonImage(item.imageUrl, "thumb")}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallbackApplied) {
                          img.dataset.fallbackApplied = "true";
                          img.src = getBrandedCategoryPlaceholder(item.category);
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: "0.79rem",
                        fontWeight: 700,
                        color: "var(--color-ink-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, mt: 0.25 }}>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--color-ink-primary)" }}>
                        {formatINR(item.price)}
                      </Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: "var(--color-ink-tertiary)", textDecoration: "line-through" }}>
                        {formatINR(item.originalPrice)}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    label={`-${disc}%`}
                    size="small"
                    sx={{
                      height: 22,
                      bgcolor: "rgba(224, 43, 32, 0.12)",
                      color: "var(--color-brand-accent)",
                      fontFamily: "var(--font-mono-telemetry)",
                      fontWeight: 800,
                      fontSize: "0.7rem",
                      flexShrink: 0,
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}

      {/* 2. CATEGORY SAVINGS BREAKDOWN */}
      {categoryStats.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            borderRadius: "10px",
            bgcolor: "var(--color-surface-container)",
            border: "1px solid var(--color-border-divider)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <LocalOfferOutlinedIcon sx={{ color: "var(--color-brand-accent)", fontSize: 19 }} />
            <Typography
              component="h3"
              sx={{
                fontFamily: "var(--font-serif-headline)",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--color-ink-primary)",
                m: 0,
              }}
            >
              Savings by Department
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.85 }}>
            {categoryStats
              .filter((stat) => stat.count > 0)
              .map((stat) => {
                const isActive = selectedCategory.toLowerCase() === stat.key.toLowerCase();
                return (
                  <Box
                    key={stat.key}
                    component="button"
                    type="button"
                    id={`btn-sidebar-cat-${stat.key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    onClick={() => onSelectCategory(stat.key)}
                    sx={{
                      width: "100%",
                      p: 1,
                      px: 1.25,
                      borderRadius: "8px",
                      bgcolor: isActive ? "rgba(224, 43, 32, 0.08)" : "var(--color-surface-container-low)",
                      border: "1px solid",
                      borderColor: isActive ? "var(--color-brand-accent)" : "var(--color-border-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "border-color 150ms ease",
                      "&:hover": { borderColor: "var(--color-brand-accent)" },
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--color-ink-primary)" }}>
                        {stat.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "var(--font-mono-telemetry)",
                          fontSize: "0.68rem",
                          color: "var(--color-ink-secondary)",
                        }}
                      >
                        {stat.count.toLocaleString("en-IN")} deals
                      </Typography>
                    </Box>

                    {stat.maxDiscount > 0 && (
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: "var(--font-mono-telemetry)",
                          fontSize: "0.74rem",
                          fontWeight: 800,
                          color: "var(--color-brand-accent)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Up to {stat.maxDiscount}%
                      </Typography>
                    )}
                  </Box>
                );
              })}
          </Box>
        </Paper>
      )}

      {/* 3. UPGRADED DAILY MYSTERY SCRATCH CARD (DPR-aware, Theme-safe, Pointer-guarded) */}
      {mysteryDeal && (
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            borderRadius: "10px",
            bgcolor: "var(--color-surface-container)",
            border: "1px dashed var(--color-brand-accent)",
            textAlign: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75, mb: 0.5 }}>
            <CardGiftcardOutlinedIcon sx={{ color: "var(--color-brand-accent)", fontSize: 19 }} />
            <Typography
              component="h3"
              sx={{
                fontFamily: "var(--font-serif-headline)",
                fontSize: "1.02rem",
                fontWeight: 700,
                color: "var(--color-ink-primary)",
                m: 0,
              }}
            >
              Daily Mystery Deal
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: "var(--color-ink-secondary)", display: "block", mb: 1.5 }}>
            Scratch below or tap Quick Reveal to unlock today&apos;s featured pick.
          </Typography>

          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: 168,
              borderRadius: "8px",
              overflow: "hidden",
              bgcolor: "var(--color-surface-container-low)",
              border: "1px solid var(--color-border-divider)",
              mb: 1.5,
            }}
          >
            {/* Revealed Product Content */}
            <Box
              sx={{
                p: 1.5,
                height: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "#ffffff",
                  borderRadius: "8px",
                  p: 0.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <img
                  src={getResponsiveAmazonImage(mysteryDeal.imageUrl, "thumb")}
                  alt={mysteryDeal.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.dataset.fallbackApplied) {
                      img.dataset.fallbackApplied = "true";
                      img.src = getBrandedCategoryPlaceholder(mysteryDeal.category);
                    }
                  }}
                />
              </Box>
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "var(--color-ink-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  width: "100%",
                }}
              >
                {mysteryDeal.title}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
                <Typography sx={{ fontSize: "0.96rem", fontWeight: 900, color: "var(--color-telemetry-positive)" }}>
                  {formatINR(mysteryDeal.price)}
                </Typography>
                {mysteryDiscount !== null && (
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "var(--font-mono-telemetry)",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: "var(--color-brand-accent)",
                    }}
                  >
                    -{mysteryDiscount}% OFF
                  </Typography>
                )}
              </Box>
            </Box>

            {/* DPR-Scaled Foil Overlay */}
            {!scratchRevealed && (
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerLeave={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                aria-label="Scratch card overlay to reveal daily mystery deal"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 5,
                  cursor: "crosshair",
                  touchAction: "none",
                  display: "block",
                }}
              />
            )}
          </Box>

          {scratchRevealed ? (
            <Button
              id={`btn-scratch-grab-${mysteryDeal.asin}`}
              component="a"
              href={getAffiliateUrl(mysteryDeal)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              fullWidth
              size="small"
              variant="contained"
              endIcon={<OpenInNewIcon sx={{ fontSize: "14px !important" }} />}
              sx={{
                borderRadius: "8px",
                py: 0.8,
                fontWeight: 800,
                bgcolor: "var(--color-brand-accent)",
                color: "#ffffff",
                "&:hover": { bgcolor: "var(--color-brand-accent-hover)", color: "#ffffff" },
              }}
            >
              Grab Mystery Deal
            </Button>
          ) : (
            <Button
              id="btn-scratch-quick-reveal"
              fullWidth
              size="small"
              variant="outlined"
              onClick={() => setScratchRevealed(true)}
              sx={{
                borderRadius: "8px",
                py: 0.65,
                fontWeight: 700,
                fontSize: "0.78rem",
                borderColor: "var(--color-border-divider)",
                color: "var(--color-ink-primary)",
                "&:hover": { borderColor: "var(--color-brand-accent)", color: "var(--color-brand-accent)" },
              }}
            >
              Quick Reveal
            </Button>
          )}
        </Paper>
      )}

      {/* 4. QUICK AMAZON URL PREVIEWER (Read-Only Allowlisted Preview) */}
      <Paper
        elevation={0}
        id="deals-url-previewer"
        sx={{
          p: 2.25,
          borderRadius: "10px",
          bgcolor: "var(--color-surface-container)",
          border: "1px solid var(--color-border-divider)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
          <LinkOutlinedIcon sx={{ color: "var(--color-brand-accent)", fontSize: 19 }} />
          <Typography
            component="h3"
            sx={{
              fontFamily: "var(--font-serif-headline)",
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "var(--color-ink-primary)",
              m: 0,
            }}
          >
            Amazon Deal Checker
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: "var(--color-ink-secondary)", display: "block", mb: 1.5, lineHeight: 1.45 }}>
          Paste any official Amazon India link to inspect ASIN details and open a direct verified checkout link.
        </Typography>

        <Box component="form" onSubmit={handlePreviewUrl} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <TextField
            id="input-amazon-url-preview"
            inputRef={urlPreviewInputRef}
            size="small"
            fullWidth
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              if (urlError) setUrlError(null);
            }}
            placeholder="https://www.amazon.in/dp/..."
            aria-label="Amazon India product URL"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                bgcolor: "var(--color-surface-container-low)",
                color: "var(--color-ink-primary)",
                fontSize: "0.82rem",
                "& fieldset": { borderColor: "var(--color-border-divider)" },
              },
            }}
          />
          <Button
            id="btn-submit-url-preview"
            type="submit"
            variant="contained"
            size="small"
            disabled={urlLoading}
            sx={{
              borderRadius: "8px",
              py: 0.75,
              fontWeight: 700,
              bgcolor: "var(--color-brand-accent)",
              color: "#ffffff",
              "&:hover": { bgcolor: "var(--color-brand-accent-hover)" },
            }}
          >
            {urlLoading ? <CircularProgress size={16} color="inherit" /> : "Preview Deal"}
          </Button>
        </Box>

        {urlError && (
          <Alert severity="warning" sx={{ mt: 1.25, py: 0.25, fontSize: "0.76rem", borderRadius: "8px" }}>
            {urlError}
          </Alert>
        )}

        {previewProduct && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: "8px",
              bgcolor: "var(--color-surface-container-low)",
              border: "1px solid var(--color-border-divider)",
            }}
          >
            <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", mb: 1.25 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: "6px",
                  bgcolor: "#ffffff",
                  p: 0.5,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={getResponsiveAmazonImage(previewProduct.imageUrl, "thumb")}
                  alt={previewProduct.title}
                  referrerPolicy="no-referrer"
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.dataset.fallbackApplied) {
                      img.dataset.fallbackApplied = "true";
                      img.src = getBrandedCategoryPlaceholder(previewProduct.category);
                    }
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--color-ink-primary)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {previewProduct.title}
                </Typography>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--color-telemetry-positive)", mt: 0.25 }}>
                  {previewProduct.price > 0 ? formatINR(previewProduct.price) : `ASIN: ${previewProduct.asin}`}
                </Typography>
              </Box>
            </Box>
            <Button
              id={`btn-preview-open-${previewProduct.asin}`}
              component="a"
              href={getAffiliateUrl(previewProduct)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              fullWidth
              size="small"
              variant="contained"
              endIcon={<OpenInNewIcon sx={{ fontSize: "13px !important" }} />}
              sx={{
                borderRadius: "6px",
                fontWeight: 700,
                fontSize: "0.76rem",
                bgcolor: "var(--color-brand-accent)",
                color: "#ffffff",
                "&:hover": { bgcolor: "var(--color-brand-accent-hover)", color: "#ffffff" },
              }}
            >
              Open Verified Amazon Link
            </Button>
          </Box>
        )}
      </Paper>

      {/* 5. FTC AFFILIATE DISCLOSURE */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: "10px",
          bgcolor: "var(--color-surface-container-low)",
          border: "1px solid var(--color-border-divider)",
          display: "flex",
          gap: 1.25,
          alignItems: "flex-start",
        }}
      >
        <SecurityOutlinedIcon sx={{ color: "var(--color-brand-accent)", fontSize: 19, mt: 0.2, flexShrink: 0 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--color-ink-primary)", mb: 0.35 }}>
            FTC &amp; Amazon Affiliate Disclosure
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--color-ink-secondary)", lineHeight: 1.5, display: "block" }}>
            WorldNewzs participates in the Amazon Associates program. Purchases made via verified links may earn us a commission at no extra cost to you.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
