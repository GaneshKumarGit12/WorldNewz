import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import HomeIcon from "@mui/icons-material/Home";
import Link from "@mui/material/Link";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Link as RouterLink } from "react-router-dom";
import { fetchWeather } from "../api/apiClient";

interface WeatherWidgetData {
  city: string;
  temp: number;
  label: string;
  icon: string;
  aqi: number;
  aqiLabel: string;
  hourly: { time: string; temp: number }[];
  daily: { day: string; temp: string; icon: string }[];
}

const defaultWeatherData: WeatherWidgetData = {
  city: "Kukatpally",
  temp: 28,
  label: "Partly cloudy",
  icon: "⛅",
  aqi: 45,
  aqiLabel: "Good air quality",
  hourly: [
    { time: "Now", temp: 28 },
    { time: "1 AM", temp: 24 },
    { time: "5 AM", temp: 23 },
    { time: "9 AM", temp: 26 },
    { time: "1 PM", temp: 31 },
    { time: "5 PM", temp: 29 },
  ],
  daily: [
    { day: "Mon", temp: "31° / 24°", icon: "🌤️" },
    { day: "Tue", temp: "30° / 23°", icon: "🌧️" },
    { day: "Wed", temp: "32° / 25°", icon: "☀️" },
    { day: "Thu", temp: "29° / 22°", icon: "⛈️" },
    { day: "Fri", temp: "30° / 23°", icon: "⛅" },
    { day: "Sat", temp: "31° / 24°", icon: "🌤️" },
    { day: "Sun", temp: "32° / 24°", icon: "☀️" },
  ],
};

export const WeatherWidget: React.FC = () => {
  const [data, setData] = useState<WeatherWidgetData>(defaultWeatherData);
  const [tabIndex, setTabIndex] = useState(0); // 0: Hourly, 1: Daily, 2: Air quality

  useEffect(() => {
    fetchWeather()
      .then((res) => {
        if (res.data && !res.data.error) {
          const api = res.data;
          const cityName = api.location || "Hyderabad";
          const temp = api.current?.temperature != null ? Math.round(api.current.temperature) : 28;
          const weatherCode = api.current?.weatherCode ?? 2;

          const weatherCodeMap: Record<number, { label: string; icon: string }> = {
            0: { label: "Clear", icon: "☀️" },
            1: { label: "Mainly clear", icon: "🌤️" },
            2: { label: "Partly cloudy", icon: "⛅" },
            3: { label: "Overcast", icon: "☁️" },
            45: { label: "Fog", icon: "🌫️" },
            51: { label: "Light drizzle", icon: "🌦️" },
            61: { label: "Light rain", icon: "🌧️" },
            95: { label: "Thunderstorm", icon: "⛈️" },
          };

          const matched = weatherCodeMap[weatherCode] || { label: "Partly cloudy", icon: "⛅" };

          // Build hourly list based on current temp
          const hourlyTemps = [
            { time: "Now", temp: temp },
            { time: "1 AM", temp: Math.round(temp - 4) },
            { time: "5 AM", temp: Math.round(temp - 5) },
            { time: "9 AM", temp: Math.round(temp - 2) },
            { time: "1 PM", temp: Math.round(temp + 3) },
            { time: "5 PM", temp: Math.round(temp + 1) },
          ];

          // Build daily
          const dailyForecasts = (api.daily || []).slice(0, 7).map((d: any) => {
            const dateObj = new Date(d.date);
            const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
            const matchedForecast = weatherCodeMap[d.weatherCode] || { icon: "⛅" };
            return {
              day: dayName,
              temp: `${Math.round(d.maxTemp)}° / ${Math.round(d.minTemp)}°`,
              icon: matchedForecast.icon,
            };
          });

          setData({
            city: cityName,
            temp,
            label: matched.label,
            icon: matched.icon,
            aqi: 42, // Default standard clean AQI
            aqiLabel: "Good air quality",
            hourly: hourlyTemps,
            daily: dailyForecasts.length > 0 ? dailyForecasts : defaultWeatherData.daily,
          });
        }
      })
      .catch((err) => {
        console.warn("Could not load live weather, using geolocated defaults.", err);
      });
  }, []);

  const handleTabChange = (_e: React.SyntheticEvent, newIndex: number) => {
    setTabIndex(newIndex);
  };

  const renderHourlyChart = () => {
    const temps = data.hourly.map((h) => h.temp);
    const max = Math.max(...temps);
    const min = Math.min(...temps);
    const range = max - min || 1;

    return (
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 110, pt: 2, px: 1 }}>
        {data.hourly.map((hour, idx) => {
          // Calculate height percentage
          const pct = ((hour.temp - min) / range) * 50 + 30; // 30% to 80% height

          return (
            <Box
              key={idx}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
                gap: 0.5,
              }}
            >
              <Typography variant="caption" sx={{ fontSize: "0.75rem", fontWeight: 700, color: "text.primary" }}>
                {hour.temp}°
              </Typography>
              {/* Bar */}
              <Box
                sx={{
                  width: 14,
                  height: `${pct}px`,
                  background: "linear-gradient(to top, #ff8a00, #ffb300)",
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.3s ease-in-out",
                }}
              />
              <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary", whiteSpace: "nowrap" }}>
                {hour.time}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  };

  const renderDailyChart = () => {
    return (
      <Box sx={{ display: "flex", overflowX: "auto", py: 1, gap: 1.5, height: 110, alignItems: "center" }}>
        {data.daily.map((day, idx) => (
          <Box
            key={idx}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: 46,
              bgcolor: "action.hover",
              p: 1,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.7rem", color: "text.secondary" }}>
              {day.day}
            </Typography>
            <Typography variant="body2" sx={{ my: 0.25, fontSize: "1.1rem" }}>
              {day.icon}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.65rem", whiteSpace: "nowrap" }}>
              {day.temp}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const renderAirQuality = () => {
    // AQI ranges: 0-50 Green, 51-100 Yellow, 101+ Orange/Red
    const aqiColor = data.aqi <= 50 ? "#2e7d32" : data.aqi <= 100 ? "#fbc02d" : "#c62828";

    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: 110, px: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            US AQI (Air Quality Index)
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, color: aqiColor }}>
            {data.aqi}
          </Typography>
        </Box>

        {/* Custom progress slider bar */}
        <Box sx={{ width: "100%", height: 8, bgcolor: "action.hover", borderRadius: 4, position: "relative", mb: 1.5 }}>
          <Box
            sx={{
              position: "absolute",
              left: `${Math.min(100, (data.aqi / 150) * 100)}%`,
              top: -3,
              width: 14,
              height: 14,
              borderRadius: "50%",
              bgcolor: aqiColor,
              border: "2px solid #fff",
              boxShadow: 2,
            }}
          />
          {/* Gradient line below */}
          <Box
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: 4,
              background: "linear-gradient(to right, #2e7d32 0%, #2e7d32 33%, #fbc02d 34%, #fbc02d 66%, #c62828 67%)",
              opacity: 0.8,
            }}
          />
        </Box>

        <Typography variant="caption" color="text.secondary">
          Air quality is satisfactory, and air pollution poses little or no risk.
        </Typography>
      </Box>
    );
  };

  return (
    <Card
      sx={{
        background: "linear-gradient(135deg, #0e1e38 0%, #0d1117 100%)",
        color: "#fff",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        height: 380,
        boxShadow: "none",
        "&:hover": { transform: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" },
      }}
    >
      <CardContent sx={{ p: 2.5, pb: "16px !important", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HomeIcon sx={{ color: "#38bdf8" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#e2e8f0" }}>
              {data.city}
            </Typography>
          </Box>
          <IconButton size="small" sx={{ color: "rgba(255,255,255,0.7)" }} id="weather-menu-btn">
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Temperature & Air Quality Indicator */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h2" sx={{ fontSize: "3.5rem", fontWeight: 800, lineHeight: 1, color: "#fff" }}>
              {data.temp}°C
            </Typography>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: "#e2e8f0" }}>
                {data.icon} {data.label}
              </Typography>
            </Box>
          </Box>

          {/* AQI Pill */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              bgcolor: "rgba(34, 197, 94, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              borderRadius: 10,
              px: 1.5,
              py: 0.5,
              cursor: "pointer",
              "&:hover": { bgcolor: "rgba(34, 197, 94, 0.25)" },
            }}
            onClick={() => setTabIndex(2)}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#22c55e", animation: "pulse 2s infinite" }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#4ade80", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 0.25 }}>
              Good air quality <ArrowForwardIosIcon sx={{ fontSize: 8 }} />
            </Typography>
          </Box>
        </Box>

        {/* Interactive Tabs */}
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            minHeight: 32,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            "& .MuiTab-root": {
              textTransform: "none",
              minHeight: 32,
              py: 0.5,
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "rgba(255,255,255,0.6)",
              "&.Mui-selected": { color: "#fff" },
            },
            "& .MuiTabs-indicator": { bgcolor: "#38bdf8" },
          }}
        >
          <Tab label="Hourly" id="weather-tab-hourly" />
          <Tab label="Daily" id="weather-tab-daily" />
          <Tab label="Air quality" id="weather-tab-aqi" />
        </Tabs>

        {/* Charts Body */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {tabIndex === 0 && renderHourlyChart()}
          {tabIndex === 1 && renderDailyChart()}
          {tabIndex === 2 && renderAirQuality()}
        </Box>

        {/* Footer Link */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Link
            component={RouterLink}
            to="/weather"
            id="see-full-forecast-link"
            sx={{
              fontSize: "0.8rem",
              fontWeight: 800,
              color: "#38bdf8",
              "&:hover": { textDecoration: "underline", color: "#60a5fa" },
            }}
          >
            See full forecast
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
};
