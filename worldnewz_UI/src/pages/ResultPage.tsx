import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import { Box, Typography, Card, CardMedia, Button, Container, Divider, Alert, Menu, MenuItem, ListItemIcon, ListItemText, Avatar, Grid, Link as MuiLink } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ShareIcon from "@mui/icons-material/Share";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import { useEffect, useState, useMemo } from "react";
import type { Article } from "../types";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import { fetchDiscover, fetchSearch } from "../api/apiClient";
import { optimizeImageUrl } from "../utils/imageOptimizer";
import SectionStatus from "../components/SectionStatus";
import NewsGrid from "../components/NewsGrid";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CommentDialog from "../components/CommentDialog";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import { JSONLDNewsArticle, JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { SEOMeta } from "../seo/SEOMeta";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { DailyNewsQuizWidget } from "../components/DailyNewsQuizWidget";
import { WeatherWidget } from "../components/WeatherWidget";
import { ContextualPollWidget } from "../components/ContextualPollWidget";
import { fetchContextualPoll } from "../api/apiClient";
import type { ContextualPollData } from "../api/apiClient";

const SITE_URL = "https://worldnewzs.in";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import VerifiedIcon from "@mui/icons-material/Verified";
import { getAuthorForCategory } from "../utils/authors";
import { getCategoryConfig } from "../utils/categoryConfig";

const generateEditorialBriefing = (desc: string, article?: Article | null) => {
  if (article && article.takeaways && Array.isArray(article.takeaways) && article.takeaways.length > 0) {
    return { takeaways: article.takeaways, whyItMatters: article.context || "This breakthrough highlights an important shift that key stakeholders are watching closely." };
  }

  if (article && (article.summary || article.context)) {
    const summarySentences = (article.summary || desc || "")
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10)
      .map((s) => s + ".");
    
    const whyItMatters = article.context || "This breakthrough highlights an important shift that key stakeholders are watching closely.";
    return { takeaways: summarySentences.slice(0, 3), whyItMatters };
  }

  const cleanDesc = desc || "";
  const sentences = cleanDesc
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const takeaways = sentences.slice(0, 3).map((s) => s + ".");
  if (takeaways.length === 0) {
    takeaways.push("WorldNewzs Editorial Desk is monitoring this breaking news event for updates.");
    takeaways.push("Verify updates from local agencies and official news channels listed in sources.");
  }

  const whyItMatters = sentences[3] && sentences[3].length > 20
    ? `${sentences[3]}. This highlights a notable pivot in contemporary trends, representing a shift that key stakeholders are watching closely.`
    : `This development marks an important progression in current events. Analysts suggest observing the reaction of regulatory bodies and industry leaders to determine its long-term impact.`;

  return { takeaways, whyItMatters };
};

const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [contextualPoll, setContextualPoll] = useState<ContextualPollData | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
  const shareOpen = Boolean(shareAnchorEl);
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();

  const originalUrl = article?.urlToImage || article?.imageUrl || "";
  const optimizedUrl = useMemo(() => optimizeImageUrl(originalUrl, 1000), [originalUrl]);
  const [imgSrc, setImgSrc] = useState(optimizedUrl);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    setImgSrc(optimizedUrl);
    setIsFallback(false);
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
    if (!isFallback && originalUrl && imgSrc !== originalUrl) {
      setIsFallback(true);
      setImgSrc(originalUrl);
    } else {
      target.style.display = "none";
    }
  };
  const { 
    getEngagement, 
    toggleLike, 
    toggleDislike, 
    addComment, 
    deleteComment, 
    likeComment, 
    dislikeComment 
  } = useComments();

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

  useEffect(() => {
    if (article) {
      fetchContextualPoll(article.category, (article as any).subcategory)
        .then((res) => {
          if (res.data) setContextualPoll(res.data);
        })
        .catch(() => {});
    }
  }, [article]);

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
      <Container maxWidth="md" sx={{ py: 4, display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  if (!article) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Article not found. Please go back and select an article.</Alert>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  const bookmarked = article.url ? isBookmarked(article.url) : false;

  const handleBookmarkClick = () => {
    if (!article.url) return;
    if (bookmarked) {
      removeBookmark(article.url);
    } else {
      addBookmark(article);
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

  const articleEngagement = article.url ? getEngagement(article.url) : {
    likes: 0,
    dislikes: 0,
    comments: [],
    userLiked: false,
    userDisliked: false,
  };

  const handleAddComment = (text: string, author: string) => {
    if (article.url && addComment) {
      addComment(article.url, text, author);
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

  const author = getAuthorForCategory(article.category);

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: "70vh" }}>
      <SEOMeta
        title={article.headline || article.title}
        description={article.summary || article.description || ""}
        ogImage={article.urlToImage || article.imageUrl}
        ogType="article"
        articlePublishedTime={article.publishedAt}
        articleModifiedTime={article.publishedAt}
        articleSection={article.category}
        canonical={`${SITE_URL}/article/${id}`}
      />
      <JSONLDNewsArticle
        article={{
          title: article.headline || article.title,
          summary: article.summary || article.description || "",
          url: `${SITE_URL}/article/${id}`,
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
          { name: getCategoryConfig(article.category).name, url: `${SITE_URL}/${article.category?.toLowerCase()}` },
          { name: article.headline || article.title, url: `${SITE_URL}/article/${id}` }
        ]}
      />
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        variant="outlined"
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      {/* Grid container for two-column desktop layout */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Main Article Card */}
          <Card component="article" itemScope itemType="https://schema.org/NewsArticle" sx={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)", borderRadius: 2, overflow: "hidden" }}>
        {/* Article Image */}
        {(article.urlToImage || article.imageUrl) && (
          <CardMedia
            component="img"
            height={400}
            image={imgSrc || "/placeholder.svg"}
            alt={article.headline || article.title}
            itemProp="image"
            loading="eager"
            fetchPriority="high"
            onError={handleImageError}
            sx={{
              objectFit: "cover",
              backgroundColor: "#f5f5f5",
            }}
          />
        )}

        <Box sx={{ p: { xs: 2, sm: 4 } }}>
          {/* Title */}
          <Typography
            variant="h4"
            component="h1"
            itemProp="headline"
            sx={{
              fontWeight: 700,
              mb: 1,
              lineHeight: 1.3,
              fontSize: { xs: "1.75rem", sm: "2.25rem" },
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

          {/* Meta Information */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 3,
              flexWrap: "wrap",
            }}
          >
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

            {article.category && (() => {
              const catConfig = getCategoryConfig(article.category);
              return (
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
              );
            })()}

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

          {/* Bookmark, Engage & Open Button */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3, alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Like */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton
                  onClick={() => article.url && toggleLike(article.url)}
                  sx={{ color: articleEngagement.userLiked ? "primary.main" : "text.secondary", '&:hover': { color: 'primary.main' } }}
                >
                  {articleEngagement.userLiked ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                </IconButton>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {articleEngagement.likes > 0 ? articleEngagement.likes : ''}
                </Typography>
              </Box>

              {/* Dislike */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton
                  onClick={() => article.url && toggleDislike(article.url)}
                  sx={{ color: articleEngagement.userDisliked ? "primary.main" : "text.secondary", '&:hover': { color: 'primary.main' } }}
                >
                  {articleEngagement.userDisliked ? <ThumbDownIcon /> : <ThumbDownOutlinedIcon />}
                </IconButton>
              </Box>

              {/* Comment */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <IconButton
                  onClick={() => setCommentDialogOpen(true)}
                  sx={{ color: "text.secondary", '&:hover': { color: 'primary.main' } }}
                >
                  <ChatBubbleOutlineIcon />
                </IconButton>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {articleEngagement.comments.length > 0 ? articleEngagement.comments.length : ''}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<ShareIcon />}
                variant="outlined"
                color="inherit"
                onClick={handleShareClick}
              >
                Share
              </Button>
              <Button
                startIcon={bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                variant={bookmarked ? "contained" : "outlined"}
                color={bookmarked ? "warning" : "inherit"}
                onClick={handleBookmarkClick}
              >
                {bookmarked ? "Bookmarked" : "Bookmark"}
              </Button>

              {article.url && (
                <Button
                  endIcon={<OpenInNewIcon />}
                  variant="outlined"
                  onClick={() => navigate(`/read-article/${id || 'article'}`, { state: { article } })}
                >
                  Read Full Article
                </Button>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Content/Description */}
          <Box itemProp="articleBody" sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Overview
            </Typography>
            <Typography
              variant="body1"
              sx={{
                lineHeight: 1.8,
                color: "text.primary",
                whiteSpace: "pre-wrap",
                mb: 4
              }}
            >
              {article.summary || article.description || "No description available for this article."}
            </Typography>
          </Box>

          {/* E-E-A-T Editorial Insights Briefing */}
          {(article.summary || article.description) && (
            <Box
              sx={{
                p: { xs: 2.5, sm: 3.5 },
                bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(25, 118, 210, 0.05)" : "rgba(25, 118, 210, 0.03)",
                borderLeft: `4px solid ${getCategoryConfig(article.category).color}`,
                borderRadius: 2,
                mb: 4,
                boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
                <AutoAwesomeIcon sx={{ color: getCategoryConfig(article.category).color, fontSize: 22 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: -0.2 }}>
                  WorldNewzs Editorial Briefing
                </Typography>
              </Box>

              {(() => {
                const briefing = generateEditorialBriefing(article.description || "", article);
                return (
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 7 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "text.primary", display: "flex", alignItems: "center", gap: 0.5 }}>
                        <LibraryBooksIcon sx={{ fontSize: 16, color: getCategoryConfig(article.category).color }} /> Key Takeaways
                      </Typography>
                      <ul style={{ margin: 0, paddingLeft: "18px" }}>
                        {briefing.takeaways.map((point, index) => (
                          <li key={index} style={{ marginBottom: "8px" }}>
                            <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.5 }}>
                              {point}
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
                        Why It Matters
                      </Typography>
                      <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6, fontStyle: "italic" }}>
                        {briefing.whyItMatters}
                      </Typography>
                    </Grid>
                  </Grid>
                );
              })()}
            </Box>
          )}

          {/* Editorial Oversight Box (E-E-A-T) */}
          {(() => {
            const catConfig = getCategoryConfig(article.category);
            return (
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
            );
          })()}

          {/* Additional Info */}
          {article.url && (
            <Box sx={{ mt: 4, p: 2, backgroundColor: "background.default", borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Want to read the complete article? Click the "Read Full Article" button above to visit the original source.
              </Typography>
            </Box>
          )}
        </Box>
      </Card>
        </Grid>

        {/* Sidebar Column */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <ContextualPollWidget initialPoll={contextualPoll} category={article.category} />
          <DailyNewsQuizWidget />
          <WeatherWidget />
        </Grid>
      </Grid>

      {/* Share Menu */}
      <Menu
        anchorEl={shareAnchorEl}
        open={shareOpen}
        onClose={handleShareClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
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

      {/* Back to Top Button */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Box>

      {/* Comment Dialog */}
      <CommentDialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        comments={articleEngagement.comments || []}
        onAddComment={handleAddComment}
        onDeleteComment={(commentId) => {
          if (article.url && deleteComment) {
            deleteComment(article.url, commentId);
          }
        }}
        onLikeComment={(commentId) => {
          if (article.url && likeComment) {
            likeComment(article.url, commentId);
          }
        }}
        onDislikeComment={(commentId) => {
          if (article.url && dislikeComment) {
            dislikeComment(article.url, commentId);
          }
        }}
      />
    </Container>
  );
};

export default ResultPage;
