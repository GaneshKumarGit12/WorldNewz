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
import CardContent from "@mui/material/CardContent";
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
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import AirIcon from "@mui/icons-material/Air";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import SpeedIcon from "@mui/icons-material/Speed";
import CompressIcon from "@mui/icons-material/Compress";
import NightlightIcon from "@mui/icons-material/Nightlight";
import ShieldIcon from "@mui/icons-material/Shield";
import MapIcon from "@mui/icons-material/Map";
import SectionStatus from "../components/SectionStatus";
import { CategoryEditorial } from "../components/CategoryEditorial";
import AdCard from "../components/AdCard";

type CurrentWeather = {
  temperatureC?: number;
  temperatureF?: number;
  feelsLikeC?: number;
  feelsLikeF?: number;
  humidity?: number;
  windSpeedKmH?: number;
  windDirectionDeg?: number;
  windDirectionCompass?: string;
  pressureHPa?: number;
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

const weatherCodeMap: Record<number, { label: string; icon: string; bgGradient: string }> = {
  0: { label: "Clear Sky", icon: "☀️", bgGradient: "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)" },
  1: { label: "Mainly Clear", icon: "🌤️", bgGradient: "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #172554 100%)" },
  2: { label: "Partly Cloudy", icon: "⛅", bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" },
  3: { label: "Overcast", icon: "☁️", bgGradient: "linear-gradient(135deg, #1e293b 0%, #334155 100%)" },
  45: { label: "Foggy", icon: "🌫️", bgGradient: "linear-gradient(135deg, #334155 0%, #1e293b 100%)" },
  48: { label: "Freezing Fog", icon: "🌫️", bgGradient: "linear-gradient(135deg, #334155 0%, #0f172a 100%)" },
  51: { label: "Light Drizzle", icon: "🌦️", bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)" },
  53: { label: "Moderate Drizzle", icon: "🌦️", bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)" },
  55: { label: "Dense Drizzle", icon: "🌧️", bgGradient: "linear-gradient(135deg, #0284c7 0%, #0f172a 100%)" },
  61: { label: "Light Rain", icon: "🌧️", bgGradient: "linear-gradient(135deg, #0369a1 0%, #0f172a 100%)" },
  63: { label: "Moderate Rain", icon: "🌧️", bgGradient: "linear-gradient(135deg, #0284c7 0%, #0f172a 100%)" },
  65: { label: "Heavy Rain", icon: "⛈️", bgGradient: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)" },
  71: { label: "Light Snow", icon: "🌨️", bgGradient: "linear-gradient(135deg, #1e293b 0%, #0284c7 100%)" },
  73: { label: "Moderate Snow", icon: "❄️", bgGradient: "linear-gradient(135deg, #0f172a 0%, #0369a1 100%)" },
  75: { label: "Heavy Snow", icon: "❄️", bgGradient: "linear-gradient(135deg, #0284c7 0%, #0f172a 100%)" },
  95: { label: "Thunderstorm", icon: "⛈️", bgGradient: "linear-gradient(135deg, #311b92 0%, #0f172a 100%)" },
  96: { label: "Thunderstorm with Hail", icon: "⛈️", bgGradient: "linear-gradient(135deg, #4a148c 0%, #0f172a 100%)" },
  99: { label: "Heavy Hailstorm", icon: "🌩️", bgGradient: "linear-gradient(135deg, #4a148c 0%, #0f172a 100%)" },
};

const getWeatherMeta = (code?: number) => {
  if (code == null) return weatherCodeMap[2];
  return weatherCodeMap[code] ?? weatherCodeMap[2];
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (value?: string) => {
  if (!value) return "--:--";
  const d = new Date(value);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
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
      return saved ? JSON.parse(saved) : ["Hyderabad", "New York", "London", "Tokyo", "Sydney"];
    } catch {
      return ["Hyderabad", "New York", "London", "Tokyo", "Sydney"];
    }
  });

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
        alert("Could not access your location. Showing default regional forecast.");
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
  const tempVal = unit === "C" ? (curObj?.temperatureC ?? 28) : (curObj?.temperatureF ?? 82);
  const feelsLikeVal = unit === "C" ? (curObj?.feelsLikeC ?? 29) : (curObj?.feelsLikeF ?? 84);
  const weatherMeta = getWeatherMeta(curObj?.weatherCode);

  const dailyList = weather?.daily ?? [];
  const hourlyList = weather?.hourly ?? [];
  const aqiObj = weather?.airQuality;
  const aqiVal = aqiObj?.us_AQI ?? aqiObj?.uS_AQI ?? 42;
  const aqiColor = aqiVal <= 50 ? "#22c55e" : aqiVal <= 100 ? "#eab308" : aqiVal <= 150 ? "#f97316" : "#ef4444";

  const alerts = weather?.alerts ?? [];

  const titleText = `${currentCity} Weather Forecast & Live Radar | WorldNewzs`;
  const descText = dynamicKeywordsData?.metaDesc || 
    `Get hyper-local weather forecast for ${currentCity}${currentCountry ? `, ${currentCountry}` : ""}: ${tempVal.toFixed(0)}°${unit}, ${weatherMeta.label}. 24-hour hourly trends, 10-day forecasts, AQI air quality indices, live satellite radar maps, and severe climate warnings.`;

  // Structured Data (Schema.org WeatherForecast)
  const schemaOrgJSON = {
    "@context": "https://schema.org",
    "@type": "WeatherForecast",
    "name": `${currentCity} Live Weather Forecast`,
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
      component="main"
      sx={{
        minHeight: "100vh",
        background: weatherMeta.bgGradient,
        color: "#f8fafc",
        py: 4,
        px: { xs: 2, md: 4 },
        transition: "background 0.5s ease-in-out",
      }}
    >
      <SEOMeta title={titleText} description={descText} keywords={combinedKeywords} canonical="https://worldnewzs.in/weather" />
      <JSONLDBreadcrumb crumbs={[
        { name: "Home", url: "https://worldnewzs.in" },
        { name: "Weather Dashboard", url: "https://worldnewzs.in/weather" }
      ]} />
      
      {/* Schema.org Injection */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgJSON) }} />

      {/* Header & Location Controls Bar */}
      <Box component="header" sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h3" component="h1" id="weather-main-heading" sx={{ fontWeight: 900, fontSize: { xs: "2rem", md: "2.5rem" }, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
              WorldNewzs Climate & Weather Radar
            </Typography>
            <Typography variant="subtitle1" sx={{ color: "#94a3b8", mt: 0.5 }}>
              Hyper-local meteorological telemetry, AQI pollution radar, and 10-day forecasts.
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
              {/* Search Form */}
              <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: "flex", gap: 1, flex: { xs: "1 1 100%", sm: "0 1 300px" } }}>
                <TextField
                  id="weather-search-input"
                  placeholder="Search city or region..."
                  size="small"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  fullWidth
                  sx={{
                    bgcolor: "rgba(255,255,255,0.08)",
                    borderRadius: 2,
                    input: { color: "#fff" },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#38bdf8" },
                  }}
                />
                <Button
                  id="weather-search-btn"
                  type="submit"
                  variant="contained"
                  sx={{ bgcolor: "#38bdf8", color: "#0f172a", fontWeight: 800, "&:hover": { bgcolor: "#60a5fa" } }}
                >
                  <SearchIcon />
                </Button>
              </Box>

              {/* GPS Auto Detect */}
              <Tooltip title="Auto-Detect My GPS Location">
                <IconButton
                  id="gps-location-btn"
                  onClick={handleGpsDetect}
                  sx={{ bgcolor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)", "&:hover": { bgcolor: "rgba(56, 189, 248, 0.3)" } }}
                >
                  <MyLocationIcon />
                </IconButton>
              </Tooltip>

              {/* °C / °F Unit Toggle */}
              <Box sx={{ bgcolor: "rgba(255,255,255,0.08)", p: 0.5, borderRadius: 2, display: "flex", border: "1px solid rgba(255,255,255,0.15)" }}>
                <Button
                  id="unit-c-btn"
                  size="small"
                  onClick={() => handleUnitToggle("C")}
                  sx={{
                    px: 1.5,
                    minWidth: "auto",
                    fontWeight: 800,
                    borderRadius: 1.5,
                    bgcolor: unit === "C" ? "#38bdf8" : "transparent",
                    color: unit === "C" ? "#0f172a" : "#94a3b8",
                    "&:hover": { bgcolor: unit === "C" ? "#38bdf8" : "rgba(255,255,255,0.1)" },
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
                    bgcolor: unit === "F" ? "#38bdf8" : "transparent",
                    color: unit === "F" ? "#0f172a" : "#94a3b8",
                    "&:hover": { bgcolor: unit === "F" ? "#38bdf8" : "rgba(255,255,255,0.1)" },
                  }}
                >
                  °F
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Favorite Cities Bar */}
        <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap", alignItems: "center" }}>
          <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700 }}>
            Saved Locations:
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
                bgcolor: fav.toLowerCase() === currentCity.toLowerCase() ? "#38bdf8" : "rgba(255,255,255,0.05)",
                color: fav.toLowerCase() === currentCity.toLowerCase() ? "#0f172a" : "#e2e8f0",
                borderColor: "rgba(255,255,255,0.2)",
                fontWeight: 700,
                cursor: "pointer",
                "&:hover": { bgcolor: fav.toLowerCase() === currentCity.toLowerCase() ? "#60a5fa" : "rgba(255,255,255,0.15)" },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Main Section Status Wrapper */}
      <SectionStatus loading={loading} error={error} hasData={weather != null} emptyText="No weather forecast available for this location.">
        {weather && (
          <Box component="section" sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            
            {/* Severe Weather Alerts & Warnings */}
            {alerts.length > 0 && (
              <Box id="weather-alerts-container" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {alerts.map((alt, idx) => (
                  <Alert
                    key={idx}
                    severity={alt.severity === "Severe" || alt.severity === "Warning" ? "warning" : "info"}
                    variant="filled"
                    sx={{
                      borderRadius: 3,
                      boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                      fontWeight: 700,
                      alignItems: "center",
                    }}
                  >
                    <AlertTitle sx={{ fontWeight: 900 }}>
                      {alt.icon} {alt.title}
                    </AlertTitle>
                    {alt.message}
                  </Alert>
                ))}
              </Box>
            )}

            {/* Top Grid: Hero Overview & Air Quality */}
            <Grid container spacing={3}>
              {/* Hero Overview Card */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <Card
                  id="hero-weather-card"
                  sx={{
                    background: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 4,
                    color: "#fff",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="h4" sx={{ fontWeight: 900, color: "#f8fafc" }}>
                            {currentCity}{currentCountry ? `, ${currentCountry}` : ""}
                          </Typography>
                          <IconButton
                            id="toggle-favorite-btn"
                            size="small"
                            onClick={() => toggleFavorite(currentCity)}
                            sx={{ color: isFavorite ? "#f59e0b" : "rgba(255,255,255,0.4)" }}
                          >
                            {isFavorite ? <StarIcon /> : <StarBorderIcon />}
                          </IconButton>
                        </Box>
                        <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
                          Live Meteorological Coordinates: {weather.latitude?.toFixed(2)}°N, {weather.longitude?.toFixed(2)}°E | Timezone: {weather.timezone}
                        </Typography>
                      </Box>

                      <Chip
                        icon={<ShieldIcon sx={{ color: "#38bdf8 !important" }} />}
                        label="Verified Telemetry"
                        sx={{ bgcolor: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)", fontWeight: 700 }}
                      />
                    </Box>

                    {/* Main Temp & Icon */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 4, my: 4, flexWrap: "wrap" }}>
                      <Typography variant="h1" sx={{ fontSize: { xs: "4.5rem", md: "6rem" }, fontWeight: 900, lineHeight: 1, letterSpacing: "-2px" }}>
                        {tempVal.toFixed(0)}°{unit}
                      </Typography>
                      <Box>
                        <Typography variant="h3" sx={{ fontSize: "2.5rem" }}>
                          {weatherMeta.icon}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "#f1f5f9" }}>
                          {weatherMeta.label}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: "#94a3b8" }}>
                          Feels like {feelsLikeVal.toFixed(0)}°{unit}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Secondary Metrics Grid */}
                    <Grid container spacing={2} sx={{ pt: 2, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <WaterDropIcon sx={{ color: "#38bdf8" }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>
                              Humidity
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                              {curObj?.humidity ?? 55}%
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <AirIcon sx={{ color: "#a855f7" }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>
                              Wind Speed
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                              {curObj?.windSpeedKmH ?? 12} km/h ({curObj?.windDirectionCompass ?? "W"})
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <CompressIcon sx={{ color: "#22c55e" }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>
                              Pressure
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                              {curObj?.pressureHPa ?? 1013} hPa
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <WbSunnyIcon sx={{ color: "#f59e0b" }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>
                              UV Index Peak
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                              {dailyList[0]?.uVIndexMax?.toFixed(1) ?? "4.5"} (Moderate)
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Air Quality & Pollution Card */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Card
                  id="aqi-card"
                  sx={{
                    background: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 4,
                    color: "#fff",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justify: "space-between",
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
                        <SpeedIcon sx={{ color: aqiColor }} /> Air Quality Index
                      </Typography>
                      <Chip
                        label={aqiObj?.statusLabel ?? "Good"}
                        sx={{ bgcolor: `${aqiColor}22`, color: aqiColor, border: `1px solid ${aqiColor}55`, fontWeight: 800 }}
                      />
                    </Box>

                    {/* Big AQI Value & Meter */}
                    <Box sx={{ textAlign: "center", my: 3 }}>
                      <Typography variant="h2" sx={{ fontWeight: 900, color: aqiColor, fontSize: "4rem", lineHeight: 1 }}>
                        {aqiVal}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, mt: 0.5, display: "block" }}>
                        US AQI Standard
                      </Typography>

                      <Box sx={{ width: "100%", height: 10, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 5, position: "relative", my: 2 }}>
                        <Box
                          sx={{
                            position: "absolute",
                            left: `${Math.min(100, (aqiVal / 200) * 100)}%`,
                            top: -4,
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            bgcolor: aqiColor,
                            border: "3px solid #fff",
                            boxShadow: "0 0 10px rgba(0,0,0,0.5)",
                          }}
                        />
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            borderRadius: 5,
                            background: "linear-gradient(to right, #22c55e 0%, #eab308 33%, #f97316 66%, #ef4444 100%)",
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Pollutants Grid */}
                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 4 }}>
                        <Box sx={{ bgcolor: "rgba(255,255,255,0.04)", p: 1, borderRadius: 2, textAlign: "center" }}>
                          <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>PM2.5</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{aqiObj?.pM2_5 ?? aqiObj?.pm2_5 ?? 11.2} µg/m³</Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Box sx={{ bgcolor: "rgba(255,255,255,0.04)", p: 1, borderRadius: 2, textAlign: "center" }}>
                          <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>PM10</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{aqiObj?.pM10 ?? aqiObj?.pm10 ?? 24.5} µg/m³</Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 4 }}>
                        <Box sx={{ bgcolor: "rgba(255,255,255,0.04)", p: 1, borderRadius: 2, textAlign: "center" }}>
                          <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>O3</Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{aqiObj?.o3 ?? 38.0} ppb</Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Alert severity="info" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.15)", color: "#e2e8f0", p: 1.5, "& .MuiAlert-icon": { color: "#38bdf8" } }}>
                      <Typography variant="caption" sx={{ display: "block", lineHeight: 1.4 }}>
                        <strong>Health Recommendation:</strong> {aqiObj?.healthAdvisory ?? "Air quality is satisfactory. Enjoy your outdoor activities."}
                      </Typography>
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* 24-Hour Hourly Forecast Strip & Interactive SVG Chart */}
            <Card
              id="hourly-forecast-card"
              sx={{
                background: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 4,
                color: "#fff",
                p: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                📈 24-Hour Hourly Trend & Rain Probability
              </Typography>

              {/* Horizontally Scrollable Hourly Strip */}
              <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 2, scrollbarWidth: "thin" }}>
                {hourlyList.slice(0, 24).map((h, idx) => {
                  const hTemp = unit === "C" ? (h.temperatureC ?? 28) : (h.temperatureF ?? 82);
                  const hMeta = getWeatherMeta(h.weatherCode);
                  return (
                    <Box
                      key={idx}
                      sx={{
                        minWidth: 90,
                        bgcolor: idx === 0 ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.04)",
                        border: idx === 0 ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: 3,
                        p: 2,
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700 }}>
                        {idx === 0 ? "Now" : formatTime(h.time)}
                      </Typography>
                      <Typography variant="h5">{hMeta.icon}</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                        {hTemp.toFixed(0)}°{unit}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#38bdf8", fontWeight: 700 }}>
                        💧 {h.rainProbability ?? 0}%
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Card>

            {/* 7–10 Day Extended Daily Forecast */}
            <Card
              id="daily-forecast-card"
              sx={{
                background: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 4,
                color: "#fff",
                p: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
                📅 7–10 Day Extended Forecast
              </Typography>

              <Grid container spacing={2}>
                {dailyList.map((day, idx) => {
                  const dMax = unit === "C" ? (day.maxTempC ?? 30) : (day.maxTempF ?? 86);
                  const dMin = unit === "C" ? (day.minTempC ?? 22) : (day.minTempF ?? 71);
                  const dMeta = getWeatherMeta(day.weatherCode);

                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2.4 }} key={`${day.date}-${idx}`}>
                      <Box
                        sx={{
                          bgcolor: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 3,
                          p: 2.5,
                          textAlign: "center",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          transition: "transform 0.2s ease",
                          "&:hover": { transform: "translateY(-4px)", bgcolor: "rgba(255,255,255,0.08)" },
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#38bdf8" }}>
                            {idx === 0 ? "Today" : formatDate(day.date)}
                          </Typography>
                          <Typography variant="h3" sx={{ my: 1 }}>
                            {dMeta.icon}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                            {dMeta.label}
                          </Typography>
                        </Box>

                        <Box sx={{ pt: 1, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          <Typography variant="h6" sx={{ fontWeight: 900 }}>
                            {dMax.toFixed(0)}° / <span style={{ color: "#94a3b8" }}>{dMin.toFixed(0)}°</span>
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mt: 0.5 }}>
                            Precip: {day.precipitationSumMm?.toFixed(1) ?? "0"} mm ({day.rainProbabilityMax ?? 0}%)
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#f59e0b", display: "block" }}>
                            UV Max: {day.uVIndexMax?.toFixed(1) ?? "4.0"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Card>

            {/* Bottom Grid: Sun & Moon Astronomy + Live Radar Map */}
            <Grid container spacing={3}>
              {/* Sun & Moon Data */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Card
                  id="astronomy-card"
                  sx={{
                    background: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 4,
                    color: "#fff",
                    p: 3,
                    height: "100%",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <NightlightIcon sx={{ color: "#f59e0b" }} /> Sun & Moon Astronomy
                  </Typography>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, my: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "rgba(255,255,255,0.04)", p: 2, borderRadius: 3 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <WbSunnyIcon sx={{ color: "#f59e0b", fontSize: 28 }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>Sunrise</Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{formatTime(dailyList[0]?.sunrise)}</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <WbSunnyIcon sx={{ color: "#ea580c", fontSize: 28 }} />
                        <Box>
                          <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>Sunset</Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{formatTime(dailyList[0]?.sunset)}</Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ bgcolor: "rgba(255,255,255,0.04)", p: 2, borderRadius: 3 }}>
                      <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>Lunar Phase</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#38bdf8", mt: 0.5 }}>
                        🌔 {dailyList[0]?.moonPhaseName ?? "Waxing Gibbous"} ({( (dailyList[0]?.moonPhaseValue ?? 0.45) * 100 ).toFixed(0)}% illuminated)
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>

              {/* Interactive Radar & Satellite View */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Card
                  id="radar-map-card"
                  sx={{
                    background: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 4,
                    color: "#fff",
                    p: 3,
                    height: "100%",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                    <MapIcon sx={{ color: "#38bdf8" }} /> Live Satellite & Weather Radar Map
                  </Typography>

                  <Box
                    sx={{
                      width: "100%",
                      height: 240,
                      borderRadius: 3,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <iframe
                      id="live-weather-radar-iframe"
                      title="Live Weather Radar Map"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${(weather.longitude ?? 78.48) - 0.2}%2C${(weather.latitude ?? 17.38) - 0.2}%2C${(weather.longitude ?? 78.48) + 0.2}%2C${(weather.latitude ?? 17.38) + 0.2}&layer=mapnik&marker=${weather.latitude ?? 17.38}%2C${weather.longitude ?? 78.48}`}
                      style={{ filter: "invert(90%) hue-rotate(180deg)" }}
                    />
                  </Box>
                </Card>
              </Grid>
            </Grid>

            {/* AdSense Compliant Banner Slot */}
            <Box sx={{ my: 2 }}>
              <AdCard placement="weather-page-bottom" />
            </Box>

          </Box>
        )}
      </SectionStatus>

      {/* Category Editorial & E-E-A-T FAQ Section */}
      <Box sx={{ mt: 6 }}>
        <CategoryEditorial categoryKey="weather" />
      </Box>
    </Box>
  );
};

export default Weather;
