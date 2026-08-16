import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { fetchWeather } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Tooltip from "@mui/material/Tooltip";
import SearchIcon from "@mui/icons-material/Search";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SectionStatus from "../components/SectionStatus";
import { CategoryEditorial } from "../components/CategoryEditorial";

type CurrentWeather = {
  temperatureC?: number;
  temperatureF?: number;
  feelsLikeC?: number;
  feelsLikeF?: number;
  minTempC?: number;
  maxTempC?: number;
  minTempF?: number;
  maxTempF?: number;
  humidity?: number;
  windSpeedKmH?: number;
  windDirectionDeg?: number;
  windDirectionCompass?: string;
  pressureHPa?: number;
  visibilityMeters?: number;
  weatherCode?: number;
  time?: string;
};

type HourlyForecast = {
  time?: string;
  temperatureC?: number;
  temperatureF?: number;
  weatherCode?: number;
  rainProbability?: number;
  precipitationMm?: number;
  windSpeedKmH?: number;
};

type DailyForecast = {
  date?: string;
  weatherCode?: number;
  minTempC?: number;
  maxTempC?: number;
  minTempF?: number;
  maxTempF?: number;
  precipitationSumMm?: number;
  rainProbabilityMax?: number;
  uVIndexMax?: number;
  windSpeedMaxKmH?: number;
  sunrise?: string;
  sunset?: string;
  moonPhaseValue?: number;
  moonPhaseName?: string;
};

type AirQualityMetrics = {
  uS_AQI?: number;
  us_AQI?: number;
  statusLabel?: string;
  healthAdvisory?: string;
  pM2_5?: number;
  pm2_5?: number;
  pM10?: number;
  pm10?: number;
  co?: number;
  nO2?: number;
  no2?: number;
  sO2?: number;
  so2?: number;
  o3?: number;
};

type WeatherAlert = {
  severity?: string;
  title?: string;
  message?: string;
  icon?: string;
};

type WeatherApiResponse = {
  location?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  current?: CurrentWeather;
  hourly?: HourlyForecast[];
  daily?: DailyForecast[];
  airQuality?: AirQualityMetrics;
  alerts?: WeatherAlert[];
  error?: string;
};

const weatherCodeMap: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear Sky", icon: "☀️" },
  1: { label: "Mainly Clear", icon: "🌤️" },
  2: { label: "Partly Cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Freezing Fog", icon: "🌫️" },
  51: { label: "Light Drizzle", icon: "🌦️" },
  53: { label: "Moderate Drizzle", icon: "🌦️" },
  55: { label: "Dense Drizzle", icon: "🌧️" },
  61: { label: "Light Rain", icon: "🌧️" },
  63: { label: "Moderate Rain", icon: "🌧️" },
  65: { label: "Heavy Rain", icon: "⛈️" },
  71: { label: "Light Snow", icon: "🌨️" },
  73: { label: "Moderate Snow", icon: "❄️" },
  75: { label: "Heavy Snow", icon: "❄️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with Hail", icon: "⛈️" },
  99: { label: "Heavy Hailstorm", icon: "🌩️" },
};

const getWeatherMeta = (code?: number) => {
  if (code == null) return weatherCodeMap[2];
  return weatherCodeMap[code] ?? weatherCodeMap[2];
};

const formatDateDayName = (dateStr?: string) => {
  if (!dateStr) return "Thu";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short" });
};

export const Weather: React.FC = () => {
  const outletContext = useOutletContext<{ searchTerm?: string }>();
  const globalSearchTerm = outletContext?.searchTerm ?? "";

  const [weather, setWeather] = useState<WeatherApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [unit, setUnit] = useState<"C" | "F">(() => {
    return (localStorage.getItem("weather_temp_unit") as "C" | "F") || "C";
  });
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("weather_favorite_cities");
      return saved ? JSON.parse(saved) : ["Hyderabad", "Hanoi", "New York", "London", "Tokyo"];
    } catch {
      return ["Hyderabad", "Hanoi", "New York", "London", "Tokyo"];
    }
  });

  const [notifEnabled, setNotifEnabled] = useState(false);

  const dynamicKeywordsData = useKeywords("weather");
  const combinedKeywords = dynamicKeywordsData
    ? [...new Set([
        'weather forecast', 'live radar', 'temperature', 'air quality index', 'weather map', 'rain radar', 'uv index', '7-day forecast',
        ...dynamicKeywordsData.primary,
        ...dynamicKeywordsData.longtail,
        ...dynamicKeywordsData.trending
      ])]
    : ['weather forecast', 'live radar', 'temperature', 'air quality index', 'weather map', 'rain radar'];

  const loadWeatherData = (city?: string, lat?: number, lon?: number) => {
    setLoading(true);
    setError(null);
    fetchWeather({ city, lat, lon })
      .then((res) => {
        if (res.data?.error) {
          setError(res.data.error);
        } else {
          setWeather(res.data);
        }
      })
      .catch((err) => {
        console.error("Error loading weather telemetry:", err);
        setError("Failed to communicate with weather telemetry server. Please check connection.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const searchToUse = globalSearchTerm.trim() || undefined;
    loadWeatherData(searchToUse);
  }, [globalSearchTerm]);

  const handleUnitToggle = (newUnit: "C" | "F") => {
    setUnit(newUnit);
    localStorage.setItem("weather_temp_unit", newUnit);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cityInput.trim()) {
      loadWeatherData(cityInput.trim());
    }
  };

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        loadWeatherData(undefined, pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn("GPS detection denied or failed:", err.message);
        alert("Could not access your location. Showing regional forecast.");
        loadWeatherData("Hyderabad");
      },
      { timeout: 10000 }
    );
  };

  const toggleFavorite = (cityName: string) => {
    let updated: string[];
    if (favorites.includes(cityName)) {
      updated = favorites.filter((c) => c !== cityName);
    } else {
      updated = [...favorites, cityName];
    }
    setFavorites(updated);
    localStorage.setItem("weather_favorite_cities", JSON.stringify(updated));
  };

  const currentCity = weather?.location ?? "Hyderabad";
  const currentCountry = weather?.country;
  const isFavorite = favorites.includes(currentCity);

  const curObj = weather?.current;
  const tempVal = unit === "C" ? (curObj?.temperatureC ?? 22) : (curObj?.temperatureF ?? 71.6);
  const minVal = unit === "C" ? (curObj?.minTempC ?? 18) : (curObj?.minTempF ?? 64.4);
  const maxVal = unit === "C" ? (curObj?.maxTempC ?? 25) : (curObj?.maxTempF ?? 77);
  const weatherMeta = getWeatherMeta(curObj?.weatherCode);

  const dailyList = weather?.daily ?? [];
  const aqiObj = weather?.airQuality;
  const aqiVal = aqiObj?.us_AQI ?? aqiObj?.uS_AQI ?? 14;
  const alerts = weather?.alerts ?? [];

  const titleText = `${currentCity} Weather Forecast & Overview | WorldNewzs`;
  const descText = dynamicKeywordsData?.metaDesc || 
    `Hyper-local weather dashboard for ${currentCity}${currentCountry ? `, ${currentCountry}` : ""}: ${tempVal.toFixed(0)}°${unit}, ${weatherMeta.label}. AQI air quality index, UV index, wind metrics, and 7-day temperature trends.`;

  // Structured Data (Schema.org WeatherForecast)
  const schemaOrgJSON = {
    "@context": "https://schema.org",
    "@type": "WeatherForecast",
    "name": `${currentCity} Live Weather Overview`,
    "description": descText,
    "url": "https://worldnewzs.in/weather",
    "validFrom": new Date().toISOString(),
    "spatialCoverage": {
      "@type": "Place",
      "name": currentCity,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": currentCountry ?? "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": weather?.latitude ?? 17.385,
        "longitude": weather?.longitude ?? 78.4867
      }
    }
  };

  return (
    <Box
      id="weather-page-root"
      component="section"
      sx={{
        minHeight: "100vh",
        bgcolor: "#090e17",
        color: "#f8fafc",
        py: 4,
        px: { xs: 2, md: 4 },
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <SEOMeta title={titleText} description={descText} keywords={combinedKeywords} canonical="https://worldnewzs.in/weather" />
      <JSONLDBreadcrumb crumbs={[
        { name: "Home", url: "https://worldnewzs.in" },
        { name: "Weather Overview", url: "https://worldnewzs.in/weather" }
      ]} />
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgJSON) }} />

      {/* Top Header & Search Bar */}
      <Box component="header" sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h3" component="h1" id="weather-main-heading" sx={{ fontWeight: 900, fontSize: { xs: "1.8rem", md: "2.2rem" }, color: "#fff" }}>
              Weather Dashboard
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
              <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: "flex", gap: 1, flex: { xs: "1 1 100%", sm: "0 1 280px" } }}>
                <TextField
                  id="weather-search-input"
                  placeholder="Search city..."
                  size="small"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  fullWidth
                  sx={{
                    bgcolor: "#111a2e",
                    borderRadius: 2,
                    input: { color: "#fff", fontSize: "0.9rem" },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.12)" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#38bdf8" },
                  }}
                />
                <Button
                  id="weather-search-btn"
                  type="submit"
                  variant="contained"
                  sx={{ bgcolor: "#2563eb", color: "#fff", fontWeight: 800, "&:hover": { bgcolor: "#3b82f6" } }}
                >
                  <SearchIcon />
                </Button>
              </Box>

              <Tooltip title="GPS Auto-Detect Location">
                <IconButton
                  id="gps-location-btn"
                  onClick={handleGpsDetect}
                  sx={{ bgcolor: "#111a2e", color: "#38bdf8", border: "1px solid rgba(255,255,255,0.12)", "&:hover": { bgcolor: "rgba(56, 189, 248, 0.2)" } }}
                >
                  <MyLocationIcon />
                </IconButton>
              </Tooltip>

              <Box sx={{ bgcolor: "#111a2e", p: 0.5, borderRadius: 2, display: "flex", border: "1px solid rgba(255,255,255,0.12)" }}>
                <Button
                  id="unit-c-btn"
                  size="small"
                  onClick={() => handleUnitToggle("C")}
                  sx={{
                    px: 1.2,
                    minWidth: "auto",
                    fontWeight: 800,
                    borderRadius: 1.5,
                    bgcolor: unit === "C" ? "#2563eb" : "transparent",
                    color: "#fff",
                  }}
                >
                  °C
                </Button>
                <Button
                  id="unit-f-btn"
                  size="small"
                  onClick={() => handleUnitToggle("F")}
                  sx={{
                    px: 1.2,
                    minWidth: "auto",
                    fontWeight: 800,
                    borderRadius: 1.5,
                    bgcolor: unit === "F" ? "#2563eb" : "transparent",
                    color: "#fff",
                  }}
                >
                  °F
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Favorite Cities Chips */}
        <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap", alignItems: "center" }}>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
            Saved:
          </Typography>
          {favorites.map((fav) => (
            <Chip
              key={fav}
              id={`fav-city-${fav.toLowerCase().replace(/\s+/g, '-')}`}
              label={fav}
              onClick={() => loadWeatherData(fav)}
              onDelete={() => toggleFavorite(fav)}
              variant={fav.toLowerCase() === currentCity.toLowerCase() ? "filled" : "outlined"}
              sx={{
                bgcolor: fav.toLowerCase() === currentCity.toLowerCase() ? "#2563eb" : "rgba(255,255,255,0.04)",
                color: "#f8fafc",
                borderColor: "rgba(255,255,255,0.1)",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Main Section Status */}
      <SectionStatus loading={loading} error={error} hasData={weather != null} emptyText="No weather telemetry available for this location.">
        {weather && (
          <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
            
            {/* Severe Weather Alerts if any */}
            {alerts.length > 0 && (
              <Box id="weather-alerts-container" sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {alerts.map((alt, idx) => (
                  <Alert
                    key={idx}
                    severity={alt.severity === "Severe" || alt.severity === "Warning" ? "warning" : "info"}
                    variant="filled"
                    sx={{ borderRadius: 3, fontWeight: 700 }}
                  >
                    <AlertTitle sx={{ fontWeight: 900 }}>{alt.icon} {alt.title}</AlertTitle>
                    {alt.message}
                  </Alert>
                ))}
              </Box>
            )}

            {/* SECTION 1: OVERVIEW ROW */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: "#f8fafc" }}>
                Overview
              </Typography>

              <Grid container spacing={2.5}>
                {/* 1. TEMPERATURE CARD */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card
                    id="overview-temperature-card"
                    sx={{
                      bgcolor: "#111c33",
                      background: "linear-gradient(145deg, #111c33 0%, #15223e 100%)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "20px",
                      color: "#fff",
                      height: "100%",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                      display: "flex",
                      flexDirection: "column",
                      justify: "space-between",
                      p: 3,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="subtitle1" sx={{ color: "#94a3b8", fontWeight: 700 }}>
                        Temperature
                      </Typography>
                      <IconButton size="small" onClick={() => toggleFavorite(currentCity)} sx={{ color: isFavorite ? "#f59e0b" : "rgba(255,255,255,0.3)" }}>
                        {isFavorite ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                      </IconButton>
                    </Box>

                    {/* Main Temp & Cloud Rain Icon */}
                    <Box sx={{ my: 3 }}>
                      <Box sx={{ fontSize: "3.5rem", lineHeight: 1, mb: 1 }}>
                        {weatherMeta.icon}
                      </Box>
                      <Typography variant="h1" sx={{ fontSize: "3.8rem", fontWeight: 900, lineHeight: 1 }}>
                        {tempVal.toFixed(0)}°{unit}
                      </Typography>
                    </Box>

                    {/* Low/High Range Pill & Location */}
                    <Box>
                      <Box sx={{ display: "flex", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
                        <Box sx={{ bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", px: 2, py: 0.6, display: "flex", gap: 1, alignItems: "baseline" }}>
                          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>L</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{minVal.toFixed(0)}°{unit}</Typography>
                        </Box>

                        <Box sx={{ bgcolor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", px: 2, py: 0.6, display: "flex", gap: 1, alignItems: "baseline" }}>
                          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>H</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{maxVal.toFixed(0)}°{unit}</Typography>
                        </Box>
                      </Box>

                      <Typography variant="body2" sx={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: 0.5, fontWeight: 600 }}>
                        <LocationOnIcon sx={{ fontSize: 18, color: "#64748b" }} /> {currentCity}{currentCountry ? `, ${currentCountry}` : ""}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>

                {/* 2. AIR QUALITY CARD (Radial Dot Ring) */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card
                    id="overview-air-quality-card"
                    sx={{
                      bgcolor: "#111c33",
                      background: "linear-gradient(145deg, #111c33 0%, #15223e 100%)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "20px",
                      color: "#fff",
                      height: "100%",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                      display: "flex",
                      flexDirection: "column",
                      justify: "space-between",
                      p: 3,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="subtitle1" sx={{ color: "#94a3b8", fontWeight: 700 }}>
                        Air Quality
                      </Typography>
                      <IconButton size="small" sx={{ color: "rgba(255,255,255,0.3)" }}>
                        <KeyboardArrowDownIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* SVG Dotted Radial Ring Meter */}
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", my: 2, position: "relative", height: 160 }}>
                      <svg width="160" height="160" viewBox="0 0 160 160">
                        {Array.from({ length: 32 }).map((_, i) => {
                          const angle = (i * 360) / 32;
                          const rad = (angle * Math.PI) / 180;
                          const cx = 80 + 60 * Math.cos(rad);
                          const cy = 80 + 60 * Math.sin(rad);
                          const isActive = i < 24; // active dotted portion
                          return (
                            <circle
                              key={i}
                              cx={cx}
                              cy={cy}
                              r={isActive ? 2.5 : 1.8}
                              fill={isActive ? (i < 12 ? "#10b981" : "#0284c7") : "rgba(255,255,255,0.15)"}
                            />
                          );
                        })}
                      </svg>
                      <Box sx={{ position: "absolute", textAlign: "center" }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1 }}>
                          {aqiVal}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, fontSize: "0.7rem" }}>
                          AQI
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Box sx={{ width: 3, height: 14, bgcolor: "#10b981", borderRadius: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#10b981" }}>
                          {aqiObj?.statusLabel ?? "Good"}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", lineHeight: 1.4 }}>
                        {aqiObj?.healthAdvisory ?? "The air is in standard level and is healthy for everyone."}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>

                {/* 3. WEEKLY TEMPERATURE LINE CHART */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card
                    id="overview-temperature-chart-card"
                    sx={{
                      bgcolor: "#111c33",
                      background: "linear-gradient(145deg, #111c33 0%, #15223e 100%)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "20px",
                      color: "#fff",
                      height: "100%",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                      display: "flex",
                      flexDirection: "column",
                      justify: "space-between",
                      p: 3,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="subtitle1" sx={{ color: "#94a3b8", fontWeight: 700 }}>
                        Temperature
                      </Typography>
                      <Chip
                        label="This week"
                        size="small"
                        deleteIcon={<KeyboardArrowDownIcon sx={{ color: "#fff !important" }} />}
                        onDelete={() => {}}
                        sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "#fff", fontWeight: 700, fontSize: "0.75rem", borderRadius: "12px" }}
                      />
                    </Box>

                    {/* Smooth SVG Line Chart */}
                    <Box sx={{ my: 2, height: 120, position: "relative" }}>
                      <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                        {/* Background subtle grid line */}
                        <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                        
                        {/* Smooth Curve Path */}
                        <path
                          d="M 10 65 Q 50 40 90 60 T 170 30 T 230 50 T 290 45"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                        />

                        {/* Active Day Vertical Dotted Highlight Line */}
                        <line x1="170" y1="10" x2="170" y2="90" stroke="rgba(255,255,255,0.3)" strokeDasharray="2 2" />
                        <circle cx="170" cy="30" r="4.5" fill="#38bdf8" stroke="#090e17" strokeWidth="2" />
                      </svg>
                    </Box>

                    {/* Day Names & Temps Row */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", textAlign: "center" }}>
                      {dailyList.slice(0, 7).map((d, idx) => {
                        const dMax = unit === "C" ? (d.maxTempC ?? 20) : (d.maxTempF ?? 68);
                        const isHighlight = idx === 3;
                        return (
                          <Box key={idx}>
                            <Typography variant="caption" sx={{ color: isHighlight ? "#fff" : "#64748b", fontWeight: isHighlight ? 800 : 600, display: "block", mb: 0.5, fontSize: "0.65rem" }}>
                              {formatDateDayName(d.date)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isHighlight ? "#38bdf8" : "#e2e8f0", fontWeight: isHighlight ? 900 : 700, fontSize: "0.75rem" }}>
                              {dMax.toFixed(0)}°
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* SECTION 2: TODAY'S HIGHLIGHT ROW */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: "#f8fafc" }}>
                Today's Highlight
              </Typography>

              <Grid container spacing={2.5}>
                {/* LEFT HIGHLIGHT GRID (4 SUB-CARDS) */}
                <Grid size={{ xs: 12, md: 7 }}>
                  <Grid container spacing={2}>
                    {/* 1. Wind Status */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card sx={{ bgcolor: "#111c33", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", p: 2.5, color: "#fff" }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, display: "block", mb: 1 }}>
                          Wind Status
                        </Typography>
                        <Box sx={{ height: 40, my: 1 }}>
                          <svg width="100%" height="100%" viewBox="0 0 150 40">
                            <path d="M 0 20 Q 30 5 60 25 T 120 10 T 150 20" fill="none" stroke="#10b981" strokeWidth="2" />
                          </svg>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <Typography variant="h5" sx={{ fontWeight: 900 }}>
                            {curObj?.windSpeedKmH ?? 7.4} <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#94a3b8" }}>km/h</span>
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748b" }}>
                            10:27 AM
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>

                    {/* 2. UV Index */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card sx={{ bgcolor: "#111c33", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", p: 2.5, color: "#fff" }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, display: "block", mb: 1 }}>
                          UV Index
                        </Typography>
                        {/* Semi-circular Gauge */}
                        <Box sx={{ display: "flex", justifyContent: "center", my: 1, position: "relative" }}>
                          <svg width="100" height="50" viewBox="0 0 100 50">
                            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round" />
                            <path d="M 10 50 A 40 40 0 0 1 70 18" fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
                          </svg>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, textAlign: "center" }}>
                          {dailyList[0]?.uVIndexMax?.toFixed(2) ?? "5.50"} <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>UV</span>
                        </Typography>
                      </Card>
                    </Grid>

                    {/* 3. Sunrise & Sunset */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card sx={{ bgcolor: "#111c33", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", p: 2.5, color: "#fff" }}>
                        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, display: "block", mb: 1 }}>
                          Sun rise & Sun set
                        </Typography>
                        {/* Arc Diagram */}
                        <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
                          <svg width="120" height="50" viewBox="0 0 120 50">
                            <path d="M 10 50 A 50 50 0 0 1 110 50" fill="none" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" strokeWidth="1.5" />
                            <circle cx="60" cy="10" r="4" fill="#f59e0b" />
                          </svg>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", textAlign: "center", mt: 0.5 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: "#64748b", display: "block", fontSize: "0.65rem" }}>Sunrise</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.75rem" }}>5:50 AM</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: "#64748b", display: "block", fontSize: "0.65rem" }}>Sunset</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.75rem" }}>6:30 PM</Typography>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>

                    {/* 4. Humidity & Visibility */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 6 }}>
                          <Card sx={{ bgcolor: "#111c33", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", p: 2, color: "#fff" }}>
                            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, display: "block" }}>Humidity</Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, my: 1 }}>
                              <WaterDropIcon sx={{ color: "#0284c7", fontSize: 18 }} />
                              <Typography variant="h6" sx={{ fontWeight: 900 }}>{curObj?.humidity ?? 87}%</Typography>
                            </Box>
                          </Card>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Card sx={{ bgcolor: "#111c33", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", p: 2, color: "#fff" }}>
                            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700, display: "block" }}>Fog Density</Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, my: 1 }}>
                              <VisibilityIcon sx={{ color: "#38bdf8", fontSize: 18 }} />
                              <Typography variant="h6" sx={{ fontWeight: 900 }}>500 m</Typography>
                            </Box>
                          </Card>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>

                {/* RIGHT BANNER / NOTIFICATION CTA CARD */}
                <Grid size={{ xs: 12, md: 5 }}>
                  <Card
                    id="weather-notification-banner-card"
                    sx={{
                      background: "linear-gradient(135deg, #092c3a 0%, #0d4642 100%)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      borderRadius: "20px",
                      color: "#fff",
                      p: 4,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justify: "space-between",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                    }}
                  >
                    <Box>
                      <NotificationsActiveIcon sx={{ fontSize: 32, color: "#34d399", mb: 2 }} />
                      <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.3, letterSpacing: "0.5px" }}>
                        GET AUTOMATIC ALERTS FOR <span style={{ color: "#34d399" }}>SUDDEN WEATHER</span> CHANGES STRAIGHT TO YOUR DEVICE!
                      </Typography>
                    </Box>

                    <Button
                      id="enable-notifications-btn"
                      variant="contained"
                      onClick={() => {
                        setNotifEnabled(!notifEnabled);
                        alert(notifEnabled ? "Weather alerts muted." : "Automatic weather alerts enabled!");
                      }}
                      sx={{
                        bgcolor: "#fff",
                        color: "#0f172a",
                        fontWeight: 900,
                        borderRadius: "30px",
                        py: 1.5,
                        textTransform: "none",
                        fontSize: "0.95rem",
                        "&:hover": { bgcolor: "#f1f5f9" },
                        mt: 3,
                      }}
                    >
                      {notifEnabled ? "Notifications Active ✓" : "Turn on notifications"}
                    </Button>
                  </Card>
                </Grid>
              </Grid>
            </Box>



          </Box>
        )}
      </SectionStatus>

      {/* Category Editorial & FAQ Section */}
      <Box sx={{ mt: 5 }}>
        <CategoryEditorial categoryKey="weather" />
      </Box>
    </Box>
  );
};

export default Weather;
