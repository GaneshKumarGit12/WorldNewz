import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import CardActions from "@mui/material/CardActions";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";

import StarIcon from "@mui/icons-material/Star";
import SearchIcon from "@mui/icons-material/Search";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LaunchIcon from "@mui/icons-material/Launch";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import TheatersIcon from "@mui/icons-material/Theaters";

import {
  fetchMoviesBrowse,
  fetchMoviesSearch,
  fetchMovieDetails,
  fetchMovieDbConfig,
} from "../api/apiClient";
import type {
  MovieDbItem,
  MovieDbDetails,
  MovieDbConfiguration,
} from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";
import { BreadcrumbNav } from "../components/BreadcrumbNav";
import { CategoryEditorial } from "../components/CategoryEditorial";

const MOVIE_GENRES = [
  { id: 0, name: "All Genres" },
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 5349, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

const LIST_TYPES = [
  { value: "trending", label: "Trending This Week" },
  { value: "popular", label: "Most Popular" },
  { value: "top_rated", label: "Top Rated" },
  { value: "now_playing", label: "Now Playing in Theaters" },
  { value: "upcoming", label: "Upcoming Releases" },
];

const Movies: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const outletContext = useOutletContext<{ searchTerm?: string }>();
  const globalSearchTerm = outletContext?.searchTerm ?? "";

  const [movies, setMovies] = useState<MovieDbItem[]>([]);
  const [config, setConfig] = useState<MovieDbConfiguration | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [listType, setListType] = useState<string>("trending");
  const [selectedGenreId, setSelectedGenreId] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Movie Details Modal state
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedMovieDetails, setSelectedMovieDetails] = useState<MovieDbDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState<boolean>(false);

  const dynamicKeywordsData = useKeywords("movies");
  const defaultKeywords = [
    "movies database",
    "trending movies",
    "top rated movies",
    "film review",
    "popular trailers",
    "movie cast",
    "upcoming films",
  ];
  const combinedKeywords = dynamicKeywordsData
    ? [
        ...new Set([
          ...defaultKeywords,
          ...dynamicKeywordsData.primary,
          ...dynamicKeywordsData.longtail,
          ...dynamicKeywordsData.trending,
        ]),
      ]
    : defaultKeywords;

  // Sync global search from layout header if any
  useEffect(() => {
    if (globalSearchTerm) {
      setSearchQuery(globalSearchTerm);
      setPage(1);
    }
  }, [globalSearchTerm]);

  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetchMovieDbConfig();
        setConfig(response.data);
      } catch (err) {
        console.warn("Failed to load MovieDB config. Using fallback image URLs.", err);
      }
    };
    loadConfig();
  }, []);

  // Load movies listings
  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        if (searchQuery.trim()) {
          const response = await fetchMoviesSearch({ query: searchQuery, page });
          setMovies(response.data.results || []);
          setTotalPages(response.data.total_pages || 1);
        } else {
          const response = await fetchMoviesBrowse({
            type: listType,
            page,
            genre: selectedGenreId > 0 ? selectedGenreId : undefined,
          });
          setMovies(response.data.results || []);
          setTotalPages(response.data.total_pages || 1);
        }
      } catch (err) {
        console.error("Failed to load movies:", err);
        setError("Unable to retrieve movie details. Please ensure the API backend is running.");
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, [listType, selectedGenreId, searchQuery, page]);

  // Handle Detail Opening
  const handleOpenDetails = async (id: number) => {
    setSelectedMovieId(id);
    setDetailsLoading(true);
    setDetailsError(null);
    setSelectedMovieDetails(null);
    setShowTrailer(false);

    try {
      const response = await fetchMovieDetails(id);
      setSelectedMovieDetails(response.data);
    } catch (err) {
      console.error(`Failed to load details for movie ${id}:`, err);
      setDetailsError("Failed to fetch movie specifications and credits.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedMovieId(null);
    setSelectedMovieDetails(null);
    setShowTrailer(false);
  };

  const getImageUrl = (path: string | null, size: string = "w500") => {
    if (!path) return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80";
    const secureBaseUrl = config?.images?.secure_base_url ?? "https://image.tmdb.org/t/p/";
    return `${secureBaseUrl}${size}${path}`;
  };

  const formatCurrency = (val: number) => {
    if (!val) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Find trailer video
  const getTrailerKey = () => {
    if (!selectedMovieDetails?.videos?.results) return null;
    const trailer = selectedMovieDetails.videos.results.find(
      (v) =>
        v.site.toLowerCase() === "youtube" &&
        (v.type.toLowerCase() === "trailer" || v.type.toLowerCase() === "teaser")
    );
    return trailer ? trailer.key : null;
  };

  const trailerKey = getTrailerKey();

  // Structured Schema data for movies list
  const schemaOrgJSON = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "MoviesDB - Global Movies & Cinema Database",
    description:
      "Browse trending, popular, and top-rated movies. Find cast, runtimes, budgets, and watch high-quality trailers on WorldNewzs.",
    url: "https://worldnewzs.in/movies",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: movies.length,
      itemListElement: movies.slice(0, 15).map((movie, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Movie",
          name: movie.title,
          description: movie.overview,
          image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
          dateCreated: movie.release_date,
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: movie.vote_average,
            reviewCount: movie.vote_count || 1,
          },
        },
      })),
    },
  };

  // Theme styling tokens
  const cardBg = isDark
    ? "linear-gradient(145deg, #131b2e 0%, #1a243d 100%)"
    : "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)";
  const cardBorder = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
  const cardShadow = isDark
    ? "0 10px 25px rgba(0, 0, 0, 0.4)"
    : "0 4px 20px rgba(0, 0, 0, 0.06)";

  return (
    <Box
      id="movies-page-root"
      component="main"
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        py: { xs: 2.5, md: 4 },
        px: { xs: 2, sm: 3, md: 4 },
        maxWidth: 1440,
        mx: "auto",
        transition: "background-color 0.2s ease, color 0.2s ease",
      }}
    >
      <SEOMeta
        title="MoviesDB - Search Trending Movies, Cast & Box Office | WorldNewzs"
        description="Search, browse, and discover popular, top-rated, and trending movies globally. Explore cast directories, box office revenue, and watch trailers. Sourced from TMDB."
        keywords={combinedKeywords}
        canonical="https://worldnewzs.in/movies"
        ogType="website"
      />

      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: "https://worldnewzs.in" },
          { name: "MoviesDB", url: "https://worldnewzs.in/movies" },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgJSON) }}
      />

      {/* Visual Breadcrumb Navigation */}
      <BreadcrumbNav items={[{ label: "MoviesDB Cinema Hub" }]} />

      {/* Hero Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 4 },
          mb: 4,
          borderRadius: 4,
          background: isDark
            ? "linear-gradient(135deg, #1e1028 0%, #291038 50%, #0d1b2a 100%)"
            : "linear-gradient(135deg, #fff1f2 0%, #fae8ff 50%, #f0f9ff 100%)",
          border: `1px solid ${isDark ? "rgba(225, 29, 72, 0.2)" : "rgba(225, 29, 72, 0.2)"}`,
          boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <Grid container spacing={3} alignItems="center" justifyContent="space-between">
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1 }}>
              <Chip
                icon={<TheatersIcon sx={{ fontSize: "1rem !important" }} />}
                label="GLOBAL CINEMA DATABASE"
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.72rem",
                  letterSpacing: "0.06em",
                  bgcolor: isDark ? "rgba(225, 29, 72, 0.15)" : "rgba(225, 29, 72, 0.15)",
                  color: isDark ? "#fb7185" : "#e11d48",
                  border: `1px solid ${isDark ? "rgba(225, 29, 72, 0.3)" : "rgba(225, 29, 72, 0.3)"}`,
                }}
              />
              <Chip
                icon={<VideoLibraryIcon sx={{ fontSize: "1rem !important" }} />}
                label="TMDB SYNDICATION"
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.72rem",
                  bgcolor: isDark ? "rgba(56, 189, 248, 0.15)" : "rgba(2, 132, 199, 0.15)",
                  color: isDark ? "#38bdf8" : "#0284c7",
                  border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.3)" : "rgba(2, 132, 199, 0.3)"}`,
                }}
              />
            </Box>
            <Typography
              variant="h3"
              component="h1"
              id="movies-main-heading"
              sx={{
                fontWeight: 900,
                fontSize: { xs: "2rem", md: "2.6rem" },
                letterSpacing: "-0.02em",
                background: "linear-gradient(to right, #f43f5e, #fb7185, #e11d48)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
              }}
            >
              MoviesDB Cinema & Film Explorer
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: isDark ? "#94a3b8" : "#475569",
                maxWidth: 650,
                lineHeight: 1.5,
              }}
            >
              Discover trending theatrical releases, inspect full cast credits, analyze box office economics, and watch high-definition official movie trailers.
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                id="movie-search-input"
                placeholder="Search movies by title..."
                size="small"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  bgcolor: isDark ? "rgba(15, 23, 42, 0.6)" : "#ffffff",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e11d48",
                  },
                }}
              />
              <Button
                id="movie-search-btn"
                variant="contained"
                onClick={() => setPage(1)}
                sx={{
                  bgcolor: "#e11d48",
                  color: "#fff",
                  fontWeight: 800,
                  px: 2.5,
                  "&:hover": { bgcolor: "#be123c" },
                }}
              >
                Search
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Filters Selectors Row */}
        <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}>
          <Grid container spacing={2} alignItems="center">
            {/* Feed Category Selector */}
            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
              <FormControl fullWidth size="small" disabled={searchQuery.trim().length > 0}>
                <InputLabel id="list-type-label">Feed Category</InputLabel>
                <Select
                  labelId="list-type-label"
                  id="list-type-select"
                  value={listType}
                  label="Feed Category"
                  onChange={(e) => {
                    setListType(e.target.value);
                    setPage(1);
                  }}
                  sx={{
                    bgcolor: isDark ? "rgba(15, 23, 42, 0.6)" : "#ffffff",
                    borderRadius: 2,
                  }}
                >
                  {LIST_TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Genre Selector */}
            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
              <FormControl fullWidth size="small" disabled={searchQuery.trim().length > 0}>
                <InputLabel id="genre-select-label">Genre</InputLabel>
                <Select
                  labelId="genre-select-label"
                  id="genre-select"
                  value={selectedGenreId}
                  label="Genre"
                  onChange={(e) => {
                    setSelectedGenreId(Number(e.target.value));
                    setPage(1);
                  }}
                  sx={{
                    bgcolor: isDark ? "rgba(15, 23, 42, 0.6)" : "#ffffff",
                    borderRadius: 2,
                  }}
                >
                  {MOVIE_GENRES.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Listings Display Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" py={12}>
          <CircularProgress size={55} sx={{ color: "#e11d48" }} />
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          sx={{
            borderRadius: 3,
            mx: "auto",
            maxWidth: 650,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          {error}
        </Alert>
      ) : movies.length === 0 ? (
        <Box textAlign="center" py={8}>
          <LiveTvIcon sx={{ fontSize: 60, color: "text.secondary", mb: 1.5 }} />
          <Typography variant="h5" fontWeight="800" mb={1}>
            No Movies Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try searching with another title or adjusting your genre filters.
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {movies.map((movie) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={movie.id}>
                <Card
                  id={`movie-card-${movie.id}`}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 3,
                    overflow: "hidden",
                    boxShadow: cardShadow,
                    transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      borderColor: "#e11d48",
                      boxShadow: "0 12px 30px rgba(225, 29, 72, 0.2)",
                    },
                  }}
                >
                  <Box sx={{ position: "relative", paddingTop: "145%", overflow: "hidden" }}>
                    <CardMedia
                      component="img"
                      image={getImageUrl(movie.poster_path, "w342")}
                      alt={`${movie.title} poster`}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.4s ease",
                        "&:hover": { transform: "scale(1.05)" },
                      }}
                    />
                    {/* Star Rating Badge */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "rgba(15, 23, 42, 0.85)",
                        color: "#fbbf24",
                        px: 1.2,
                        py: 0.4,
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        backdropFilter: "blur(6px)",
                        border: "1px solid rgba(251, 191, 36, 0.3)",
                        fontWeight: 800,
                        fontSize: "0.78rem",
                      }}
                    >
                      <StarIcon sx={{ fontSize: 16 }} />
                      {movie.vote_average ? movie.vote_average.toFixed(1) : "0.0"}
                    </Box>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, p: 2, pb: 1 }}>
                    <Typography
                      variant="h6"
                      component="h2"
                      fontWeight="800"
                      sx={{
                        fontSize: "1rem",
                        lineHeight: 1.35,
                        mb: 1,
                        height: "2.7em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {movie.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.5,
                        minHeight: "4.5em",
                        fontSize: "0.85rem",
                      }}
                    >
                      {movie.overview || "No official synopsis available for this title."}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 1.5, color: "text.secondary" }}>
                      <CalendarMonthIcon sx={{ fontSize: 16, color: "#e11d48" }} />
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {movie.release_date || "Unknown Release Date"}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, pt: 0, mt: "auto" }}>
                    <Button
                      id={`movie-btn-details-${movie.id}`}
                      variant="contained"
                      fullWidth
                      size="small"
                      startIcon={<InfoIcon />}
                      onClick={() => handleOpenDetails(movie.id)}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 800,
                        textTransform: "none",
                        fontSize: "0.88rem",
                        background: "linear-gradient(to right, #e11d48, #be123c)",
                        "&:hover": {
                          background: "linear-gradient(to right, #be123c, #9f1239)",
                        },
                      }}
                    >
                      Specs, Cast & Trailer
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" alignItems="center" mt={6} gap={2}>
              <Button
                variant="outlined"
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => Math.max(p - 1, 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                sx={{
                  borderRadius: 2,
                  fontWeight: 800,
                  borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                }}
              >
                Previous
              </Button>
              <Typography variant="body2" fontWeight="700" color="text.secondary">
                Page {page} of {Math.min(totalPages, 500)}
              </Typography>
              <Button
                variant="outlined"
                disabled={page >= Math.min(totalPages, 500)}
                onClick={() => {
                  setPage((p) => p + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                sx={{
                  borderRadius: 2,
                  fontWeight: 800,
                  borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                }}
              >
                Next
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Editorial Content Guidance */}
      <Box sx={{ mt: 6 }}>
        <CategoryEditorial categoryKey="movies" />
      </Box>

      {/* FAQ Accordion Section */}
      <Box sx={{ mt: 6, mb: 4, maxWidth: 900, mx: "auto" }}>
        <Typography
          variant="h4"
          component="h2"
          id="movies-faq-heading"
          sx={{
            fontWeight: 900,
            mb: 3,
            textAlign: "center",
            fontSize: { xs: "1.5rem", md: "1.8rem" },
          }}
        >
          Frequently Asked Questions (FAQs)
        </Typography>

        <Accordion
          sx={{
            bgcolor: cardBg,
            border: `1px solid ${cardBorder}`,
            mb: 1.5,
            borderRadius: "12px !important",
            overflow: "hidden",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#e11d48" }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Where does the movie metadata and ratings information come from?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              All movie listings, poster assets, release schedules, cast directories, and financial statistics (budget and box office gross) are powered by The Movie Database (TMDB) API under license.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          sx={{
            bgcolor: cardBg,
            border: `1px solid ${cardBorder}`,
            mb: 1.5,
            borderRadius: "12px !important",
            overflow: "hidden",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#e11d48" }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Can I watch full movies directly on WorldNewzs?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              WorldNewzs is an informational and editorial cinema hub. We provide high-definition official movie trailers, synopsis reviews, and cast breakdowns. We link out to verified platforms and theatrical listings for full feature screenings.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          sx={{
            bgcolor: cardBg,
            border: `1px solid ${cardBorder}`,
            mb: 1.5,
            borderRadius: "12px !important",
            overflow: "hidden",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#e11d48" }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              How frequently are trending movies and box office ranks updated?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Our backend caches TMDB feeds every 6 hours to ensure daily box office changes, newly dropped teaser trailers, and upcoming release dates are dynamically reflected in real time.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* TMDB API Attribution */}
      <Box textAlign="center" mt={6} pt={3} borderTop="1px solid" borderColor="divider">
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: "650px", mx: "auto" }}>
          This product uses the TMDB API but is not endorsed or certified by TMDB. Image assets and movies metadata are provided under license by{" "}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#e11d48", fontWeight: "700", textDecoration: "none" }}
          >
            TheMovieDB.org
          </a>.
        </Typography>
      </Box>

      {/* Specifications Details Dialog Modal */}
      <Dialog
        open={selectedMovieId !== null}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            color: "text.primary",
            borderRadius: 4,
            backgroundImage: "none",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
          },
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            background: isDark ? "#0f172a" : "#1e293b",
            color: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" component="div" fontWeight="800">
            {selectedMovieDetails ? selectedMovieDetails.title : "Loading movie specifications..."}
          </Typography>
          <IconButton aria-label="close" onClick={handleCloseDetails} sx={{ color: "#f8fafc" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {detailsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={12}>
              <CircularProgress size={50} sx={{ color: "#e11d48" }} />
            </Box>
          ) : detailsError ? (
            <Box p={3}>
              <Alert severity="error">{detailsError}</Alert>
            </Box>
          ) : selectedMovieDetails ? (
            <Box>
              {/* Structured schema for this movie */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Movie",
                    name: selectedMovieDetails.title,
                    image: getImageUrl(selectedMovieDetails.poster_path),
                    description: selectedMovieDetails.overview,
                    dateCreated: selectedMovieDetails.release_date,
                    genre: selectedMovieDetails.genres.map((g) => g.name).join(", "),
                    duration: selectedMovieDetails.runtime ? `PT${selectedMovieDetails.runtime}M` : undefined,
                    aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: selectedMovieDetails.vote_average,
                      bestRating: "10",
                      worstRating: "1",
                      ratingCount: selectedMovieDetails.vote_count || 1,
                    },
                  }),
                }}
              />

              {/* Backdrop & Hero Video Trigger Layout */}
              <Box
                sx={{
                  position: "relative",
                  background: "#020617",
                  height: { xs: "220px", sm: "360px" },
                  backgroundImage: `linear-gradient(to bottom, rgba(3,7,18,0.3) 0%, rgba(3,7,18,0.92) 100%), url(${getImageUrl(
                    selectedMovieDetails.backdrop_path,
                    "w1280"
                  )})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Watch Trailer Button Overlay */}
                {trailerKey && !showTrailer && (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PlayCircleOutlineIcon />}
                      onClick={() => setShowTrailer(true)}
                      sx={{
                        borderRadius: "28px",
                        bgcolor: "#e11d48",
                        color: "#fff",
                        boxShadow: "0 8px 24px rgba(225, 29, 72, 0.4)",
                        textTransform: "none",
                        px: 3.5,
                        py: 1.5,
                        fontWeight: "800",
                        fontSize: "0.95rem",
                        "&:hover": { bgcolor: "#be123c" },
                      }}
                    >
                      Watch Official Trailer
                    </Button>
                  </Box>
                )}

                {/* Embedded Video Player */}
                {showTrailer && trailerKey && (
                  <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "#000000" }}>
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                      title="Movie Trailer"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </Box>
                )}
              </Box>

              {/* Movie Info Panel */}
              <Box p={{ xs: 2.5, md: 3.5 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    {selectedMovieDetails.tagline && (
                      <Typography
                        variant="subtitle1"
                        fontStyle="italic"
                        color="text.secondary"
                        sx={{ mb: 1.5, fontSize: "1.05rem", fontWeight: 600 }}
                      >
                        "{selectedMovieDetails.tagline}"
                      </Typography>
                    )}
                    <Typography variant="h6" fontWeight="800" gutterBottom>
                      Overview
                    </Typography>
                    <Typography variant="body1" paragraph color="text.secondary" sx={{ lineHeight: 1.65, mb: 3 }}>
                      {selectedMovieDetails.overview}
                    </Typography>

                    {/* Cast List */}
                    {selectedMovieDetails.credits?.cast && selectedMovieDetails.credits.cast.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="h6" fontWeight="800" gutterBottom>
                          Top Cast
                        </Typography>
                        <Box
                          display="flex"
                          gap={2}
                          sx={{
                            overflowX: "auto",
                            pb: 1.5,
                            "&::-webkit-scrollbar": { height: "6px" },
                            "&::-webkit-scrollbar-thumb": { backgroundColor: "#e11d48", borderRadius: "3px" },
                          }}
                        >
                          {selectedMovieDetails.credits.cast.slice(0, 8).map((actor) => (
                            <Box key={actor.id} sx={{ minWidth: "90px", textAlign: "center" }}>
                              <Box
                                component="img"
                                src={getImageUrl(actor.profile_path, "w185")}
                                alt={actor.name}
                                sx={{
                                  width: "65px",
                                  height: "65px",
                                  objectFit: "cover",
                                  borderRadius: "50%",
                                  mb: 1,
                                  border: "2px solid rgba(225, 29, 72, 0.3)",
                                }}
                              />
                              <Typography
                                variant="body2"
                                fontWeight="700"
                                sx={{ fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                              >
                                {actor.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontSize: "0.65rem", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                              >
                                {actor.character}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Grid>

                  {/* Sidebar Metadata */}
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        p: 2,
                        mb: 2.5,
                        background: cardBg,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="800" gutterBottom borderBottom="1px solid" borderColor="divider" pb={1}>
                        Metadata
                      </Typography>
                      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                        <Grid size={12}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <StarIcon sx={{ color: "#fbbf24" }} />
                            <Typography variant="body2" fontWeight="700">
                              {selectedMovieDetails.vote_average ? selectedMovieDetails.vote_average.toFixed(1) : "0.0"} / 10 ({selectedMovieDetails.vote_count} votes)
                            </Typography>
                          </Box>
                        </Grid>
                        {selectedMovieDetails.runtime && (
                          <Grid size={12}>
                            <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                              <AccessTimeIcon sx={{ fontSize: 18 }} />
                              <Typography variant="body2" fontWeight="700">{selectedMovieDetails.runtime} mins</Typography>
                            </Box>
                          </Grid>
                        )}
                        <Grid size={12}>
                          <Typography variant="caption" color="text.secondary">Status</Typography>
                          <Typography variant="body2" fontWeight="700">{selectedMovieDetails.status}</Typography>
                        </Grid>
                        <Grid size={12}>
                          <Typography variant="caption" color="text.secondary">Release Date</Typography>
                          <Typography variant="body2" fontWeight="700">{selectedMovieDetails.release_date}</Typography>
                        </Grid>
                        <Grid size={12}>
                          <Typography variant="caption" color="text.secondary">Budget</Typography>
                          <Typography variant="body2" fontWeight="700" sx={{ display: "flex", alignItems: "center" }}>
                            <AttachMoneyIcon sx={{ fontSize: 16 }} />
                            {formatCurrency(selectedMovieDetails.budget)}
                          </Typography>
                        </Grid>
                        <Grid size={12}>
                          <Typography variant="caption" color="text.secondary">Box Office Revenue</Typography>
                          <Typography variant="body2" fontWeight="700" sx={{ display: "flex", alignItems: "center" }}>
                            <AttachMoneyIcon sx={{ fontSize: 16 }} />
                            {formatCurrency(selectedMovieDetails.revenue)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Card>

                    {/* Genres Card */}
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        p: 2,
                        background: cardBg,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="800" gutterBottom borderBottom="1px solid" borderColor="divider" pb={1}>
                        Genres
                      </Typography>
                      <Box display="flex" gap={0.8} flexWrap="wrap" mt={1.5}>
                        {selectedMovieDetails.genres.map((g) => (
                          <Chip key={g.id} label={g.name} size="small" sx={{ fontWeight: 700, fontSize: "0.72rem" }} />
                        ))}
                      </Box>
                    </Card>
                  </Grid>
                </Grid>

                {/* Recommendations Grid */}
                {selectedMovieDetails.recommendations && selectedMovieDetails.recommendations.length > 0 && (
                  <Box mt={4} pt={3} borderTop="1px solid" borderColor="divider">
                    <Typography variant="h6" fontWeight="800" gutterBottom>
                      Recommended Movies
                    </Typography>
                    <Grid container spacing={2}>
                      {selectedMovieDetails.recommendations.slice(0, 4).map((rec) => (
                        <Grid size={{ xs: 6, sm: 3 }} key={rec.id}>
                          <Card
                            sx={{
                              cursor: "pointer",
                              borderRadius: 2,
                              transition: "transform 0.2s",
                              "&:hover": { transform: "scale(1.03)" },
                            }}
                            onClick={() => handleOpenDetails(rec.id)}
                          >
                            <CardMedia
                              component="img"
                              height="180"
                              image={getImageUrl(rec.poster_path, "w185")}
                              alt={rec.title}
                            />
                            <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                              <Typography variant="body2" fontWeight="700" noWrap sx={{ fontSize: "0.8rem" }}>
                                {rec.title}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>

              {/* Modal Footer Actions */}
              <Box p={2.5} borderTop="1px solid" borderColor="divider" display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" onClick={handleCloseDetails} sx={{ borderRadius: 2, fontWeight: 700 }}>
                  Close
                </Button>
                {selectedMovieDetails.id && (
                  <Button
                    variant="contained"
                    endIcon={<LaunchIcon />}
                    href={`https://www.themoviedb.org/movie/${selectedMovieDetails.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderRadius: 2,
                      fontWeight: 800,
                      bgcolor: "#e11d48",
                      "&:hover": { bgcolor: "#be123c" },
                    }}
                  >
                    View on TMDB
                  </Button>
                )}
              </Box>
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Movies;
