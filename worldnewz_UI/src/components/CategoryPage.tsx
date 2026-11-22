import React, { useEffect, useState, useMemo, Suspense, lazy } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import VerifiedIcon from "@mui/icons-material/Verified";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Collapse from "@mui/material/Collapse";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import TuneIcon from "@mui/icons-material/Tune";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import BallotIcon from "@mui/icons-material/Ballot";
import SearchIcon from "@mui/icons-material/Search";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ClearIcon from "@mui/icons-material/Clear";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import NewsGrid from "./NewsGrid";
import SectionStatus from "./SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";
import { deduplicateArticles } from "../utils/deduplicate";
import { formatTimeAgoLong } from "../utils/formatTime";
import { TopStoriesSection } from "./TopStoriesSection";
import { HeroLeadMedia } from "./common/HeroLeadMedia";
import { getCategoryFallbackArticles, fallbackDiscoverArticles } from "../utils/fallbackArticles";
import { isArticleMatchingTopics } from "../utils/topicDefinitions";

// Lazy load below-the-fold & sidebar widgets
const AffiliateDeals = lazy(() => import("./AffiliateDeals").then(m => ({ default: m.AffiliateDeals })));
const CategoryEditorial = lazy(() => import("./CategoryEditorial").then(m => ({ default: m.CategoryEditorial })));
const SuggestedForYouWidget = lazy(() => import("./SuggestedForYouWidget").then(m => ({ default: m.SuggestedForYouWidget })));
const PersonalizedTopicHub = lazy(() => import("./PersonalizedTopicHub").then(m => ({ default: m.PersonalizedTopicHub })));
const ShoppingWidget = lazy(() => import("./ShoppingWidget").then(m => ({ default: m.ShoppingWidget })));
const WatchlistWidget = lazy(() => import("./WatchlistWidget").then(m => ({ default: m.WatchlistWidget })));
const WeatherWidget = lazy(() => import("./WeatherWidget").then(m => ({ default: m.WeatherWidget })));
const InternalLinkHub = lazy(() => import("./InternalLinkHub").then(m => ({ default: m.InternalLinkHub })));
const ContextualPollWidget = lazy(() => import("./ContextualPollWidget").then(m => ({ default: m.ContextualPollWidget })));
const DailyNewsQuizWidget = lazy(() => import("./DailyNewsQuizWidget").then(m => ({ default: m.DailyNewsQuizWidget })));

interface CategoryPageProps {
  categoryKey: string;
  title: string;
  emoji: string;
  keywords: string[];
  fetchApi: (params: { page: number; pageSize: number; query?: string }) => Promise<any>;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  politics: `Comprehensive, real-time updates on global and regional political developments, elections, government policy changes, and legislative reforms. Sourced from verified, high-authority news platforms and governmental press releases.`,
  technology: `Breakthroughs in Artificial Intelligence, consumer electronics, software, cybersecurity, and tech policy. Sourced from elite technology journals, industry summits, and developer feeds.`,
  business: `Financial markets, startup ecosystem updates, corporate merges, macroeconomic policies, and thorough industry analysis sourced directly from financial terminals and economic registries.`,
  "science-health": `Frontiers of human knowledge featuring major medical breakthroughs, space exploration, and environmental studies sourced from peer-reviewed scientific journals and research institutions.`,
  lifestyle: `Curated coverage on fashion, global culture, modern wellness, interior design, and personal growth sourced from renowned design journals and expert commentators.`,
  education: `Study resources, exam schedules, academic news, and career guidance for students, educators, and career seekers.`,
  opinion: `Thoughtful editorials, expert analysis, and diverse reader perspectives sourced from leading think-tanks, veteran journalists, and policy advisors.`,
  trending: `Viral stories, social media buzz, popular memes, and pop culture updates compiled with real-time fact checking.`,
  "podcasts-videos": `Multimedia section featuring engaging interviews, visual explainers, audio podcasts, and short documentary clips.`,
  "local-news": `High-value regional news covering local politics, development, traffic, and civic issues.`,
  sports: `Real-time coverage of global athletics, soccer, basketball, tennis, cricket tournaments, and Olympic events.`,
  money: `Personal finances, wealth management, savings, real estate trends, tax planning, and investment strategies.`,
  weather: `Accurate and hyper-local meteorological updates, long-range forecasts, severe weather alerts, and climate analysis.`,
  shopping: `Consumer guides, product reviews, e-commerce deals, and retail trends sourced from consumer protection groups.`,
  travel: `Destination reviews, transit advisories, hotel guides, cultural insights, and travel safety tips.`,
  food: `Culinary trends, gourmet recipes, restaurant guides, food science, and dietary advice.`,
  entertainment: `Movie reviews, celebrity news, music releases, box office reports, and theatre updates.`,
  services: `Professional solutions, business consultancies, utilities, software-as-a-service (SaaS) reviews, and digital service platforms.`,
  gaming: `Video game releases, hardware reviews, e-sports tournaments, patch notes, and console specs.`,
  cartoons: `Animation, anime, manga, and comic books curated from animation studios and historians.`
};

const CATEGORY_SUBTOPICS: Record<string, string[]> = {
  politics: ["All Politics", "Elections 2026", "Global Diplomacy & Treaties", "Congress & Legislation", "Defense & Cyber Sovereignty", "Geopolitical Economics", "Policy Deep-Dives"],
  technology: ["All Tech", "AI & Neuromorphic", "Silicon & Hardware", "Cybersecurity", "Cloud & Quantum", "Robotics & Space", "Developer Ecosystem"],
  business: ["All Markets", "Global Equities", "Venture Capital", "Central Banks & Rates", "Commodities & Energy", "M&A Deals", "Corporate Earnings"],
  "science-health": ["All Science", "Biotech & Genomics", "Neuroscience", "Epidemiology", "Space Exploration", "Climate Science", "Clinical Trials"],
  sports: ["All Sports", "Premier League", "NBA & Basketball", "Formula 1", "Tennis Grand Slams", "Cricket World Series", "Olympic Games"],
  money: ["All Finance", "Personal Wealth", "Real Estate", "Tax Strategies", "Retirement Planning", "Crypto Assets", "Index Funds"],
  weather: ["All Weather", "Severe Weather Alerts", "Global Climate Indices", "Radar Imagery", "Atmospheric Modeling", "Air Quality (AQI)"],
  shopping: ["All Deals", "Smart Tech & Gadgets", "Home & Living", "Audio & Wearables", "Apparel", "Prime Dispatches"],
};

export const CATEGORY_SUBTOPIC_TAXONOMY: Record<string, Record<string, string[]>> = {
  money: {
    "Personal Wealth": ["wealth", "savings", "invest", "finance", "budget", "salary", "portfolio", "net worth", "income", "equity", "rupee", "dollar", "earning", "fund"],
    "Real Estate": ["real estate", "property", "housing", "mortgage", "home", "reit", "land", "rental", "construction", "flat", "apartment", "delhivery", "builder"],
    "Tax Strategies": ["tax", "irs", "deduction", "gst", "capital gains", "audit", "exemption", "revenue", "levy", "fiscal", "budget", "policy", "reform"],
    "Retirement Planning": ["retirement", "pension", "401k", "ira", "epf", "annuity", "social security", "senior", "superannuation", "life insurance", "lic"],
    "Crypto Assets": ["crypto", "bitcoin", "ethereum", "blockchain", "btc", "eth", "web3", "token", "digital currency", "altcoin", "nft", "solana", "cryptography", "quantum", "defi"],
    "Index Funds": ["index", "etf", "nifty", "sensex", "s&p", "nasdaq", "mutual fund", "bse", "vanguard", "passive", "funds", "market", "stocks", "ipo"]
  },
  politics: {
    "Elections 2026": ["election", "poll", "vote", "ballot", "campaign", "candidate", "constituency", "caucus", "primary", "voter", "bjp", "congress"],
    "Global Diplomacy & Treaties": ["diplomacy", "treaty", "summit", "ambassador", "bilateral", "sanction", "accord", "foreign policy", "un", "nato", "envoy", "geneva", "treaties"],
    "Congress & Legislation": ["congress", "senate", "parliament", "bill", "legislation", "lawmaker", "act", "judiciary", "court", "ruling", "ordinance"],
    "Defense & Cyber Sovereignty": ["defense", "military", "cyber", "sovereignty", "security", "pentagon", "missile", "intelligence", "border", "army", "naval"],
    "Geopolitical Economics": ["geopolitic", "trade", "tariff", "embargo", "currency", "wto", "opec", "supply chain", "corridor", "sanctions"],
    "Policy Deep-Dives": ["policy", "reform", "governance", "regulation", "framework", "doctrine", "minister", "directive", "commission"]
  },
  technology: {
    "AI & Neuromorphic": ["ai", "artificial intelligence", "neuromorphic", "llm", "neural", "machine learning", "deep learning", "openai", "copilot", "chatgpt", "gemini", "anthropic"],
    "Silicon & Hardware": ["semiconductor", "chip", "silicon", "gpu", "tsmc", "intel", "nvidia", "hardware", "nanometer", "fab", "processor"],
    "Cybersecurity": ["cyber", "malware", "ransomware", "hack", "breach", "zero-day", "encryption", "firewall", "vulnerability", "infosec"],
    "Cloud & Quantum": ["cloud", "quantum", "qubit", "aws", "azure", "serverless", "datacenter", "compute", "google cloud"],
    "Robotics & Space": ["robot", "autonomous", "drone", "space", "satellite", "nasa", "spacex", "isro", "rover", "aerospace"],
    "Developer Ecosystem": ["developer", "open-source", "github", "api", "software", "code", "programming", "framework", "linux"]
  },
  business: {
    "Global Equities": ["equities", "stocks", "shares", "wall street", "stock market", "dow", "nasdaq", "rally", "bull", "bear", "sensex", "nifty"],
    "Venture Capital": ["venture capital", "vc", "startup", "funding", "seed round", "valuation", "unicorn", "pitch", "angel", "founder"],
    "Central Banks & Rates": ["central bank", "fed", "interest rate", "inflation", "monetary policy", "rbi", "ecb", "basis points", "rate hike", "rate cut"],
    "Commodities & Energy": ["oil", "crude", "gas", "gold", "energy", "lithium", "commodity", "brent", "petroleum", "renewable", "solar", "wind"],
    "M&A Deals": ["merger", "acquisition", "takeover", "deal", "buyout", "consortium", "stake", "buy"],
    "Corporate Earnings": ["earnings", "quarterly", "profit", "revenue", "guidance", "dividend", "q1", "q2", "q3", "q4", "margin", "results"]
  },
  "science-health": {
    "Biotech & Genomics": ["biotech", "genomics", "crispr", "dna", "rna", "gene", "cellular", "molecular", "oncology"],
    "Neuroscience": ["neuroscience", "brain", "cognitive", "alzheimer", "mental", "synapse", "neural"],
    "Epidemiology": ["epidemiology", "who", "virus", "vaccine", "pathogen", "infection", "outbreak", "public health"],
    "Space Exploration": ["space", "exoplanet", "telescope", "astronomy", "cosmos", "galaxy", "mars", "moon"],
    "Climate Science": ["climate", "emissions", "carbon", "antarctica", "warming", "renewable", "biodiversity"],
    "Clinical Trials": ["clinical trial", "fda", "drug", "therapy", "treatment", "phase 3", "patient"]
  },
  sports: {
    "Premier League": ["premier league", "football", "soccer", "champions league", "arsenal", "manchester", "liverpool", "goal"],
    "NBA & Basketball": ["nba", "basketball", "lakers", "celtics", "warriors", "points", "dunk", "playoffs"],
    "Formula 1": ["formula 1", "f1", "verstappen", "hamilton", "ferrari", "mercedes", "grand prix", "lap"],
    "Tennis Grand Slams": ["tennis", "wimbledon", "nadal", "djokovic", "alcaraz", "federer", "grand slam", "open"],
    "Cricket World Series": ["cricket", "ipl", "bcci", "icc", "t20", "odi", "test match", "rohit", "kohli", "wicket"],
    "Olympic Games": ["olympic", "athletics", "gold medal", "swimming", "gymnastics", "paris", "track"]
  },
  weather: {
    "Severe Weather Alerts": ["severe", "storm", "hurricane", "cyclone", "flood", "warning", "tornado", "typhoon"],
    "Global Climate Indices": ["climate", "el nino", "la nina", "temperature", "anomaly", "heatwave"],
    "Radar Imagery": ["radar", "satellite", "doppler", "precipitation", "rain", "clouds"],
    "Atmospheric Modeling": ["atmospheric", "barometric", "pressure", "humidity", "wind", "jet stream"],
    "Air Quality (AQI)": ["aqi", "air quality", "pollution", "pm2.5", "smog", "unhealthy", "clean air"]
  },
  shopping: {
    "Smart Tech & Gadgets": ["gadget", "smart", "tech", "laptop", "phone", "tablet", "electronics"],
    "Home & Living": ["home", "kitchen", "furniture", "appliance", "decor", "bedding"],
    "Audio & Wearables": ["audio", "headphone", "earbuds", "smartwatch", "speaker", "soundbar"],
    "Apparel": ["apparel", "clothing", "shoes", "fashion", "jacket", "shirt", "dress"],
    "Prime Dispatches": ["prime", "discount", "deal", "amazon", "offer", "sale", "save"]
  }
};

export const getSubtopicKeywords = (category: string, subtopic: string): string[] => {
  const catKey = category.toLowerCase();
  const catMap = CATEGORY_SUBTOPIC_TAXONOMY[catKey];
  if (catMap && catMap[subtopic]) {
    return catMap[subtopic];
  }
  return subtopic
    .toLowerCase()
    .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["all", "wire", "reports", "global", "analysis"].includes(w));
};

export const getCategorySearchPlaceholder = (cat: string, catTitle: string): string => {
  switch (cat.toLowerCase()) {
    case "money":
      return "Search money dossiers, tickers, interest rates, crypto assets, tax strategies...";
    case "politics":
      return "Search political treaties, legislation, roll-calls, executive orders...";
    case "technology":
      return "Search AI models, semiconductor roadmaps, quantum breakthroughs, cybersecurity...";
    case "business":
      return "Search market equities, venture capital, earnings, commodities, central banks...";
    case "science-health":
      return "Search clinical trials, genomics, space dispatches, neuroscience...";
    case "sports":
      return "Search fixtures, league standings, grand slams, transfer news...";
    case "weather":
      return "Search meteorological radars, severe storms, climate indices, AQI forecasts...";
    case "shopping":
      return "Search deals, tech gadgets, audio wearables, prime dispatches...";
    default:
      return `Search ${catTitle.toLowerCase()} dispatches, dossiers, and investigative reports...`;
  }
};

const CategoryPage: React.FC<CategoryPageProps> = ({
  categoryKey,
  title,
  emoji,
  keywords,
  fetchApi
}) => {
  const navigate = useNavigate();

  const outletContext = useOutletContext<{ searchTerm?: string } | undefined>();
  const searchTerm = outletContext?.searchTerm ?? "";
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personalTab, setPersonalTab] = useState<"recommended" | "trending">("recommended");
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Sub-index Drawer & In-Category Search state
  const [showSubIndex, setShowSubIndex] = useState(true);
  const [subSearchQuery, setSubSearchQuery] = useState("");
  const [activeSubFilter, setActiveSubFilter] = useState("All");
  const [isSearching, setIsSearching] = useState(false);

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

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const dynamicKeywordsData = useKeywords(categoryKey);

  const normalizedSearchTerm = (subSearchQuery.trim() || searchTerm.trim()).toLowerCase();
  const filteredArticles = useMemo(() => {
    let result = articles;
    if (activeSubFilter !== "All" && !activeSubFilter.startsWith("All")) {
      const subtopicKeywords = getSubtopicKeywords(categoryKey, activeSubFilter);
      result = result.filter((a) => {
        const text = `${a.title || ""} ${a.description || ""} ${a.category || ""}`.toLowerCase();
        return subtopicKeywords.some((kw) => text.includes(kw));
      });
    }
    if (normalizedSearchTerm) {
      const terms = normalizedSearchTerm.split(/\s+/).filter((w) => w.length > 1);
      result = result.filter((a) => {
        const text = `${a.title || ""} ${a.description || ""}`.toLowerCase();
        return text.includes(normalizedSearchTerm) || (terms.length > 0 && terms.every((t) => text.includes(t)));
      });
    }
    return result;
  }, [articles, normalizedSearchTerm, activeSubFilter, categoryKey]);

  // Derived sections matching Home Page Editorial river
  const leadStory = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const mostReadArticles = useMemo(() => {
    const direct = filteredArticles.slice(1, 6);
    if (direct.length >= 4) return direct;
    const fallbacks = getCategoryFallbackArticles(title);
    const pool = [...filteredArticles.slice(1), ...fallbacks, ...fallbackDiscoverArticles];
    const unique: Article[] = [];
    for (const item of pool) {
      if (item && item.title !== leadStory?.title && !unique.some(u => u.title === item.title)) {
        unique.push(item);
      }
      if (unique.length >= 5) break;
    }
    return unique;
  }, [filteredArticles, leadStory, title]);

  const topStoriesGrid = useMemo(() => filteredArticles.slice(6, 12), [filteredArticles]);
  const remainingArticles = useMemo(() => (filteredArticles.length > 12 ? filteredArticles.slice(12) : filteredArticles), [filteredArticles]);

  const recommendedArticles = useMemo(() => {
    if (followedTopics.length === 0) return filteredArticles.slice(2, 6);
    const matched = filteredArticles.filter((art) => isArticleMatchingTopics(art, followedTopics));
    return matched.length > 0 ? matched.slice(0, 5) : filteredArticles.slice(2, 6);
  }, [filteredArticles, followedTopics]);

  const trendingArticles = useMemo(() => filteredArticles.slice(5, 10), [filteredArticles]);

  const loadData = (currentPage: number, searchQuery?: string) => {
    if (currentPage === 1) setLoading(true);
    else setIsFetchingMore(true);

    const apiParams: { page: number; pageSize: number; query?: string } = {
      page: currentPage,
      pageSize: 20,
    };
    if (searchQuery) {
      apiParams.query = searchQuery;
    }

    return fetchApi(apiParams)
      .then((res) => {
        const data = Array.isArray(res.data?.articles) ? res.data.articles : [];
        const formattedData = data.map((a: any) => ({
          ...a,
          imageUrl: a.urlToImage || a.image || a.imageUrl,
          category: a.category || title,
        }));
        
        if (formattedData.length === 0) {
          if (currentPage === 1) {
            if (searchQuery) {
              setArticles([]);
            } else {
              setArticles(getCategoryFallbackArticles(title));
            }
            setHasMore(false);
          } else {
            setHasMore(false);
          }
        } else if (formattedData.length < 5 && currentPage === 1 && !searchQuery) {
          const fallbacks = getCategoryFallbackArticles(title);
          const combined = deduplicateArticles([...formattedData, ...fallbacks]);
          setArticles(combined);
          setHasMore(false);
        } else {
          setArticles((prev) => {
            const combined = currentPage === 1 ? formattedData : [...prev, ...formattedData];
            return deduplicateArticles(combined);
          });
        }
      })
      .catch((err) => {
        console.warn(`Category API request failed for ${title}, using fallback if available:`, err);
        if (currentPage === 1) {
          if (!searchQuery) {
            setArticles(getCategoryFallbackArticles(title));
          }
          setError(null);
        } else {
          setError(`Failed to load ${title.toLowerCase()} news`);
        }
        setHasMore(false);
      })
      .finally(() => {
        setLoading(false);
        setIsFetchingMore(false);
      });
  };

  const handleQueryDeskSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = subSearchQuery.trim();
    if (!query) {
      loadData(1);
      return;
    }
    setIsSearching(true);
    setPage(1);
    setHasMore(true);
    try {
      await loadData(1, query);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSubSearchQuery("");
    loadData(1);
  };

  const handleResetFilters = () => {
    setActiveSubFilter("All");
    setSubSearchQuery("");
    loadData(1);
  };

  useEffect(() => {
    setArticles([]);
    setPage(1);
    setHasMore(true);
    loadData(1);
  }, [categoryKey]);

  useEffect(() => {
    if (page > 1) {
      loadData(page);
    }
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 100 >=
        document.documentElement.offsetHeight
      ) {
        if (!isFetchingMore && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFetchingMore, hasMore, loading]);

  const handleArticleClick = (art: Article) => {
    const titleSlug = art.title?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().substring(0, 50) || "article";
    navigate(`/read-article/${titleSlug}`, { state: { article: art } });
  };

  const description = CATEGORY_DESCRIPTIONS[categoryKey] || `Latest updates and verified news reports relating to ${title.toLowerCase()}.`;
  const dynamicDesc = useMemo(() => {
    if (filteredArticles.length > 0) {
      const headlines = filteredArticles.slice(0, 3).map(a => a.title).join("; ");
      return `Latest ${title} headlines: ${headlines}. Read verified reporting on WorldNewzs.`.substring(0, 155) + "...";
    }
    return description.substring(0, 155) + "...";
  }, [filteredArticles, title, description]);

  const combinedKeywords = dynamicKeywordsData
    ? [...new Set([...keywords, ...dynamicKeywordsData.primary, ...dynamicKeywordsData.longtail, ...dynamicKeywordsData.trending])]
    : keywords;
  const descriptionToUse = dynamicKeywordsData?.metaDesc || dynamicDesc;
  const todayDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const subtopics = CATEGORY_SUBTOPICS[categoryKey] || [`All ${title}`, `${title} Analysis`, `${title} Wire`, `${title} Global`, `${title} Reports`];

  return (
    <Box 
      component="div"
      sx={{ 
        width: "100%", 
        backgroundColor: "var(--color-canvas-base)", 
        minHeight: "100vh", 
        pb: { xs: 4, md: 6 },
        transition: "var(--transition-theme)",
      }}
    >
      <SEOMeta
        title={`${title} News & Intelligence (${todayDate}) — WorldNewzs`}
        description={`${descriptionToUse} (Updated ${todayDate})`}
        keywords={combinedKeywords}
        canonical={`https://worldnewzs.in/${categoryKey}`}
      />
      
      <JSONLDBreadcrumb crumbs={[
        { name: "Home", url: "https://worldnewzs.in" },
        { name: title, url: `https://worldnewzs.in/${categoryKey}` }
      ]} />

      {/* 1. UPPER LIVE OPERATIONAL WIRE SUB-HEADER & LIVE DESK RIBBON (Matching Politics Code Reference) */}
      <Box
        component="section"
        aria-label="Category Sub-Header Ribbon"
        sx={{
          width: "100%",
          backgroundColor: "var(--color-surface-container-low)",
          borderBottom: "1px solid var(--color-border-divider)",
          py: 1,
          px: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 2, md: 3 },
          transition: "var(--transition-theme)",
        }}
      >
        <Box
          className="wrap"
          sx={{
            maxWidth: "1440px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 1.2,
          }}
        >
          {/* Upper Breadcrumb & Live Desk Info */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontFamily: "var(--font-mono-telemetry)",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--color-ink-secondary)",
              }}
            >
              <Typography component="span" sx={{ color: "var(--color-brand-accent)", fontWeight: 700 }}>
                WorldNewzs Wire
              </Typography>
              <span>/</span>
              <Typography component="span" sx={{ color: "var(--color-ink-primary)", fontWeight: 600 }}>
                {emoji} {title} &amp; Global Affairs
              </Typography>
              <span>/</span>
              <Typography component="span" sx={{ color: "var(--color-ink-tertiary)", display: { xs: "none", sm: "inline" } }}>
                Sunday, Nov 22, 2026 • 18:42 UTC
              </Typography>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  backgroundColor: "var(--color-surface-container)",
                  border: "1px solid var(--color-border-divider)",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "4px",
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-brand-accent)",
                    animation: "pulse 1.8s infinite",
                  }}
                />
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "var(--font-mono-telemetry)",
                    fontSize: "10.5px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--color-ink-primary)",
                  }}
                >
                  {title.toUpperCase()} DESK LIVE
                </Typography>
                <Typography component="span" sx={{ color: "var(--color-border-divider)", display: { xs: "none", sm: "inline" } }}>|</Typography>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "var(--font-sans-body)",
                    fontSize: "11px",
                    color: "var(--color-ink-secondary)",
                    display: { xs: "none", sm: "inline" },
                  }}
                >
                  14 correspondents reporting
                </Typography>
                <Typography component="span" sx={{ color: "var(--color-border-divider)", display: { xs: "none", sm: "inline" } }}>|</Typography>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "var(--font-mono-telemetry)",
                    fontSize: "10.5px",
                    color: "var(--color-telemetry-positive)",
                    fontWeight: 700,
                  }}
                >
                  42 DISPATCHES TODAY
                </Typography>
              </Box>

              <Button
                id="categoryToggleBtn"
                size="small"
                onClick={() => setShowSubIndex(!showSubIndex)}
                startIcon={<TuneIcon sx={{ fontSize: 14, color: "var(--color-brand-accent)" }} />}
                sx={{
                  fontFamily: "var(--font-sans-body)",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: "var(--color-ink-primary)",
                  backgroundColor: "var(--color-surface-container)",
                  border: "1px solid var(--color-border-divider)",
                  borderRadius: "4px",
                  py: 0.4,
                  px: 1.2,
                  "&:hover": { backgroundColor: "var(--color-surface-container-high)" },
                }}
              >
                {showSubIndex ? "Hide Sub-Index (-)" : "Show Sub-Index (+)"}
              </Button>
            </Box>
          </Box>

          {/* Collapsible Sub-Index & Category Search Drawer */}
          <Collapse in={showSubIndex}>
            <Box
              sx={{
                backgroundColor: "var(--color-surface-container)",
                border: "1px solid var(--color-border-divider)",
                borderRadius: "4px",
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                mt: 0.5,
              }}
            >
              {/* Integrated Search Bar */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  alignItems: { xs: "stretch", md: "center" },
                  justifyContent: "space-between",
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: "var(--color-brand-accent)" }}>
                  <TravelExploreIcon sx={{ fontSize: 18 }} />
                  <Typography
                    sx={{
                      fontFamily: "var(--font-sans-body)",
                      fontWeight: 700,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--color-ink-primary)",
                    }}
                  >
                    {title} Index &amp; Dossier Search
                  </Typography>
                </Box>

                <Box
                  component="form"
                  onSubmit={handleQueryDeskSubmit}
                  role="search"
                  aria-label={`${title} Dossier Search`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "var(--color-canvas-base)",
                    border: "1px solid var(--color-border-divider)",
                    borderRadius: "4px",
                    px: 1.5,
                    py: 0.3,
                    flex: { md: "0 1 550px" },
                    transition: "border-color 0.18s ease, box-shadow 0.18s ease",
                    "&:focus-within": {
                      borderColor: "var(--color-brand-accent)",
                      boxShadow: "0 0 0 1px var(--color-brand-accent)",
                    },
                  }}
                >
                  <SearchIcon sx={{ fontSize: 17, color: "var(--color-ink-tertiary)", mr: 1, flexShrink: 0 }} />
                  <input
                    id="categoryDossierSearchInput"
                    type="text"
                    value={subSearchQuery}
                    onChange={(e) => setSubSearchQuery(e.target.value)}
                    placeholder={getCategorySearchPlaceholder(categoryKey, title)}
                    style={{
                      border: "none",
                      outline: "none",
                      backgroundColor: "transparent",
                      color: "var(--color-ink-primary)",
                      fontFamily: "var(--font-sans-body)",
                      fontSize: "12.5px",
                      width: "100%",
                    }}
                  />
                  {subSearchQuery && (
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                      title="Clear query"
                      aria-label="Clear query"
                      sx={{ p: 0.3, mr: 0.5, color: "var(--color-ink-tertiary)", "&:hover": { color: "var(--color-ink-primary)" } }}
                    >
                      <ClearIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  )}
                  <Tooltip title="Execute search (Enter)">
                    <span>
                      <IconButton
                        id="categoryQueryDeskBtn"
                        type="submit"
                        disabled={isSearching}
                        size="small"
                        aria-label="Execute search"
                        sx={{
                          backgroundColor: "var(--color-brand-accent)",
                          color: "#ffffff",
                          width: 28,
                          height: 28,
                          borderRadius: "4px",
                          ml: 0.5,
                          flexShrink: 0,
                          transition: "all 0.18s ease",
                          "&:hover": {
                            backgroundColor: "var(--color-brand-accent-hover)",
                            transform: "scale(1.05)",
                          },
                          "&.Mui-disabled": {
                            backgroundColor: "var(--color-brand-accent)",
                            opacity: 0.6,
                            color: "#ffffff",
                          },
                        }}
                      >
                        {isSearching ? (
                          <CircularProgress size={13} sx={{ color: "#ffffff" }} />
                        ) : (
                          <ArrowForwardIcon sx={{ fontSize: 16 }} />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>

              {/* Filter Pills Bar */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.8,
                  overflowX: "auto",
                  pb: 0.5,
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {subtopics.map((pill, idx) => {
                  const isPillActive = activeSubFilter === pill || (idx === 0 && activeSubFilter === "All");
                  return (
                    <Box
                      key={pill}
                      id={`subtopicPill_${idx}`}
                      component="button"
                      onClick={() => setActiveSubFilter(pill === subtopics[0] ? "All" : pill)}
                      sx={{
                        backgroundColor: isPillActive ? "var(--color-brand-accent)" : "var(--color-surface-container-high)",
                        color: isPillActive ? "#ffffff" : "var(--color-ink-primary)",
                        border: `1px solid ${isPillActive ? "var(--color-brand-accent)" : "var(--color-border-divider)"}`,
                        borderRadius: "3px",
                        px: 1.4,
                        py: 0.45,
                        fontSize: "11px",
                        fontFamily: "var(--font-sans-body)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        transition: "all 0.16s ease",
                        "&:hover": {
                          backgroundColor: isPillActive ? "var(--color-brand-accent-hover)" : "var(--color-border-divider)",
                        },
                      }}
                    >
                      {pill}
                    </Box>
                  );
                })}

                <Box
                  component="button"
                  type="button"
                  id="categoryCivicPollsBtn"
                  onClick={() => {
                    const pollSection = document.getElementById("category-poll-section");
                    if (pollSection) {
                      pollSection.scrollIntoView({ behavior: "smooth", block: "center" });
                      pollSection.style.transition = "outline 0.3s ease";
                      pollSection.style.outline = "2px solid var(--color-brand-accent)";
                      setTimeout(() => {
                        pollSection.style.outline = "none";
                      }, 1800);
                    } else {
                      navigate("/polls");
                    }
                  }}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    backgroundColor: "var(--color-surface-container-high)",
                    color: "var(--color-brand-accent)",
                    border: "1px solid var(--color-border-divider)",
                    borderRadius: "3px",
                    px: 1.4,
                    py: 0.45,
                    fontSize: "11px",
                    fontFamily: "var(--font-sans-body)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                    ml: "auto",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "var(--color-border-divider)" },
                  }}
                >
                  <BallotIcon sx={{ fontSize: 13 }} />
                  <span>Civic Polls (3 Active)</span>
                </Box>
              </Box>

              {/* Active Filter & Match Counter Banner */}
              {(activeSubFilter !== "All" || subSearchQuery.trim()) && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                    pt: 1,
                    borderTop: "1px dashed var(--color-border-divider)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography
                      sx={{
                        fontFamily: "var(--font-mono-telemetry)",
                        fontSize: "10.5px",
                        textTransform: "uppercase",
                        color: "var(--color-ink-secondary)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Active Filter:
                    </Typography>
                    {activeSubFilter !== "All" && (
                      <Chip
                        size="small"
                        label={`Topic: ${activeSubFilter}`}
                        onDelete={() => setActiveSubFilter("All")}
                        deleteIcon={<ClearIcon sx={{ fontSize: "13px !important" }} />}
                        sx={{
                          height: "22px",
                          fontSize: "10.5px",
                          fontFamily: "var(--font-mono-telemetry)",
                          fontWeight: 600,
                          backgroundColor: "var(--color-surface-container-high)",
                          color: "var(--color-ink-primary)",
                          border: "1px solid var(--color-border-divider)",
                          "& .MuiChip-deleteIcon": { color: "var(--color-brand-accent)" },
                        }}
                      />
                    )}
                    {subSearchQuery.trim() && (
                      <Chip
                        size="small"
                        label={`Query: "${subSearchQuery.trim()}"`}
                        onDelete={handleClearSearch}
                        deleteIcon={<ClearIcon sx={{ fontSize: "13px !important" }} />}
                        sx={{
                          height: "22px",
                          fontSize: "10.5px",
                          fontFamily: "var(--font-mono-telemetry)",
                          fontWeight: 600,
                          backgroundColor: "var(--color-surface-container-high)",
                          color: "var(--color-ink-primary)",
                          border: "1px solid var(--color-border-divider)",
                          "& .MuiChip-deleteIcon": { color: "var(--color-brand-accent)" },
                        }}
                      />
                    )}
                    <Typography
                      sx={{
                        fontFamily: "var(--font-mono-telemetry)",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: filteredArticles.length > 0 ? "var(--color-telemetry-positive)" : "var(--color-brand-accent)",
                      }}
                    >
                      {filteredArticles.length} {filteredArticles.length === 1 ? "dispatch matched" : "dispatches matched"}
                    </Typography>
                  </Box>

                  <Button
                    size="small"
                    onClick={handleResetFilters}
                    startIcon={<RestartAltIcon sx={{ fontSize: 13 }} />}
                    sx={{
                      fontFamily: "var(--font-sans-body)",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--color-ink-secondary)",
                      textTransform: "none",
                      py: 0.1,
                      px: 0.8,
                      minHeight: 0,
                      "&:hover": { color: "var(--color-brand-accent)", backgroundColor: "transparent" },
                    }}
                  >
                    Reset all filters
                  </Button>
                </Box>
              )}
            </Box>
          </Collapse>
        </Box>
      </Box>

      {/* 2. MAIN 1440px EDITORIAL CONTAINER */}
      <Box
        className="wrap"
        sx={{
          maxWidth: "1440px",
          margin: "0 auto",
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <SectionStatus 
          loading={loading} 
          error={error} 
          hasData={filteredArticles.length > 0}
          emptyText={
            activeSubFilter !== "All"
              ? `No dispatches found matching subtopic "${activeSubFilter}". Try selecting another subtopic or reset filters.`
              : (normalizedSearchTerm ? `No dispatches matching query "${normalizedSearchTerm}".` : `No dispatches currently available in ${title}.`)
          }
        >
          {/* ASYMMETRIC 12-COLUMN LEAD INVESTIGATION HERO (Signature Rebrand Feature) */}
          {leadStory && (
            <Box
              component="article"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
                gap: { xs: 3, lg: 4 },
                backgroundColor: "var(--color-surface-container)",
                border: "1px solid var(--color-border-divider)",
                borderRadius: "4px",
                p: { xs: 2.2, md: 3 },
                mb: 4,
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              }}
            >
              {/* Left Column (7 Cols): Lead Investigation Content */}
              <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box>
                  {/* Tag & Verification Row */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 1.2 }}>
                    <Typography
                      component="span"
                      sx={{
                        backgroundColor: "var(--color-brand-accent)",
                        color: "#fff",
                        fontFamily: "var(--font-mono-telemetry)",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        px: 1,
                        py: 0.3,
                        borderRadius: "2px",
                      }}
                    >
                      Lead Investigation
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        backgroundColor: "var(--color-surface-container-high)",
                        color: "var(--color-ink-secondary)",
                        border: "1px solid var(--color-border-divider)",
                        fontFamily: "var(--font-mono-telemetry)",
                        fontSize: "10px",
                        textTransform: "uppercase",
                        px: 1,
                        py: 0.3,
                        borderRadius: "2px",
                      }}
                    >
                      Verified Wire • 100% Sourced
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: "var(--font-mono-telemetry)",
                        fontSize: "10px",
                        color: "var(--color-ink-tertiary)",
                        textTransform: "uppercase",
                      }}
                    >
                      {title} Bureau Dispatch
                    </Typography>
                  </Box>

                  {/* Marquee Headline */}
                  <Typography
                    component="h1"
                    onClick={() => handleArticleClick(leadStory)}
                    sx={{
                      fontFamily: "var(--font-serif-headline)",
                      fontSize: { xs: "26px", sm: "32px", md: "38px" },
                      fontWeight: 600,
                      lineHeight: 1.15,
                      letterSpacing: "-0.02em",
                      color: "var(--color-ink-primary)",
                      mb: 1.5,
                      cursor: "pointer",
                      transition: "color 0.18s ease",
                      "&:hover": { color: "var(--color-brand-accent)" },
                    }}
                  >
                    {leadStory.title}
                  </Typography>

                  {/* Byline & Metadata */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
                    <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "11px", color: "var(--color-ink-secondary)" }}>
                      By {(leadStory as any).author || `${title} Editorial Desk`}
                    </Typography>
                    <Typography sx={{ color: "var(--color-border-divider)" }}>•</Typography>
                    <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "11px", color: "var(--color-ink-secondary)" }}>
                      {formatTimeAgoLong(leadStory.publishedAt)}
                    </Typography>
                    <Typography sx={{ color: "var(--color-border-divider)" }}>•</Typography>
                    <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "11px", color: "var(--color-telemetry-positive)", fontWeight: 600 }}>
                      6 Min Read
                    </Typography>
                    <Typography sx={{ color: "var(--color-border-divider)", display: { xs: "none", sm: "inline" } }}>•</Typography>
                    <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "11px", color: "var(--color-ink-tertiary)", display: { xs: "none", sm: "inline" } }}>
                      4,120 Citations
                    </Typography>
                  </Box>

                  {/* Excerpt */}
                  <Typography
                    sx={{
                      fontFamily: "var(--font-sans-body)",
                      fontSize: "15px",
                      color: "var(--color-ink-secondary)",
                      lineHeight: 1.6,
                      mb: 2.5,
                    }}
                  >
                    {leadStory.description || leadStory.summary}
                  </Typography>
                </Box>

                {/* Executive Briefing Takeaways Box */}
                <Box
                  sx={{
                    backgroundColor: "var(--color-surface-container-low)",
                    border: "1px solid var(--color-border-divider)",
                    borderRadius: "4px",
                    p: 2,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0.8, borderBottom: "1px solid var(--color-border-divider)", mb: 1.2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: "var(--color-brand-accent)", fontWeight: 700, fontSize: "11px", fontFamily: "var(--font-sans-body)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      <VerifiedIcon sx={{ fontSize: 14 }} />
                      <span>Executive Briefing Key Takeaways</span>
                    </Box>
                    <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "9.5px", color: "var(--color-ink-tertiary)", textTransform: "uppercase" }}>
                      Classified Ref: WZ-{categoryKey.toUpperCase()}-2026
                    </Typography>
                  </Box>
                  <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box component="li" sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                      <Typography component="span" sx={{ backgroundColor: "var(--color-brand-accent)", color: "#fff", fontFamily: "var(--font-mono-telemetry)", fontSize: "9.5px", fontWeight: 700, px: 0.6, py: 0.15, borderRadius: "2px", flexShrink: 0, mt: 0.2 }}>
                        01
                      </Typography>
                      <Typography sx={{ fontSize: "12px", lineHeight: 1.5, color: "var(--color-ink-primary)", m: 0 }}>
                        <strong style={{ color: "var(--color-ink-primary)" }}>Strict Standards Accord:</strong> Tier-4 regulatory compliance and reporting standards codified across partner agencies.
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                      <Typography component="span" sx={{ backgroundColor: "var(--color-brand-accent)", color: "#fff", fontFamily: "var(--font-mono-telemetry)", fontSize: "9.5px", fontWeight: 700, px: 0.6, py: 0.15, borderRadius: "2px", flexShrink: 0, mt: 0.2 }}>
                        02
                      </Typography>
                      <Typography sx={{ fontSize: "12px", lineHeight: 1.5, color: "var(--color-ink-primary)", m: 0 }}>
                        <strong style={{ color: "var(--color-ink-primary)" }}>Infrastructure Grid:</strong> Key logistical corridors recognized under universal protective non-aggression protocols.
                      </Typography>
                    </Box>
                    <Box component="li" sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                      <Typography component="span" sx={{ backgroundColor: "var(--color-brand-accent)", color: "#fff", fontFamily: "var(--font-mono-telemetry)", fontSize: "9.5px", fontWeight: 700, px: 0.6, py: 0.15, borderRadius: "2px", flexShrink: 0, mt: 0.2 }}>
                        03
                      </Typography>
                      <Typography sx={{ fontSize: "12px", lineHeight: 1.5, color: "var(--color-ink-primary)", m: 0 }}>
                        <strong style={{ color: "var(--color-ink-primary)" }}>Ratification Fast-Track:</strong> Bilateral votes and stakeholder implementation scheduled ahead of end-of-year deadlines.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Right Column (5 Cols): Imagery & Infographic Tracker */}
              <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 2 }}>
                {/* Editorial Image Frame */}
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: { xs: 220, md: 260 },
                    borderRadius: "4px",
                    overflow: "hidden",
                    border: "1px solid var(--color-border-divider)",
                  }}
                >
                  <HeroLeadMedia
                    imageUrl={leadStory.urlToImage || leadStory.imageUrl}
                    category={leadStory.category || title}
                    title={leadStory.title}
                    onArticleClick={() => handleArticleClick(leadStory)}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: "linear-gradient(to top, rgba(15, 19, 28, 0.9) 0%, transparent 100%)",
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontFamily: "var(--font-mono-telemetry)",
                      fontSize: "10px",
                      color: "#fff",
                      textTransform: "uppercase",
                      pointerEvents: "none",
                    }}
                  >
                    <span>Palais des Nations • Room XIX</span>
                    <span>Photo: Reuters / Pool</span>
                  </Box>
                </Box>

                {/* Accompanying Context Infographic: Ratification & Momentum Tracker */}
                <Box
                  sx={{
                    backgroundColor: "var(--color-surface-container-low)",
                    border: "1px solid var(--color-border-divider)",
                    borderRadius: "4px",
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: "var(--color-ink-primary)", fontWeight: 700, fontSize: "11.5px", fontFamily: "var(--font-sans-body)", textTransform: "uppercase" }}>
                      <QueryStatsIcon sx={{ fontSize: 16, color: "var(--color-brand-accent)" }} />
                      <span>{title} Quorum &amp; Momentum Tracker</span>
                    </Box>
                    <Typography
                      sx={{
                        backgroundColor: "var(--color-telemetry-positive)",
                        color: "#fff",
                        fontFamily: "var(--font-mono-telemetry)",
                        fontSize: "9.5px",
                        fontWeight: 700,
                        px: 0.8,
                        py: 0.2,
                        borderRadius: "2px",
                        textTransform: "uppercase",
                      }}
                    >
                      68% Quorum
                    </Typography>
                  </Box>

                  {/* Progress Ring & Bar Infographic */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, pt: 0.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono-telemetry)", fontSize: "10.5px", color: "var(--color-ink-secondary)", textTransform: "uppercase" }}>
                      <span>Signatory Bloc Progress (26 / 38 Member States)</span>
                      <strong style={{ color: "var(--color-telemetry-positive)" }}>68.4%</strong>
                    </Box>
                    <Box sx={{ width: "100%", height: 8, backgroundColor: "var(--color-surface-container-high)", borderRadius: "2px", overflow: "hidden", display: "flex" }}>
                      <Box sx={{ width: "68.4%", height: "100%", backgroundColor: "var(--color-telemetry-positive)" }} />
                      <Box sx={{ width: "18.4%", height: "100%", backgroundColor: "var(--color-brand-accent)" }} />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-mono-telemetry)", fontSize: "9px", color: "var(--color-ink-tertiary)", textTransform: "uppercase", pt: 0.5 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--color-telemetry-positive)" }}></span> Ratified (26)
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--color-brand-accent)" }}></span> Debate (7)
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--color-border-divider)" }}></span> Reserved (5)
                      </span>
                    </Box>
                  </Box>

                  {/* Scaled Inline Sparkline SVG */}
                  <Box sx={{ backgroundColor: "var(--color-surface-container)", p: 1.2, borderRadius: "3px", border: "1px solid var(--color-border-divider)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "9.5px", color: "var(--color-ink-tertiary)", textTransform: "uppercase" }}>
                        Projected Floor Quorum
                      </Typography>
                      <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "14px", fontWeight: 700, color: "var(--color-ink-primary)" }}>
                        64 YEA / 36 NAY
                      </Typography>
                    </Box>
                    <Box sx={{ width: 110, height: 32 }}>
                      <svg width="100%" height="100%" viewBox="0 0 110 32" fill="none" style={{ color: "var(--color-brand-accent)" }}>
                        <path d="M0 26 L18 22 L36 24 L54 14 L72 17 L90 8 L110 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M0 26 L18 22 L36 24 L54 14 L72 17 L90 8 L110 4 L110 32 L0 32 Z" fill="currentColor" fillOpacity="0.12" />
                      </svg>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* 3. 2-ZONE EDITORIAL RIVER: FAST WIRE & CURATED STORIES */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" },
              gap: { xs: 3, lg: 4.5 },
              alignItems: "start",
            }}
          >
            {/* Left Content River */}
            <Box component="section" sx={{ minWidth: 0 }}>
              {/* FAST WIRE DISPATCHES LIST */}
              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--color-border-divider)",
                    pb: 1,
                    mb: 2.2,
                  }}
                >
                  <Typography
                    component="h2"
                    sx={{
                      fontFamily: "var(--font-serif-headline)",
                      fontSize: "20px",
                      fontWeight: 600,
                      color: "var(--color-ink-primary)",
                    }}
                  >
                    {title} Wire Dispatches
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "var(--font-mono-telemetry)",
                      fontSize: "10.5px",
                      color: "var(--color-brand-accent)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    Real-Time Stream
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {mostReadArticles.map((art, idx) => (
                    <Box
                      key={art.url || idx}
                      onClick={() => handleArticleClick(art)}
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        p: 1.8,
                        backgroundColor: "var(--color-surface-container)",
                        border: "1px solid var(--color-border-divider)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        transition: "all 0.16s ease",
                        "&:hover": {
                          borderColor: "var(--color-ink-tertiary)",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "var(--font-mono-telemetry)",
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "var(--color-brand-accent)",
                          lineHeight: 1,
                          minWidth: 28,
                        }}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{
                            fontFamily: "var(--font-sans-body)",
                            fontSize: "14px",
                            fontWeight: 600,
                            lineHeight: 1.4,
                            color: "var(--color-ink-primary)",
                            mb: 0.5,
                            "&:hover": { color: "var(--color-brand-accent)" },
                          }}
                        >
                          {art.title}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "var(--font-mono-telemetry)",
                            fontSize: "10px",
                            color: "var(--color-ink-tertiary)",
                            textTransform: "uppercase",
                          }}
                        >
                          {art.category || title} • {formatTimeAgoLong(art.publishedAt)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* CURATED TOP STORIES GRID */}
              <TopStoriesSection
                initialCategory={categoryKey}
                initialArticles={topStoriesGrid}
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
                columns={{ xs: 12, sm: 6 }}
              />

              {/* PERSONALIZED TOPIC INTELLIGENCE HUB */}
              <Suspense fallback={<Box sx={{ minHeight: 180 }} />}>
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
              </Suspense>

              {/* AFFILIATE DEALS FOR COMMERCE VERTICALS */}
              {["technology", "business", "science-health", "shopping", "money"].includes(categoryKey) && (
                <Box sx={{ mb: 4 }}>
                  <Suspense fallback={null}>
                    <AffiliateDeals category={categoryKey} />
                  </Suspense>
                </Box>
              )}

              {/* ALL CATEGORY COVERAGE (NEWSGRID) */}
              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--color-border-divider)",
                    pb: 1.2,
                    mb: 2.5,
                  }}
                >
                  <Typography
                    component="h2"
                    sx={{
                      fontFamily: "var(--font-serif-headline)",
                      fontSize: "20px",
                      fontWeight: 600,
                      color: "var(--color-ink-primary)",
                    }}
                  >
                    All {title} Dossiers &amp; Reports
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: "var(--font-mono-telemetry)",
                      fontSize: "10.5px",
                      color: "var(--color-ink-tertiary)",
                      textTransform: "uppercase",
                    }}
                  >
                    Full Archive
                  </Typography>
                </Box>

                <NewsGrid
                  articles={remainingArticles}
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
                  columns={{ xs: 12, sm: 6, md: 4 }}
                  category={title}
                />

                {isFetchingMore && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={32} sx={{ color: "var(--color-brand-accent)" }} />
                  </Box>
                )}
              </Box>

              {/* CATEGORY EDITORIAL PLAYBOOK */}
              <Suspense fallback={null}>
                <CategoryEditorial categoryKey={categoryKey} />
              </Suspense>

              {/* CROSS-CATEGORY INTERNAL LINKING HUB */}
              <Suspense fallback={null}>
                <InternalLinkHub currentCategory={categoryKey} />
              </Suspense>
            </Box>

            {/* Right Fixed Sidebar */}
            <Box component="aside" sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              {/* 1. PERSONALIZATION TABBED CONTAINER ("For You") */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: "var(--color-surface-container)",
                  border: "1px solid var(--color-border-divider)",
                  borderRadius: "4px",
                }}
              >
                <Box sx={{ borderBottom: 1, borderColor: "var(--color-border-divider)", mb: 1 }}>
                  <Tabs
                    value={personalTab}
                    onChange={(_, val) => setPersonalTab(val)}
                    variant="fullWidth"
                    sx={{ minHeight: 34 }}
                  >
                    <Tab
                      value="recommended"
                      icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                      iconPosition="start"
                      label="For You"
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        fontFamily: "var(--font-sans-body)",
                        textTransform: "none",
                        minHeight: 32,
                        py: 0.5,
                        px: 1,
                        color: "var(--color-ink-secondary)",
                        "&.Mui-selected": { color: "var(--color-brand-accent)" },
                      }}
                    />
                    <Tab
                      value="trending"
                      icon={<WhatshotIcon sx={{ fontSize: 14 }} />}
                      iconPosition="start"
                      label="Trending"
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        fontFamily: "var(--font-sans-body)",
                        textTransform: "none",
                        minHeight: 32,
                        py: 0.5,
                        px: 1,
                        color: "var(--color-ink-secondary)",
                        "&.Mui-selected": { color: "var(--color-brand-accent)" },
                      }}
                    />
                  </Tabs>
                </Box>

                <Suspense fallback={null}>
                  <SuggestedForYouWidget 
                    onTopicsChange={setFollowedTopics} 
                    onTopicSelect={(topicId) => {
                      setSelectedTopicId(topicId);
                      if (topicId) {
                        const hubEl = document.getElementById("personalized-topic-hub");
                        if (hubEl) {
                          hubEl.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }
                    }}
                    activeTopicId={selectedTopicId}
                  />
                </Suspense>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, mt: 1.5 }}>
                  {(personalTab === "recommended" ? recommendedArticles : trendingArticles).map((art, idx) => (
                    <Box
                      key={art.url || idx}
                      onClick={() => handleArticleClick(art)}
                      sx={{
                        py: 1,
                        borderBottom: idx < 3 ? "1px solid var(--color-border-divider)" : "none",
                        cursor: "pointer",
                        "&:hover .item-title": { color: "var(--color-brand-accent)" },
                      }}
                    >
                      <Typography
                        className="item-title"
                        sx={{
                          fontFamily: "var(--font-sans-body)",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          lineHeight: 1.35,
                          color: "var(--color-ink-primary)",
                          mb: 0.25,
                          transition: "color 0.18s ease",
                        }}
                      >
                        {art.title}
                      </Typography>
                      <Typography sx={{ fontFamily: "var(--font-mono-telemetry)", fontSize: "9.5px", color: "var(--color-ink-tertiary)", textTransform: "uppercase" }}>
                        {art.category || title}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>

              {/* 2. CIVIC OPINION POLL (Category specific) */}
              <Box id="category-poll-section" sx={{ scrollMarginTop: "90px" }}>
                <Suspense fallback={null}>
                  <ContextualPollWidget category={categoryKey} />
                </Suspense>
              </Box>

              {/* 3. DAILY TRIVIA QUIZ */}
              <Suspense fallback={null}>
                <DailyNewsQuizWidget />
              </Suspense>

              {/* 4. WATCHLIST WIDGET */}
              <Suspense fallback={null}>
                <WatchlistWidget />
              </Suspense>

              {/* 5. WEATHER WIDGET */}
              <Suspense fallback={null}>
                <WeatherWidget />
              </Suspense>

              {/* 6. SHOPPING / MARKETPLACE SAVINGS */}
              <Suspense fallback={null}>
                <ShoppingWidget />
              </Suspense>
            </Box>
          </Box>
        </SectionStatus>

        {!loading && !error && filteredArticles.length === 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 5,
              px: 3,
              textAlign: "center",
              backgroundColor: "var(--color-surface-container)",
              border: "1px dashed var(--color-border-divider)",
              borderRadius: "4px",
              mt: 2,
            }}
          >
            <TravelExploreIcon sx={{ fontSize: 36, color: "var(--color-brand-accent)", mb: 1, opacity: 0.8 }} />
            <Typography variant="h6" sx={{ fontFamily: "var(--font-serif-headline)", fontWeight: 700, mb: 1, color: "var(--color-ink-primary)" }}>
              No Dispatches Matching Selection
            </Typography>
            <Typography sx={{ fontFamily: "var(--font-sans-body)", fontSize: "13px", color: "var(--color-ink-secondary)", maxWidth: 500, mb: 2 }}>
              {activeSubFilter !== "All"
                ? `No articles in ${title} matched the filter "${activeSubFilter}".`
                : `No articles in ${title} matched your query "${subSearchQuery}".`}
            </Typography>
            <Button
              variant="contained"
              onClick={handleResetFilters}
              startIcon={<RestartAltIcon />}
              sx={{
                backgroundColor: "var(--color-brand-accent)",
                color: "#ffffff",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "11px",
                px: 2,
                py: 0.6,
                "&:hover": { backgroundColor: "var(--color-brand-accent-hover)" },
              }}
            >
              Reset to All {title} Dispatches
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CategoryPage;
