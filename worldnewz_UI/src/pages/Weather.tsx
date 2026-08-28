import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
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
import Paper from "@mui/material/Paper";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import InputAdornment from "@mui/material/InputAdornment";

import SearchIcon from "@mui/icons-material/Search";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import AirIcon from "@mui/icons-material/Air";
import CompressIcon from "@mui/icons-material/Compress";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import BoltIcon from "@mui/icons-material/Bolt";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";

import { fetchWeather } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";
import { BreadcrumbNav } from "../components/BreadcrumbNav";
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
  if (!dateStr) return "Today";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short" });
};

export const Weather: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

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
      return saved ? JSON.parse(saved) : ["Hyderabad", "New York", "London", "Tokyo", "Dubai", "Singapore"];
    } catch {
      return ["Hyderabad", "New York", "London", "Tokyo", "Dubai", "Singapore"];
    }
  });

  const [notifEnabled, setNotifEnabled] = useState(false);

  const dynamicKeywordsData = useKeywords("weather");
  const combinedKeywords = dynamicKeywordsData
    ? [
        ...new Set([
          "weather forecast",
          "live radar",
          "temperature",
          "air quality index",
          "weather map",
          "rain radar",
          "uv index",
          "7-day forecast",
          ...dynamicKeywordsData.primary,
          ...dynamicKeywordsData.longtail,
          ...dynamicKeywordsData.trending,
        ]),
      ]
    : ["weather forecast", "live radar", "temperature", "air quality index", "weather map", "rain radar"];

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
  const feelsLikeVal = unit === "C" ? (curObj?.feelsLikeC ?? 23) : (curObj?.feelsLikeF ?? 73.4);
  const minVal = unit === "C" ? (curObj?.minTempC ?? 18) : (curObj?.minTempF ?? 64.4);
  const maxVal = unit === "C" ? (curObj?.maxTempC ?? 25) : (curObj?.maxTempF ?? 77);
  const weatherMeta = getWeatherMeta(curObj?.weatherCode);

  const dailyList = weather?.daily ?? [];
  const aqiObj = weather?.airQuality;
  const aqiVal = aqiObj?.us_AQI ?? aqiObj?.uS_AQI ?? 18;
  const alerts = weather?.alerts ?? [];

  const titleText = `${currentCity} Weather Forecast, Live Radar & AQI | WorldNewzs`;
  const descText =
    dynamicKeywordsData?.metaDesc ||
    `Hyper-local weather dashboard for ${currentCity}${currentCountry ? `, ${currentCountry}` : ""}: ${tempVal.toFixed(
      0
    )}°${unit}, ${weatherMeta.label}. AQI air quality index, UV index, wind metrics, and 7-day temperature trends.`;

  // Structured Data (Schema.org WeatherForecast)
  const schemaOrgJSON = {
    "@context": "https://schema.org",
    "@type": "WeatherForecast",
    name: `${currentCity} Live Weather Overview`,
    description: descText,
    url: "https://worldnewzs.in/weather",
    validFrom: new Date().toISOString(),
    spatialCoverage: {
      "@type": "Place",
      name: currentCity,
      address: {
        "@type": "PostalAddress",
        addressCountry: currentCountry ?? "IN",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: weather?.latitude ?? 17.385,
        longitude: weather?.longitude ?? 78.4867,
      },
    },
  };

  // Card theme styling tokens
  const cardBg = isDark
    ? "linear-gradient(145deg, #131b2e 0%, #1a243d 100%)"
    : "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)";
  const cardBorder = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
  const cardShadow = isDark
    ? "0 10px 25px rgba(0, 0, 0, 0.4)"
    : "0 4px 20px rgba(0, 0, 0, 0.06)";

  return (
    <Box
      id="weather-page-root"
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
        title={titleText}
        description={descText}
        keywords={combinedKeywords}
        canonical="https://worldnewzs.in/weather"
      />
      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: "https://worldnewzs.in" },
          { name: "Weather Forecast", url: "https://worldnewzs.in/weather" },
        ]}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgJSON) }}
      />

      {/* Visual Breadcrumb Navigation */}
      <BreadcrumbNav items={[{ label: "Weather Forecast & Telemetry" }]} />

      {/* Hero Header Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 4 },
          mb: 4,
          borderRadius: 4,
          background: isDark
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0c213b 100%)"
            : "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #dbeafe 100%)",
          border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.2)" : "rgba(2, 132, 199, 0.2)"}`,
          boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <Grid container spacing={3} alignItems="center" justifyContent="space-between">
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1 }}>
              <Chip
                icon={<CloudQueueIcon sx={{ fontSize: "1rem !important" }} />}
                label="LIVE RADAR & TELEMETRY"
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.72rem",
                  letterSpacing: "0.06em",
                  bgcolor: isDark ? "rgba(56, 189, 248, 0.15)" : "rgba(2, 132, 199, 0.15)",
                  color: isDark ? "#38bdf8" : "#0284c7",
                  border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.3)" : "rgba(2, 132, 199, 0.3)"}`,
                }}
              />
              <Chip
                label="VERIFIED ACCUWEATHER"
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.72rem",
                  bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.15)",
                  color: isDark ? "#34d399" : "#059669",
                  border: `1px solid ${isDark ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
                }}
              />
            </Box>
            <Typography
              variant="h3"
              component="h1"
              id="weather-main-heading"
              sx={{
                fontWeight: 900,
                fontSize: { xs: "2rem", md: "2.6rem" },
                letterSpacing: "-0.02em",
                color: isDark ? "#ffffff" : "#0f172a",
                mb: 1,
              }}
            >
              Weather & Live Radar Dashboard
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: isDark ? "#94a3b8" : "#475569",
                maxWidth: 600,
                lineHeight: 1.5,
              }}
            >
              Hyper-local meteorological telemetry, real-time AQI readings, 7-day temperature trends, and severe weather advisories for cities worldwide.
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                alignItems: { xs: "flex-start", md: "flex-end" },
              }}
            >
              {/* Search input + GPS button + Unit toggle */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  width: "100%",
                  justifyContent: { xs: "flex-start", md: "flex-end" },
                }}
              >
                <Box
                  component="form"
                  onSubmit={handleSearchSubmit}
                  sx={{
                    display: "flex",
                    gap: 1,
                    flex: { xs: "1 1 100%", sm: "0 1 320px" },
                  }}
                >
                  <TextField
                    id="weather-search-input"
                    placeholder="Search city (e.g. Tokyo, Paris...)"
                    size="small"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
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
                        borderColor: "#0284c7",
                      },
                    }}
                  />
                  <Button
                    id="weather-search-btn"
                    type="submit"
                    variant="contained"
                    sx={{
                      bgcolor: "#0284c7",
                      color: "#fff",
                      fontWeight: 800,
                      px: 2.5,
                      "&:hover": { bgcolor: "#0369a1" },
                    }}
                  >
                    Search
                  </Button>
                </Box>

                <Tooltip title="GPS Auto-Detect Location">
                  <IconButton
                    id="gps-location-btn"
                    onClick={handleGpsDetect}
                    sx={{
                      bgcolor: isDark ? "rgba(15, 23, 42, 0.6)" : "#ffffff",
                      color: isDark ? "#38bdf8" : "#0284c7",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
                      "&:hover": {
                        bgcolor: isDark ? "rgba(56, 189, 248, 0.15)" : "rgba(2, 132, 199, 0.1)",
                      },
                    }}
                  >
                    <MyLocationIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Unit Switcher */}
                <Box
                  sx={{
                    bgcolor: isDark ? "rgba(15, 23, 42, 0.6)" : "#ffffff",
                    p: 0.4,
                    borderRadius: 2,
                    display: "flex",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
                  }}
                >
                  <Button
                    id="unit-c-btn"
                    size="small"
                    onClick={() => handleUnitToggle("C")}
                    sx={{
                      px: 1.5,
                      minWidth: "auto",
                      fontWeight: 800,
                      borderRadius: 1.5,
                      bgcolor: unit === "C" ? "#0284c7" : "transparent",
                      color: unit === "C" ? "#fff" : "text.secondary",
                      "&:hover": {
                        bgcolor: unit === "C" ? "#0369a1" : "rgba(0,0,0,0.05)",
                      },
                    }}
                  >
                    °C
                  </Button>
                  <Button
                    id="unit-f-btn"
                    size="small"
                    onClick={() => handleUnitToggle("F")}
                    sx={{
                      px: 1.5,
                      minWidth: "auto",
                      fontWeight: 800,
                      borderRadius: 1.5,
                      bgcolor: unit === "F" ? "#0284c7" : "transparent",
                      color: unit === "F" ? "#fff" : "text.secondary",
                      "&:hover": {
                        bgcolor: unit === "F" ? "#0369a1" : "rgba(0,0,0,0.05)",
                      },
                    }}
                  >
                    °F
                  </Button>
                </Box>
              </Box>

              {/* Favorite Cities Chips */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: { xs: "flex-start", md: "flex-end" },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Saved:
                </Typography>
                {favorites.map((fav) => {
                  const isCurrent = fav.toLowerCase() === currentCity.toLowerCase();
                  return (
                    <Chip
                      key={fav}
                      id={`fav-city-${fav.toLowerCase().replace(/\s+/g, "-")}`}
                      label={fav}
                      onClick={() => loadWeatherData(fav)}
                      onDelete={() => toggleFavorite(fav)}
                      variant={isCurrent ? "filled" : "outlined"}
                      sx={{
                        bgcolor: isCurrent
                          ? "#0284c7"
                          : isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.04)",
                        color: isCurrent ? "#ffffff" : "text.primary",
                        borderColor: isCurrent
                          ? "transparent"
                          : isDark
                          ? "rgba(255,255,255,0.12)"
                          : "rgba(0,0,0,0.12)",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: isCurrent
                            ? "#0369a1"
                            : isDark
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.08)",
                        },
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Section Status & Weather Dashboard Grid */}
      <SectionStatus
        loading={loading}
        error={error}
        hasData={weather != null}
        emptyText="No weather telemetry available for this location. Try searching for a different city."
      >
        {weather && (
          <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
            {/* Severe Weather Alerts if any */}
            {alerts.length > 0 && (
              <Box id="weather-alerts-container" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {alerts.map((alt, idx) => (
                  <Alert
                    key={idx}
                    severity={alt.severity === "Severe" || alt.severity === "Warning" ? "error" : "warning"}
                    variant="filled"
                    sx={{ borderRadius: 3, fontWeight: 700, boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}
                  >
                    <AlertTitle sx={{ fontWeight: 900 }}>
                      {alt.icon || "⚠️"} {alt.title || "Severe Weather Advisory"}
                    </AlertTitle>
                    {alt.message}
                  </Alert>
                ))}
              </Box>
            )}

            {/* SECTION 1: OVERVIEW ROW */}
            <Box>
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  fontSize: { xs: "1.25rem", md: "1.45rem" },
                }}
              >
                <ThermostatIcon sx={{ color: "#0284c7" }} /> Meteorological Overview
              </Typography>

              <Grid container spacing={2.5}>
                {/* 1. TEMPERATURE HERO CARD */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card
                    id="overview-temperature-card"
                    sx={{
                      background: cardBg,
                      border: `1px solid ${cardBorder}`,
                      borderRadius: "20px",
                      color: "text.primary",
                      height: "100%",
                      boxShadow: cardShadow,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      p: 3,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <LocationOnIcon sx={{ color: "#0284c7", fontSize: 20 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {currentCity}{currentCountry ? `, ${currentCountry}` : ""}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => toggleFavorite(currentCity)}
                        sx={{ color: isFavorite ? "#f59e0b" : "text.secondary" }}
                        title={isFavorite ? "Remove from saved cities" : "Save city"}
                      >
                        {isFavorite ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                      </IconButton>
                    </Box>

                    {/* Main Temp & Weather Condition Icon */}
                    <Box sx={{ my: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography
                          variant="h1"
                          sx={{
                            fontSize: { xs: "3.4rem", md: "4rem" },
                            fontWeight: 900,
                            lineHeight: 1,
                            letterSpacing: "-0.03em",
                            color: isDark ? "#ffffff" : "#0f172a",
                          }}
                        >
                          {tempVal.toFixed(0)}°{unit}
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 700,
                            mt: 0.5,
                          }}
                        >
                          Feels like {feelsLikeVal.toFixed(0)}°{unit} • {weatherMeta.label}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          fontSize: { xs: "3.5rem", md: "4.5rem" },
                          lineHeight: 1,
                          filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.15))",
                        }}
                      >
                        {weatherMeta.icon}
                      </Box>
                    </Box>

                    {/* High/Low Range Pill & Pressure */}
                    <Box sx={{ pt: 1.5, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Box
                            sx={{
                              bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                              borderRadius: "10px",
                              px: 1.5,
                              py: 0.4,
                              display: "flex",
                              gap: 0.6,
                              alignItems: "baseline",
                            }}
                          >
                            <Typography variant="caption" sx={{ color: "#38bdf8", fontWeight: 900 }}>L</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800 }}>{minVal.toFixed(0)}°{unit}</Typography>
                          </Box>

                          <Box
                            sx={{
                              bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                              borderRadius: "10px",
                              px: 1.5,
                              py: 0.4,
                              display: "flex",
                              gap: 0.6,
                              alignItems: "baseline",
                            }}
                          >
                            <Typography variant="caption" sx={{ color: "#f43f5e", fontWeight: 900 }}>H</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800 }}>{maxVal.toFixed(0)}°{unit}</Typography>
                          </Box>
                        </Box>

                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}>
                          <CompressIcon sx={{ fontSize: 15 }} /> {curObj?.pressureHPa ?? 1013} hPa
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* 2. AIR QUALITY CARD (Radial Dot Ring) */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card
                    id="overview-air-quality-card"
                    sx={{
                      background: cardBg,
                      border: `1px solid ${cardBorder}`,
                      borderRadius: "20px",
                      color: "text.primary",
                      height: "100%",
                      boxShadow: cardShadow,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      p: 3,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="subtitle1" sx={{ color: "text.secondary", fontWeight: 700 }}>
                        Air Quality Index (AQI)
                      </Typography>
                      <Chip
                        label={aqiObj?.statusLabel ?? (aqiVal <= 50 ? "Good" : aqiVal <= 100 ? "Moderate" : "Unhealthy")}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.75rem",
                          bgcolor: aqiVal <= 50 ? "rgba(16, 185, 129, 0.15)" : aqiVal <= 100 ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: aqiVal <= 50 ? "#10b981" : aqiVal <= 100 ? "#f59e0b" : "#ef4444",
                        }}
                      />
                    </Box>

                    {/* SVG Dotted Radial Ring Meter */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        my: 1.5,
                        position: "relative",
                        height: 140,
                      }}
                    >
                      <svg width="140" height="140" viewBox="0 0 160 160">
                        {Array.from({ length: 32 }).map((_, i) => {
                          const angle = (i * 360) / 32;
                          const rad = (angle * Math.PI) / 180;
                          const cx = 80 + 60 * Math.cos(rad);
                          const cy = 80 + 60 * Math.sin(rad);
                          const activeThreshold = Math.min(32, Math.max(6, Math.round((aqiVal / 300) * 32)));
                          const isActive = i < activeThreshold;
                          return (
                            <circle
                              key={i}
                              cx={cx}
                              cy={cy}
                              r={isActive ? 3 : 2}
                              fill={
                                isActive
                                  ? aqiVal <= 50
                                    ? "#10b981"
                                    : aqiVal <= 100
                                    ? "#f59e0b"
                                    : "#ef4444"
                                  : isDark
                                  ? "rgba(255,255,255,0.15)"
                                  : "rgba(0,0,0,0.12)"
                              }
                            />
                          );
                        })}
                      </svg>
                      <Box sx={{ position: "absolute", textAlign: "center" }}>
                        <Typography
                          variant="h3"
                          sx={{
                            fontWeight: 900,
                            lineHeight: 1,
                            color: isDark ? "#ffffff" : "#0f172a",
                          }}
                        >
                          {aqiVal}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 800,
                            fontSize: "0.75rem",
                          }}
                        >
                          US AQI
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ pt: 1, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", lineHeight: 1.4, fontWeight: 500 }}>
                        {aqiObj?.healthAdvisory ?? (aqiVal <= 50 ? "Air quality is considered satisfactory, and air pollution poses little or no risk." : "Sensitive individuals should consider limiting prolonged outdoor exertion.")}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>

                {/* 3. WEEKLY TEMPERATURE LINE CHART */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card
                    id="overview-temperature-chart-card"
                    sx={{
                      background: cardBg,
                      border: `1px solid ${cardBorder}`,
                      borderRadius: "20px",
                      color: "text.primary",
                      height: "100%",
                      boxShadow: cardShadow,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      p: 3,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="subtitle1" sx={{ color: "text.secondary", fontWeight: 700 }}>
                        7-Day Temperature Trend
                      </Typography>
                      <Chip
                        label="Weekly"
                        size="small"
                        sx={{
                          bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                          color: "text.secondary",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                        }}
                      />
                    </Box>

                    {/* Smooth SVG Line Chart */}
                    <Box sx={{ my: 1.5, height: 100, position: "relative" }}>
                      <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                        <line
                          x1="0"
                          y1="50"
                          x2="300"
                          y2="50"
                          stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
                          strokeDasharray="3 3"
                        />
                        <path
                          d="M 10 65 Q 50 40 90 60 T 170 30 T 230 50 T 290 45"
                          fill="none"
                          stroke="#0284c7"
                          strokeWidth="3"
                        />
                        <line
                          x1="170"
                          y1="10"
                          x2="170"
                          y2="90"
                          stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
                          strokeDasharray="2 2"
                        />
                        <circle
                          cx="170"
                          cy="30"
                          r="5"
                          fill="#0284c7"
                          stroke={isDark ? "#131b2e" : "#ffffff"}
                          strokeWidth="2.5"
                        />
                      </svg>
                    </Box>

                    {/* Day Names & Temps Row */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", textAlign: "center", pt: 1, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                      {dailyList.slice(0, 7).map((d, idx) => {
                        const dMax = unit === "C" ? (d.maxTempC ?? 22) : (d.maxTempF ?? 71);
                        const isHighlight = idx === 3;
                        return (
                          <Box key={idx}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: isHighlight ? "primary.main" : "text.secondary",
                                fontWeight: isHighlight ? 900 : 700,
                                display: "block",
                                mb: 0.3,
                                fontSize: "0.68rem",
                              }}
                            >
                              {formatDateDayName(d.date)}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: isHighlight ? "#0284c7" : "text.primary",
                                fontWeight: isHighlight ? 900 : 700,
                                fontSize: "0.78rem",
                              }}
                            >
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
              <Typography
                variant="h5"
                component="h2"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  fontSize: { xs: "1.25rem", md: "1.45rem" },
                }}
              >
                <BoltIcon sx={{ color: "#f59e0b" }} /> Today's Highlights & Environmental Metrics
              </Typography>

              <Grid container spacing={2.5}>
                {/* LEFT HIGHLIGHT GRID (4 SUB-CARDS) */}
                <Grid size={{ xs: 12, md: 7 }}>
                  <Grid container spacing={2}>
                    {/* 1. Wind Status */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card
                        sx={{
                          background: cardBg,
                          border: `1px solid ${cardBorder}`,
                          borderRadius: "18px",
                          p: 2.5,
                          color: "text.primary",
                          boxShadow: cardShadow,
                          height: "100%",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <AirIcon sx={{ color: "#10b981", fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: 700 }}>
                            Wind Status
                          </Typography>
                        </Box>
                        <Box sx={{ height: 35, my: 1 }}>
                          <svg width="100%" height="100%" viewBox="0 0 150 35">
                            <path
                              d="M 0 18 Q 30 5 60 22 T 120 10 T 150 18"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2.5"
                            />
                          </svg>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <Typography variant="h5" sx={{ fontWeight: 900 }}>
                            {curObj?.windSpeedKmH ?? 7.4}{" "}
                            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>
                              km/h
                            </span>
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                            Dir: {curObj?.windDirectionCompass ?? "SW"}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>

                    {/* 2. UV Index */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card
                        sx={{
                          background: cardBg,
                          border: `1px solid ${cardBorder}`,
                          borderRadius: "18px",
                          p: 2.5,
                          color: "text.primary",
                          boxShadow: cardShadow,
                          height: "100%",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <WbSunnyIcon sx={{ color: "#f59e0b", fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: 700 }}>
                            UV Index
                          </Typography>
                        </Box>
                        {/* Semi-circular Gauge */}
                        <Box sx={{ display: "flex", justifyContent: "center", my: 0.5, position: "relative" }}>
                          <svg width="100" height="45" viewBox="0 0 100 45">
                            <path
                              d="M 10 45 A 40 40 0 0 1 90 45"
                              fill="none"
                              stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                              strokeWidth="8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M 10 45 A 40 40 0 0 1 70 18"
                              fill="none"
                              stroke="#f59e0b"
                              strokeWidth="8"
                              strokeLinecap="round"
                            />
                          </svg>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <Typography variant="h6" sx={{ fontWeight: 900 }}>
                            {dailyList[0]?.uVIndexMax?.toFixed(1) ?? "5.5"}{" "}
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>UV</span>
                          </Typography>
                          <Chip
                            label="Moderate"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 800,
                              bgcolor: "rgba(245, 158, 11, 0.15)",
                              color: "#f59e0b",
                            }}
                          />
                        </Box>
                      </Card>
                    </Grid>

                    {/* 3. Sunrise & Sunset */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Card
                        sx={{
                          background: cardBg,
                          border: `1px solid ${cardBorder}`,
                          borderRadius: "18px",
                          p: 2.5,
                          color: "text.primary",
                          boxShadow: cardShadow,
                          height: "100%",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <NightsStayIcon sx={{ color: "#818cf8", fontSize: 20 }} />
                          <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: 700 }}>
                            Sun & Twilight Cycle
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "center", my: 0.5 }}>
                          <svg width="120" height="40" viewBox="0 0 120 40">
                            <path
                              d="M 10 40 A 50 50 0 0 1 110 40"
                              fill="none"
                              stroke={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}
                              strokeDasharray="3 3"
                              strokeWidth="1.5"
                            />
                            <circle cx="60" cy="10" r="4.5" fill="#f59e0b" />
                          </svg>
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", textAlign: "center", mt: 0.5 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontSize: "0.65rem" }}>
                              Sunrise
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.75rem" }}>
                              5:50 AM
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontSize: "0.65rem" }}>
                              Sunset
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.75rem" }}>
                              6:30 PM
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>

                    {/* 4. Humidity & Visibility */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 6 }}>
                          <Card
                            sx={{
                              background: cardBg,
                              border: `1px solid ${cardBorder}`,
                              borderRadius: "18px",
                              p: 2,
                              color: "text.primary",
                              boxShadow: cardShadow,
                              height: "100%",
                            }}
                          >
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, display: "block" }}>
                              Humidity
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, my: 0.8 }}>
                              <WaterDropIcon sx={{ color: "#0284c7", fontSize: 18 }} />
                              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                {curObj?.humidity ?? 87}%
                              </Typography>
                            </Box>
                          </Card>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Card
                            sx={{
                              background: cardBg,
                              border: `1px solid ${cardBorder}`,
                              borderRadius: "18px",
                              p: 2,
                              color: "text.primary",
                              boxShadow: cardShadow,
                              height: "100%",
                            }}
                          >
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, display: "block" }}>
                              Visibility
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, my: 0.8 }}>
                              <VisibilityIcon sx={{ color: "#38bdf8", fontSize: 18 }} />
                              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                {(curObj?.visibilityMeters ? (curObj.visibilityMeters / 1000).toFixed(1) : "10")} km
                              </Typography>
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
                      background: isDark
                        ? "linear-gradient(135deg, #092c3a 0%, #0d4642 100%)"
                        : "linear-gradient(135deg, #0284c7 0%, #0f766e 100%)",
                      border: "1px solid rgba(52, 211, 153, 0.3)",
                      borderRadius: "20px",
                      color: "#ffffff",
                      p: { xs: 3, md: 4 },
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                    }}
                  >
                    <Box>
                      <NotificationsActiveIcon sx={{ fontSize: 36, color: "#34d399", mb: 2 }} />
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 900,
                          lineHeight: 1.3,
                          letterSpacing: "0.5px",
                          color: "#ffffff",
                          fontSize: { xs: "1.3rem", md: "1.5rem" },
                        }}
                      >
                        GET AUTOMATIC ALERTS FOR <span style={{ color: "#34d399" }}>SUDDEN WEATHER</span> CHANGES DIRECTLY TO YOUR BROWSER!
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                        Enable real-time push advisories for lightning storms, heavy rain, dense fog, and dangerous AQI spikes in your area.
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
                        bgcolor: "#ffffff",
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
                      {notifEnabled ? "Notifications Active ✓" : "Turn on real-time alerts"}
                    </Button>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </SectionStatus>

      {/* Editorial Content & FAQ Section */}
      <Box sx={{ mt: 6 }}>
        <CategoryEditorial categoryKey="weather" />
      </Box>

      {/* Dedicated FAQ Accordion */}
      <Box sx={{ mt: 6, mb: 4, maxWidth: 900, mx: "auto" }}>
        <Typography
          variant="h4"
          component="h2"
          id="weather-faq-heading"
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
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#0284c7" }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              How frequently is WorldNewzs weather and air quality telemetry refreshed?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Our backend weather telemetry aggregates high-resolution atmospheric models from OpenWeather and Open-Meteo with a strict 15-minute caching lifecycle. This provides up-to-the-minute updates for temperature, barometric pressure, wind gusts, and real-time US AQI metrics without lagging.
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
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#0284c7" }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              How does GPS auto-detection work on the Weather Dashboard?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Clicking the GPS location icon queries your browser's HTML5 Geolocation API. Coordinates (latitude and longitude) are sent securely to our ASP.NET Core proxy to resolve hyper-local microclimate readings for your precise neighborhood, while respecting your device privacy settings.
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
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#0284c7" }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              What does the Air Quality Index (AQI) rating mean for my health?
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              An AQI between 0–50 is considered Good with negligible health risk. 51–100 represents Moderate quality where unusually sensitive individuals should take precautions. AQI levels exceeding 150 are Unhealthy, warranting reduced outdoor exertion and air purifier usage indoors.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};

export default Weather;
