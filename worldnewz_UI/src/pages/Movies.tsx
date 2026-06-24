import React, { useState, useEffect } from "react";
import Container from "@mui/material/Container";
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
import StarIcon from "@mui/icons-material/Star";
import SearchIcon from "@mui/icons-material/Search";
import MovieIcon from "@mui/icons-material/Movie";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LaunchIcon from "@mui/icons-material/Launch";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { Helmet } from "react-helmet-async";
import { CategoryEditorial } from "../components/CategoryEditorial";

import {
  fetchMoviesBrowse,
  fetchMoviesSearch,
  fetchMovieDetails,
  fetchMovieDbConfig
} from "../api/apiClient";
import type {
  MovieDbItem,
  MovieDbDetails,
  MovieDbConfiguration
} from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";

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
  { id: 37, name: "Western" }
];

const LIST_TYPES = [
  { value: "trending", label: "Trending This Week" },
  { value: "popular", label: "Most Popular" },
  { value: "top_rated", label: "Top Rated" },
  { value: "now_playing", label: "Now Playing in Theaters" },
  { value: "upcoming", label: "Upcoming Releases" }
];

const Movies: React.FC = () => {
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
  const defaultKeywords = ["movies database", "trending movies", "top rated movies", "film review", "popular trailers", "movie cast", "upcoming films"];
  const combinedKeywords = dynamicKeywordsData
    ? [...new Set([...defaultKeywords, ...dynamicKeywordsData.primary, ...dynamicKeywordsData.longtail, ...dynamicKeywordsData.trending])]
    : defaultKeywords;

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
            genre: selectedGenreId > 0 ? selectedGenreId : undefined
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
    if (!path) return "https://via.placeholder.com/500x750?text=No+Image+Available";
    const secureBaseUrl = config?.images?.secure_base_url ?? "https://image.tmdb.org/t/p/";
    return `${secureBaseUrl}${size}${path}`;
  };

  const formatCurrency = (val: number) => {
    if (!val) return "N/A";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  // Find trailer video
  const getTrailerKey = () => {
    if (!selectedMovieDetails?.videos?.results) return null;
    const trailer = selectedMovieDetails.videos.results.find(
      (v) => v.site.toLowerCase() === "youtube" && (v.type.toLowerCase() === "trailer" || v.type.toLowerCase() === "teaser")
    );
    return trailer ? trailer.key : null;
  };

  const trailerKey = getTrailerKey();

  return (
    <>
      <SEOMeta
        title="MoviesDB - Search and Explore Trending Movies"
        description="Search, browse and discover details of popular, top rated, and trending movies globally. Sourced from TMDB."
        keywords={combinedKeywords}
        ogType="website"
      />

      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: "https://worldnewzs.in" },
          { name: "MoviesDB", url: "https://worldnewzs.in/movies" }
        ]}
      />

      {/* Structured data list of movies for search crawlability */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "MoviesDB - Global Movies Database",
            "description": "Browse trending, popular, and top-rated movies. Find cast, runtimes, budgets, and watch high-quality trailers.",
            "url": "https://worldnewzs.in/movies",
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": movies.length,
              "itemListElement": movies.slice(0, 15).map((movie, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Movie",
                  "name": movie.title,
                  "description": movie.overview,
                  "image": movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
                  "dateCreated": movie.release_date,
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": movie.vote_average,
                    "reviewCount": movie.vote_count || 1
                  }
                }
              }))
            }
          })}
        </script>
      </Helmet>

      {/* Hero Banner */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #030712 50%, #31102f 100%)",
          color: "#f8fafc",
          py: { xs: 6, md: 8 },
          mb: 4,
          borderRadius: "0 0 24px 24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          textAlign: "center"
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
            <MovieIcon sx={{ fontSize: { xs: 40, md: 50 }, mr: 2, color: "#e11d48" }} />
            <Typography
              variant="h3"
              component="h1"
              fontWeight="800"
              sx={{
                fontSize: { xs: "2rem", md: "3.5rem" },
                background: "linear-gradient(to right, #f43f5e, #fb7185, #e11d48)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              MoviesDB Hub
            </Typography>
          </Box>
          <Typography
            variant="h6"
            component="p"
            sx={{ color: "#94a3b8", maxWidth: "700px", mx: "auto", fontWeight: "400" }}
          >
            Access cast directories, budget statistics, release specs, and trailers. Sourced with attribution to TMDB.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {/* Filters Panel */}
        <Paper
          elevation={4}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: "16px",
            background: (theme) => theme.palette.mode === "dark" ? "#1e293b" : "#ffffff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
          }}
        >
          <Grid container spacing={2} alignItems="center">
            {/* Search Input */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search movies by title..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1); // Reset page on new query
                }}
                id="movie-search-input"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* List Type Feed Selector */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth disabled={searchQuery.trim().length > 0}>
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth disabled={searchQuery.trim().length > 0}>
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
        </Paper>

        {/* Listings Display */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={10}>
            <CircularProgress size={60} thickness={4} sx={{ color: "#e11d48" }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: "12px", mb: 4 }}>
            {error}
          </Alert>
        ) : movies.length === 0 ? (
          <Box textAlign="center" py={8}>
            <LiveTvIcon sx={{ fontSize: 60, color: "#94a3b8", mb: 2 }} />
            <Typography variant="h5" color="textSecondary" fontWeight="600" mb={1}>
              No Movies Found
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Try searching with another keyword or resetting filters.
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={4}>
              {movies.map((movie) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={movie.id}>
                  <Card
                    id={`movie-card-${movie.id}`}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "16px",
                      overflow: "hidden",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-6px)",
                        boxShadow: "0 12px 30px rgba(225, 29, 72, 0.15)"
                      }
                    }}
                  >
                    <Box sx={{ position: "relative" }}>
                      <CardMedia
                        component="img"
                        height="320"
                        image={getImageUrl(movie.poster_path, "w342")}
                        alt={`${movie.title} poster`}
                        sx={{ objectFit: "cover" }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          background: "rgba(15, 23, 42, 0.85)",
                          color: "#fbbf24",
                          px: 1.2,
                          py: 0.5,
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          backdropFilter: "blur(4px)",
                          border: "1px solid rgba(251, 191, 36, 0.3)",
                          fontWeight: "700",
                          fontSize: "0.85rem"
                        }}
                      >
                        <StarIcon sx={{ fontSize: 16 }} />
                        {movie.vote_average ? movie.vote_average.toFixed(1) : "0.0"}
                      </Box>
                    </Box>
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Typography variant="h6" component="h2" fontWeight="700" sx={{ lineClamp: 2, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "2.4em", mb: 1 }}>
                        {movie.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: 1.5,
                          minHeight: "4.5em",
                          fontSize: "0.85rem"
                        }}
                      >
                        {movie.overview || "No synopsis available."}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block" mt={2}>
                        <strong>Released:</strong> {movie.release_date || "Unknown"}
                      </Typography>
                    </CardContent>

                    <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                      <Button
                        id={`movie-btn-details-${movie.id}`}
                        variant="contained"
                        fullWidth
                        size="small"
                        color="primary"
                        startIcon={<InfoIcon />}
                        onClick={() => handleOpenDetails(movie.id)}
                        sx={{
                          borderRadius: "8px",
                          background: "linear-gradient(to right, #e11d48, #be123c)"
                        }}
                      >
                        Specs & Info
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
                  sx={{ borderRadius: "8px" }}
                >
                  Previous
                </Button>
                <Typography variant="body2" fontWeight="600" color="textSecondary">
                  Page {page} of {Math.min(totalPages, 500)} {/* TMDB caps standard API browsing at 500 pages */}
                </Typography>
                <Button
                  variant="outlined"
                  disabled={page >= Math.min(totalPages, 500)}
                  onClick={() => {
                    setPage((p) => p + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  sx={{ borderRadius: "8px" }}
                >
                  Next
                </Button>
              </Box>
            )}
          </>
        )}

        <CategoryEditorial categoryKey="movies" />

        {/* TMDB API Attribution */}
        <Box textAlign="center" mt={8} pt={3} borderTop="1px solid" borderColor="divider">
          <Typography variant="body2" color="textSecondary" sx={{ maxWidth: "600px", mx: "auto" }}>
            This product uses the TMDB API but is not endorsed or certified by TMDB. Image assets and movies metadata are provided under license by{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#e11d48", fontWeight: "600", textDecoration: "none" }}
            >
              TheMovieDB.org
            </a>.
          </Typography>
        </Box>
      </Container>

      {/* Specifications Details Dialog */}
      <Dialog
        open={selectedMovieId !== null}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: "20px",
            overflow: "hidden"
          }
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            background: "#030712",
            color: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <Typography variant="h6" component="div" fontWeight="700">
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
              {/* Structured data for this specific movie when detail dialog is shown to enable Google rich snippet indexing */}
              <Helmet>
                <script type="application/ld+json">
                  {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Movie",
                    "name": selectedMovieDetails.title,
                    "image": getImageUrl(selectedMovieDetails.poster_path),
                    "description": selectedMovieDetails.overview,
                    "dateCreated": selectedMovieDetails.release_date,
                    "genre": selectedMovieDetails.genres.map(g => g.name).join(", "),
                    "duration": selectedMovieDetails.runtime ? `PT${selectedMovieDetails.runtime}M` : undefined,
                    "aggregateRating": {
                      "@type": "AggregateRating",
                      "ratingValue": selectedMovieDetails.vote_average,
                      "bestRating": "10",
                      "worstRating": "1",
                      "ratingCount": selectedMovieDetails.vote_count || 1
                    }
                  })}
                </script>
              </Helmet>

              {/* Backdrop & Hero Layout */}
              <Box
                sx={{
                  position: "relative",
                  background: "#020617",
                  height: { xs: "200px", sm: "350px" },
                  backgroundImage: `linear-gradient(to bottom, rgba(3,7,18,0.2) 0%, rgba(3,7,18,0.9) 100%), url(${getImageUrl(selectedMovieDetails.backdrop_path, "w1280")})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                {/* Watch Trailer Overlay / Play Trigger */}
                {trailerKey && !showTrailer && (
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                  >
                    <Button
                      variant="contained"
                      color="error"
                      size="large"
                      startIcon={<PlayCircleOutlineIcon />}
                      onClick={() => setShowTrailer(true)}
                      sx={{
                        borderRadius: "28px",
                        boxShadow: "0 8px 24px rgba(225, 29, 72, 0.4)",
                        textTransform: "none",
                        px: 4,
                        py: 1.5,
                        fontWeight: "700"
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
              <Box p={3}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    {selectedMovieDetails.tagline && (
                      <Typography variant="subtitle1" fontStyle="italic" color="textSecondary" sx={{ mb: 1.5, fontSize: "1.1rem" }}>
                        "{selectedMovieDetails.tagline}"
                      </Typography>
                    )}
                    <Typography variant="h6" fontWeight="700" gutterBottom>
                      Overview
                    </Typography>
                    <Typography variant="body1" paragraph color="textSecondary" sx={{ lineHeight: 1.6, mb: 3 }}>
                      {selectedMovieDetails.overview}
                    </Typography>

                    {/* Cast List */}
                    {selectedMovieDetails.credits?.cast && selectedMovieDetails.credits.cast.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="h6" fontWeight="700" gutterBottom>
                          Top Cast
                        </Typography>
                        <Box display="flex" gap={2} sx={{ overflowX: "auto", pb: 1, "&::-webkit-scrollbar": { height: "6px" }, "&::-webkit-scrollbar-thumb": { backgroundColor: "#e11d48", borderRadius: "3px" } }}>
                          {selectedMovieDetails.credits.cast.slice(0, 8).map((actor) => (
                            <Box key={actor.id} sx={{ minWidth: "100px", textAlign: "center" }}>
                              <Box
                                component="img"
                                src={getImageUrl(actor.profile_path, "w185")}
                                alt={actor.name}
                                sx={{
                                  width: "70px",
                                  height: "70px",
                                  objectFit: "cover",
                                  borderRadius: "50%",
                                  mb: 1,
                                  border: "2px solid rgba(225, 29, 72, 0.2)"
                                }}
                              />
                              <Typography variant="body2" fontWeight="700" sx={{ fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {actor.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.65rem", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                    <Card variant="outlined" sx={{ borderRadius: "12px", p: 2, mb: 3, background: (theme: any) => theme.palette.mode === "dark" ? "#1e293b" : "#f8fafc" }}>
                      <Typography variant="subtitle1" fontWeight="700" gutterBottom borderBottom="1px solid" borderColor="divider" pb={1}>
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
                              <Typography variant="body2" fontWeight="600">{selectedMovieDetails.runtime} mins</Typography>
                            </Box>
                          </Grid>
                        )}
                        <Grid size={12}>
                          <Typography variant="caption" color="textSecondary">Status</Typography>
                          <Typography variant="body2" fontWeight="600">{selectedMovieDetails.status}</Typography>
                        </Grid>
                        <Grid size={12}>
                          <Typography variant="caption" color="textSecondary">Release Date</Typography>
                          <Typography variant="body2" fontWeight="600">{selectedMovieDetails.release_date}</Typography>
                        </Grid>
                        <Grid size={12}>
                          <Typography variant="caption" color="textSecondary">Budget</Typography>
                          <Typography variant="body2" fontWeight="600" sx={{ display: "flex", alignItems: "center" }}>
                            <AttachMoneyIcon sx={{ fontSize: 16 }} />
                            {formatCurrency(selectedMovieDetails.budget)}
                          </Typography>
                        </Grid>
                        <Grid size={12}>
                          <Typography variant="caption" color="textSecondary">Revenue</Typography>
                          <Typography variant="body2" fontWeight="600" sx={{ display: "flex", alignItems: "center" }}>
                            <AttachMoneyIcon sx={{ fontSize: 16 }} />
                            {formatCurrency(selectedMovieDetails.revenue)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Card>

                    {/* Genres Card */}
                    <Card variant="outlined" sx={{ borderRadius: "12px", p: 2, background: (theme: any) => theme.palette.mode === "dark" ? "#1e293b" : "#f8fafc" }}>
                      <Typography variant="subtitle1" fontWeight="700" gutterBottom borderBottom="1px solid" borderColor="divider" pb={1}>
                        Genres
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap" mt={1.5}>
                        {selectedMovieDetails.genres.map((g) => (
                          <Chip key={g.id} label={g.name} size="small" sx={{ fontWeight: "600", fontSize: "0.75rem", border: "1px solid rgba(225, 29, 72, 0.2)" }} />
                        ))}
                      </Box>
                    </Card>
                  </Grid>
                </Grid>

                {/* Recommendations Grid */}
                {selectedMovieDetails.recommendations && selectedMovieDetails.recommendations.length > 0 && (
                  <Box mt={4} pt={3} borderTop="1px solid" borderColor="divider">
                    <Typography variant="h6" fontWeight="700" gutterBottom>
                      Recommended Movies
                    </Typography>
                    <Grid container spacing={2}>
                      {selectedMovieDetails.recommendations.slice(0, 4).map((rec) => (
                        <Grid size={{ xs: 6, sm: 3 }} key={rec.id}>
                          <Card
                            sx={{
                              cursor: "pointer",
                              borderRadius: "8px",
                              transition: "transform 0.2s",
                              "&:hover": { transform: "scale(1.03)" }
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
              <Box p={3} borderTop="1px solid" borderColor="divider" display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" onClick={handleCloseDetails} sx={{ borderRadius: "8px" }}>
                  Close
                </Button>
                {selectedMovieDetails.id && (
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<LaunchIcon />}
                    href={`https://www.themoviedb.org/movie/${selectedMovieDetails.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderRadius: "8px",
                      background: "linear-gradient(to right, #e11d48, #be123c)"
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
    </>
  );
};

export default Movies;
