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
import SearchIcon from "@mui/icons-material/Search";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import ComputerIcon from "@mui/icons-material/Computer";
import LanguageIcon from "@mui/icons-material/Language";
import LaunchIcon from "@mui/icons-material/Launch";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import GamepadIcon from "@mui/icons-material/Gamepad";
import { Helmet } from "react-helmet-async";

import {
  fetchFreeToPlayGames,
  fetchFreeToPlayGameDetails
} from "../api/apiClient";
import type { FreeToGameItem, FreeToGameDetails } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";

const GENRES = [
  { value: "", label: "All Genres" },
  { value: "mmorpg", label: "MMORPG" },
  { value: "shooter", label: "Shooter" },
  { value: "strategy", label: "Strategy" },
  { value: "moba", label: "MOBA" },
  { value: "racing", label: "Racing" },
  { value: "sports", label: "Sports" },
  { value: "social", label: "Social" },
  { value: "sandbox", label: "Sandbox" },
  { value: "survival", label: "Survival" },
  { value: "pvp", label: "PvP" },
  { value: "pve", label: "PvE" },
  { value: "anime", label: "Anime" },
  { value: "fantasy", label: "Fantasy" },
  { value: "sci-fi", label: "Sci-Fi" },
  { value: "card", label: "Card Games" }
];

const PLATFORMS = [
  { value: "all", label: "All Platforms" },
  { value: "windows", label: "Windows PC" },
  { value: "browser", label: "Web Browser" }
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity", label: "Popularity" },
  { value: "release-date", label: "Release Date" },
  { value: "alphabetical", label: "Alphabetical" }
];

const Gaming: React.FC = () => {
  const [games, setGames] = useState<FreeToGameItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [platform, setPlatform] = useState<string>("all");
  const [category, setCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("relevance");

  // Game Details Modal State
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [selectedGameDetails, setSelectedGameDetails] = useState<FreeToGameDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [activeScreenshot, setActiveScreenshot] = useState<string>("");

  const dynamicKeywordsData = useKeywords("gaming");
  const defaultKeywords = ["free to play games", "MMO games", "free computer games", "browser games", "freetogame", "PC gaming", "multiplayer games"];
  const combinedKeywords = dynamicKeywordsData
    ? [...new Set([...defaultKeywords, ...dynamicKeywordsData.primary, ...dynamicKeywordsData.longtail, ...dynamicKeywordsData.trending])]
    : defaultKeywords;

  // Load game listings
  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchFreeToPlayGames({
          platform: platform === "all" ? undefined : platform,
          category: category === "" ? undefined : category,
          "sort-by": sortBy
        });
        setGames(response.data || []);
      } catch (err: any) {
        console.error("Failed to load FreeToGame items:", err);
        setError("Unable to load free-to-play games database. Please check if the API server is online.");
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, [platform, category, sortBy]);

  // Load detailed specs and screens
  const handleOpenDetails = async (id: number) => {
    setSelectedGameId(id);
    setDetailsLoading(true);
    setDetailsError(null);
    setSelectedGameDetails(null);

    try {
      const response = await fetchFreeToPlayGameDetails(id);
      setSelectedGameDetails(response.data);
      if (response.data.screenshots && response.data.screenshots.length > 0) {
        setActiveScreenshot(response.data.screenshots[0].image);
      } else {
        setActiveScreenshot(response.data.thumbnail);
      }
    } catch (err) {
      console.error(`Failed to load details for game ${id}:`, err);
      setDetailsError("Failed to fetch technical specifications and screenshots.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedGameId(null);
    setSelectedGameDetails(null);
  };

  // Local Search Filtering
  const filteredGames = games.filter(
    (game) =>
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.short_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SEOMeta
        title="Gaming - Free-To-Play & MMO Games Database"
        description="Access and explore the ultimate list of free-to-play games and MMOs. View minimum specifications, official websites, and screenshots."
        keywords={combinedKeywords}
        ogType="website"
      />

      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: "https://worldnewzs.in" },
          { name: "Gaming", url: "https://worldnewzs.in/gaming" }
        ]}
      />

      {/* Structured data list of games for Google Search crawlability */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Free-To-Play & MMO Games Directory | WorldNewzs",
            "description": "Browse a comprehensive database of 400+ free-to-play games and MMOs, detailing system requirements, reviews, and official download links.",
            "url": "https://worldnewzs.in/gaming",
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": filteredGames.length,
              "itemListElement": filteredGames.slice(0, 15).map((game, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Game",
                  "name": game.title,
                  "description": game.short_description,
                  "genre": game.genre,
                  "image": game.thumbnail,
                  "url": game.game_url,
                  "publisher": {
                    "@type": "Organization",
                    "name": game.publisher
                  }
                }
              }))
            }
          })}
        </script>
      </Helmet>

      <Box
        sx={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)",
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
            <SportsEsportsIcon sx={{ fontSize: { xs: 40, md: 50 }, mr: 2, color: "#a855f7" }} />
            <Typography
              variant="h3"
              component="h1"
              fontWeight="800"
              sx={{
                fontSize: { xs: "2rem", md: "3.5rem" },
                background: "linear-gradient(to right, #a855f7, #ec4899, #f43f5e)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              Free-To-Play Games Hub
            </Typography>
          </Box>
          <Typography
            variant="h6"
            component="p"
            sx={{ color: "#94a3b8", maxWidth: "700px", mx: "auto", fontWeight: "400" }}
          >
            Access programmatically and visually the best free-to-play games and MMO games database. Sourced with attribution to FreeToGame.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 8 }}>
        {/* Filters Toolbar */}
        <Paper
          elevation={4}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: "16px",
            background: (theme: any) => theme.palette.mode === "dark" ? "#1e293b" : "#ffffff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
          }}
        >
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="game-search-input"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Platform */}
            <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
              <FormControl fullWidth>
                <InputLabel id="platform-select-label">Platform</InputLabel>
                <Select
                  labelId="platform-select-label"
                  id="platform-select"
                  value={platform}
                  label="Platform"
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  {PLATFORMS.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Category */}
            <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
              <FormControl fullWidth>
                <InputLabel id="genre-select-label">Genre</InputLabel>
                <Select
                  labelId="genre-select-label"
                  id="genre-select"
                  value={category}
                  label="Genre"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {GENRES.map((g) => (
                    <MenuItem key={g.value} value={g.value}>
                      {g.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Sort By */}
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="sort-select-label">Sort By</InputLabel>
                <Select
                  labelId="sort-select-label"
                  id="sort-select"
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Listings States */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={10}>
            <CircularProgress size={60} thickness={4} sx={{ color: "#a855f7" }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: "12px", mb: 4 }}>
            {error}
          </Alert>
        ) : filteredGames.length === 0 ? (
          <Box textAlign="center" py={8}>
            <GamepadIcon sx={{ fontSize: 60, color: "#94a3b8", mb: 2 }} />
            <Typography variant="h5" color="textSecondary" fontWeight="600" mb={1}>
              No Games Found
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Try adjusting your filters or search keywords.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {filteredGames.map((game) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={game.id}>
                <Card
                  id={`game-card-${game.id}`}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "16px",
                    overflow: "hidden",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-6px)",
                      boxShadow: "0 12px 30px rgba(168, 85, 247, 0.15)"
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="190"
                    image={game.thumbnail}
                    alt={`${game.title} thumbnail`}
                    sx={{ objectFit: "cover" }}
                  />
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Box display="flex" gap={1} mb={1.5} flexWrap="wrap">
                      <Chip
                        label={game.genre}
                        size="small"
                        sx={{
                          background: "linear-gradient(to right, #a855f7, #8b5cf6)",
                          color: "#ffffff",
                          fontWeight: "600",
                          fontSize: "0.75rem"
                        }}
                      />
                      <Chip
                        icon={game.platform.toLowerCase().includes("browser") ? <LanguageIcon /> : <ComputerIcon />}
                        label={game.platform.toLowerCase().includes("browser") ? "Web Browser" : "Windows PC"}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: "500", fontSize: "0.75rem" }}
                      />
                    </Box>
                    <Typography variant="h5" component="h2" fontWeight="700" gutterBottom>
                      {game.title}
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
                        minHeight: "4.5em"
                      }}
                    >
                      {game.short_description}
                    </Typography>

                    <Box mt={2} borderTop="1px solid" borderColor="divider" pt={1.5}>
                      <Typography variant="caption" color="textSecondary" display="block">
                        <strong>Publisher:</strong> {game.publisher}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        <strong>Released:</strong> {game.release_date}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: "space-between" }}>
                    <Button
                      id={`game-btn-details-${game.id}`}
                      variant="outlined"
                      size="small"
                      color="secondary"
                      startIcon={<InfoIcon />}
                      onClick={() => handleOpenDetails(game.id)}
                      sx={{ borderRadius: "8px" }}
                    >
                      Specs & Screens
                    </Button>
                    <Button
                      id={`game-btn-play-${game.id}`}
                      variant="contained"
                      size="small"
                      color="primary"
                      endIcon={<LaunchIcon />}
                      href={game.game_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        borderRadius: "8px",
                        background: "linear-gradient(to right, #ec4899, #f43f5e)"
                      }}
                    >
                      Play Now
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Footer Attribution as requested by Terms of Use */}
        <Box textAlign="center" mt={6} pt={3} borderTop="1px solid" borderColor="divider">
          <Typography variant="body2" color="textSecondary">
            Data sourced from and attributed to{" "}
            <a
              href="https://www.freetogame.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#a855f7", fontWeight: "600", textDecoration: "none" }}
            >
              FreeToGame.com
            </a>. All rights reserved.
          </Typography>
        </Box>
      </Container>

      {/* Specifications & Screenshots Modal */}
      <Dialog
        open={selectedGameId !== null}
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
            background: "#0f172a",
            color: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <Typography variant="h6" component="div" fontWeight="700">
            {selectedGameDetails ? selectedGameDetails.title : "Loading game specs..."}
          </Typography>
          <IconButton aria-label="close" onClick={handleCloseDetails} sx={{ color: "#f8fafc" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {detailsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={12}>
              <CircularProgress size={50} sx={{ color: "#ec4899" }} />
            </Box>
          ) : detailsError ? (
            <Box p={3}>
              <Alert severity="error">{detailsError}</Alert>
            </Box>
          ) : selectedGameDetails ? (
            <Box>
              {/* Screenshots Gallery */}
              {selectedGameDetails.screenshots && selectedGameDetails.screenshots.length > 0 ? (
                <Box sx={{ background: "#020617", p: 2, textAlign: "center" }}>
                  <CardMedia
                    component="img"
                    image={activeScreenshot}
                    alt="game screenshot"
                    sx={{
                      maxHeight: { xs: "250px", sm: "400px" },
                      objectFit: "contain",
                      mx: "auto",
                      borderRadius: "8px"
                    }}
                  />
                  {selectedGameDetails.screenshots.length > 1 && (
                    <Box
                      display="flex"
                      gap={1}
                      mt={2}
                      sx={{
                        overflowX: "auto",
                        pb: 1,
                        "&::-webkit-scrollbar": { height: "6px" },
                        "&::-webkit-scrollbar-thumb": { backgroundColor: "#475569", borderRadius: "3px" }
                      }}
                    >
                      {selectedGameDetails.screenshots.map((screen) => (
                        <Box
                          key={screen.id}
                          component="img"
                          src={screen.image}
                          alt="thumbnail screenshot"
                          onClick={() => setActiveScreenshot(screen.image)}
                          sx={{
                            height: "60px",
                            width: "100px",
                            objectFit: "cover",
                            borderRadius: "4px",
                            cursor: "pointer",
                            border: activeScreenshot === screen.image ? "2px solid #a855f7" : "2px solid transparent",
                            opacity: activeScreenshot === screen.image ? 1 : 0.6,
                            transition: "all 0.2s ease",
                            "&:hover": { opacity: 1 }
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ background: "#020617", p: 4, textAlign: "center" }}>
                  <CardMedia
                    component="img"
                    image={selectedGameDetails.thumbnail}
                    alt="game default logo"
                    sx={{ maxHeight: "250px", objectFit: "contain", mx: "auto", borderRadius: "8px" }}
                  />
                </Box>
              )}

              {/* Game Info Panel */}
              <Box p={3}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Typography variant="h6" fontWeight="700" gutterBottom>
                      About the Game
                    </Typography>
                    <Typography variant="body1" paragraph color="textSecondary" sx={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
                      {selectedGameDetails.description || selectedGameDetails.short_description}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 5 }}>
                    <Card variant="outlined" sx={{ borderRadius: "12px", p: 2, mb: 3, background: (theme: any) => theme.palette.mode === "dark" ? "#1e293b" : "#f8fafc" }}>
                      <Typography variant="subtitle1" fontWeight="700" gutterBottom borderBottom="1px solid" borderColor="divider" pb={1}>
                        Metadata
                      </Typography>
                      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                        <Grid size={6}>
                          <Typography variant="caption" color="textSecondary">Platform</Typography>
                          <Typography variant="body2" fontWeight="600">{selectedGameDetails.platform}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="textSecondary">Genre</Typography>
                          <Typography variant="body2" fontWeight="600">{selectedGameDetails.genre}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="textSecondary">Developer</Typography>
                          <Typography variant="body2" fontWeight="600">{selectedGameDetails.developer}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="textSecondary">Publisher</Typography>
                          <Typography variant="body2" fontWeight="600">{selectedGameDetails.publisher}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="textSecondary">Release Date</Typography>
                          <Typography variant="body2" fontWeight="600">{selectedGameDetails.release_date}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="textSecondary">Status</Typography>
                          <Chip label={selectedGameDetails.status} size="small" color="success" sx={{ height: "20px", fontWeight: "600" }} />
                        </Grid>
                      </Grid>
                    </Card>

                    {/* Minimum System Requirements */}
                    {selectedGameDetails.minimum_system_requirements && (
                      <Card variant="outlined" sx={{ borderRadius: "12px", p: 2, background: (theme: any) => theme.palette.mode === "dark" ? "#1e293b" : "#f8fafc" }}>
                        <Typography variant="subtitle1" fontWeight="700" gutterBottom borderBottom="1px solid" borderColor="divider" pb={1}>
                          Minimum PC Specifications
                        </Typography>
                        <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                          {selectedGameDetails.minimum_system_requirements.os && (
                            <Grid size={12}>
                              <Typography variant="caption" color="textSecondary">OS</Typography>
                              <Typography variant="body2" fontWeight="500">{selectedGameDetails.minimum_system_requirements.os}</Typography>
                            </Grid>
                          )}
                          {selectedGameDetails.minimum_system_requirements.processor && (
                            <Grid size={12}>
                              <Typography variant="caption" color="textSecondary">Processor (CPU)</Typography>
                              <Typography variant="body2" fontWeight="500">{selectedGameDetails.minimum_system_requirements.processor}</Typography>
                            </Grid>
                          )}
                          {selectedGameDetails.minimum_system_requirements.memory && (
                            <Grid size={12}>
                              <Typography variant="caption" color="textSecondary">Memory (RAM)</Typography>
                              <Typography variant="body2" fontWeight="500">{selectedGameDetails.minimum_system_requirements.memory}</Typography>
                            </Grid>
                          )}
                          {selectedGameDetails.minimum_system_requirements.graphics && (
                            <Grid size={12}>
                              <Typography variant="caption" color="textSecondary">Graphics (GPU)</Typography>
                              <Typography variant="body2" fontWeight="500">{selectedGameDetails.minimum_system_requirements.graphics}</Typography>
                            </Grid>
                          )}
                          {selectedGameDetails.minimum_system_requirements.storage && (
                            <Grid size={12}>
                              <Typography variant="caption" color="textSecondary">Storage</Typography>
                              <Typography variant="body2" fontWeight="500">{selectedGameDetails.minimum_system_requirements.storage}</Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Card>
                    )}
                  </Grid>
                </Grid>
              </Box>

              {/* Action Buttons */}
              <Box p={3} borderTop="1px solid" borderColor="divider" display="flex" justifyContent="flex-end" gap={2}>
                <Button variant="outlined" onClick={handleCloseDetails} sx={{ borderRadius: "8px" }}>
                  Close
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  endIcon={<LaunchIcon />}
                  href={selectedGameDetails.game_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    borderRadius: "8px",
                    background: "linear-gradient(to right, #a855f7, #ec4899)"
                  }}
                >
                  Play Game
                </Button>
              </Box>
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Gaming;
