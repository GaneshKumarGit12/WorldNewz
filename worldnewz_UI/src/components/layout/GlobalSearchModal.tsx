import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  InputBase,
  IconButton,
  CircularProgress,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import HistoryIcon from "@mui/icons-material/History";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BoltIcon from "@mui/icons-material/Bolt";
import { fetchSearch, fetchStocks } from "../../api/apiClient";
import type { StockItem } from "../../api/apiClient";
import type { Article } from "../../types";

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
  isDark?: boolean;
}

// Fallback high-profile tickers for instant zero-latency match
const FALLBACK_TICKERS: StockItem[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 180.14, change: 1.45, changePercent: 0.8, exchange: "NYSE", trendHint: "Moderate Bullish" },
  { symbol: "NVDA", name: "NVIDIA Corporation", price: 128.45, change: 4.12, changePercent: 3.3, exchange: "NYSE", trendHint: "Strong Bullish" },
  { symbol: "MSFT", name: "Microsoft Corporation", price: 423.56, change: 3.36, changePercent: 0.8, exchange: "NYSE", trendHint: "Moderate Bullish" },
  { symbol: "TSLA", name: "Tesla Inc.", price: 173.30, change: -2.10, changePercent: -1.2, exchange: "NYSE", trendHint: "Moderate Bearish" },
  { symbol: "BTC", name: "Bitcoin / USD", price: 9203.20, change: 178.40, changePercent: 1.97, exchange: "CRYPTO", trendHint: "Strong Bullish" },
  { symbol: "S&P 500", name: "S&P 500 Index", price: 5864.67, change: 47.80, changePercent: 0.82, exchange: "INDEX", trendHint: "Moderate Bullish" },
  { symbol: "NIFTY 50", name: "NSE Nifty 50 Index", price: 24435.50, change: -71.40, changePercent: -0.29, exchange: "NSE", trendHint: "Neutral" },
  { symbol: "RELIANCE", name: "Reliance Industries Ltd.", price: 2930.31, change: 79.81, changePercent: 2.8, exchange: "NSE", trendHint: "Strong Bullish" },
  { symbol: "TCS", name: "Tata Consultancy Services Ltd.", price: 3736.16, change: -84.04, changePercent: -2.2, exchange: "NSE", trendHint: "Strong Bearish" },
  { symbol: "INFY", name: "Infosys Ltd.", price: 1403.36, change: -17.04, changePercent: -1.2, exchange: "NSE", trendHint: "Moderate Bearish" },
];

const QUICK_DESKS = [
  { label: "Money & Markets Wire", path: "/money", icon: "💰", subtitle: "Equities, central banks & crypto" },
  { label: "Technology & AI Wire", path: "/technology", icon: "⚡", subtitle: "Quantum, AI & edge computing" },
  { label: "Live Stocks Terminal", path: "/stocks", icon: "📈", subtitle: "Real-time ticker analytics & predictions" },
  { label: "Today's Amazon Deals", path: "/amazon-products", icon: "🛍️", subtitle: "Verified discounts & affiliate catalog" },
  { label: "Civic Polls & Dossiers", path: "/polls", icon: "📊", subtitle: "Real-time reader sentiment" },
  { label: "DVCubie Snake Arena", path: "/games/dvcubie2026", icon: "🎮", subtitle: "Multiplayer arcade arena" },
];

const RECENT_SEARCHES_KEY = "worldnewzs_recent_searches";

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ open, onClose, isDark = true }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [stocks, setStocks] = useState<StockItem[]>(FALLBACK_TICKERS);
  const [newsResults, setNewsResults] = useState<Article[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : ["Clean Energy", "Frontier Quantum", "Federal Reserve", "Apple", "NVIDIA"];
    } catch {
      return ["Clean Energy", "Federal Reserve", "Apple", "NVIDIA"];
    }
  });

  // Focus input automatically on open
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setNewsResults([]);
    }
  }, [open]);

  // Fetch live market stocks to supplement fallbacks
  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetchStocks("NYSE").catch(() => null),
      fetchStocks("NSE").catch(() => null),
    ]).then(([nyseRes, nseRes]) => {
      const nyseStocks = Array.isArray(nyseRes?.data?.stocks) ? nyseRes.data.stocks : [];
      const nseStocks = Array.isArray(nseRes?.data?.stocks) ? nseRes.data.stocks : [];
      const combined = [...nyseStocks, ...nseStocks];
      if (combined.length > 0) {
        setStocks(combined);
      }
    });
  }, [open]);

  // Save to recent searches
  const recordRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Could not save search history", e);
    }
  };

  const handleClearHistory = () => {
    try {
      setRecentSearches([]);
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.warn("Could not clear history", e);
    }
  };

  // Debounced search for news articles
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setNewsResults([]);
      setLoadingNews(false);
      return;
    }

    setLoadingNews(true);
    const timer = setTimeout(() => {
      fetchSearch({ query: trimmed, pageSize: 5 })
        .then((res) => {
          const raw = Array.isArray(res.data?.results) ? res.data.results : [];
          setNewsResults(raw.slice(0, 5));
        })
        .catch((err) => {
          console.warn("Live news search query failed:", err);
          setNewsResults([]);
        })
        .finally(() => {
          setLoadingNews(false);
        });
    }, 240);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter tickers based on query
  const matchingTickers = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return [];
    return stocks
      .filter((s) => s.symbol.toUpperCase().includes(q) || s.name.toUpperCase().includes(q))
      .slice(0, 4);
  }, [stocks, query]);

  // Filter quick desks based on query
  const matchingDesks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK_DESKS.slice(0, 4);
    return QUICK_DESKS.filter(
      (d) => d.label.toLowerCase().includes(q) || d.subtitle.toLowerCase().includes(q)
    );
  }, [query]);

  // Form submission: execute full search
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    recordRecentSearch(trimmed);
    onClose();
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSelectTicker = (ticker: StockItem) => {
    recordRecentSearch(ticker.symbol);
    onClose();
    navigate(`/stocks`);
  };

  const handleSelectArticle = (article: Article) => {
    if (article.title) recordRecentSearch(article.title.slice(0, 30));
    onClose();
    if (article.url) {
      navigate(`/read-full-article?url=${encodeURIComponent(article.url)}&title=${encodeURIComponent(article.title || "")}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(article.title || "")}`);
    }
  };

  const handleSelectDesk = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="global-command-palette-title"
      PaperProps={{
        sx: {
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          backgroundImage: "none",
          borderRadius: "16px",
          border: "1px solid",
          borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)",
          boxShadow: isDark
            ? "0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)"
            : "0 20px 50px rgba(15, 23, 42, 0.15)",
          overflow: "hidden",
          m: { xs: 1.5, sm: 2 },
          maxHeight: "85vh",
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: isDark ? "rgba(7, 11, 20, 0.8)" : "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(8px)",
        },
      }}
    >
      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
        {/* Top Input Bar */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 1.5,
            borderBottom: "1px solid",
            borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
            gap: 1.2,
          }}
        >
          <SearchIcon sx={{ color: isDark ? "#60a5fa" : "#2563eb", fontSize: 22 }} />
          <InputBase
            id="global-command-palette-input"
            inputRef={inputRef}
            fullWidth
            placeholder="Search wire dispatches, tickers (e.g. AAPL, NVDA), topics…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            inputProps={{
              "aria-label": "Search wire dispatches, tickers and topics",
              style: {
                fontSize: "15px",
                fontFamily: "var(--font-sans-body)",
                fontWeight: 500,
                color: isDark ? "#f8fafc" : "#0f172a",
              },
            }}
          />
          {loadingNews && <CircularProgress size={16} sx={{ color: isDark ? "#94a3b8" : "#64748b" }} />}
          {query ? (
            <IconButton size="small" onClick={() => setQuery("")} sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          ) : (
            <Box
              component="span"
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "var(--font-mono-telemetry)",
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9",
                color: isDark ? "#94a3b8" : "#64748b",
                border: "1px solid",
                borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#e2e8f0",
              }}
            >
              ESC
            </Box>
          )}
        </Box>

        {/* Scrollable Results Area */}
        <Box sx={{ overflowY: "auto", maxHeight: "60vh", p: 2 }}>
          {/* Section 1: Market Tickers */}
          {matchingTickers.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <Typography
                component="div"
                sx={{
                  fontSize: "11px",
                  fontWeight: 800,
                  fontFamily: "var(--font-mono-telemetry)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: isDark ? "#60a5fa" : "#2563eb",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.6,
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 14 }} />
                <span>Market Tickers ({matchingTickers.length})</span>
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                {matchingTickers.map((ticker) => {
                  const isPositive = (ticker.changePercent ?? 0) >= 0;
                  return (
                    <Box
                      key={ticker.symbol}
                      onClick={() => handleSelectTicker(ticker)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1.2,
                        borderRadius: "10px",
                        backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f8fafc",
                        border: "1px solid",
                        borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#e2e8f0",
                        cursor: "pointer",
                        transition: "all 0.18s ease",
                        "&:hover": {
                          backgroundColor: isDark ? "rgba(59, 130, 246, 0.12)" : "#eff6ff",
                          borderColor: isDark ? "rgba(59, 130, 246, 0.3)" : "#bfdbfe",
                          transform: "translateX(2px)",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 800,
                            fontFamily: "var(--font-mono-telemetry)",
                            fontSize: "13.5px",
                            color: isDark ? "#f8fafc" : "#0f172a",
                            minWidth: "65px",
                          }}
                        >
                          {ticker.symbol}
                        </Box>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: "13px",
                            fontFamily: "var(--font-sans-body)",
                            color: isDark ? "#94a3b8" : "#475569",
                            maxWidth: { xs: 150, sm: 260 },
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {ticker.name}
                        </Typography>
                        {ticker.exchange && (
                          <Chip
                            label={ticker.exchange}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: "10px",
                              fontWeight: 700,
                              fontFamily: "var(--font-mono-telemetry)",
                              backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#e2e8f0",
                              color: isDark ? "#cbd5e1" : "#475569",
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography
                          component="span"
                          sx={{
                            fontWeight: 700,
                            fontFamily: "var(--font-mono-telemetry)",
                            fontSize: "13px",
                            color: isDark ? "#f8fafc" : "#0f172a",
                          }}
                        >
                          {ticker.exchange === "NSE" || ticker.exchange === "BSE" ? "₹" : "$"}
                          {ticker.price?.toLocaleString()}
                        </Typography>
                        <Box
                          component="span"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.2,
                            px: 0.8,
                            py: 0.2,
                            borderRadius: "5px",
                            fontSize: "11px",
                            fontWeight: 700,
                            fontFamily: "var(--font-mono-telemetry)",
                            backgroundColor: isPositive
                              ? (isDark ? "rgba(34, 197, 94, 0.15)" : "#dcfce7")
                              : (isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2"),
                            color: isPositive
                              ? (isDark ? "#4ade80" : "#16a34a")
                              : (isDark ? "#f87171" : "#dc2626"),
                          }}
                        >
                          {isPositive ? <TrendingUpIcon sx={{ fontSize: 13 }} /> : <TrendingDownIcon sx={{ fontSize: 13 }} />}
                          <span>{isPositive ? "+" : ""}{ticker.changePercent}%</span>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Section 2: Wire Dispatches & News */}
          {newsResults.length > 0 && (
            <Box sx={{ mb: 2.5 }}>
              <Typography
                component="div"
                sx={{
                  fontSize: "11px",
                  fontWeight: 800,
                  fontFamily: "var(--font-mono-telemetry)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: isDark ? "#38bdf8" : "#0284c7",
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.6,
                }}
              >
                <NewspaperIcon sx={{ fontSize: 14 }} />
                <span>Wire Dispatches &amp; Articles ({newsResults.length})</span>
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                {newsResults.map((article, idx) => (
                  <Box
                    key={article.url || idx}
                    onClick={() => handleSelectArticle(article)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.2,
                      borderRadius: "10px",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f8fafc",
                      border: "1px solid",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#e2e8f0",
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      "&:hover": {
                        backgroundColor: isDark ? "rgba(59, 130, 246, 0.12)" : "#eff6ff",
                        borderColor: isDark ? "rgba(59, 130, 246, 0.3)" : "#bfdbfe",
                        transform: "translateX(2px)",
                      },
                    }}
                  >
                    {article.urlToImage ? (
                      <Box
                        component="img"
                        src={article.urlToImage}
                        alt=""
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: "8px",
                          objectFit: "cover",
                          flexShrink: 0,
                          backgroundColor: isDark ? "#1e293b" : "#e2e8f0",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: "8px",
                          backgroundColor: isDark ? "#1e293b" : "#e2e8f0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isDark ? "#64748b" : "#94a3b8",
                          flexShrink: 0,
                        }}
                      >
                        <NewspaperIcon sx={{ fontSize: 20 }} />
                      </Box>
                    )}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: 700,
                          lineHeight: 1.35,
                          fontFamily: "var(--font-sans-body)",
                          color: isDark ? "#f8fafc" : "#0f172a",
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {article.title}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.3 }}>
                        <Box
                          component="span"
                          sx={{
                            fontSize: "10px",
                            fontWeight: 700,
                            fontFamily: "var(--font-mono-telemetry)",
                            textTransform: "uppercase",
                            color: isDark ? "#60a5fa" : "#2563eb",
                          }}
                        >
                          {article.category || "Wire"}
                        </Box>
                        {article.publishedAt && (
                          <Typography
                            component="span"
                            sx={{ fontSize: "11px", color: isDark ? "#64748b" : "#94a3b8" }}
                          >
                            • {new Date(article.publishedAt).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <ArrowForwardIcon sx={{ fontSize: 16, color: isDark ? "#64748b" : "#94a3b8" }} />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Section 3: Quick Desk Navigation */}
          <Box sx={{ mb: query ? 1 : 2.5 }}>
            <Typography
              component="div"
              sx={{
                fontSize: "11px",
                fontWeight: 800,
                fontFamily: "var(--font-mono-telemetry)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: isDark ? "#94a3b8" : "#64748b",
                mb: 1,
                display: "flex",
                alignItems: "center",
                gap: 0.6,
              }}
            >
              <BoltIcon sx={{ fontSize: 14 }} />
              <span>{query ? "Matching Desks" : "Quick Editorial Desks"}</span>
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1,
              }}
            >
              {matchingDesks.map((desk) => (
                <Box
                  key={desk.path}
                  onClick={() => handleSelectDesk(desk.path)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    p: 1.2,
                    borderRadius: "10px",
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.02)" : "#f8fafc",
                    border: "1px solid",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#e2e8f0",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    "&:hover": {
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#cbd5e1",
                    },
                  }}
                >
                  <Box sx={{ fontSize: "18px" }}>{desk.icon}</Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: "12.5px",
                        fontWeight: 700,
                        fontFamily: "var(--font-sans-body)",
                        color: isDark ? "#f8fafc" : "#0f172a",
                      }}
                    >
                      {desk.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "11px",
                        color: isDark ? "#64748b" : "#94a3b8",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {desk.subtitle}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Section 4: Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography
                  component="div"
                  sx={{
                    fontSize: "11px",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono-telemetry)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: isDark ? "#94a3b8" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.6,
                  }}
                >
                  <HistoryIcon sx={{ fontSize: 14 }} />
                  <span>Recent Searches</span>
                </Typography>
                <Typography
                  onClick={handleClearHistory}
                  sx={{
                    fontSize: "11px",
                    color: isDark ? "#64748b" : "#94a3b8",
                    cursor: "pointer",
                    "&:hover": { color: isDark ? "#cbd5e1" : "#475569", textDecoration: "underline" },
                  }}
                >
                  Clear History
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                {recentSearches.map((term, i) => (
                  <Chip
                    key={i}
                    label={term}
                    size="small"
                    onClick={() => {
                      setQuery(term);
                    }}
                    sx={{
                      fontFamily: "var(--font-sans-body)",
                      fontSize: "11.5px",
                      cursor: "pointer",
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f1f5f9",
                      color: isDark ? "#cbd5e1" : "#334155",
                      border: "1px solid",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                      "&:hover": {
                        backgroundColor: isDark ? "rgba(59, 130, 246, 0.15)" : "#dbeafe",
                        color: isDark ? "#60a5fa" : "#2563eb",
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Full Search Action Trigger */}
          {query.trim().length > 0 && (
            <Box
              onClick={() => handleSubmit()}
              sx={{
                mt: 2,
                p: 1.4,
                borderRadius: "10px",
                backgroundColor: isDark ? "rgba(59, 130, 246, 0.1)" : "#eff6ff",
                border: "1px dashed",
                borderColor: isDark ? "rgba(59, 130, 246, 0.3)" : "#93c5fd",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "all 0.18s ease",
                "&:hover": {
                  backgroundColor: isDark ? "rgba(59, 130, 246, 0.18)" : "#dbeafe",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SearchIcon sx={{ color: isDark ? "#60a5fa" : "#2563eb", fontSize: 18 }} />
                <Typography sx={{ fontSize: "13px", fontWeight: 600, color: isDark ? "#f8fafc" : "#0f172a" }}>
                  Search for &ldquo;<strong>{query}</strong>&rdquo; across all news archives
                </Typography>
              </Box>
              <Chip
                label="Press ↵ Enter"
                size="small"
                sx={{
                  fontFamily: "var(--font-mono-telemetry)",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  backgroundColor: isDark ? "rgba(59, 130, 246, 0.2)" : "#dbeafe",
                  color: isDark ? "#93c5fd" : "#1d4ed8",
                }}
              />
            </Box>
          )}
        </Box>

        {/* Modal Footer Controls */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1,
            backgroundColor: isDark ? "rgba(0, 0, 0, 0.2)" : "#f8fafc",
            borderTop: "1px solid",
            borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <kbd style={{ fontSize: "10px", padding: "2px 5px", borderRadius: "4px", backgroundColor: isDark ? "#1e293b" : "#e2e8f0", color: isDark ? "#94a3b8" : "#475569" }}>ESC</kbd>
              <Typography sx={{ fontSize: "11px", color: isDark ? "#64748b" : "#94a3b8" }}>close</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <kbd style={{ fontSize: "10px", padding: "2px 5px", borderRadius: "4px", backgroundColor: isDark ? "#1e293b" : "#e2e8f0", color: isDark ? "#94a3b8" : "#475569" }}>↵</kbd>
              <Typography sx={{ fontSize: "11px", color: isDark ? "#64748b" : "#94a3b8" }}>select / search</Typography>
            </Box>
          </Box>
          <Typography
            sx={{
              fontSize: "11px",
              fontFamily: "var(--font-mono-telemetry)",
              fontWeight: 600,
              color: isDark ? "#60a5fa" : "#2563eb",
            }}
          >
            WORLDNEWZS WIRE INTELLIGENCE
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
