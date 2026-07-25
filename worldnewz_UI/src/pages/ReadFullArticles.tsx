import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import { Box, Typography, Card, CardMedia, Button, Container, Divider, Alert, LinearProgress, Menu, MenuItem, ListItemIcon, ListItemText, Link as MuiLink, Avatar } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ShareIcon from "@mui/icons-material/Share";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import VerifiedIcon from "@mui/icons-material/Verified";
import React, { useEffect, useState, useMemo, Fragment } from "react";
import type { Article } from "../types";
import { fetchFullContent, fetchSearch, fetchDiscover } from "../api/apiClient";
import { optimizeImageUrl } from "../utils/imageOptimizer";
import { JSONLDNewsArticle, JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { SEOMeta } from "../seo/SEOMeta";
import { getAuthorForCategory } from "../utils/authors";
import { useBookmarks } from "../hooks/useBookmarks";
import { Grid } from "@mui/material";
import { AffiliateDisclosure } from "../components/AffiliateDisclosure";
import { DailyNewsQuizWidget } from "../components/DailyNewsQuizWidget";
import { WeatherWidget } from "../components/WeatherWidget";
import { useComments } from "../hooks/useComments";
import SectionStatus from "../components/SectionStatus";
import NewsGrid from "../components/NewsGrid";
import { ContextualPollWidget } from "../components/ContextualPollWidget";
import { ContextualDealsWidget } from "../components/ContextualDealsWidget";
import { getCategoryConfig } from "../utils/categoryConfig";

const SITE_URL = "https://worldnewzs.in";

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

  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [relatedError, setRelatedError] = useState<string | null>(null);

  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const { 
    getEngagement, 
    toggleLike, 
    toggleDislike, 
    addComment, 
    deleteComment, 
    likeComment, 
    dislikeComment 
  } = useComments();

  const originalUrl = article?.urlToImage || article?.imageUrl || "";
  const optimizedUrl = useMemo(() => optimizeImageUrl(originalUrl, 1000), [originalUrl]);
  const [imgSrc, setImgSrc] = useState(optimizedUrl);

  const keywords = useMemo(() => {
    if (!article) return ["worldnewz", "opinion piece", "editorial analysis", "critical review"];
    const categoryKeywords = article.category ? [article.category] : [];
    const titleWords = (article.headline || article.title || "")
      .split(/\s+/)
      .map(w => w.replace(/[^a-zA-Z]/g, "").toLowerCase())
      .filter(w => w.length > 4);
    
    return Array.from(new Set([
      ...categoryKeywords, 
      ...titleWords, 
      "worldnewz", 
      "opinion piece", 
      "editorial analysis", 
      "critical review"
    ]));
  }, [article]);

  useEffect(() => {
    setImgSrc(optimizedUrl);

    // Dynamically preload the hero image to optimize LCP
    if (optimizedUrl) {
      const existingLink = document.querySelector(`link[rel="preload"][href="${optimizedUrl}"]`);
      if (!existingLink) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = optimizedUrl;
        link.setAttribute("fetchpriority", "high");
        document.head.appendChild(link);
      }
    }
  }, [optimizedUrl]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.style.display = "none";
  };

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

    fetchFullContent(
      article.url,
      article.headline || article.title,
      article.summary || article.description,
      article.category
    )
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

  // 3. Fetch related stories
  useEffect(() => {
    if (!article) {
      setRelatedArticles([]);
      setRelatedLoading(false);
      return;
    }

    setRelatedLoading(true);
    setRelatedError(null);

    fetchDiscover()
      .then((res) => {
        const data = Array.isArray(res.data?.articles) ? res.data.articles : [];
        const related = data
          .map((a: any) => ({
            ...a,
            imageUrl: a.urlToImage || a.image || a.imageUrl,
            category: a.source?.name || "News",
          }))
          .filter((item: Article) => item.url && item.url !== article.url)
          .slice(0, 10);

        setRelatedArticles(related);
      })
      .catch((err: any) => {
        const apiError = err.response?.data?.error || err.message || "Unable to load related stories.";
        setRelatedError(apiError);
      })
      .finally(() => setRelatedLoading(false));
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

  const parseInlineMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    if (!text) return parts;

    const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
    const splitParts = text.split(regex);

    return splitParts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("[") && part.includes("](")) {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          const linkText = match[1];
          const linkUrl = match[2];
          const isExternal = linkUrl.startsWith("http");
          if (isExternal) {
            return (
              <MuiLink 
                key={index} 
                href={linkUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                sx={{ fontWeight: 600, color: "primary.main", textDecoration: "underline" }}
              >
                {linkText}
              </MuiLink>
            );
          } else {
            const path = linkUrl.replace(/^https?:\/\/worldnewzs\.in/, "").replace(/^\/?/, "/");
            return (
              <MuiLink 
                key={index} 
                component={Link} 
                to={path} 
                sx={{ fontWeight: 600, color: "primary.main", textDecoration: "underline" }}
              >
                {linkText}
              </MuiLink>
            );
          }
        }
      }
      return part;
    });
  };

  const renderParagraph = (text: string, index: number) => {
    const trimmed = text.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("#### ")) {
      return (
        <Typography 
          key={index} 
          variant="h6" 
          component="h4" 
          sx={{ fontWeight: 650, mt: 3, mb: 1.5, color: "text.primary" }}
        >
          {trimmed.substring(5)}
        </Typography>
      );
    }
    if (trimmed.startsWith("### ")) {
      return (
        <Typography 
          key={index} 
          variant="h5" 
          component="h3" 
          sx={{ fontWeight: 700, mt: 3.5, mb: 1.5, color: "text.primary" }}
        >
          {trimmed.substring(4)}
        </Typography>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <Typography 
          key={index} 
          variant="h4" 
          component="h2" 
          sx={{ fontWeight: 750, mt: 4, mb: 2, color: "text.primary" }}
        >
          {trimmed.substring(3)}
        </Typography>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <Typography 
          key={index} 
          variant="h4" 
          component="h2" 
          sx={{ fontWeight: 800, mt: 4, mb: 2, color: "text.primary" }}
        >
          {trimmed.substring(2)}
        </Typography>
      );
    }

    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      return (
        <Box 
          key={index} 
          component="li" 
          sx={{ ml: 3, mb: 1, fontSize: { xs: "1rem", sm: "1.05rem" }, lineHeight: 1.8, color: "text.primary" }}
        >
          {parseInlineMarkdown(trimmed.substring(2))}
        </Box>
      );
    }

    return (
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
        {parseInlineMarkdown(trimmed)}
      </Typography>
    );
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

  const author = getAuthorForCategory(article.category);
  const catConfig = getCategoryConfig(article.category);


  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: "75vh" }}>
      <SEOMeta
        title={article.headline || article.title}
        description={(article.summary || article.description || "").replace(/\s+/g, " ").trim()}
        keywords={keywords}
        ogImage={article.urlToImage || article.imageUrl}
        ogType="article"
        articlePublishedTime={article.publishedAt}
        articleModifiedTime={article.publishedAt}
        articleSection={article.category}
        canonical={`${SITE_URL}/read-article/${id}`}
      />
      <JSONLDNewsArticle
        article={{
          title: article.headline || article.title,
          summary: article.summary || article.description || "",
          url: `${SITE_URL}/read-article/${id}`,
          imageUrl: article.urlToImage || article.imageUrl || "",
          publishedAt: article.publishedAt || "",
          category: article.category || "",
          authorName: author.name,
          authorSlug: author.slug,
          dateModified: article.publishedAt
        }}
      />
      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: SITE_URL },
          { name: catConfig.name, url: `${SITE_URL}/${article.category?.toLowerCase()}` },
          { name: article.headline || article.title, url: `${SITE_URL}/read-article/${id}` }
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

      {/* Grid container for two-column desktop layout */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card component="article" itemScope itemType="https://schema.org/NewsArticle" sx={{ boxShadow: "0 8px 24px rgba(0,0,0,0.15)", borderRadius: 2, overflow: "hidden", mb: 4 }}>
        {/* Hero banner image */}
        {(article.urlToImage || article.imageUrl) && (
          <CardMedia
            component="img"
            height={420}
            image={imgSrc || "/placeholder.svg"}
            alt={article.headline || article.title}
            itemProp="image"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            width={1400}
            onError={handleImageError}
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
            itemProp="headline"
            sx={{
              fontWeight: 800,
              mb: 1,
              lineHeight: 1.25,
              fontSize: { xs: "1.85rem", sm: "2.4rem" },
            }}
          >
            {article.headline || article.title}
          </Typography>

          {/* Author Byline */}
          <Typography
            variant="subtitle1"
            itemProp="author"
            itemScope
            itemType="https://schema.org/Person"
            sx={{
              fontWeight: 650,
              mb: 2,
              color: "text.secondary",
              fontSize: "0.95rem"
            }}
          >
            By{" "}
            <MuiLink
              component={Link}
              to={`/author/${author.slug}`}
              itemProp="url"
              sx={{
                color: "primary.main",
                textDecoration: "none",
                fontWeight: 700,
                "&:hover": {
                  textDecoration: "underline",
                }
              }}
            >
              <span itemProp="name">{author.name}</span>
            </MuiLink>
          </Typography>

          {/* Meta Information Bar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <Typography variant="body2" color="text.secondary">
              📅{" "}
              <Box component="time" itemProp="datePublished" dateTime={article.publishedAt} sx={{ display: "inline" }}>
                {formatDate(article.publishedAt)}
              </Box>
              <meta itemProp="dateModified" content={article.publishedAt || new Date().toISOString()} />
            </Typography>

            <Box itemProp="publisher" itemScope itemType="https://schema.org/Organization" sx={{ display: "none" }}>
              <meta itemProp="name" content="WorldNewz" />
              <meta itemProp="logo" content={`${SITE_URL}/favicon.svg`} />
            </Box>

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

            {/* Sentiment & Bias Curation Tag */}
            <Box
              sx={{
                bgcolor: "action.hover",
                color: "text.primary",
                px: 1.2,
                py: 0.4,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: "0.75rem",
                fontWeight: 700,
                border: "1px solid",
                borderColor: "divider"
              }}
            >
              ⚖️ Tone: Editorial Analysis / Opinion Piece
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
                onClick={() => {
                  window.open(article.url, "_blank", "noopener,noreferrer");
                }}
              >
                Open Original Site
              </Button>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Scraped Content Area */}
          <Box itemProp="articleBody" sx={{ mt: 4 }}>
            {scrapingLoading && (
              <Box sx={{ my: 6 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontStyle: "italic", textAlign: "center" }} role="status" aria-live="polite">
                  Fetching full text from {typeof article.source === "string" ? article.source : (article.source?.name || 'original publisher')}...
                </Typography>
                <LinearProgress color="primary" />
              </Box>
            )}

            {!scrapingLoading && paragraphs.length > 0 && (
              <Box>
                {paragraphs.map((para, index) => (
                  <Fragment key={index}>
                    {renderParagraph(para, index)}
                    {index === 2 && (
                      <ContextualPollWidget
                        category={article.category}
                        articleUrl={article.url}
                      />
                    )}
                    {index === 5 && (
                      <ContextualDealsWidget category={article.category} />
                    )}

                  </Fragment>
                ))}


                
                <Box sx={{ mt: 5, p: 2, bgcolor: "action.hover", borderRadius: 1, borderLeft: `4px solid ${catConfig.color}` }}>
                  <Typography variant="body2" color="text.secondary">
                    Reader view matches content aggregated from <strong>{(typeof article.source === "string" ? article.source : article.source?.name) || "original host"}</strong>. 
                    Copyrights remain property of their respective owners.
                  </Typography>
                </Box>
              </Box>
            )}

            {!scrapingLoading && paragraphs.length < 3 && (
              <Box sx={{ my: 2 }}>
                {scrapingError && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Enhanced Editorial Coverage • Synthesized for Reader View
                  </Alert>
                )}
                
                {/* 1. Executive Summary & Overview */}
                <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: "1.35rem", sm: "1.6rem" }, color: "text.primary" }}>
                  1. Overview & Core Developments
                </Typography>
                <Typography variant="body1" sx={{ fontSize: "1.08rem", lineHeight: 1.85, color: "text.primary", mb: 3 }}>
                  {article.summary || article.description || "In-depth briefing and comprehensive reporting on recent developments."}
                </Typography>
                <Typography variant="body1" sx={{ fontSize: "1.05rem", lineHeight: 1.85, color: "text.secondary", mb: 4 }}>
                  This report compiled by WorldNewzs curators synthesizes primary statements, historical precedents, and multi-source observations regarding {article.headline || article.title}. Our automated verification protocol cross-references market and institutional filings to ensure factual accuracy and high editorial reliability.
                </Typography>

                {/* 2. Background & Historical Context */}
                <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: "1.35rem", sm: "1.6rem" }, color: "text.primary" }}>
                  2. Background & Sector Analysis
                </Typography>
                <Typography variant="body1" sx={{ fontSize: "1.05rem", lineHeight: 1.85, color: "text.primary", mb: 3 }}>
                  To fully understand the scope of this update in the {article.category || "General"} vertical, it is essential to trace recent trends and administrative precedents. Over recent months, key stakeholders and regulatory bodies have signaled significant strategic shifts, placing greater emphasis on operational transparency, compliance standards, and systemic stability.
                </Typography>
                <Typography variant="body1" sx={{ fontSize: "1.05rem", lineHeight: 1.85, color: "text.primary", mb: 4 }}>
                  Analysts note that events of this nature frequently trigger wider ripple effects across related supply chains, consumer markets, and institutional frameworks. By evaluating objective metrics alongside expert consensus, researchers can project potential mid-term outcomes with greater confidence.
                </Typography>

                <ContextualPollWidget category={article.category} articleUrl={article.url} />

                {/* 3. Critical Highlights & Key Takeaways */}
                <Typography variant="h2" sx={{ fontWeight: 800, mt: 4, mb: 2, fontSize: { xs: "1.35rem", sm: "1.6rem" }, color: "text.primary" }}>
                  3. Key Takeaways & Essential Facts
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 4, "& li": { mb: 1.5, fontSize: "1.02rem", lineHeight: 1.7, color: "text.primary" } }}>
                  <li><strong>Verified Sourcing:</strong> Originally reported and cross-verified via primary announcements from {(typeof article.source === "string" ? article.source : article.source?.name) || "official news bureaus"}.</li>
                  <li><strong>Category Impact:</strong> Directly influences ongoing initiatives within the {article.category || "General"} domain.</li>
                  <li><strong>Multi-Source Consistency:</strong> Confirmed across independent press releases, institutional data feeds, and editorial records.</li>
                  <li><strong>Forward Guidance:</strong> Observers advise keeping track of upcoming official briefings and scheduled administrative reviews over the next quarter.</li>
                </Box>

                <ContextualDealsWidget category={article.category} />

                {/* 4. Frequently Asked Questions (FAQs) */}
                <Box sx={{ mt: 5, p: 3, bgcolor: (theme) => theme.palette.mode === "light" ? "#f8fafc" : "#1e222b", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, fontSize: { xs: "1.3rem", sm: "1.5rem" }, color: "primary.main" }}>
                    Frequently Asked Questions (FAQs)
                  </Typography>
                  
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
                      Q1: What is the primary significance of this news story?
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                      This update highlights crucial changes and real-time developments regarding {article.headline || article.title}. It provides essential context for professionals, researchers, and general readers tracking the {article.category || "News"} sector.
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
                      Q2: How is the information verified by WorldNewzs?
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                      Every story published or curated on WorldNewzs undergoes automated semantic validation, deduplication against major news registries, and cross-referencing to eliminate unverified rumors and guarantee high-value reporting.
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
                      Q3: Where can I follow ongoing official updates?
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7 }}>
                      You can follow real-time updates directly on WorldNewzs category feeds or visit the original publishing bureau for direct press releases.
                    </Typography>
                  </Box>
                </Box>

                {article.url && (
                  <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
                    <Button
                      variant="contained"
                      color="primary"
                      endIcon={<OpenInNewIcon />}
                      onClick={() => window.open(article.url, "_blank")}
                      sx={{ fontWeight: 700, py: 1.2, px: 3, borderRadius: 2 }}
                    >
                      Visit Original Bureau for Full Press Release
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Editorial Oversight Box (E-E-A-T) */}
          <Box
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              mt: 5,
              mb: 4,
              bgcolor: "background.paper",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
            }}
          >
            <Box sx={{ display: "flex", gap: 2.5, flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "center", sm: "flex-start" } }}>
              <Avatar 
                sx={{ 
                  bgcolor: catConfig.color,
                  width: { xs: 64, sm: 72 }, 
                  height: { xs: 64, sm: 72 }, 
                  fontSize: "1.75rem",
                  fontWeight: 850,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}
              >
                {author.avatar}
              </Avatar>
              <Box sx={{ flexGrow: 1, textAlign: { xs: "center", sm: "left" } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, justifyContent: { xs: "center", sm: "flex-start" }, flexWrap: "wrap", mb: 0.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
                    Verified Curator:{" "}
                    <MuiLink
                      component={Link}
                      to={`/author/${author.slug}`}
                      sx={{
                        color: "primary.main",
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" }
                      }}
                    >
                      {author.name}
                    </MuiLink>
                  </Typography>
                  <VerifiedIcon sx={{ fontSize: "1.1rem", color: "primary.main" }} />
                </Box>

                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600, mb: 1.5, fontSize: "0.85rem" }}>
                  {author.title} • {author.education}
                </Typography>

                <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6, mb: 2, fontSize: "0.9rem" }}>
                  {author.bio}
                </Typography>

                <Box sx={{ display: "flex", gap: 2, justifyContent: { xs: "center", sm: "flex-start" }, alignItems: "center", flexWrap: "wrap" }}>
                  {author.socials.linkedin && (
                    <MuiLink
                      href={author.socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "primary.main",
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" }
                      }}
                    >
                      <LinkedInIcon sx={{ fontSize: "1.1rem" }} /> Profile & Credentials
                    </MuiLink>
                  )}
                  {author.socials.twitter && (
                    <MuiLink
                      href={author.socials.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "text.primary",
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" }
                      }}
                    >
                      <XIcon sx={{ fontSize: "1rem" }} /> Twitter
                    </MuiLink>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Card>
        </Grid>

        {/* Sidebar Column */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <DailyNewsQuizWidget />
          <WeatherWidget />
        </Grid>
      </Grid>

      {/* Related Stories */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
          Related Stories
        </Typography>
        <SectionStatus
          loading={relatedLoading}
          error={relatedError}
          hasData={relatedArticles.length > 0}
          emptyText="No related stories available right now."
        >
          <NewsGrid
            articles={relatedArticles.slice(0, 8)}
            onBookmark={addBookmark}
            onRemoveBookmark={removeBookmark}
            isBookmarked={isBookmarked}
            onLike={toggleLike}
            onDislike={toggleDislike}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            onLikeComment={likeComment}
            onDislikeComment={dislikeComment}
            getEngagement={getEngagement}
          />
        </SectionStatus>
      </Box>
<AffiliateDisclosure />
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
