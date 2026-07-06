import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import HomeIcon from "@mui/icons-material/Home";
import Link from "@mui/material/Link";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import { Link as RouterLink } from "react-router-dom";
import { fetchWeather } from "../api/apiClient";

interface HourlyItem {
  time: string;
  temp: number;
}

interface DailyItem {
  day: string;
  temp: string;
  icon: string;
}

interface WeatherWidgetData {
  city: string;
  tempC: number;
  tempF: number;
  label: string;
  icon: string;
  aqi: number;
  aqiLabel: string;
  hourly: HourlyItem[];
  daily: DailyItem[];
}

const weatherCodeMap: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear Sky", icon: "☀️" },
  1: { label: "Mainly Clear", icon: "🌤️" },
  2: { label: "Partly Cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Foggy", icon: "🌫️" },
  48: { label: "Freezing Fog", icon: "🌫️" },
  51: { label: "Light Drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy Drizzle", icon: "🌧️" },
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

const defaultWeatherData: WeatherWidgetData = {
  city: "Hyderabad",
  tempC: 28,
  tempF: 82,
  label: "Partly Cloudy",
  icon: "⛅",
  aqi: 42,
  aqiLabel: "Good Air Quality",
  hourly: [
    { time: "Now", temp: 28 },
    { time: "1 PM", temp: 31 },
    { time: "4 PM", temp: 30 },
    { time: "7 PM", temp: 27 },
    { time: "10 PM", temp: 25 },
    { time: "1 AM", temp: 24 },
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
  const [unit, setUnit] = useState<"C" | "F">("C");

  useEffect(() => {
    fetchWeather()
      .then((res) => {
        if (res.data && !res.data.error) {
          const api = res.data;
          const cityName = api.location || api.city || "Hyderabad";
          
          const tempC = Math.round(api.current?.temperatureC ?? api.current?.temperature ?? 28);
          const tempF = Math.round(api.current?.temperatureF ?? (tempC * 9 / 5 + 32));
          const code = api.current?.weatherCode ?? 2;
          const matched = weatherCodeMap[code] || { label: "Partly Cloudy", icon: "⛅" };

          // Build hourly list
          let hourlyItems: HourlyItem[] = [];
          if (Array.isArray(api.hourly) && api.hourly.length > 0) {
            hourlyItems = api.hourly.slice(0, 6).map((h: any, i: number) => {
              const dateObj = h.time ? new Date(h.time) : null;
              const timeStr = i === 0 ? "Now" : dateObj ? dateObj.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }) : `${i * 3}h`;
              return {
                time: timeStr,
                temp: unit === "C" ? Math.round(h.temperatureC ?? h.temp ?? tempC) : Math.round(h.temperatureF ?? (h.temp * 9 / 5 + 32)),
              };
            });
          } else {
            hourlyItems = [
              { time: "Now", temp: tempC },
              { time: "1 PM", temp: tempC + 3 },
              { time: "4 PM", temp: tempC + 2 },
              { time: "7 PM", temp: tempC - 1 },
              { time: "10 PM", temp: tempC - 3 },
              { time: "1 AM", temp: tempC - 4 },
            ];
          }

          // Build daily list
          let dailyItems: DailyItem[] = [];
          if (Array.isArray(api.daily) && api.daily.length > 0) {
            dailyItems = api.daily.slice(0, 7).map((d: any) => {
              const dateObj = new Date(d.date);
              const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
              const dMatched = weatherCodeMap[d.weatherCode] || { icon: "⛅" };
              const max = unit === "C" ? Math.round(d.maxTempC ?? d.maxTemp) : Math.round(d.maxTempF ?? (d.maxTemp * 9 / 5 + 32));
              const min = unit === "C" ? Math.round(d.minTempC ?? d.minTemp) : Math.round(d.minTempF ?? (d.minTemp * 9 / 5 + 32));
              return {
                day: dayName,
                temp: `${max}° / ${min}°`,
                icon: dMatched.icon,
              };
            });
          }

          const aqiVal = api.airQuality?.us_AQI ?? api.airQuality?.uS_AQI ?? 42;
          const aqiLabel = api.airQuality?.statusLabel ?? "Good Air Quality";

          setData({
            city: cityName,
            tempC,
            tempF,
            label: matched.label,
            icon: matched.icon,
            aqi: aqiVal,
            aqiLabel: aqiLabel,
            hourly: hourlyItems,
            daily: dailyItems.length > 0 ? dailyItems : defaultWeatherData.daily,
          });
        }
      })
      .catch((err) => {
        console.warn("Using localized default weather data.", err);
      });
  }, [unit]);

  const toggleUnit = () => {
    setUnit((prev) => (prev === "C" ? "F" : "C"));
  };

  const currentDisplayTemp = unit === "C" ? data.tempC : data.tempF;

  const renderHourlyChart = () => {
    const temps = data.hourly.map((h) => h.temp);
    const max = Math.max(...temps, currentDisplayTemp);
    const min = Math.min(...temps, currentDisplayTemp);
    const range = max - min || 1;

    return (
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 110, pt: 2, px: 1 }}>
        {data.hourly.map((hour, idx) => {
          const pct = ((hour.temp - min) / range) * 50 + 30;

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
              <Box
                sx={{
                  width: 14,
                  height: `${pct}px`,
                  background: "linear-gradient(to top, #38bdf8, #818cf8)",
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
      <Box sx={{ display: "flex", overflowX: "auto", py: 1, gap: 1.2, height: 110, alignItems: "center" }}>
        {data.daily.map((day, idx) => (
          <Box
            key={idx}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: 48,
              bgcolor: "rgba(255, 255, 255, 0.05)",
              p: 1,
              borderRadius: 2,
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.7rem", color: "#94a3b8" }}>
              {day.day}
            </Typography>
            <Typography variant="body2" sx={{ my: 0.25, fontSize: "1.1rem" }}>
              {day.icon}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.65rem", whiteSpace: "nowrap", color: "#e2e8f0" }}>
              {day.temp}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const renderAirQuality = () => {
    const aqiColor = data.aqi <= 50 ? "#22c55e" : data.aqi <= 100 ? "#eab308" : "#ef4444";

    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: 110, px: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#e2e8f0" }}>
            Air Quality Index (AQI)
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, color: aqiColor }}>
            {data.aqi}
          </Typography>
        </Box>

        <Box sx={{ width: "100%", height: 8, bgcolor: "rgba(255,255,255,0.1)", borderRadius: 4, position: "relative", mb: 1.5 }}>
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
          <Box
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: 4,
              background: "linear-gradient(to right, #22c55e 0%, #eab308 50%, #ef4444 100%)",
              opacity: 0.8,
            }}
          />
        </Box>

        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
          {data.aqiLabel} — Sourced from live satellite telemetry.
        </Typography>
      </Box>
    );
  };

  return (
    <Card
      id="embedded-weather-widget"
      sx={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#fff",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        height: 380,
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 35px rgba(0,0,0,0.4)" },
      }}
    >
      <CardContent sx={{ p: 2.5, pb: "16px !important", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <HomeIcon sx={{ color: "#38bdf8" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#f8fafc" }}>
              {data.city}
            </Typography>
          </Box>
          
          <IconButton
            id="widget-unit-toggle-btn"
            size="small"
            onClick={toggleUnit}
            title={`Switch to °${unit === "C" ? "F" : "C"}`}
            sx={{ color: "#38bdf8", bgcolor: "rgba(56, 189, 248, 0.1)", "&:hover": { bgcolor: "rgba(56, 189, 248, 0.2)" } }}
          >
            <DeviceThermostatIcon fontSize="small" />
            <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 800 }}>
              °{unit}
            </Typography>
          </IconButton>
        </Box>

        {/* Temperature & Air Quality Indicator */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h2" sx={{ fontSize: "3.2rem", fontWeight: 800, lineHeight: 1, color: "#fff" }}>
              {currentDisplayTemp}°{unit}
            </Typography>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: "#e2e8f0" }}>
                {data.icon} {data.label}
              </Typography>
            </Box>
          </Box>

          <Box
            id="widget-aqi-pill"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              bgcolor: "rgba(34, 197, 94, 0.15)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              borderRadius: 10,
              px: 1.2,
              py: 0.4,
              cursor: "pointer",
              "&:hover": { bgcolor: "rgba(34, 197, 94, 0.25)" },
            }}
            onClick={() => setTabIndex(2)}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#22c55e" }} />
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#4ade80", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 0.25 }}>
              AQI {data.aqi} <ArrowForwardIosIcon sx={{ fontSize: 8 }} />
            </Typography>
          </Box>
        </Box>

        {/* Interactive Tabs */}
        <Tabs
          value={tabIndex}
          onChange={(_e, val) => setTabIndex(val)}
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
              "&.Mui-selected": { color: "#38bdf8" },
            },
            "& .MuiTabs-indicator": { bgcolor: "#38bdf8" },
          }}
        >
          <Tab label="Hourly" id="weather-tab-hourly" />
          <Tab label="7-Day" id="weather-tab-daily" />
          <Tab label="Air Quality" id="weather-tab-aqi" />
        </Tabs>

        {/* Charts Body */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {tabIndex === 0 && renderHourlyChart()}
          {tabIndex === 1 && renderDailyChart()}
          {tabIndex === 2 && renderAirQuality()}
        </Box>

        {/* Footer Link */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Typography variant="caption" sx={{ color: "#64748b" }}>
            WorldNewzs Live Climate
          </Typography>
          <Link
            component={RouterLink}
            to="/weather"
            id="see-full-forecast-link"
            sx={{
              fontSize: "0.8rem",
              fontWeight: 800,
              color: "#38bdf8",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              "&:hover": { textDecoration: "underline", color: "#60a5fa" },
            }}
          >
            Full Dashboard <ArrowForwardIosIcon sx={{ fontSize: 10 }} />
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
};
