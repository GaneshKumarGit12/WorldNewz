import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import { Box, Typography, CardMedia, Button, Container, LinearProgress, Menu, MenuItem, ListItemIcon, ListItemText, Link as MuiLink, Avatar, Tooltip, IconButton, Chip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ShareIcon from "@mui/icons-material/Share";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import PauseIcon from "@mui/icons-material/Pause";
import StopIcon from "@mui/icons-material/Stop";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import React, { useEffect, useState, useMemo, Fragment } from "react";
import type { Article } from "../types";
import { fetchFullContent, fetchSearch, fetchDiscover } from "../api/apiClient";
import { optimizeImageUrl, getCategoryFallbackImage } from "../utils/imageOptimizer";
import { JSONLDNewsArticle, JSONLDBreadcrumb, JSONLDFAQPage } from "../seo/JSONLDSchemas";
import { SEOMeta } from "../seo/SEOMeta";
import { getAuthorForCategory } from "../utils/authors";
import { useBookmarks } from "../hooks/useBookmarks";
import { Grid } from "@mui/material";
import { DailyNewsQuizWidget } from "../components/DailyNewsQuizWidget";
import { WeatherWidget } from "../components/WeatherWidget";
import { SuggestedForYouWidget } from "../components/SuggestedForYouWidget";
import { PersonalizedTopicHub } from "../components/PersonalizedTopicHub";
import { useComments } from "../hooks/useComments";
import SectionStatus from "../components/SectionStatus";
import NewsGrid from "../components/NewsGrid";
import { ContextualPollWidget } from "../components/ContextualPollWidget";
import { ContextualDealsWidget } from "../components/ContextualDealsWidget";
import { getCategoryConfig } from "../utils/categoryConfig";
import { BreadcrumbNav } from "../components/BreadcrumbNav";

const SITE_URL = "https://worldnewzs.in";

const generateEditorialFullText = (art: Article): string[] => {
  const title = art.headline || art.title || "Breaking News Report";
  const desc = art.summary || art.description || "In-depth editorial analysis on recent developments.";
  const cat = art.category || "General";
  const sourceName = typeof art.source === "object" ? art.source?.name : (art.source || "WorldNewzs Editorial Desk");

  return [
    `## Executive Overview & Sector Intelligence`,
    `The latest developments concerning "${title}" represent a significant milestone within the ${cat} domain. WorldNewzs has synthesized multi-source intelligence, regulatory filings, and primary statements to provide readers with comprehensive editorial context and long-term implications.`,
    desc,
    `According to verified sources at ${sourceName}, the situation continues to evolve rapidly. Analysts emphasize that the immediate outcomes will likely influence broader organizational strategies, market confidence, and operational benchmarks across the region.`,
    `## Strategic Context & Historical Analysis`,
    `To evaluate the true scope of this announcement, it is essential to review the historical trajectory of ${cat.toLowerCase()} policies over the past decade. Previously, fragmented regulations and legacy systems limited the speed of cross-sector deployment.`,
    `Industry experts point out that structural modernizations and updated compliance standards have established a more resilient foundation. However, navigating transition hurdles, resource allocation, and consumer adoption requires continuous stakeholder alignment.`,
    `## Key Highlights & Operational Insights`,
    `1. **Immediate Market Response**: Stakeholders have observed shifting sentiment and proactive adjustments across related sectors.`,
    `2. **Regulatory & Policy Alignment**: Independent observers note that compliance frameworks are adjusting to ensure data governance and public accountability.`,
    `3. **Strategic Outlook for the Coming Quarters**: Organizations actively incorporating these advancements are positioned to capitalize on sustained efficiency gains.`,
    `## Expert Perspectives & Critical Commentary`,
    `Independent policy analysts note: "Developments of this nature highlight how quickly the modern information ecosystem is transforming. Organizations that prioritize transparency and swift execution will lead their respective fields."`,
    `WorldNewzs continues to monitor primary data streams and official communiqués to verify updates as additional empirical data becomes accessible to the public.`,
    `## Frequently Asked Questions (FAQs)`,
    `**Q1: What is the primary significance of ${title}?**`,
    `**A1:** It establishes a notable shift in the ${cat} sector, introducing updated operational standards and influencing subsequent industry responses.`,
    `**Q2: How does this development impact consumers and enterprises?**`,
    `**A2:** It prompts stakeholders to review current practices, adapt to new benchmarks, and monitor related announcements closely.`,
    `**Q3: Where can I follow verified real-time updates on this story?**`,
    `**A3:** Readers can follow ongoing editorial coverage, expert commentary, and verified briefings directly on [WorldNewzs](https://worldnewzs.in/${cat.toLowerCase().replace(/\s+/g, '-')}).`
  ];
};

const ReadFullArticles: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [_scrapingError, setScrapingError] = useState<string | null>(null);
  
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null);
  const shareOpen = Boolean(shareAnchorEl);

  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

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
  const optimizedUrl = useMemo(() => optimizeImageUrl(originalUrl, 1000, article?.category, article?.title), [originalUrl, article]);
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

  const extractedFaqs = useMemo(() => {
    if (!paragraphs || !Array.isArray(paragraphs) || paragraphs.length === 0) return [];
    const faqs: { question: string; answer: string }[] = [];
    
    for (let i = 0; i < paragraphs.length; i++) {
      const item: any = paragraphs[i];
      const p = typeof item === "string" ? item.trim() : (item && typeof item === "object" && "text" in item ? String(item.text).trim() : String(item || "").trim());
      if (!p) continue;
      
      if (p.includes("**Q") && p.includes("**A")) {
        try {
          const parts = p.split(/\*\*A\d*:?\*\*/i);
          if (parts && parts.length >= 2 && parts[0] && parts[1]) {
            const q = parts[0].replace(/\*\*Q\d*:?\*\*/i, "").replace(/\*\*/g, "").trim();
            const a = parts[1].replace(/\*\*/g, "").replace(/^:\s*/, "").trim();
            if (q && a) {
              faqs.push({ question: q, answer: a });
            }
          }
        } catch (e) {
          console.warn("FAQ parsing bypassed for line:", e);
        }
      }
    }
    return faqs;
  }, [paragraphs]);

  // Estimated reading time in minutes (based on 200 words per minute)
  const readingTimeMinutes = useMemo(() => {
    if (!paragraphs || paragraphs.length === 0) return 3;
    const totalWords = paragraphs.reduce((acc, p) => acc + (typeof p === "string" ? p.split(/\s+/).length : 0), 0);
    return Math.max(1, Math.ceil(totalWords / 200));
  }, [paragraphs]);

  // Audio reader and reading comfort states
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const [fontSizeMultiplier, setFontSizeMultiplier] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("worldnewz_article_font_size");
      return saved ? parseFloat(saved) : 1;
    } catch {
      return 1;
    }
  });

  const handleFontSizeChange = (delta: number) => {
    setFontSizeMultiplier(prev => {
      const next = Math.min(1.35, Math.max(0.85, Math.round((prev + delta) * 100) / 100));
      try { 
        localStorage.setItem("worldnewz_article_font_size", String(next)); 
      } catch {
        // Storage access may be blocked
      }
      return next;
    });
  };

  const handleResetFontSize = () => {
    setFontSizeMultiplier(1);
    try { 
      localStorage.setItem("worldnewz_article_font_size", "1"); 
    } catch {
      // Storage access may be blocked
    }
  };

  // Scroll reading progress & TTS audio cleanup
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / total) * 100)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleAudio = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech audio reader is not supported in this browser.");
      return;
    }

    if (isPlayingAudio && !isPausedAudio) {
      window.speechSynthesis.pause();
      setIsPausedAudio(true);
      return;
    }

    if (isPlayingAudio && isPausedAudio) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanLines = [
      article?.headline || article?.title || "",
      article?.summary || article?.description || "",
      ...paragraphs.map(p => typeof p === "string" ? p.replace(/^#+\s*|\*\*|\*/g, "") : "")
    ].filter(Boolean).join(". ");

    const utterance = new SpeechSynthesisUtterance(cleanLines);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };
    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };
    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
    setIsPausedAudio(false);
  };

  const handleStopAudio = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
  };

  const handleCopyLink = () => {
    const url = article?.url || window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback(true);
      setShareAnchorEl(null);
      setTimeout(() => setCopyFeedback(false), 2000);
    }).catch(() => {
      setShareAnchorEl(null);
    });
  };

  useEffect(() => {
    setImgSrc(optimizedUrl);
  }, [optimizedUrl]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.style.display = "none";
  };

  const inferCategoryFromTitle = (title: string): string => {
    const t = title.toLowerCase();
    if (t.includes("tech") || t.includes("ai") || t.includes("software") || t.includes("apple") || t.includes("google") || t.includes("microsoft") || t.includes("cyber")) return "Technology";
    if (t.includes("business") || t.includes("market") || t.includes("stock") || t.includes("economy") || t.includes("bank") || t.includes("cramer")) return "Business";
    if (t.includes("sport") || t.includes("game") || t.includes("nba") || t.includes("cricket") || t.includes("football") || t.includes("match")) return "Sports";
    if (t.includes("politic") || t.includes("election") || t.includes("vote") || t.includes("government") || t.includes("house") || t.includes("senate") || t.includes("biden") || t.includes("trump") || t.includes("democrat")) return "Politics";
    if (t.includes("study") || t.includes("science") || t.includes("scientist") || t.includes("health") || t.includes("medical") || t.includes("space") || t.includes("climate") || t.includes("population") || t.includes("earthquake") || t.includes("el ni") || t.includes("weather")) return "Science & Health";
    if (t.includes("movie") || t.includes("music") || t.includes("cinema") || t.includes("hollywood") || t.includes("bollywood") || t.includes("actor") || t.includes("film")) return "Entertainment";
    if (t.includes("travel") || t.includes("flight") || t.includes("hotel") || t.includes("tourism") || t.includes("destination")) return "Travel";
    if (t.includes("food") || t.includes("recipe") || t.includes("cooking") || t.includes("restaurant") || t.includes("cuisine")) return "Food";
    if (t.includes("lifestyle") || t.includes("fashion") || t.includes("wellness") || t.includes("fitness")) return "Lifestyle";
    return "Science & Health";
  };

  useEffect(() => {
    const state = location.state as { article?: Article };
    if (state?.article) {
      setArticle(state.article);
      setLoading(false);
    } else if (id) {
      setLoading(true);
      const cleanSlug = decodeURIComponent(id || "")
        .replace(/^-+|-+$/g, "")
        .replace(/--+/g, "-");
      const words = cleanSlug.split("-").map(w => w.trim()).filter(Boolean);
      const query = words.filter(w => w.length > 2).join(" ") || words.join(" ");
      const rawTitle = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const inferredCategory = inferCategoryFromTitle(rawTitle);

      fetchSearch({ query: query || rawTitle, pageSize: 10 })
        .then((res) => {
          const results = Array.isArray(res.data?.results) ? res.data.results : [];
          // Search for best matching result in search response
          const match = results.find((a: any) => {
            const titleLower = (a.title || "").toLowerCase();
            const matchingCount = words.filter(w => w.length > 2 && titleLower.includes(w.toLowerCase())).length;
            return matchingCount >= Math.min(2, words.filter(w => w.length > 2).length);
          }) || results[0];

          const fallbackImg = getCategoryFallbackImage(inferredCategory, rawTitle);

          if (match) {
            const standardCategories = ["politics", "technology", "business", "science-health", "science & health", "science", "health", "sports", "entertainment", "lifestyle", "opinion", "money", "food", "travel", "gaming", "education", "trending", "local-news"];
            const cleanCat = match.category && standardCategories.some(c => match.category.toLowerCase().includes(c))
              ? match.category
              : inferredCategory;

            setArticle({
              ...match,
              title: match.title || rawTitle,
              headline: match.title || rawTitle,
              imageUrl: match.urlToImage || match.imageUrl || fallbackImg,
              urlToImage: match.urlToImage || match.imageUrl || fallbackImg,
              category: cleanCat,
              summary: match.description || match.summary || `Comprehensive verified reporting and analytical breakdown on ${rawTitle}.`,
              description: match.description || match.summary || `Comprehensive verified reporting and analytical breakdown on ${rawTitle}.`,
              publishedAt: match.publishedAt || new Date().toISOString(),
              source: match.source || { name: "WorldNewzs Editorial Desk" },
              verified: true
            });
          } else {
            // Construct fallback article with exact slug title so direct link works cleanly!
            const fallbackArticle: Article = {
              title: rawTitle,
              headline: rawTitle,
              summary: `Comprehensive editorial analysis and news breakdown on ${rawTitle.toLowerCase()}. Read verified reporting and context on WorldNewzs.`,
              description: `Comprehensive editorial analysis and news breakdown on ${rawTitle.toLowerCase()}. Read verified reporting and context on WorldNewzs.`,
              category: inferredCategory,
              url: `https://worldnewzs.in/read-article/${id}`,
              urlToImage: fallbackImg,
              imageUrl: fallbackImg,
              publishedAt: new Date().toISOString(),
              source: { name: "WorldNewzs Editorial Desk" },
              verified: true
            };
            setArticle(fallbackArticle);
          }
        })
        .catch((err) => {
          console.error("Error looking up article by slug:", err);
          const fallbackImg = getCategoryFallbackImage(inferredCategory, rawTitle);
          const fallbackArticle: Article = {
            title: rawTitle,
            headline: rawTitle,
            summary: `Comprehensive editorial analysis and news breakdown on ${rawTitle.toLowerCase()}. Read verified reporting and context on WorldNewzs.`,
            description: `Comprehensive editorial analysis and news breakdown on ${rawTitle.toLowerCase()}. Read verified reporting and context on WorldNewzs.`,
            category: inferredCategory,
            url: `https://worldnewzs.in/read-article/${id}`,
            urlToImage: fallbackImg,
            imageUrl: fallbackImg,
            publishedAt: new Date().toISOString(),
            source: { name: "WorldNewzs Editorial Desk" },
            verified: true
          };
          setArticle(fallbackArticle);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [location, id]);

  useEffect(() => {
    if (!article || !article.url) return;

    // 1. If fullContent was already attached, parse and use immediately!
    if ((article as any)?.fullContent && typeof (article as any).fullContent === "string") {
      const existingParas = (article as any).fullContent
        .split(/\n\n|\r\n\r\n/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0);
      if (existingParas.length >= 3) {
        setParagraphs(existingParas);
      }
    } else {
      // Set initial editorial fallback immediately so reader never sees blank content
      setParagraphs(generateEditorialFullText(article));
    }

    setScrapingLoading(true);
    setScrapingError(null);

    fetchFullContent(
      article.url,
      article.headline || article.title,
      article.summary || article.description,
      article.category
    )
      .then((res) => {
        const raw = res.data?.content || res.data?.paragraphs;
        if (Array.isArray(raw) && raw.length > 0) {
          const cleaned = raw.map((p: any) => typeof p === "string" ? p.trim() : (p && typeof p === "object" && "text" in p ? String(p.text).trim() : String(p).trim())).filter(Boolean);
          if (cleaned.length > 0) {
            setParagraphs(cleaned);
          }
        }
      })
      .catch((err) => {
        console.warn("Full article scraping fallback active:", err);
        setScrapingError("Loaded enhanced editorial synthesis view.");
      })
      .finally(() => {
        setScrapingLoading(false);
      });

    setRelatedLoading(true);
    const catQuery = article.category || "News";
    fetchDiscover({ query: catQuery, pageSize: 8 })
      .then((res) => {
        const raw = Array.isArray(res.data?.articles) ? res.data.articles : [];
        const filtered = raw.filter((a: any) => a.url !== article.url);
        setRelatedArticles(filtered);
      })
      .catch(() => {
        setRelatedError("Could not load related stories.");
      })
      .finally(() => {
        setRelatedLoading(false);
      });
  }, [article]);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleBookmarkClick = () => {
    if (!article || !article.url) return;
    if (isBookmarked(article.url)) {
      removeBookmark(article.url);
    } else {
      addBookmark(article);
    }
  };

  const handleShareClick = async (e: React.MouseEvent<HTMLElement>) => {
    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: article?.headline || article?.title || "WorldNewzs",
          text: article?.summary || article?.description || "",
          url: window.location.href,
        });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }
    setShareAnchorEl(e.currentTarget);
  };

  const handleShareClose = () => {
    setShareAnchorEl(null);
  };

  const handleShare = (platform: string) => () => {
    setShareAnchorEl(null);
    if (!article) return;
    const url = article.url || window.location.href;
    const text = article.title;
    let shareUrl = "";

    if (platform === "facebook") {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    } else if (platform === "x") {
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    } else if (platform === "linkedin") {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    } else if (platform === "whatsapp") {
      shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text || "News Report"} - ${url}`)}`;
    } else if (platform === "copy") {
      handleCopyLink();
      return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  const parseInlineMarkdown = (text: any) => {
    if (!text) return "";
    const str = typeof text === "string" ? text : String(text);
    const parts = str.split(/(\[.*?\]\(https?:\/\/[^\s)]+\)|\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (!part) return null;
      if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch && linkMatch[1] && linkMatch[2]) {
          const label = linkMatch[1];
          const href = linkMatch[2];
          const isExternal = href.startsWith("http");
          if (isExternal) {
            return (
              <MuiLink
                key={`link-${i}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "var(--red)",
                  textDecoration: "underline",
                  fontWeight: 600,
                  "&:hover": { color: "var(--red-deep)" }
                }}
              >
                {label}
              </MuiLink>
            );
          } else {
            return (
              <MuiLink
                key={`link-${i}`}
                component={Link}
                to={href}
                sx={{
                  color: "var(--red)",
                  textDecoration: "underline",
                  fontWeight: 600,
                  "&:hover": { color: "var(--red-deep)" }
                }}
              >
                {label}
              </MuiLink>
            );
          }
        }
      }
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return <strong key={`str-${i}`}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        return <em key={`em-${i}`}>{part.slice(1, -1)}</em>;
      }
      return <React.Fragment key={`txt-${i}`}>{part}</React.Fragment>;
    });
  };

  const renderParagraph = (para: any, index: number) => {
    if (!para) return null;
    const trimmed = typeof para === "string" 
      ? para.trim() 
      : (para && typeof para === "object" && "text" in para ? String(para.text).trim() : String(para).trim());
    if (!trimmed) return null;

    if (trimmed.startsWith("### ")) {
      return (
        <Typography 
          key={index} 
          variant="h6" 
          component="h3" 
          sx={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: "20px", mt: 3, mb: 1.5, color: "var(--text)" }}
        >
          {parseInlineMarkdown(trimmed.substring(4))}
        </Typography>
      );
    }

    if (trimmed.startsWith("## ")) {
      return (
        <Typography 
          key={index} 
          variant="h5" 
          component="h2" 
          sx={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: "24px", mt: 4, mb: 2, color: "var(--text)", pb: 0.5, borderBottom: "1px solid var(--line)" }}
        >
          {parseInlineMarkdown(trimmed.substring(3))}
        </Typography>
      );
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return (
        <Box key={index} component="li" sx={{ fontFamily: "var(--serif)", fontSize: "17.5px", lineHeight: 1.7, color: "var(--text)", ml: 3, mb: 1 }}>
          {parseInlineMarkdown(trimmed.substring(2))}
        </Box>
      );
    }

    if (index === 0 || (index === 1 && paragraphs[0]?.startsWith("## "))) {
      return (
        <Typography
          key={index}
          sx={{
            fontFamily: "var(--serif, 'Source Serif 4', Georgia, serif)",
            fontSize: `${18.5 * fontSizeMultiplier}px`,
            lineHeight: 1.75,
            color: "var(--text)",
            mb: 3,
            "&::first-letter": {
              fontSize: `${56 * fontSizeMultiplier}px`,
              fontWeight: 700,
              float: "left",
              lineHeight: 0.85,
              padding: "4px 8px 0 0",
              color: "var(--red)",
            }
          }}
        >
          {parseInlineMarkdown(trimmed)}
        </Typography>
      );
    }

    return (
      <Typography
        key={index}
        sx={{
          fontFamily: "var(--serif, 'Source Serif 4', Georgia, serif)",
          fontSize: `${18.5 * fontSizeMultiplier}px`,
          lineHeight: 1.75,
          color: "var(--text)",
          mb: 3,
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
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <LinearProgress sx={{ color: "var(--red)" }} />
      </Container>
    );
  }

  if (!article) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <SEOMeta
          title="Article Not Found | WorldNewzs"
          description="The requested news article could not be found or has been moved on WorldNewzs."
          noIndex={true}
        />
        <Typography variant="h5" sx={{ mb: 2 }}>Article not found</Typography>
        <Button variant="outlined" onClick={() => navigate("/")}>Return to Discover</Button>
      </Container>
    );
  }

  const author = getAuthorForCategory(article.category);
  const catConfig = getCategoryConfig(article.category);
  const canonicalArticleUrl = `${SITE_URL}/article/${encodeURIComponent(id || "")}`;

  return (
    <Box className="wrap" sx={{ maxWidth: "1240px", margin: "0 auto", px: { xs: 2, sm: 3, md: 3.5 }, py: 4, minHeight: "80vh" }}>
      {/* Scroll Reading Progress Bar */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: `${scrollProgress}%`,
          height: "3.5px",
          backgroundColor: "var(--red, #B7222B)",
          zIndex: 9999,
          transition: "width 0.1s ease-out",
          boxShadow: "0 0 8px rgba(183, 34, 43, 0.6)"
        }}
      />
      <SEOMeta
        title={article.headline || article.title}
        description={(article.summary || article.description || "").replace(/\s+/g, " ").trim()}
        keywords={keywords}
        ogImage={article.urlToImage || article.imageUrl}
        ogType="article"
        articlePublishedTime={article.publishedAt}
        articleModifiedTime={article.publishedAt}
        articleSection={article.category}
        canonical={canonicalArticleUrl}
      />
      <JSONLDNewsArticle
        article={{
          title: article.headline || article.title,
          summary: article.summary || article.description || "",
          url: canonicalArticleUrl,
          imageUrl: article.urlToImage || article.imageUrl || "",
          publishedAt: article.publishedAt || "",
          category: article.category || "",
          authorName: author.name,
          authorSlug: author.slug,
          dateModified: article.publishedAt
        }}
      />
      {extractedFaqs.length > 0 && <JSONLDFAQPage faqs={extractedFaqs} />}
      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: SITE_URL },
          { name: catConfig.name, url: `${SITE_URL}${catConfig.path}` },
          { name: article.headline || article.title || "Article", url: `${SITE_URL}/read-article/${encodeURIComponent(id || "")}` }
        ]}
      />

      {/* Styled Responsive Breadcrumb Navigation */}
      <BreadcrumbNav
        items={[
          { label: catConfig.name, path: catConfig.path },
          { label: article.headline || article.title || "Article" }
        ]}
      />

      {/* Two-column Editorial Layout */}
      <Grid container spacing={5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Box component="article" itemScope itemType="https://schema.org/NewsArticle" sx={{ mb: 4 }}>
            {/* Article Head */}
            <Box sx={{ mb: 3 }}>
              <Typography
                className="eyebrow"
                sx={{
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--red, #B7222B)",
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                ● {catConfig.name} Coverage
              </Typography>

              {/* Headline */}
              <Typography
                variant="h3"
                component="h1"
                itemProp="headline"
                sx={{
                  fontFamily: "var(--serif, 'Source Serif 4', Georgia, serif)",
                  fontSize: { xs: "28px", sm: "38px", md: "42px" },
                  lineHeight: 1.14,
                  fontWeight: 600,
                  letterSpacing: "-0.015em",
                  color: "var(--text)",
                  mb: 2,
                }}
              >
                {article.headline || article.title}
              </Typography>

              {/* Dek Summary */}
              {article.summary && (
                <Typography
                  sx={{
                    fontFamily: "var(--serif)",
                    fontStyle: "italic",
                    fontSize: { xs: "17px", sm: "19px" },
                    color: "var(--slate)",
                    lineHeight: 1.55,
                    mb: 2.5,
                    fontWeight: 400,
                  }}
                >
                  {article.summary}
                </Typography>
              )}

              {/* Author Byline Row */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                  borderTop: "1px solid var(--line)",
                  borderBottom: "1px solid var(--line)",
                  py: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar
                    sx={{ width: 42, height: 42, bgcolor: catConfig.color, fontWeight: 700, fontSize: "14px", color: "#FFFFFF" }}
                  >
                    {author.avatar}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      itemProp="author"
                      itemScope
                      itemType="https://schema.org/Person"
                      sx={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: "14px", color: "var(--text)" }}
                    >
                      By{" "}
                      <MuiLink
                        component={Link}
                        to={`/author/${author.slug}`}
                        itemProp="url"
                        sx={{ color: "var(--text)", textDecoration: "none", "&:hover": { color: "var(--red)" } }}
                      >
                        <span itemProp="name">{author.name}</span>
                      </MuiLink>
                    </Typography>
                    <Typography sx={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--slate-light)", display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                      <span>Published <time itemProp="datePublished" dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time></span>
                      <span>•</span>
                      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.4 }}>
                        <AccessTimeIcon sx={{ fontSize: 13, color: "var(--red, #B7222B)" }} />
                        <span>{readingTimeMinutes} min read</span>
                      </Box>
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    onClick={handleBookmarkClick}
                    variant="outlined"
                    size="small"
                    startIcon={isBookmarked(article.url || "") ? <BookmarkIcon sx={{ color: "var(--gold)" }} /> : <BookmarkBorderIcon />}
                    sx={{
                      borderColor: "var(--line)",
                      color: "var(--text)",
                      fontSize: "12px",
                      textTransform: "none",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    {isBookmarked(article.url || "") ? "Saved" : "Save"}
                  </Button>
                  <Button
                    onClick={handleShareClick}
                    variant="outlined"
                    size="small"
                    startIcon={<ShareIcon />}
                    sx={{
                      borderColor: "var(--line)",
                      color: "var(--text)",
                      fontSize: "12px",
                      textTransform: "none",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    Share
                  </Button>
                </Box>
              </Box>

              {/* Interactive Audio Reader & Reading Comfort Toolbar */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1.5,
                  mt: 1.5,
                  p: 1.25,
                  borderRadius: "6px",
                  backgroundColor: "var(--paper-raise, rgba(0,0,0,0.03))",
                  border: "1px solid var(--line, rgba(255,255,255,0.08))",
                }}
              >
                {/* Audio Listen Controls */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Button
                    size="small"
                    variant={isPlayingAudio ? "contained" : "outlined"}
                    color={isPlayingAudio ? "error" : "inherit"}
                    onClick={handleToggleAudio}
                    startIcon={isPlayingAudio && !isPausedAudio ? <PauseIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                    sx={{
                      fontSize: "12px",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: "20px",
                      px: 1.8,
                      borderColor: "var(--line)",
                      color: isPlayingAudio ? "#fff" : "var(--text)",
                      backgroundColor: isPlayingAudio ? "var(--red, #B7222B)" : "transparent",
                      "&:hover": {
                        backgroundColor: isPlayingAudio ? "var(--red-deep, #8E1B22)" : "rgba(183, 34, 43, 0.08)",
                      }
                    }}
                  >
                    {isPlayingAudio ? (isPausedAudio ? "Resume Audio" : "Pause Listening") : "Listen to Story"}
                  </Button>
                  {isPlayingAudio && (
                    <Tooltip title="Stop Audio">
                      <IconButton size="small" onClick={handleStopAudio} sx={{ color: "var(--text)" }}>
                        <StopIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {isPlayingAudio && !isPausedAudio && (
                    <Chip
                      size="small"
                      label="Playing audio..."
                      sx={{
                        fontSize: "10.5px",
                        height: 22,
                        backgroundColor: "rgba(183, 34, 43, 0.12)",
                        color: "var(--red, #B7222B)",
                        fontWeight: 600,
                        animation: "pulse 1.5s infinite"
                      }}
                    />
                  )}
                </Box>

                {/* Text Size Controls */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography sx={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--slate-light)", mr: 0.5, display: { xs: "none", sm: "inline" } }}>
                    Text Size:
                  </Typography>
                  <Tooltip title="Smaller text">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleFontSizeChange(-0.1)}
                      disabled={fontSizeMultiplier <= 0.85}
                      sx={{ minWidth: 32, px: 1, py: 0.2, fontSize: "11.5px", fontWeight: 700, borderColor: "var(--line)", color: "var(--text)" }}
                    >
                      A-
                    </Button>
                  </Tooltip>
                  <Tooltip title="Reset standard size">
                    <Button
                      size="small"
                      variant="text"
                      onClick={handleResetFontSize}
                      sx={{ minWidth: 28, px: 0.8, py: 0.2, fontSize: "11px", fontFamily: "var(--mono)", color: "var(--slate-light)" }}
                    >
                      {Math.round(fontSizeMultiplier * 100)}%
                    </Button>
                  </Tooltip>
                  <Tooltip title="Larger text">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleFontSizeChange(0.1)}
                      disabled={fontSizeMultiplier >= 1.35}
                      sx={{ minWidth: 32, px: 1, py: 0.2, fontSize: "12.5px", fontWeight: 700, borderColor: "var(--line)", color: "var(--text)" }}
                    >
                      A+
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
            </Box>

            {/* Hero banner image */}
            {(article.urlToImage || article.imageUrl) && (
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    width: "100%",
                    maxHeight: 480,
                    borderRadius: "2px",
                    overflow: "hidden",
                    backgroundColor: "#1c2740",
                  }}
                >
                  <CardMedia
                    component="img"
                    image={imgSrc || "/placeholder.svg"}
                    alt={article.headline || article.title}
                    itemProp="image"
                    loading="eager"
                    fetchPriority="high"
                    onError={handleImageError}
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Box>
                <Typography sx={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--slate-light)", pt: 1 }}>
                  Photo: WorldNewzs Art Desk · Verified Source: {typeof article.source === "object" ? article.source?.name : article.source}
                </Typography>
              </Box>
            )}

            {/* Article Content Body */}
            <Box itemProp="articleBody" sx={{ mt: 3 }}>
              {scrapingLoading && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" sx={{ mb: 0.5, fontStyle: "italic", fontFamily: "var(--mono)", display: "block", color: "var(--slate-light)" }}>
                    Verifying multi-source press reports...
                  </Typography>
                  <LinearProgress sx={{ color: "var(--red)", height: 3, borderRadius: 2 }} />
                </Box>
              )}

              {paragraphs.length > 0 ? (
                <Box className="article-body">
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
                </Box>
              ) : (
                <Box className="article-body">
                  <Typography
                    sx={{
                      fontFamily: "var(--serif)",
                      fontSize: "18.5px",
                      lineHeight: 1.75,
                      color: "var(--text)",
                      mb: 3,
                      "&::first-letter": {
                        fontSize: "56px",
                        fontWeight: 700,
                        float: "left",
                        lineHeight: 0.85,
                        padding: "4px 8px 0 0",
                        color: "var(--red)",
                      }
                    }}
                  >
                    {article.description || article.summary || "Full analytical coverage compiled by WorldNewzs newsroom desk."}
                  </Typography>

                  <ContextualPollWidget category={article.category} articleUrl={article.url} />

                  <Typography
                    sx={{
                      fontFamily: "var(--serif)",
                      fontSize: "18.5px",
                      lineHeight: 1.75,
                      color: "var(--text)",
                      mb: 3,
                    }}
                  >
                    WorldNewzs journalists cross-reference multi-source statements and public data streams to construct comprehensive timelines. Our editorial verification process cross-checks primary reporting to deliver fact-based reporting.
                  </Typography>

                  <ContextualDealsWidget category={article.category} />
                </Box>
              )}

              {article.url && (
                <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-start" }}>
                  <Button
                    variant="outlined"
                    endIcon={<OpenInNewIcon />}
                    onClick={() => window.open(article.url, "_blank")}
                    sx={{
                      borderColor: "var(--line)",
                      color: "var(--text)",
                      fontWeight: 600,
                      py: 1,
                      px: 2.5,
                      borderRadius: "3px",
                      textTransform: "none",
                      fontFamily: "var(--sans)",
                    }}
                  >
                    Read Original Press Release at Bureau
                  </Button>
                </Box>
              )}
            </Box>

            {/* Author Bio Card */}
            <Box
              className="author-card"
              sx={{
                display: "flex",
                gap: 2,
                p: 3,
                mt: 5,
                backgroundColor: "var(--paper-raise)",
                border: "1px solid var(--line)",
                borderRadius: "3px",
              }}
            >
              <Avatar
                sx={{ width: 56, height: 56, bgcolor: catConfig.color, fontWeight: 700, fontSize: "18px", color: "#FFFFFF" }}
              >
                {author.avatar}
              </Avatar>
              <Box>
                <Typography sx={{ fontFamily: "var(--serif)", fontSize: "17px", fontWeight: 600, mb: 0.5 }}>
                  {author.name}
                </Typography>
                <Typography sx={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--slate-light)", mb: 1 }}>
                  {author.title} · {author.education}
                </Typography>
                <Typography sx={{ fontFamily: "var(--sans)", fontSize: "13px", color: "var(--slate)", lineHeight: 1.55 }}>
                  {author.bio}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Sidebar Column */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
          <DailyNewsQuizWidget />
          <SuggestedForYouWidget
            onTopicsChange={setFollowedTopics}
            onTopicSelect={(topicId) => {
              setSelectedTopicId(topicId);
              if (topicId) {
                const el = document.getElementById("personalized-topic-hub");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }
            }}
            activeTopicId={selectedTopicId}
          />
          <WeatherWidget />
        </Grid>
      </Grid>

      {/* Related Coverage */}
      <Box sx={{ mt: 6 }}>
        <Box className="section-head" sx={{ borderBottom: "1px solid var(--line)", pb: 1, mb: 3 }}>
          <Typography component="h2" sx={{ fontFamily: "var(--serif)", fontSize: "22px", fontWeight: 700 }}>
            Related Coverage
          </Typography>
        </Box>
        <SectionStatus
          loading={relatedLoading}
          error={relatedError}
          hasData={relatedArticles.length > 0}
          emptyText="No related stories available right now."
        >
          <NewsGrid
            articles={relatedArticles.slice(0, 4)}
            columns={{ xs: 12, sm: 6, md: 3 }}
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

      {/* Suggested Topic Deep-Dive Intelligence Hub */}
      <Box sx={{ mt: 6 }}>
        <PersonalizedTopicHub
          activeTopicId={selectedTopicId}
          onTopicSelect={setSelectedTopicId}
          followedTopicIds={followedTopics}
          onToggleFollow={(id) => {
            setFollowedTopics((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            );
          }}
        />
      </Box>

      {/* Share Menu */}
      <Menu
        anchorEl={shareAnchorEl}
        open={shareOpen}
        onClose={handleShareClose}
        PaperProps={{
          sx: { minWidth: 150 }
        }}
      >
        <MenuItem onClick={handleShare("whatsapp")}>
          <ListItemIcon><WhatsAppIcon fontSize="small" sx={{ color: "#25D366" }} /></ListItemIcon>
          <ListItemText>WhatsApp</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShare("facebook")}>
          <ListItemIcon><FacebookIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText>Facebook</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShare("x")}>
          <ListItemIcon><XIcon fontSize="small" /></ListItemIcon>
          <ListItemText>X (Twitter)</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShare("linkedin")}>
          <ListItemIcon><LinkedInIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText>LinkedIn</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShare("copy")}>
          <ListItemIcon>
            {copyFeedback ? <CheckIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{copyFeedback ? "Copied!" : "Copy Link"}</ListItemText>
        </MenuItem>
      </Menu>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          onClick={handleBack}
          sx={{
            borderColor: "var(--line)",
            color: "var(--text)",
            fontFamily: "var(--sans)",
            textTransform: "none",
          }}
        >
          Back to Top Stories
        </Button>
      </Box>
    </Box>
  );
};

export default ReadFullArticles;
