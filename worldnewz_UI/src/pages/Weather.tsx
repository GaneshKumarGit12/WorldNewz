import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { fetchWeather } from "../api/apiClient";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import SectionStatus from "../components/SectionStatus";

type DailyForecast = {
  date?: string;
  weatherCode?: number;
  minTemp?: number;
  maxTemp?: number;
  precipitationSum?: number;
  uvIndex?: number;
  windSpeedMax?: number;
  sunrise?: string;
  sunset?: string;
};

type WeatherApiResponse = {
  location?: {
    city?: string;
    country?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
  };
  current?: {
    temperature?: number;
    windSpeed?: number;
    weatherCode?: number;
    time?: string;
  };
  daily?: DailyForecast[];
  error?: string;
};

const weatherCodeMap: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Depositing rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Moderate drizzle", icon: "🌦️" },
  55: { label: "Dense drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌧️" },
  63: { label: "Moderate rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "⛈️" },
  71: { label: "Light snow", icon: "🌨️" },
  73: { label: "Snow", icon: "❄️" },
  75: { label: "Heavy snow", icon: "❄️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with hail", icon: "⛈️" },
  99: { label: "Severe hail", icon: "🌩️" },
};

const getWeatherLabel = (code?: number) => {
  if (code == null) return "Unknown";
  return weatherCodeMap[code]?.label ?? "Unknown";
};

const getWeatherIcon = (code?: number) => {
  if (code == null) return "🌈";
  return weatherCodeMap[code]?.icon ?? "🌈";
};

const formatDate = (value?: string) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const Weather: React.FC = () => {
  const outletContext = useOutletContext<{ searchTerm?: string }>();
  const searchTerm = outletContext?.searchTerm ?? "";
  const [weather, setWeather] = useState<WeatherApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const weatherText = `${weather?.location?.city ?? ""} ${weather?.location?.country ?? ""} ${getWeatherLabel(weather?.current?.weatherCode)} ${weather?.location?.timezone ?? ""}`.toLowerCase();
  const weatherMatches = normalizedSearchTerm === "" || weatherText.includes(normalizedSearchTerm);
  const dailyForecasts = weather?.daily?.slice(0, 7) ?? [];
  const filteredDaily = normalizedSearchTerm
    ? dailyForecasts.filter((day) => {
        const dayText = `${formatDate(day.date)} ${getWeatherLabel(day.weatherCode)} ${day.precipitationSum ?? ""} ${day.windSpeedMax ?? ""}`.toLowerCase();
        return dayText.includes(normalizedSearchTerm);
      })
    : dailyForecasts;
  const weatherEmptyText = normalizedSearchTerm ? "No weather results match your search." : "No weather data available.";

  useEffect(() => {
    fetchWeather()
      .then((res) => {
        setWeather(res.data);
      })
      .catch((error) => {
        console.error("Error fetching weather:", error);
        const message = error instanceof Error ? error.message : "Failed to load weather data";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  const cityName = weather?.location?.city ?? "Your city";
  const countryName = weather?.location?.country;
  const currentTemp = weather?.current?.temperature;
  const currentLabel = getWeatherLabel(weather?.current?.weatherCode);
  const currentIcon = getWeatherIcon(weather?.current?.weatherCode);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Weather Dashboard
      </Typography>

      <SectionStatus
        loading={loading}
        error={error}
        hasData={weatherMatches || filteredDaily.length > 0}
        emptyText={weatherEmptyText}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ minHeight: 260 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {cityName}{countryName ? `, ${countryName}` : ""}
                </Typography>
                <Typography variant="h1" sx={{ fontSize: { xs: "3rem", md: "4rem" }, lineHeight: 1 }}>
                  {currentTemp?.toFixed(0) ?? "—"}°
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {currentIcon} {currentLabel}
                </Typography>
                <Typography color="text.secondary">
                  {weather?.location?.timezone ?? "Local time"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ minHeight: 260 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Today’s details
                </Typography>
                <Typography>
                  Wind: {weather?.current?.windSpeed?.toFixed(1) ?? "—"} m/s
                </Typography>
                <Typography>
                  Forecast: {currentLabel}
                </Typography>
                <Typography>
                  Updated: {weather?.current?.time ? new Date(weather.current.time).toLocaleString() : "—"}
                </Typography>
                <Typography sx={{ mt: 2, color: "text.secondary" }}>
                  Open-Meteo daily forecast cached for 15 minutes.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              7-day forecast
            </Typography>
            <Grid container spacing={2}>
              {filteredDaily.map((day, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={`${day.date}-${index}`}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {formatDate(day.date)}
                      </Typography>
                      <Typography variant="h4" sx={{ mb: 1 }}>
                        {getWeatherIcon(day.weatherCode)}
                      </Typography>
                      <Typography>{getWeatherLabel(day.weatherCode)}</Typography>
                      <Typography sx={{ mt: 1 }}>
                        {day.maxTemp?.toFixed(0) ?? "—"}° / {day.minTemp?.toFixed(0) ?? "—"}°
                      </Typography>
                      <Typography variant="caption" display="block">
                        Precip: {day.precipitationSum?.toFixed(1) ?? "0"} mm
                      </Typography>
                      <Typography variant="caption" display="block">
                        Wind: {day.windSpeedMax?.toFixed(1) ?? "—"} m/s
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </SectionStatus>
    </Box>
  );
};

export default Weather;
