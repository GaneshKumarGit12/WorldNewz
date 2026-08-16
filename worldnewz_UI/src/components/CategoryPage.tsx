import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext, Link as RouterLink, useNavigate } from "react-router-dom";
import type { Article } from "../types";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import VerifiedIcon from "@mui/icons-material/Verified";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WhatshotIcon from "@mui/icons-material/Whatshot";

import NewsGrid from "./NewsGrid";
import SectionStatus from "./SectionStatus";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";
import { deduplicateArticles } from "../utils/deduplicate";
import { formatTimeAgoLong } from "../utils/formatTime";
import { AffiliateDeals } from "./AffiliateDeals";
import { CategoryEditorial } from "./CategoryEditorial";
import { SuggestedForYouWidget } from "./SuggestedForYouWidget";
import { PersonalizedTopicHub } from "./PersonalizedTopicHub";
import { TopStoriesSection } from "./TopStoriesSection";
import { ShoppingWidget } from "./ShoppingWidget";
import { WatchlistWidget } from "./WatchlistWidget";
import { WeatherWidget } from "./WeatherWidget";
import { HeroLeadMedia } from "./common/HeroLeadMedia";
import { getCategoryFallbackArticles, fallbackDiscoverArticles } from "../utils/fallbackArticles";

interface CategoryPageProps {
  categoryKey: string;
  title: string;
  emoji: string;
  keywords: string[];
  fetchApi: (params: { page: number; pageSize: number }) => Promise<any>;
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
  
  const defaultTopicForCategory = useMemo(() => {
    const key = (categoryKey || "").toLowerCase();
    if (key.includes("movie") || key.includes("entertainment")) return "top-movies";
    if (key.includes("game") || key.includes("gaming")) return "top-gaming";
    if (key.includes("stock") || key.includes("money") || key.includes("business")) return "top-stocks";
    return "top-ai";
  }, [categoryKey]);

  const [selectedTopicId, setSelectedTopicId] = useState<string>(defaultTopicForCategory);

  useEffect(() => {
    setSelectedTopicId(defaultTopicForCategory);
  }, [defaultTopicForCategory]);
  
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

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredArticles = useMemo(() => {
    return normalizedSearchTerm
      ? articles.filter((a) =>
          `${a.title} ${a.description ?? ""}`.toLowerCase().includes(normalizedSearchTerm)
        )
      : articles;
  }, [articles, normalizedSearchTerm]);

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
    return filteredArticles.filter((art) =>
      followedTopics.some(
        (t) =>
          (art.category && art.category.toLowerCase().includes(t.toLowerCase())) ||
          (art.title && art.title.toLowerCase().includes(t.toLowerCase()))
      )
    ).slice(0, 5);
  }, [filteredArticles, followedTopics]);

  const trendingArticles = useMemo(() => filteredArticles.slice(5, 10), [filteredArticles]);

  const loadData = (currentPage: number) => {
    if (currentPage === 1) setLoading(true);
    else setIsFetchingMore(true);

    fetchApi({ page: currentPage, pageSize: 20 })
      .then((res) => {
        const data = Array.isArray(res.data?.articles) ? res.data.articles : [];
        const formattedData = data.map((a: any) => ({
          ...a,
          imageUrl: a.urlToImage || a.image || a.imageUrl,
          category: a.category || title,
        }));
        
        if (formattedData.length === 0) {
          if (currentPage === 1) {
            setArticles(getCategoryFallbackArticles(title));
            setHasMore(false);
          } else {
            setHasMore(false);
          }
        } else if (formattedData.length < 5 && currentPage === 1) {
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
        console.warn(`Category API request failed for ${title}, using curated fallback articles:`, err);
        if (currentPage === 1) {
          setArticles(getCategoryFallbackArticles(title));
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

  const handlePlayGamesClick = () => {
    navigate("/play-games");
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

  return (
    <Box sx={{ width: "100%", backgroundColor: "var(--paper)", minHeight: "100vh", py: { xs: 2, md: 4 } }}>
      <SEOMeta
        title={`${title} News (${todayDate}) — WorldNewzs`}
        description={`${descriptionToUse} (Updated ${todayDate})`}
        keywords={combinedKeywords}
        canonical={`https://worldnewzs.in/${categoryKey}`}
      />
      
      <JSONLDBreadcrumb crumbs={[
        { name: "Home", url: "https://worldnewzs.in" },
        { name: title, url: `https://worldnewzs.in/${categoryKey}` }
      ]} />

      <Box
        className="wrap"
        sx={{
          maxWidth: "1240px",
          margin: "0 auto",
          px: { xs: 2, md: 3.5 },
        }}
      >
        {/* --- Category Banner & Verification Status --- */}
        <Box sx={{ mb: 3, pb: 2, borderBottom: "1px solid var(--line)" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 1 }}>
            <Typography
              sx={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--red)",
              }}
            >
              Edition No. 4,821 · {title} Desk · Source Verification Active
            </Typography>

            <Chip 
              icon={<VerifiedIcon sx={{ fontSize: "14px !important" }} />}
              label="Source Verification Active" 
              variant="outlined"
              size="small"
              sx={{ 
                fontFamily: "var(--mono)",
                fontSize: "10.5px",
                fontWeight: 600,
                color: "var(--gold)",
                borderColor: "var(--gold)",
                borderRadius: "2px",
              }}
            />
          </Box>

          <Typography
            component="h1"
            sx={{
              fontFamily: "var(--serif)",
              fontSize: { xs: "28px", sm: "36px", md: "40px" },
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              mb: 1,
            }}
          >
            {emoji} {title}
          </Typography>

          <Typography
            sx={{
              fontFamily: "var(--sans)",
              fontSize: { xs: "14px", sm: "15px" },
              color: "var(--slate)",
              lineHeight: 1.6,
              maxWidth: 900,
            }}
          >
            {description}
          </Typography>
        </Box>

        {/* --- 2-ZONE EDITORIAL RIVER LAYOUT --- */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" },
            gap: { xs: 3, lg: 5.5 },
            alignItems: "start",
          }}
        >
          {/* ================= LEFT MAIN EDITORIAL RIVER ================= */}
          <Box component="section" sx={{ minWidth: 0 }}>
            <SectionStatus 
              loading={loading} 
              error={error} 
              hasData={filteredArticles.length > 0}
              emptyText={normalizedSearchTerm ? "No results matching your search query." : `No articles currently available in ${title}.`}
            >
              {/* 1. HERO LEAD STORY & MOST READ RAIL */}
              {leadStory && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1.65fr 1fr" },
                    gap: 3.5,
                    pb: 4,
                    mb: 4,
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  {/* Lead Story */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      "&:hover .lead-title": { color: "var(--red-deep)" },
                    }}
                  >
                    <HeroLeadMedia
                      imageUrl={leadStory.urlToImage || leadStory.imageUrl}
                      category={leadStory.category || title}
                      title={leadStory.title}
                      onArticleClick={() => handleArticleClick(leadStory)}
                    />

                    <Box
                      onClick={() => handleArticleClick(leadStory)}
                      sx={{ cursor: "pointer" }}
                    >
                      <Typography
                        className="eyebrow"
                        sx={{
                          fontFamily: "var(--mono)",
                          fontSize: "11px",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--red)",
                          mb: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        Featured Lead · {leadStory.category || title}
                      </Typography>

                    <Typography
                      className="lead-title"
                      component="h2"
                      sx={{
                        fontFamily: "var(--serif)",
                        fontSize: { xs: "24px", sm: "30px", md: "34px" },
                        fontWeight: 700,
                        lineHeight: 1.15,
                        letterSpacing: "-0.015em",
                        color: "var(--text)",
                        mb: 1.5,
                        transition: "color 0.2s ease",
                      }}
                    >
                      {leadStory.title}
                    </Typography>

                    <Typography
                      sx={{
                        fontFamily: "var(--serif)",
                        fontStyle: "italic",
                        fontSize: "16px",
                        color: "var(--slate)",
                        lineHeight: 1.55,
                        mb: 2,
                      }}
                    >
                      {leadStory.description || leadStory.summary}
                    </Typography>

                    <Typography
                      sx={{
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        color: "var(--slate-light)",
                      }}
                    >
                      By {(leadStory as any).author || "Editorial Desk"} · {formatTimeAgoLong(leadStory.publishedAt)}
                    </Typography>
                    </Box>
                  </Box>

                  {/* Most Read Rail */}
                  <Box
                    sx={{
                      borderLeft: { xs: "none", md: "1px solid var(--line)" },
                      pl: { xs: 0, md: 3 },
                      pt: { xs: 2, md: 0 },
                      borderTop: { xs: "1px solid var(--line)", md: "none" },
                    }}
                  >
                    <Box
                      className="section-head"
                      sx={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        borderBottom: "1px solid var(--line)",
                        pb: 1,
                        mb: 2.5,
                      }}
                    >
                      <Typography
                        component="h2"
                        sx={{
                          fontFamily: "var(--serif)",
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "var(--text)",
                        }}
                      >
                        Top Stories
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          fontFamily: "var(--mono)",
                          fontSize: "10.5px",
                          color: "var(--slate-light)",
                        }}
                      >
                        Most Read
                      </Typography>
                    </Box>

                    {mostReadArticles.map((art, idx) => (
                      <Box
                        key={art.url || idx}
                        onClick={() => handleArticleClick(art)}
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 2,
                          mb: 2.2,
                          pb: 2,
                          borderBottom: idx < mostReadArticles.length - 1 ? "1px solid var(--line-soft)" : "none",
                          cursor: "pointer",
                          "&:hover .rail-title": { color: "var(--red)" },
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "var(--serif)",
                            fontSize: "26px",
                            fontWeight: 700,
                            color: "var(--gold)",
                            lineHeight: 1,
                            minWidth: 22,
                          }}
                        >
                          {idx + 1}
                        </Typography>
                        <Box>
                          <Typography
                            className="rail-title"
                            sx={{
                              fontFamily: "var(--sans)",
                              fontSize: "13.5px",
                              fontWeight: 600,
                              lineHeight: 1.35,
                              color: "var(--text)",
                              mb: 0.5,
                              transition: "color 0.2s ease",
                            }}
                          >
                            {art.title}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: "var(--mono)",
                              fontSize: "10.5px",
                              color: "var(--slate-light)",
                            }}
                          >
                            {art.category || title} · {formatTimeAgoLong(art.publishedAt)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* 2. TOP STORIES WITH SELECTION & MULTI-API AGGREGATION */}
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

              {/* 3. PERSONALIZED TOPIC INTELLIGENCE HUB (DRIVEN BY TOPIC SELECTIONS) */}
              <PersonalizedTopicHub
                initialTopicId={selectedTopicId}
                followedTopicIds={followedTopics}
                onToggleFollow={(id) => {
                  setFollowedTopics((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  );
                }}
              />

              {/* 4. AFFILIATE DEALS FOR COMMERCE CATEGORIES */}
              {["technology", "business", "science-health", "shopping", "money"].includes(categoryKey) && (
                <Box sx={{ mb: 5 }}>
                  <AffiliateDeals category={categoryKey} />
                </Box>
              )}

              {/* 5. FULL CATEGORY FEED (NEWSGRID WITH LAYOUT CONTAINMENT) */}
              <Box sx={{ mb: 4 }}>
                <Box
                  className="section-head"
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--line)",
                    pb: 1.2,
                    mb: 3,
                  }}
                >
                  <Typography
                    component="h2"
                    sx={{
                      fontFamily: "var(--serif)",
                      fontSize: "22px",
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    All {title} Coverage
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
                    <CircularProgress size={36} sx={{ color: "var(--red)" }} />
                  </Box>
                )}
              </Box>

              {/* 6. CATEGORY SPECIFIC EDITORIAL PLAYBOOK */}
              <CategoryEditorial categoryKey={categoryKey} />
            </SectionStatus>
          </Box>

          {/* ================= RIGHT FIXED SIDEBAR ================= */}
          <Box component="aside" sx={{ display: "flex", flexDirection: "column", gap: 3.5, minWidth: 0 }}>
            {/* 1. PERSONALIZATION TABBED CONTAINER ("For You") */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: "var(--paper-raise)",
                border: "1px solid var(--line)",
                borderRadius: "3px",
              }}
            >
              <Box sx={{ borderBottom: "1px solid var(--line)", pb: 1.5, mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: "var(--mono)",
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--red)",
                    }}
                  >
                    Personalization
                  </Typography>
                </Box>
                <Tabs
                  value={personalTab}
                  onChange={(_, val) => setPersonalTab(val)}
                  sx={{
                    minHeight: 32,
                    "& .MuiTabs-indicator": { backgroundColor: "var(--red)", height: 2 },
                  }}
                >
                  <Tab
                    value="recommended"
                    icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                    iconPosition="start"
                    label="For You"
                    sx={{
                      fontSize: "12.5px",
                      fontWeight: 600,
                      fontFamily: "var(--sans)",
                      textTransform: "none",
                      minHeight: 32,
                      py: 0.5,
                      px: 1,
                      color: "var(--slate)",
                      "&.Mui-selected": { color: "var(--text)" },
                    }}
                  />
                  <Tab
                    value="trending"
                    icon={<WhatshotIcon sx={{ fontSize: 14 }} />}
                    iconPosition="start"
                    label="Trending"
                    sx={{
                      fontSize: "12.5px",
                      fontWeight: 600,
                      fontFamily: "var(--sans)",
                      textTransform: "none",
                      minHeight: 32,
                      py: 0.5,
                      px: 1,
                      color: "var(--slate)",
                      "&.Mui-selected": { color: "var(--text)" },
                    }}
                  />
                </Tabs>
              </Box>

              <SuggestedForYouWidget 
                onTopicsChange={setFollowedTopics} 
                onTopicSelect={(topicId) => {
                  setSelectedTopicId(topicId);
                  const hubEl = document.getElementById("personalized-topic-hub");
                  if (hubEl) {
                    hubEl.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                activeTopicId={selectedTopicId}
              />

              <Box sx={{ mt: 2 }}>
                {(personalTab === "recommended" ? recommendedArticles : trendingArticles).map((art, idx) => (
                  <Box
                    key={art.url || idx}
                    onClick={() => handleArticleClick(art)}
                    sx={{
                      py: 1,
                      borderBottom: idx < 3 ? "1px solid var(--line-soft)" : "none",
                      cursor: "pointer",
                      "&:hover .item-title": { color: "var(--red)" },
                    }}
                  >
                    <Typography
                      className="item-title"
                      sx={{
                        fontFamily: "var(--sans)",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        lineHeight: 1.35,
                        color: "var(--text)",
                        mb: 0.25,
                      }}
                    >
                      {art.title}
                    </Typography>
                    <Typography sx={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--slate-light)" }}>
                      {art.category || title}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* 2. READER TOOLS (Quiz, Polls, Games) */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: "var(--paper-raise)",
                border: "1px solid var(--line)",
                borderRadius: "3px",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--slate-light)",
                  mb: 1.5,
                  pb: 1,
                  borderBottom: "1px solid var(--line-soft)",
                }}
              >
                Reader Utilities & Games
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography sx={{ fontFamily: "var(--sans)", fontSize: "13.5px", fontWeight: 600, mb: 0.5, color: "var(--text)" }}>
                    Daily News Quiz 🏆
                  </Typography>
                  <Typography sx={{ fontFamily: "var(--sans)", fontSize: "12px", color: "var(--slate)", mb: 1 }}>
                    Test your knowledge on today's headlines.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/badge-quiz"
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: "var(--line)",
                      color: "var(--text)",
                      fontSize: "11.5px",
                      textTransform: "none",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    Play Quiz →
                  </Button>
                </Box>

                <Box sx={{ pt: 1.5, borderTop: "1px solid var(--line-soft)" }}>
                  <Typography sx={{ fontFamily: "var(--sans)", fontSize: "13.5px", fontWeight: 600, mb: 0.5, color: "var(--text)" }}>
                    Community Opinion Poll 🗳️
                  </Typography>
                  <Typography sx={{ fontFamily: "var(--sans)", fontSize: "12px", color: "var(--slate)", mb: 1 }}>
                    Vote on active geopolitical and market questions.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/polls"
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: "var(--line)",
                      color: "var(--text)",
                      fontSize: "11.5px",
                      textTransform: "none",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    Vote in Poll →
                  </Button>
                </Box>

                <Box sx={{ pt: 1.5, borderTop: "1px solid var(--line-soft)" }}>
                  <Typography sx={{ fontFamily: "var(--sans)", fontSize: "13.5px", fontWeight: 600, mb: 0.5, color: "var(--text)" }}>
                    Arcade Games 🎮
                  </Typography>
                  <Button
                    onClick={handlePlayGamesClick}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: "var(--line)",
                      color: "var(--text)",
                      fontSize: "11.5px",
                      textTransform: "none",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    Open Arcade →
                  </Button>
                </Box>
              </Box>
            </Paper>

            {/* 3. MARKETPLACE PICKS (Sponsored) */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: "var(--paper-raise)",
                border: "1px solid var(--line)",
                borderRadius: "3px",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography
                  sx={{
                    fontFamily: "var(--sans)",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  Marketplace Picks
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "var(--mono)",
                    fontSize: "10px",
                    color: "var(--slate-light)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    backgroundColor: "var(--paper)",
                    px: 1,
                    py: 0.25,
                    borderRadius: "2px",
                  }}
                >
                  Sponsored
                </Typography>
              </Box>

              <ShoppingWidget />
            </Paper>

            {/* 4. WATCHLIST & WEATHER DATA WIDGETS */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: "var(--paper-raise)",
                border: "1px solid var(--line)",
                borderRadius: "3px",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--slate-light)",
                  mb: 1.5,
                }}
              >
                Market Watchlist
              </Typography>
              <WatchlistWidget />
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: "var(--paper-raise)",
                border: "1px solid var(--line)",
                borderRadius: "3px",
              }}
            >
              <WeatherWidget />
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CategoryPage;
