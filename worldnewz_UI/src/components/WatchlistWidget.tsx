import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router-dom";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { fetchStocks } from "../api/apiClient";

interface WatchlistItem {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isPositive: boolean;
  sparkline: number[];
  followed: boolean;
}

const defaultWatchlist: WatchlistItem[] = [
  {
    symbol: "INR/USD",
    name: "Indian Rupee/US Dollar",
    price: "0.01198",
    change: "+0.29%",
    isPositive: true,
    sparkline: [20, 22, 21, 24, 25, 23, 27, 28, 29, 31, 30, 32],
    followed: false,
  },
  {
    symbol: "DOW",
    name: "Dow Jones Industrial Average",
    price: "42,535.47",
    change: "+1.32%",
    isPositive: true,
    sparkline: [10, 15, 12, 18, 22, 21, 25, 27, 26, 32, 34, 38],
    followed: true,
  },
  {
    symbol: "SENSEX",
    name: "BSE SENSEX",
    price: "77,100.47",
    change: "+0.14%",
    isPositive: true,
    sparkline: [30, 28, 29, 32, 31, 33, 32, 34, 33, 35, 36, 37],
    followed: true,
  },
  {
    symbol: "NIFTY 50",
    name: "NSE Nifty 50 Index",
    price: "23,516.20",
    change: "-0.25%",
    isPositive: false,
    sparkline: [40, 38, 39, 37, 36, 34, 35, 33, 31, 32, 30, 28],
    followed: false,
  },
];

export const WatchlistWidget: React.FC = () => {
  const [items, setItems] = useState<WatchlistItem[]>(defaultWatchlist);
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    // Attempt to load live stocks data from backend
    fetchStocks("NYSE")
      .then((res) => {
        if (res.data && res.data.stocks && res.data.stocks.length > 0) {
          const apiStocks = res.data.stocks.slice(0, 3);
          const updatedItems = items.map((item) => {
            const match = apiStocks.find(s => s.symbol.includes(item.symbol) || item.symbol.includes(s.symbol));
            if (match) {
              const spark = [...item.sparkline];
              // slightly shift sparkline based on change
              spark.push(spark[spark.length - 1] + (match.changePercent > 0 ? 2 : -2));
              spark.shift();
              return {
                ...item,
                price: match.price.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                change: `${match.changePercent >= 0 ? "+" : ""}${match.changePercent.toFixed(2)}%`,
                isPositive: match.changePercent >= 0,
                sparkline: spark,
              };
            }
            return item;
          });
          setItems(updatedItems);
        }
      })
      .catch((err) => {
        console.warn("Could not load live stocks for watchlist, using cached defaults.", err);
      });
  }, []);

  const handleFollowToggle = (symbol: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.symbol === symbol ? { ...item, followed: !item.followed } : item
      )
    );
  };

  const renderSparkline = (data: number[], isPositive: boolean) => {
    const width = 60;
    const height = 24;
    const padding = 2;
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;

    const points = data
      .map((val, idx) => {
        const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
        const y = padding + (1 - (val - minVal) / range) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width={width} height={height} style={{ overflow: "visible" }}>
        <polyline
          fill="none"
          stroke={isPositive ? "#2e7d32" : "#d32f2f"}
          strokeWidth="1.5"
          points={points}
        />
      </svg>
    );
  };

  return (
    <Card
      sx={{
        background: (theme) =>
          theme.palette.mode === "dark" ? "#161b22" : "#ffffff",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        height: 380,
        boxShadow: "none",
        "&:hover": { transform: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" },
      }}
    >
      <CardContent sx={{ p: 2.5, pb: "16px !important", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TrendingUpIcon sx={{ color: "success.main" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Watchlist suggestions
            </Typography>
          </Box>
          <IconButton size="small" id="watchlist-menu-btn">
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Currency Pair */}
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {items[0].symbol}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: items[0].isPositive ? "success.main" : "error.main",
              }}
            >
              {items[0].change}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {items[0].name}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {items[0].price}
            </Typography>
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 700 }}>
          Suggested for you
        </Typography>

        {/* Suggested Stocks List */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1, overflowY: "auto", pr: 0.5 }}>
          {items.slice(1).map((stock) => (
            <Box
              key={stock.symbol}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                pb: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ minWidth: 80 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.85rem" }}>
                  {stock.symbol}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.7rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110 }}>
                  {stock.name}
                </Typography>
              </Box>

              {/* Sparkline */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mx: 1 }}>
                {renderSparkline(stock.sparkline, stock.isPositive)}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 80, justifyContent: "flex-end" }}>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem", color: stock.isPositive ? "success.main" : "error.main", display: "block" }}>
                    {stock.change}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                    {stock.price}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => handleFollowToggle(stock.symbol)}
                  id={`follow-btn-${stock.symbol.replace(/\s+/g, "")}`}
                  sx={{
                    bgcolor: stock.followed ? "primary.main" : "action.hover",
                    color: stock.followed ? "primary.contrastText" : "text.primary",
                    border: "1px solid",
                    borderColor: stock.followed ? "primary.main" : "divider",
                    p: 0.25,
                    "&:hover": { bgcolor: stock.followed ? "primary.dark" : "action.selected" },
                  }}
                >
                  {stock.followed ? <CheckIcon sx={{ fontSize: 14 }} /> : <AddIcon sx={{ fontSize: 14 }} />}
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Footer Carousel Dots & See Watchlist Link */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
          {/* Carousel dots */}
          <Box sx={{ display: "flex", gap: 0.75 }}>
            {[0, 1, 2, 3].map((dot) => (
              <Box
                key={dot}
                onClick={() => setActiveDot(dot)}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: activeDot === dot ? "text.primary" : "text.disabled",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
              />
            ))}
          </Box>

          <Link
            component={RouterLink}
            to="/stocks"
            id="see-watchlist-link"
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "primary.main",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            See watchlist suggestions
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
};
