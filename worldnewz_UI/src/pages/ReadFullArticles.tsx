import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Box, Typography, Card, CardMedia, Button, Container, Divider, Alert, LinearProgress, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ShareIcon from "@mui/icons-material/Share";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import VerifiedIcon from "@mui/icons-material/Verified";
import ScienceIcon from "@mui/icons-material/Science";
import LaptopIcon from "@mui/icons-material/Laptop";
import ExploreIcon from "@mui/icons-material/Explore";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import FlightIcon from "@mui/icons-material/Flight";
import MovieIcon from "@mui/icons-material/Movie";
import { useEffect, useState } from "react";
import type { Article } from "../types";
import { fetchFullContent, fetchSearch } from "../api/apiClient";
import { JSONLDNewsArticle, JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { SEOMeta } from "../seo/SEOMeta";

const getCategoryConfig = (category?: string) => {
  const cat = (category || '').toLowerCase().trim();
  switch (cat) {
    case 'science':
      return { color: '#4caf50', icon: <ScienceIcon fontSize="inherit" />, name: 'Science' };
    case 'tech':
    case 'technology':
      return { color: '#2196f3', icon: <LaptopIcon fontSize="inherit" />, name: 'Technology' };
    case 'discover':
    case 'general':
    case 'news':
      return { color: '#ff9800', icon: <ExploreIcon fontSize="inherit" />, name: 'Discover' };
    case 'sports':
      return { color: '#f44336', icon: <SportsSoccerIcon fontSize="inherit" />, name: 'Sports' };
    case 'money':
    case 'business':
    case 'finance':
      return { color: '#e91e63', icon: <MonetizationOnIcon fontSize="inherit" />, name: 'Money' };
    case 'food':
      return { color: '#9c27b0', icon: <RestaurantIcon fontSize="inherit" />, name: 'Food' };
    case 'shopping':
      return { color: '#00bcd4', icon: <ShoppingBagIcon fontSize="inherit" />, name: 'Shopping' };
    case 'travel':
      return { color: '#009688', icon: <FlightIcon fontSize="inherit" />, name: 'Travel' };
    case 'entertainment':
      return { color: '#673ab7', icon: <MovieIcon fontSize="inherit" />, name: 'Entertainment' };
    default:
      return { color: '#ff9800', icon: <ExploreIcon fontSize="inherit" />, name: 'Discover' };
  }
};

const ReadFullArticles: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [scrapingError, setScrapingError] = useState<string | null>(null);
  
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
  const shareOpen = Boolean(shareAnchorEl);

  // 1. Resolve article object (from state or fallback fetch)
  useEffect(() => {
    const state = location.state as { article?: Article };
    if (state?.article) {
      setArticle(state.article);
      setLoading(false);
    } else if (id) {
      setLoading(true);
      const query = id.split("-").join(" ");
      fetchSearch({ query, pageSize: 5 })
        .then((res) => {
          const results = Array.isArray(res.data?.results) ? res.data.results : [];
          if (results.length > 0) {
            const fetched = results[0];
            setArticle({
              ...fetched,
              imageUrl: fetched.urlToImage || fetched.imageUrl,
              category: fetched.category || (fetched.source && (typeof fetched.source === "string" ? fetched.source : fetched.source.name)) || "News"
            });
          } else {
            setArticle(null);
          }
        })
        .catch((err) => {
          console.error("Error looking up article by slug:", err);
          setArticle(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [location, id]);

  // 2. Fetch full parsed content once article URL is known
  useEffect(() => {
    if (!article || !article.url) return;

    setScrapingLoading(true);
    setScrapingError(null);

    fetchFullContent(article.url)
      .then((res) => {
        if (res.data && res.data.success && Array.isArray(res.data.content)) {
          setParagraphs(res.data.content);
        } else {
          setParagraphs([]);
          setScrapingError(res.data?.message || "No readable content found on the page.");
        }
      })
      .catch((err) => {
        console.error("Error fetching full content proxy:", err);
        setScrapingError("Could not retrieve the full content due to source page restrictions.");
      })
      .finally(() => {
        setScrapingLoading(false);
      });
  }, [article]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box sx={{ width: '100%' }}>
          <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>Loading Article Metadata...</Typography>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  if (!article) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Alert severity="error">Article not found.</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 3 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  const handleBack = () => {
    if (id) {
      navigate(`/article/${id}`, { state: { article } });
    } else {
      navigate(-1);
    }
  };

  const handleShareClick = (e: React.MouseEvent<HTMLElement>) => {
    setShareAnchorEl(e.currentTarget);
  };

  const handleShareClose = () => {
    setShareAnchorEl(null);
  };

  const handleShare = (platform: string) => () => {
    setShareAnchorEl(null);
    if (!article) return;

    const url = article.url || window.location.href;
    const text = article.socialMediaHook || article.headline || article.title || "";
    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case "x":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date unknown";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const catConfig = getCategoryConfig(article.category);

  return (
    <Container maxWidth="md" sx={{ py: 4, minHeight: "75vh" }}>
      <SEOMeta
        title={article.headline || article.title}
        description={article.summary || article.description || ""}
        ogImage={article.urlToImage || article.imageUrl}
        ogType="article"
        articlePublishedTime={article.publishedAt}
        articleSection={article.category}
        canonical={`${window.location.origin}/read-article/${id}`}
      />
      <JSONLDNewsArticle
        article={{
          title: article.headline || article.title,
          summary: article.summary || article.description || "",
          url: `${window.location.origin}/read-article/${id}`,
          imageUrl: article.urlToImage || article.imageUrl || "",
          publishedAt: article.publishedAt || "",
          category: article.category || ""
        }}
      />
      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: window.location.origin },
          { name: catConfig.name, url: `${window.location.origin}/${article.category?.toLowerCase()}` },
          { name: article.headline || article.title, url: `${window.location.origin}/read-article/${id}` }
        ]}
      />

      {/* Back to Briefing Page */}
      <Button
        startIcon={<ArrowBackIcon />}
        variant="outlined"
        onClick={handleBack}
        sx={{ mb: 3 }}
      >
        Back to Briefing
      </Button>

      <Card sx={{ boxShadow: "0 8px 24px rgba(0,0,0,0.15)", borderRadius: 2, overflow: "hidden", mb: 4 }}>
        {/* Hero banner image */}
        {(article.urlToImage || article.imageUrl) && (
          <CardMedia
            component="img"
            height={420}
            image={article.urlToImage || article.imageUrl}
            alt={article.title}
            loading="lazy"
            onError={(e: any) => {
              e.target.style.display = "none";
            }}
            sx={{
              objectFit: "cover",
              backgroundColor: "rgba(0,0,0,0.05)",
            }}
          />
        )}

        <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
          {/* Headline */}
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              mb: 2,
              lineHeight: 1.25,
              fontSize: { xs: "1.85rem", sm: "2.4rem" },
            }}
          >
            {article.headline || article.title}
          </Typography>

          {/* Meta Information Bar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <Typography variant="body2" color="text.secondary">
              📅 {formatDate(article.publishedAt)}
            </Typography>

            {article.category && (
              <Box
                sx={{
                  backgroundColor: catConfig.color,
                  color: "#fff",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {catConfig.icon}
                {catConfig.name}
              </Box>
            )}

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {article.verified && (
                <VerifiedIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
              )}
              <Typography variant="body2" color="text.secondary">
                Source: {typeof article.source === "string" ? article.source : (article.source?.name || 'News')}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Social Media options & External source link */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3, alignItems: "center", justifyContent: "space-between" }}>
            <Button
              startIcon={<ShareIcon />}
              variant="outlined"
              color="inherit"
              onClick={handleShareClick}
            >
              Share Article
            </Button>

            {article.url && (
              <Button
                endIcon={<OpenInNewIcon />}
                variant="outlined"
                color="primary"
                onClick={() => window.open(article.url, "_blank", "noopener,noreferrer")}
              >
                Open Original Site
              </Button>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Scraped Content Area */}
          <Box sx={{ mt: 4 }}>
            {scrapingLoading && (
              <Box sx={{ my: 6 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontStyle: "italic", textAlign: "center" }}>
                  Fetching full text from {typeof article.source === "string" ? article.source : (article.source?.name || 'original publisher')}...
                </Typography>
                <LinearProgress color="primary" />
              </Box>
            )}

            {!scrapingLoading && paragraphs.length > 0 && (
              <Box>
                {paragraphs.map((para, index) => (
                  <Typography
                    key={index}
                    variant="body1"
                    sx={{
                      fontSize: { xs: "1rem", sm: "1.05rem" },
                      lineHeight: 1.8,
                      color: "text.primary",
                      mb: 2.5,
                      textAlign: "justify"
                    }}
                  >
                    {para}
                  </Typography>
                ))}
                
                <Box sx={{ mt: 5, p: 2, bgcolor: "action.hover", borderRadius: 1, borderLeft: `4px solid ${catConfig.color}` }}>
                  <Typography variant="body2" color="text.secondary">
                    Reader view matches content aggregated from <strong>{(typeof article.source === "string" ? article.source : article.source?.name) || "original host"}</strong>. 
                    Copyrights remain property of their respective owners.
                  </Typography>
                </Box>
              </Box>
            )}

            {!scrapingLoading && paragraphs.length === 0 && (
              <Box sx={{ my: 2 }}>
                {scrapingError && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    {scrapingError} Showing editorial summary instead.
                  </Alert>
                )}
                
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Overview & Summary
                </Typography>
                
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: "1.05rem",
                    lineHeight: 1.8,
                    color: "text.primary",
                    mb: 4,
                    whiteSpace: "pre-wrap"
                  }}
                >
                  {article.summary || article.description || "No content overview available."}
                </Typography>

                {article.url && (
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<OpenInNewIcon />}
                    onClick={() => window.open(article.url, "_blank")}
                  >
                    Visit Site for Full Article
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Card>

      {/* Share Menu */}
      <Menu
        anchorEl={shareAnchorEl}
        open={shareOpen}
        onClose={handleShareClose}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 150 }
        }}
      >
        <MenuItem onClick={handleShare("facebook")}>
          <ListItemIcon><FacebookIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText>Facebook</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShare("x")}>
          <ListItemIcon><XIcon fontSize="small" sx={{ color: 'text.primary' }} /></ListItemIcon>
          <ListItemText>X (Twitter)</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShare("linkedin")}>
          <ListItemIcon><LinkedInIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText>LinkedIn</ListItemText>
        </MenuItem>
      </Menu>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          onClick={handleBack}
        >
          Back to Briefing
        </Button>
      </Box>
    </Container>
  );
};

export default ReadFullArticles;
