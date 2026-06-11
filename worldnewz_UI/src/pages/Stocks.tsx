import React, { useState, useEffect } from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SearchIcon from "@mui/icons-material/Search";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import Chip from "@mui/material/Chip";
import { fetchStocks } from "../api/apiClient";
import type { StockItem } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";

const Stocks: React.FC = () => {
  const [exchange, setExchange] = useState<string>("NYSE");
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    loadStocks(exchange);
  }, [exchange]);

  const loadStocks = async (ex: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchStocks(ex);
      setStocks(response.data.stocks || []);
      setLastUpdated(response.data.lastUpdated || "");
    } catch (err: any) {
      setError("Failed to fetch stock market quotes. Please check if backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeChange = (event: any) => {
    setExchange(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCurrencySymbol = (ex: string) => {
    return ex === "NYSE" ? "$" : "₹";
  };

  // Aggregated index stats for top widget cards
  const getTopGainer = () => {
    if (stocks.length === 0) return null;
    return [...stocks].sort((a, b) => b.changePercent - a.changePercent)[0];
  };

  const getTopLoser = () => {
    if (stocks.length === 0) return null;
    return [...stocks].sort((a, b) => a.changePercent - b.changePercent)[0];
  };

  const topGainer = getTopGainer();
  const topLoser = getTopLoser();
  const currencySymbol = getCurrencySymbol(exchange);

  const dynamicKeywordsData = useKeywords("stocks");

  const defaultKeywords = ["stocks", "stock market", "NYSE", "BSE", "NSE", "investing", "financial analytics", "tomorrow trend hint"];
  const combinedKeywords = dynamicKeywordsData
    ? [...new Set([...defaultKeywords, ...dynamicKeywordsData.primary, ...dynamicKeywordsData.longtail, ...dynamicKeywordsData.trending])]
    : defaultKeywords;
  const descriptionToUse = dynamicKeywordsData?.metaDesc || "Monitor indices and stock values for NYSE, BSE, and NSE. Get tomorrow's predictive stock trend hints using MarketData app feed.";

  return (
    <>
      <SEOMeta
        title="Dynamic Stock Market Dashboard | WorldNewzs"
        description={descriptionToUse}
        keywords={combinedKeywords}
        canonical="https://worldnewzs.in/stocks"
      />
      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: "https://worldnewzs.in" },
          { name: "Stock Dashboard", url: "https://worldnewzs.in/stocks" },
        ]}
      />

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Header section */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 5, flexWrap: "wrap", gap: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <ShowChartIcon sx={{ fontSize: 45, color: "primary.main" }} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 900 }}>
                Stock Market Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Technical analytics and AI-based predictive trend hints for tomorrow.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="exchange-select-label">Stock Exchange</InputLabel>
              <Select
                labelId="exchange-select-label"
                id="exchange-select"
                value={exchange}
                onChange={handleExchangeChange}
                label="Stock Exchange"
                sx={{ borderRadius: 3, fontWeight: 700 }}
              >
                <MenuItem value="NYSE">NYSE (United States)</MenuItem>
                <MenuItem value="BSE">BSE (India)</MenuItem>
                <MenuItem value="NSE">NSE (India)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Loading and Error */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={50} />
          </Box>
        )}

        {error && !loading && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Top summary cards */}
        {!loading && !error && stocks.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Top Gainer Widget */}
            {topGainer && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ borderRadius: 4, borderLeft: "6px solid #2e7d32", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }} color="text.secondary">
                        Top Gainer
                      </Typography>
                      <TrendingUpIcon color="success" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {topGainer.symbol}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                      {topGainer.name}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 900 }}>
                        {currencySymbol}{topGainer.price}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "success.main", fontWeight: 800, display: "flex", alignItems: "center" }}>
                        <ArrowDropUpIcon /> +{topGainer.changePercent.toFixed(2)}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Top Loser Widget */}
            {topLoser && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ borderRadius: 4, borderLeft: "6px solid #d32f2f", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }} color="text.secondary">
                        Top Loser
                      </Typography>
                      <TrendingDownIcon color="error" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {topLoser.symbol}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                      {topLoser.name}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 900 }}>
                        {currencySymbol}{topLoser.price}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "error.main", fontWeight: 800, display: "flex", alignItems: "center" }}>
                        <ArrowDropDownIcon /> {topLoser.changePercent.toFixed(2)}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* API Feed Status Widget */}
            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
              <Card sx={{ borderRadius: 4, borderLeft: "6px solid #0288d1", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", height: "100%" }}>
                <CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase" }} color="text.secondary">
                      API Feed Status
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "info.main", mt: 0.5 }}>
                      MarketData™ Active
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      <strong>Last Sync:</strong> {lastUpdated}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      <strong>Source:</strong> marketdata.app api integration
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Main Stocks Listing Table */}
        {!loading && !error && (
          <Card sx={{ borderRadius: 4, boxShadow: "0 6px 25px rgba(0,0,0,0.05)", border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid", borderColor: "divider", flexWrap: "wrap", gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {exchange} Listings
              </Typography>
              <TextField
                placeholder="Filter symbol or company..."
                value={searchQuery}
                onChange={handleSearchChange}
                size="small"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ maxWidth: 300, width: "100%" }}
              />
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: "none", borderRadius: 0 }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: "action.hover" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Symbol</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Company Name</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Change</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>% Change</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Tomorrow's Trend Hint</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStocks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">No tickers match your filter.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStocks.map((stock) => {
                      const isPositive = stock.change >= 0;
                      const isStrong = Math.abs(stock.changePercent) >= 1.5;

                      return (
                        <TableRow key={stock.symbol} hover>
                          <TableCell sx={{ fontWeight: 800 }}>{stock.symbol}</TableCell>
                          <TableCell sx={{ color: "text.secondary" }}>{stock.name}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>
                            {currencySymbol}{stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 800,
                              color: isPositive ? "success.main" : "error.main",
                            }}
                          >
                            {isPositive ? "+" : ""}{stock.change.toFixed(2)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 800,
                              color: isPositive ? "success.main" : "error.main",
                            }}
                          >
                            {isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={stock.trendHint}
                              size="small"
                              color={
                                stock.trendHint.includes("Bullish")
                                  ? "success"
                                  : stock.trendHint.includes("Bearish")
                                  ? "error"
                                  : "default"
                              }
                              variant={isStrong ? "filled" : "outlined"}
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                minWidth: 200,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </Container>
    </>
  );
};

export default Stocks;
