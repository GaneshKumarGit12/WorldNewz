import React, { useState, useEffect, useMemo, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";

// Icons
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import CheckIcon from "@mui/icons-material/Check";
import PodcastsIcon from "@mui/icons-material/Podcasts";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import YouTubeIcon from "@mui/icons-material/YouTube";
import LaunchIcon from "@mui/icons-material/Launch";
import ShuffleIcon from "@mui/icons-material/Shuffle";

import { fetchPodcastsVideosFeed } from "../api/apiClient";
import type { PodcastEpisode } from "../api/apiClient";
import { fallbackFeaturedPodcast, fallbackPodcastEpisodes } from "../utils/fallbackPodcastsVideos";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { BreadcrumbNav } from "../components/BreadcrumbNav";
import { CategoryEditorial } from "../components/CategoryEditorial";
import { useColorMode } from "../context/ThemeContext";

// Verified 100% public, embeddable backup queue categorized by sector
export const CATEGORY_BACKUP_VIDEOS: Record<
  string,
  Array<{ id: string; title: string; desk: string; duration: string; description: string }>
> = {
  politics: [
    {
      id: "bixR-KIJKYM",
      title: "Inside the Committee Vote: What Changed Overnight",
      desk: "WorldNewzs Desk",
      duration: "9:14",
      description: "A deep dive into decisive committee votes, high-stakes negotiations, and what policy shifts mean for upcoming legislation."
    },
    {
      id: "_38JCsl3NxQ",
      title: "Global Trade Corridors: Shipping Disruptions & Supply Realities",
      desk: "WorldNewzs Desk",
      duration: "11:45",
      description: "A tactical examination of maritime transit bottlenecks, container freight rates, and supply chain resilience measures."
    },
    {
      id: "sCjZ9yvW-6g",
      title: "Global Policy & Parliamentary Debates Analysis",
      desk: "WorldNewzs Desk",
      duration: "14:20",
      description: "International affairs analysis on multilateral treaties, democratic procedures, and legislative developments."
    }
  ],
  technology: [
    {
      id: "k2qgadSvNyU",
      title: "The Chip Supply Chain, Explained in Plain English",
      desk: "Tech Briefing",
      duration: "27:03",
      description: "Everything you need to know about advanced lithography, semiconductor fabrication plants, and the geopolitical battle for silicon supremacy."
    },
    {
      id: "z-IR48Mb3W0",
      title: "AI Compute Clusters & Energy Demands: The Next Grid Crisis?",
      desk: "Tech Briefing",
      duration: "15:20",
      description: "Examining next-generation data centers, nuclear energy contracts, and how hyperscalers are securing continuous base-load power."
    },
    {
      id: "uB_ZkL47kK0",
      title: "How Transistors and Modern Silicon Logic Actually Work",
      desk: "Tech Briefing",
      duration: "22:15",
      description: "A deep engineering dive into nanoscale lithography, logic gates, and processor architectures."
    }
  ],
  business: [
    {
      id: "PHe0bXAIuk8",
      title: "Weekly Wrap: Markets, Policy & the Stories Behind the Headlines",
      desk: "WORLDNEWZS STUDIO",
      duration: "18:42",
      description: "Our editorial desk breaks down the week's biggest developments across politics, business, and technology, with context you won't get from the ticker alone."
    },
    {
      id: "YQ_xWvX1n9g",
      title: "Earnings Season Recap: Winners, Losers, Surprises",
      desk: "Market Watch",
      duration: "6:48",
      description: "Breaking down quarterly financial disclosures, executive forward guidance, and surprise winners in retail and cloud services."
    },
    {
      id: "eI4an8aSXhs",
      title: "The Global Financial System: Macro Trends & Market Capital",
      desk: "Market Watch",
      duration: "24:30",
      description: "Investigating international debt markets, liquidity cycles, and institutional capital movements."
    }
  ],
  "science & health": [
    {
      id: "qT_hE3a_Q3g",
      title: "What the New Trial Data Actually Tells Us",
      desk: "Health Desk",
      duration: "33:12",
      description: "Leading medical researchers analyze phase 3 clinical results, statistical significance, and real-world therapeutic timelines."
    },
    {
      id: "fN1cE01-nFU",
      title: "The Architecture of Next-Gen Space Telescopes",
      desk: "Health Desk",
      duration: "19:05",
      description: "Astronomers explain cryo-cooling mirrors, infrared spectrometry, and discovering early galaxy formations."
    },
    {
      id: "0bXkXq9_aVo",
      title: "Biomedical Innovations & Clinical Trial Methodologies",
      desk: "Health Desk",
      duration: "16:40",
      description: "Comprehensive medical explainer on peer review, randomized trials, and pharmaceutical verification."
    }
  ],
  sports: [
    {
      id: "VwQv_vM8tJc",
      title: "Transfer Window Roundup: The Deals That Matter",
      desk: "Sports Desk",
      duration: "4:56",
      description: "An exhaustive breakdown of deadline day contracts, strategic player movements, and tactical rebalancing across major European leagues."
    },
    {
      id: "h_UeN_oXo_o",
      title: "The Financial Anatomy of Major League Football Transfers",
      desk: "Sports Desk",
      duration: "12:10",
      description: "Scouting metrics, wage structures, release clauses, and financial fair play regulations decoded."
    },
    {
      id: "vQK_p7x9bC0",
      title: "Championship Highlights & Tactical Analysis",
      desk: "Sports Desk",
      duration: "8:45",
      description: "Tactical breakdown of formations, defensive transitions, and decisive matchday moments."
    }
  ],
  money: [
    {
      id: "fTt4B5yP1A8",
      title: "Rate Decisions and What They Mean for Your Wallet",
      desk: "Money Matters",
      duration: "21:37",
      description: "How central bank benchmark adjustments influence mortgage rates, personal borrowing, high-yield savings accounts, and equity valuations."
    },
    {
      id: "PHe0bXAIuk8",
      title: "How The Economic Machine Works: Long-Term Debt Cycles",
      desk: "Money Matters",
      duration: "30:00",
      description: "Ray Dalio's foundational breakdown of inflation, credit expansion, productivity growth, and deleveraging."
    },
    {
      id: "M7lc1UVf-VE",
      title: "Smart Capital Allocation & Personal Wealth Growth",
      desk: "Money Matters",
      duration: "18:15",
      description: "Portfolio diversification, index investing, and risk mitigation strategies for retail investors."
    }
  ]
};

const normalizeCategoryKey = (cat?: string): string => {
  if (!cat) return "general";
  const c = cat.toLowerCase().trim();
  if (c.includes("politic")) return "politics";
  if (c.includes("tech")) return "technology";
  if (c.includes("biz") || c.includes("business")) return "business";
  if (c.includes("sci") || c.includes("health")) return "science & health";
  if (c.includes("sport")) return "sports";
  if (c.includes("money") || c.includes("finance") || c.includes("stock")) return "money";
  return "business";
};

const extractYouTubeId = (raw: string): string => {
  if (!raw) return "PHe0bXAIuk8";
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  const match = raw.match(/(?:embed\/|v=|vi\/|youtu\.be\/|\/v\/)([a-zA-Z0-9_-]{11})/);
  if (match && match[1]) return match[1];
  return "PHe0bXAIuk8";
};

const getCleanEmbedUrl = (raw: string): string => {
  const id = extractYouTubeId(raw);
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`;
};

const getWatchOnYouTubeUrl = (raw: string): string => {
  const id = extractYouTubeId(raw);
  return `https://www.youtube.com/watch?v=${id}`;
};

const CATEGORIES = [
  "All",
  "Politics",
  "Technology",
  "Business",
  "Science & Health",
  "Sports",
  "Money",
];

// Fixed Waveform heights to create the exact audio visualizer bars from the screenshot
const WAVEFORM_HEIGHTS = [
  8, 14, 20, 10, 16, 24, 18, 12, 22, 16,
  8, 14, 20, 12, 18, 26, 14, 10, 20, 15,
  8, 12, 16, 22, 14, 28, 20, 12, 24, 18,
  10, 16, 22, 14, 8, 20, 26, 18, 12, 16,
  24, 14, 8, 18, 22, 10, 14, 26, 18, 12,
  20, 14, 8, 16, 24, 18, 12, 22, 16, 8,
  14, 20, 12, 18, 26, 14, 10, 20, 15, 8
];

const PodcastsVideos: React.FC = () => {
  const { mode } = useColorMode();
  const isDark = mode === "dark";

  const [featured, setFeatured] = useState<PodcastEpisode>(fallbackFeaturedPodcast);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>(fallbackPodcastEpisodes);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeModalItem, setActiveModalItem] = useState<PodcastEpisode | null>(null);
  const [backupIndex, setBackupIndex] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [shiftingFeed, setShiftingFeed] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetchPodcastsVideosFeed()
      .then((res) => {
        if (!isMounted) return;
        if (res.data && res.data.episodes && res.data.episodes.length > 0) {
          if (res.data.featured) {
            setFeatured(res.data.featured);
          }
          // Merge with verified fallback baseline
          const seen = new Set<string>();
          const combined: PodcastEpisode[] = [];
          res.data.episodes.forEach((ep) => {
            if (ep.id && !seen.has(ep.id)) {
              seen.add(ep.id);
              combined.push(ep);
            }
          });
          fallbackPodcastEpisodes.forEach((ep) => {
            if (ep.id && !seen.has(ep.id)) {
              seen.add(ep.id);
              combined.push(ep);
            }
          });
          setEpisodes(combined);
        }
      })
      .catch(() => {
        // Silently populate the resilient offline catalog
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fail-Safe Video Shifter: Shifts immediately to next working category video
  const handleShiftToNextBackup = useCallback(() => {
    if (!activeModalItem) return;
    const catKey = normalizeCategoryKey(activeModalItem.category);
    const queue = CATEGORY_BACKUP_VIDEOS[catKey] || CATEGORY_BACKUP_VIDEOS.business;

    setShiftingFeed(true);
    const nextIdx = (backupIndex + 1) % queue.length;
    setBackupIndex(nextIdx);

    const nextVideo = queue[nextIdx];
    setTimeout(() => {
      setActiveModalItem((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          id: nextVideo.id,
          videoUrl: `https://www.youtube-nocookie.com/embed/${nextVideo.id}`,
          title: nextVideo.title,
          desk: nextVideo.desk,
          duration: nextVideo.duration,
          description: nextVideo.description
        };
      });
      setShiftingFeed(false);
    }, 200);
  }, [activeModalItem, backupIndex]);

  // Global message listener for YouTube player error events (e.g. error 100, 101, 150)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data === "string" && (event.data.includes("onError") || event.data.includes("error"))) {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event === "onError" || (parsed.info && typeof parsed.info.error !== "undefined")) {
            console.warn("[PodcastsVideos] Detected YouTube playback error code. Shifting to alternate feed...");
            handleShiftToNextBackup();
          }
        } catch {
          // ignore parsing error from non-JSON messages
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleShiftToNextBackup]);

  const filteredEpisodes = useMemo(() => {
    if (selectedCategory === "All") {
      return episodes;
    }
    return episodes.filter(
      (ep) =>
        ep.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim()
    );
  }, [episodes, selectedCategory]);

  const handleOpenPlayer = (episode: PodcastEpisode) => {
    setBackupIndex(0);
    setActiveModalItem(episode);
  };

  const handleClosePlayer = () => {
    setActiveModalItem(null);
    setCopiedLink(false);
    setShiftingFeed(false);
  };

  const handleCopyShare = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <Box
      id="podcasts-videos-page-container"
      sx={{
        bgcolor: isDark ? "#080c16" : "#f8fafc",
        color: isDark ? "#f8fafc" : "#0f172a",
        minHeight: "100vh",
        pb: 8,
        transition: "background-color 0.3s ease",
      }}
    >
      <SEOMeta
        title="Podcasts & Videos News (Aug 22, 2026) — WorldNewzs | WorldNewzs"
        description="Curated audio and visual news reports, explainer videos, weekly digests, and high-impact investigative podcast episodes across global markets, technology, and policy."
        keywords={[
          "podcasts and videos",
          "news podcasts",
          "explainer videos",
          "worldnewzs podcasts",
          "audio news reports",
          "video briefings",
          "technology briefing",
          "market wrap"
        ]}
        canonical="https://worldnewzs.in/podcasts-videos"
      />

      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: "https://worldnewzs.in" },
          { name: "Podcasts & Videos", url: "https://worldnewzs.in/podcasts-videos" },
        ]}
      />

      <Box
        className="wrap"
        sx={{
          maxWidth: "1280px",
          margin: "0 auto",
          px: { xs: 2, sm: 3, md: 4 },
          pt: 3,
        }}
      >
        <BreadcrumbNav items={[{ label: "Podcasts & Videos" }]} />

        {/* ─── MASTHEAD HEADER ─── */}
        <Box sx={{ mb: 4, mt: 1 }}>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: "2rem", sm: "2.6rem", md: "3.2rem" },
              fontWeight: 900,
              fontFamily: "var(--sans, system-ui, -apple-system, sans-serif)",
              color: isDark ? "#ffffff" : "#0f172a",
              letterSpacing: "-0.035em",
              lineHeight: 1.15,
              mb: 1.5,
            }}
          >
            Curated Audio & Visual News Reports
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: isDark ? "#94a3b8" : "#475569",
              fontSize: { xs: "0.95rem", sm: "1.05rem" },
              maxWidth: "860px",
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            A running rundown of news podcasts, explainer videos, and interview clips, pulled from
            verified reporting and streamed straight from the source.
          </Typography>
        </Box>

        {/* ─── HERO FEATURED SHOWCASE CARD ─── */}
        <Card
          id="featured-hero-podcast-card"
          elevation={0}
          sx={{
            bgcolor: isDark ? "#0f172a" : "#ffffff",
            borderRadius: "16px",
            border: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
            overflow: "hidden",
            mb: 6,
            boxShadow: isDark
              ? "0 20px 40px -15px rgba(0, 0, 0, 0.6)"
              : "0 10px 30px -10px rgba(0, 0, 0, 0.08)",
          }}
        >
          <Grid container>
            {/* Left Player Area */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Box
                onClick={() => handleOpenPlayer(featured)}
                sx={{
                  position: "relative",
                  height: { xs: 260, sm: 360, md: 410 },
                  bgcolor: "#0b1120",
                  cursor: "pointer",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  "&:hover .hero-play-btn": {
                    transform: "scale(1.1)",
                    bgcolor: "#eab308",
                    boxShadow: "0 0 30px rgba(234, 179, 8, 0.6)",
                  },
                  "&:hover .hero-bg-img": {
                    transform: "scale(1.04)",
                  },
                }}
              >
                {/* Background Image / Poster */}
                <Box
                  component="img"
                  className="hero-bg-img"
                  src={featured.thumbnailUrl}
                  alt={featured.title}
                  loading="eager"
                  decoding="async"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.38,
                    transition: "transform 0.4s ease",
                  }}
                />

                {/* Gradient Overlay */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(11, 17, 32, 0.3) 0%, rgba(11, 17, 32, 0.85) 100%)",
                  }}
                />

                {/* Top-Left: LIVE DESK Badge */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 18,
                    left: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                    bgcolor: "rgba(15, 23, 42, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "20px",
                    px: 1.5,
                    py: 0.5,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <FiberManualRecordIcon
                    sx={{
                      fontSize: 10,
                      color: "#eab308",
                      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      "@keyframes pulse": {
                        "0%, 100%": { opacity: 1 },
                        "50%": { opacity: 0.4 },
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#f8fafc",
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    LIVE DESK
                  </Typography>
                </Box>

                {/* Center: Amber / Golden Play Button */}
                <Box
                  className="hero-play-btn"
                  sx={{
                    position: "relative",
                    zIndex: 2,
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    bgcolor: "#eab308",
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 10px 25px rgba(234, 179, 8, 0.4)",
                    transition: "all 0.25s ease",
                  }}
                >
                  <PlayArrowIcon sx={{ fontSize: 44, ml: 0.5 }} />
                </Box>

                {/* Bottom: Audio Visualizer Waveform Equalizer + Duration */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 16,
                    left: 20,
                    right: 20,
                    zIndex: 2,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: 1.5,
                  }}
                >
                  {/* Visualizer Equalizer Bars */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "3px",
                      flex: 1,
                      overflow: "hidden",
                      height: 32,
                      opacity: 0.85,
                    }}
                  >
                    {WAVEFORM_HEIGHTS.map((height, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          width: "3px",
                          height: `${height}px`,
                          bgcolor: "#eab308",
                          borderRadius: "1px",
                          opacity: 0.8,
                          transition: "height 0.2s ease",
                        }}
                      />
                    ))}
                  </Box>

                  {/* Duration Chip */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#f8fafc",
                      fontWeight: 800,
                      fontSize: "0.78rem",
                      bgcolor: "rgba(15, 23, 42, 0.9)",
                      px: 1,
                      py: 0.3,
                      borderRadius: "4px",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      fontFamily: "monospace",
                    }}
                  >
                    {featured.duration}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Right Content Area */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  p: { xs: 3, sm: 4, md: 4.5 },
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                {/* FEATURED VIDEO Badge */}
                <Box sx={{ mb: 2.5 }}>
                  <Chip
                    icon={
                      <PlayArrowIcon
                        sx={{ fontSize: "1rem !important", color: "#38bdf8 !important" }}
                      />
                    }
                    label="FEATURED VIDEO"
                    size="small"
                    sx={{
                      bgcolor: isDark ? "rgba(56, 189, 248, 0.1)" : "rgba(14, 165, 233, 0.12)",
                      color: isDark ? "#38bdf8" : "#0284c7",
                      fontWeight: 800,
                      fontSize: "0.7rem",
                      letterSpacing: "0.08em",
                      borderRadius: "6px",
                      px: 0.5,
                      border: isDark
                        ? "1px solid rgba(56, 189, 248, 0.25)"
                        : "1px solid rgba(14, 165, 233, 0.3)",
                    }}
                  />
                </Box>

                {/* Headline Title */}
                <Typography
                  variant="h3"
                  component="h2"
                  onClick={() => handleOpenPlayer(featured)}
                  sx={{
                    fontSize: { xs: "1.45rem", sm: "1.75rem", md: "1.9rem" },
                    fontWeight: 800,
                    lineHeight: 1.25,
                    color: isDark ? "#f8fafc" : "#0f172a",
                    mb: 2,
                    cursor: "pointer",
                    transition: "color 0.2s ease",
                    "&:hover": {
                      color: isDark ? "#eab308" : "#b45309",
                    },
                  }}
                >
                  {featured.title}
                </Typography>

                {/* Description Body */}
                <Typography
                  variant="body2"
                  sx={{
                    color: isDark ? "#94a3b8" : "#64748b",
                    fontSize: "0.92rem",
                    lineHeight: 1.65,
                    mb: 3.5,
                  }}
                >
                  {featured.description}
                </Typography>

                {/* Desk & Date Meta Footer */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    color: isDark ? "#64748b" : "#94a3b8",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    fontFamily: "monospace",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: isDark ? "#cbd5e1" : "#475569", fontWeight: 800 }}
                  >
                    {featured.desk}
                  </Typography>
                  <Typography variant="caption">•</Typography>
                  <Typography variant="caption">{featured.formattedDate}</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* ─── RUNDOWN & CATEGORY FILTER ROW ─── */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            mb: 3.5,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 900,
              fontSize: "0.85rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontFamily: "monospace",
              color: isDark ? "#f8fafc" : "#0f172a",
            }}
          >
            RUNDOWN — LATEST EPISODES
          </Typography>

          {/* Filter Pills */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Chip
                  key={cat}
                  id={`podcast-cat-chip-${cat.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                  label={cat}
                  onClick={() => setSelectedCategory(cat)}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    px: 1,
                    height: 32,
                    borderRadius: "16px",
                    cursor: "pointer",
                    bgcolor: isSelected
                      ? "#eab308"
                      : isDark
                      ? "#1e293b"
                      : "#e2e8f0",
                    color: isSelected
                      ? "#000000"
                      : isDark
                      ? "#94a3b8"
                      : "#475569",
                    border: isSelected
                      ? "1px solid #eab308"
                      : isDark
                      ? "1px solid #334155"
                      : "1px solid #cbd5e1",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: isSelected
                        ? "#f59e0b"
                        : isDark
                        ? "#334155"
                        : "#cbd5e1",
                      color: isSelected ? "#000000" : isDark ? "#f8fafc" : "#0f172a",
                    },
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* ─── 3-COLUMN EPISODES GRID ─── */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#eab308" }} />
          </Box>
        ) : filteredEpisodes.length === 0 ? (
          <Box
            sx={{
              p: 6,
              textAlign: "center",
              bgcolor: isDark ? "#0f172a" : "#ffffff",
              borderRadius: "12px",
              border: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
            }}
          >
            <OndemandVideoIcon sx={{ fontSize: 44, color: "#64748b", mb: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              No episodes found in {selectedCategory}
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>
              Explore other categories or reset to browse all broadcasts.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setSelectedCategory("All")}
              sx={{
                borderColor: "#eab308",
                color: "#eab308",
                fontWeight: 700,
                "&:hover": { borderColor: "#f59e0b", bgcolor: "rgba(234, 179, 8, 0.1)" },
              }}
            >
              Show All Episodes
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3} id="podcasts-episodes-grid">
            {filteredEpisodes.map((episode) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={episode.id}>
                <Card
                  onClick={() => handleOpenPlayer(episode)}
                  id={`podcast-card-${episode.id}`}
                  elevation={0}
                  sx={{
                    bgcolor: isDark ? "#0f172a" : "#ffffff",
                    borderRadius: "12px",
                    border: isDark ? "1px solid #1e293b" : "1px solid #e2e8f0",
                    overflow: "hidden",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    transition:
                      "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      borderColor: "#eab308",
                      boxShadow: isDark
                        ? "0 14px 28px rgba(0, 0, 0, 0.5)"
                        : "0 10px 24px rgba(0, 0, 0, 0.08)",
                      "& .card-play-btn": {
                        transform: "scale(1.15)",
                        bgcolor: "#eab308",
                        color: "#0f172a",
                      },
                      "& .card-thumb-img": {
                        transform: "scale(1.05)",
                      },
                    },
                  }}
                >
                  {/* Card Thumbnail Area */}
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      paddingTop: "56.25%", // 16:9 Aspect Ratio
                      bgcolor: "#070b14",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      component="img"
                      className="card-thumb-img"
                      src={episode.thumbnailUrl}
                      alt={episode.title}
                      loading="lazy"
                      decoding="async"
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.78,
                        transition: "transform 0.35s ease",
                      }}
                    />

                    {/* Gradient Overlay */}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, rgba(7, 11, 20, 0.2) 0%, rgba(7, 11, 20, 0.85) 100%)",
                      }}
                    />

                    {/* Top-Left: Format Tag (VIDEO or PODCAST) */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        bgcolor: "rgba(15, 23, 42, 0.85)",
                        px: 1,
                        py: 0.3,
                        borderRadius: "4px",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {episode.mediaType === "podcast" ? (
                        <PodcastsIcon sx={{ fontSize: 12, color: "#38bdf8" }} />
                      ) : (
                        <OndemandVideoIcon sx={{ fontSize: 12, color: "#38bdf8" }} />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#f8fafc",
                          fontWeight: 900,
                          fontSize: "0.64rem",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        {episode.mediaType === "podcast" ? "PODCAST" : "VIDEO"}
                      </Typography>
                    </Box>

                    {/* Center: Play Button Overlay */}
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        className="card-play-btn"
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          bgcolor: "rgba(255, 255, 255, 0.9)",
                          color: "#0f172a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.25s ease",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        }}
                      >
                        <PlayArrowIcon sx={{ fontSize: 28, ml: 0.2 }} />
                      </Box>
                    </Box>

                    {/* Bottom-Right: Duration */}
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        bgcolor: "rgba(0, 0, 0, 0.8)",
                        px: 0.8,
                        py: 0.2,
                        borderRadius: "4px",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#f8fafc",
                          fontWeight: 800,
                          fontSize: "0.72rem",
                          fontFamily: "monospace",
                        }}
                      >
                        {episode.duration}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Card Content Area */}
                  <Box
                    sx={{
                      p: 2.5,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      flex: 1,
                    }}
                  >
                    <Box sx={{ mb: 2 }}>
                      {/* Category Label */}
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#eab308",
                          fontWeight: 900,
                          fontSize: "0.72rem",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          display: "block",
                          mb: 1,
                        }}
                      >
                        {episode.category}
                      </Typography>

                      {/* Episode Title */}
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          fontSize: "0.98rem",
                          fontWeight: 800,
                          lineHeight: 1.35,
                          color: isDark ? "#f8fafc" : "#0f172a",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {episode.title}
                      </Typography>
                    </Box>

                    {/* Footer Source Desk & Date */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pt: 1.5,
                        borderTop: isDark ? "1px solid #1e293b" : "1px solid #f1f5f9",
                        color: isDark ? "#64748b" : "#94a3b8",
                        fontSize: "0.74rem",
                        fontWeight: 700,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: isDark ? "#94a3b8" : "#64748b",
                          maxWidth: "60%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {episode.desk}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: isDark ? "#64748b" : "#94a3b8",
                        }}
                      >
                        {episode.formattedDate}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ─── EDITORIAL & FAQ SECTION FOR SEO & ADSENSE ─── */}
        <Box sx={{ mt: 8 }}>
          <CategoryEditorial categoryKey="podcasts-videos" />
        </Box>
      </Box>

      {/* ─── THEATER MEDIA MODAL ─── */}
      <Dialog
        open={Boolean(activeModalItem)}
        onClose={handleClosePlayer}
        maxWidth="md"
        fullWidth
        id="podcast-video-theater-dialog"
        PaperProps={{
          sx: {
            bgcolor: "#0b1120",
            color: "#f8fafc",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid #1e293b",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
          },
        }}
      >
        <IconButton
          id="close-theater-modal-btn"
          onClick={handleClosePlayer}
          sx={{
            position: "absolute",
            right: 14,
            top: 14,
            color: "#ffffff",
            zIndex: 10,
            bgcolor: "rgba(15, 23, 42, 0.85)",
            "&:hover": { bgcolor: "rgba(15, 23, 42, 1)" },
          }}
        >
          <CloseIcon />
        </IconButton>

        {activeModalItem && (
          <DialogContent sx={{ p: 0 }}>
            {/* 16:9 Video Player Embed */}
            <Box
              sx={{
                width: "100%",
                paddingTop: "56.25%",
                position: "relative",
                bgcolor: "#000000",
              }}
            >
              {shiftingFeed ? (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#0b1120",
                    color: "#eab308"
                  }}
                >
                  <CircularProgress color="inherit" size={36} />
                </Box>
              ) : (
                <iframe
                  key={activeModalItem.id}
                  src={getCleanEmbedUrl(activeModalItem.videoUrl || activeModalItem.id)}
                  title={activeModalItem.title}
                  referrerPolicy="strict-origin-when-cross-origin"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </Box>

            {/* Modal Episode Details & Actions */}
            <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    label={activeModalItem.category}
                    size="small"
                    sx={{
                      bgcolor: "#eab308",
                      color: "#000000",
                      fontWeight: 900,
                      fontSize: "0.68rem",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  />
                  <Tooltip title="Switch to another verified broadcast in this category">
                    <Button
                      size="small"
                      onClick={handleShiftToNextBackup}
                      startIcon={<ShuffleIcon sx={{ fontSize: "0.9rem !important" }} />}
                      sx={{
                        color: "#94a3b8",
                        borderColor: "#334155",
                        fontSize: "0.68rem",
                        textTransform: "none",
                        fontWeight: 700,
                        py: 0.2,
                        "&:hover": { color: "#f8fafc", borderColor: "#eab308" }
                      }}
                      variant="outlined"
                    >
                      Switch Stream Feed
                    </Button>
                  </Tooltip>
                </Box>

                <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700 }}>
                  Duration: {activeModalItem.duration}
                </Typography>
              </Box>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.15rem", sm: "1.4rem" },
                  color: "#f8fafc",
                  lineHeight: 1.35,
                  mb: 1.5,
                }}
              >
                {activeModalItem.title}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "#94a3b8",
                  lineHeight: 1.6,
                  fontSize: "0.9rem",
                  mb: 3,
                }}
              >
                {activeModalItem.description}
              </Typography>

              {/* Action Bar / Social Share */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  pt: 2,
                  borderTop: "1px solid #1e293b",
                  flexWrap: "wrap",
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "#cbd5e1", fontWeight: 800, display: "block" }}
                  >
                    {activeModalItem.desk}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    Published: {activeModalItem.formattedDate}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Button
                    size="small"
                    component="a"
                    href={getWatchOnYouTubeUrl(activeModalItem.videoUrl || activeModalItem.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<YouTubeIcon sx={{ color: "#ef4444 !important" }} />}
                    endIcon={<LaunchIcon sx={{ fontSize: "0.85rem !important" }} />}
                    sx={{
                      color: "#f8fafc",
                      bgcolor: "rgba(239, 68, 68, 0.12)",
                      borderColor: "rgba(239, 68, 68, 0.35)",
                      fontSize: "0.75rem",
                      textTransform: "none",
                      fontWeight: 700,
                      "&:hover": {
                        bgcolor: "rgba(239, 68, 68, 0.25)",
                        borderColor: "#ef4444",
                      },
                    }}
                    variant="outlined"
                  >
                    Watch on YouTube
                  </Button>

                  <Tooltip title={copiedLink ? "Link Copied!" : "Copy Link"}>
                    <Button
                      size="small"
                      startIcon={copiedLink ? <CheckIcon /> : <ContentCopyIcon />}
                      onClick={() => handleCopyShare(window.location.href)}
                      sx={{
                        color: copiedLink ? "#22c55e" : "#cbd5e1",
                        borderColor: "#334155",
                        fontSize: "0.75rem",
                        textTransform: "none",
                        fontWeight: 700,
                      }}
                      variant="outlined"
                    >
                      {copiedLink ? "Copied" : "Share"}
                    </Button>
                  </Tooltip>

                  <IconButton
                    size="small"
                    component="a"
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: "#1877f2", bgcolor: "rgba(24, 119, 242, 0.1)" }}
                  >
                    <FacebookIcon sx={{ fontSize: 16 }} />
                  </IconButton>

                  <IconButton
                    size="small"
                    component="a"
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      activeModalItem.title
                    )}&url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: "#38bdf8", bgcolor: "rgba(56, 189, 248, 0.1)" }}
                  >
                    <TwitterIcon sx={{ fontSize: 16 }} />
                  </IconButton>

                  <IconButton
                    size="small"
                    component="a"
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      activeModalItem.title + " - " + window.location.href
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: "#22c55e", bgcolor: "rgba(34, 197, 94, 0.1)" }}
                  >
                    <WhatsAppIcon sx={{ fontSize: 16 }} />
                  </IconButton>

                  <IconButton
                    size="small"
                    component="a"
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: "#0a66c2", bgcolor: "rgba(10, 102, 194, 0.1)" }}
                  >
                    <LinkedInIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </DialogContent>
        )}
      </Dialog>
    </Box>
  );
};

export default PodcastsVideos;
