import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchGoogleSearch } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { useColorMode } from "../context/ThemeContext";
import AdCard from "../components/AdCard";
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CircularProgress, 
  Button, 
  Divider,
  Paper
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import LanguageIcon from "@mui/icons-material/Language";

interface GoogleResultItem {
  title: string;
  link: string;
  snippet: string;
  imageUrl?: string;
}

const GSearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const { mode } = useColorMode();
  const isDark = mode === "dark";

  const [results, setResults] = useState<GoogleResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useWidgetFallback, setUseWidgetFallback] = useState(false);

  useEffect(() => {
    if (useWidgetFallback) {
      const existingScript = document.getElementById("google-cse-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-cse-script";
        script.src = "https://cse.google.com/cse.js?cx=e44b68ef599eb4717";
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [useWidgetFallback]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setUseWidgetFallback(false);

    fetchGoogleSearch(query)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setResults(res.data);
        } else {
          setResults([]);
        }
      })
      .catch((err: any) => {
        console.warn("Google Search JSON API failed, falling back to Google Search Widget:", err);
        setUseWidgetFallback(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [query]);

  const displayTitle = query ? `Search: "${query}"` : "Google Search";

  return (
    <Box sx={{ minHeight: "80vh", py: { xs: 3, md: 5 } }}>
      <SEOMeta
        title={displayTitle}
        description={`Google search results for "${query}" on WorldNewzs.`}
        keywords={["google search", query, "worldnewzs search"]}
      />

      <Container maxWidth="lg">
        {/* Back Link */}
        <Box sx={{ mb: 3 }}>
          <Button
            component={Link}
            to="/"
            startIcon={<ArrowBackIcon />}
            id="back-to-home-btn"
            sx={{
              color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              transition: "color 0.2s",
              "&:hover": {
                color: "#c83a15",
                backgroundColor: "transparent"
              }
            }}
          >
            Back to Home
          </Button>
        </Box>

        {/* Title Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontFamily: "'Outfit', 'Inter', 'Roboto', sans-serif",
              color: isDark ? "#ffffff" : "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1
            }}
          >
            <SearchIcon sx={{ color: "#c83a15", fontSize: 32 }} />
            Google Search Results
          </Typography>
          {query && (
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              Showing web search results for <strong>{query}</strong>
            </Typography>
          )}
        </Box>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10 }}>
            <CircularProgress sx={{ color: "#c83a15" }} />
          </Box>
        )}

        {/* Error State */}
        {!loading && error && !useWidgetFallback && (
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 4,
              borderColor: "divider",
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.01)"
            }}
          >
            <Typography variant="h6" color="error" sx={{ mb: 2, fontWeight: 700 }}>
              ⚠️ Search Configuration Warning
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 600, mx: "auto", mb: 3, color: "text.secondary" }}>
              {error.includes("GOOGLE_SEARCH_CX") || error.includes("credentials") ? (
                "Google search service is not fully configured on the server. Please verify GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, and GOOGLE_SEARCH_CX are correctly configured in the backend environment."
              ) : (
                error
              )}
            </Typography>
            <Button
              variant="contained"
              component={Link}
              to="/"
              sx={{
                backgroundColor: "#c83a15",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: "#a83011"
                }
              }}
            >
              Return Home
            </Button>
          </Paper>
        )}

        {/* Empty State */}
        {!loading && !error && query && results.length === 0 && !useWidgetFallback && (
          <Paper
            variant="outlined"
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: 4,
              borderColor: "divider",
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.01)"
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              No Results Found
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              We couldn't find any Google web results matching "{query}". Check your spelling or try another term.
            </Typography>
            <Button
              variant="outlined"
              component={Link}
              to="/"
              sx={{
                borderColor: "#c83a15",
                color: "#c83a15",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                "&:hover": {
                  borderColor: "#a83011",
                  backgroundColor: "rgba(200, 58, 21, 0.05)"
                }
              }}
            >
              Browse Latest News
            </Button>
          </Paper>
        )}

        {/* Results List */}
        {!loading && !error && results.length > 0 && !useWidgetFallback && (
          <Grid container spacing={4}>
            {/* Main Content Area */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {results.map((item, idx) => (
                  <React.Fragment key={`${item.link}-${idx}`}>
                    {/* Render AdCard every 3 articles, with clear visual separation */}
                    {idx > 0 && idx % 3 === 0 && (
                      <Box sx={{ my: 1, p: 1 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: "block", 
                            mb: 1.5, 
                            color: "text.secondary", 
                            fontWeight: 600,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase"
                          }}
                        >
                          Sponsored Ad
                        </Typography>
                        <AdCard placement="between-articles" index={idx} />
                        <Divider sx={{ mt: 3, mb: 1 }} />
                      </Box>
                    )}

                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        borderColor: "divider",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        overflow: "hidden",
                        backgroundColor: isDark ? "rgba(22,27,34,0.4)" : "#ffffff",
                        backdropFilter: isDark ? "blur(12px)" : "none",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
                          borderColor: "#c83a15"
                        }
                      }}
                    >
                      <Grid container>
                        {/* Thumbnail Image (CLS optimized) */}
                        {item.imageUrl && (
                          <Grid size={{ xs: 12, sm: 4 }}>
                            <Box 
                              sx={{ 
                                position: "relative", 
                                pt: "62.5%", // 16:10 aspect ratio
                                width: "100%",
                                height: 0,
                                overflow: "hidden"
                              }}
                            >
                              <CardMedia
                                component="img"
                                image={item.imageUrl}
                                alt={item.title}
                                sx={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover"
                                }}
                              />
                            </Box>
                          </Grid>
                        )}
                        <Grid size={{ xs: 12, sm: item.imageUrl ? 8 : 12 }}>
                          <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
                            {/* Hostname Link */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
                              <LanguageIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: "text.secondary", 
                                  fontFamily: "monospace",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {new URL(item.link).hostname}
                              </Typography>
                            </Box>

                            {/* Title */}
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                mb: 1.5,
                                lineHeight: 1.3,
                                "& a": {
                                  color: isDark ? "#ffffff" : "#1e293b",
                                  textDecoration: "none",
                                  transition: "color 0.2s",
                                  "&:hover": {
                                    color: "#c83a15"
                                  }
                                }
                              }}
                            >
                              <a href={item.link} target="_blank" rel="noopener noreferrer">
                                {item.title}
                              </a>
                            </Typography>

                            {/* Snippet */}
                            <Typography
                              variant="body2"
                              sx={{
                                color: "text.secondary",
                                mb: 2,
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                lineHeight: 1.6
                              }}
                            >
                              {item.snippet}
                            </Typography>

                            {/* Action Button */}
                            <Box sx={{ mt: "auto" }}>
                              <Button
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="outlined"
                                size="small"
                                sx={{
                                  textTransform: "none",
                                  fontWeight: 600,
                                  borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
                                  color: isDark ? "rgba(255,255,255,0.85)" : "#1e293b",
                                  borderRadius: 2,
                                  "&:hover": {
                                    borderColor: "#c83a15",
                                    color: "#c83a15",
                                    backgroundColor: "rgba(200, 58, 21, 0.05)"
                                  }
                                }}
                              >
                                View Original Article
                              </Button>
                            </Box>
                          </CardContent>
                        </Grid>
                      </Grid>
                    </Card>
                  </React.Fragment>
                ))}
              </Box>
            </Grid>

            {/* Sidebar Ad & Content Area */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box 
                sx={{ 
                  position: "sticky", 
                  top: 90, 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 4 
                }}
              >
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    borderColor: "divider",
                    backgroundColor: isDark ? "rgba(22,27,34,0.4)" : "#ffffff"
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em", color: "#c83a15" }}>
                    About WorldNewzs Search
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                    WorldNewzs features integrated Google Custom Search to let you access real-time web results directly from our platform. Organic results are separated clearly from promotional contents to ensure privacy and AdSense policy adherence.
                  </Typography>
                </Paper>

                <Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: "block", 
                      mb: 1.5, 
                      color: "text.secondary", 
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase"
                    }}
                  >
                    Sponsored Sidebar Ad
                  </Typography>
                  <AdCard placement="sidebar" index={99} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Google CSE Widget Fallback Container */}
        {!loading && useWidgetFallback && (
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 4,
              borderColor: "divider",
              backgroundColor: isDark ? "rgba(22, 27, 34, 0.4)" : "#ffffff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
            }}
          >
            <div className="gcse-searchresults-only" data-queryParameterName="q"></div>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default GSearchResults;
