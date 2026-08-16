import React, { useEffect, useState, useRef } from "react";
import { 
  Box, Typography, Grid, Paper, Button, 
  Divider, LinearProgress, Alert, CardActionArea, 
  Autocomplete, TextField, CircularProgress, Chip, Stack, Tooltip, IconButton
} from "@mui/material";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import LocalTaxiIcon from "@mui/icons-material/LocalTaxi";
import ElectricRickshawIcon from "@mui/icons-material/ElectricRickshaw";
import StarsIcon from "@mui/icons-material/Stars";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import NavigationIcon from "@mui/icons-material/Navigation";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import TrafficIcon from "@mui/icons-material/Traffic";
import SubwayIcon from "@mui/icons-material/Subway";

import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { 
  bookRide, fetchRideStatus, fetchRideHistory, fetchMapsConfig, 
  fetchPlacesAutocomplete, fetchDistanceMatrix, fetchDirections 
} from "../api/apiClient";
import type { 
  RideBooking, PlaceSuggestion, DistanceMatrixResult, 
  DirectionsResult 
} from "../api/apiClient";

// Dark Theme map styling for Google Maps
const DarkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d4a373" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
];

export const TransportationPage: React.FC = () => {
  const [pickupInput, setPickupInput] = useState<string>("Connaught Place, New Delhi");
  const [destInput, setDestInput] = useState<string>("India Gate, New Delhi");
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<PlaceSuggestion[]>([]);
  const [pickupLoading, setPickupLoading] = useState<boolean>(false);
  const [destLoading, setDestLoading] = useState<boolean>(false);

  const [vehicleType, setVehicleType] = useState<string>("Sedan");
  const [matrixData, setMatrixData] = useState<DistanceMatrixResult | null>(null);
  const [directionsData, setDirectionsData] = useState<DirectionsResult | null>(null);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);

  const email = "user@worldnewzs.in";
  const [booking, setBooking] = useState<RideBooking | null>(null);
  const [history, setHistory] = useState<RideBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [showTraffic, setShowTraffic] = useState<boolean>(true);

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapObj = useRef<any>(null);
  const originMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const trafficLayerRef = useRef<any>(null);

  const statusTimer = useRef<number | null>(null);
  const countdownTimer = useRef<number | null>(null);

  // Load Maps Config & Ride History
  useEffect(() => {
    fetchMapsConfig()
      .then(res => {
        if (res.data.hasValidKey && res.data.apiKey) {
          loadGoogleMapsScript(res.data.apiKey);
        }
      })
      .catch(err => console.error("Maps config error:", err));

    loadHistory();

    return () => {
      clearTimers();
    };
  }, []);

  const loadHistory = () => {
    fetchRideHistory(email)
      .then(res => setHistory(res.data))
      .catch(err => console.error("Error loading ride history:", err));
  };

  const clearTimers = () => {
    if (statusTimer.current) window.clearInterval(statusTimer.current);
    if (countdownTimer.current) window.clearInterval(countdownTimer.current);
  };

  // Dynamically load Google Maps JS SDK script safely
  const loadGoogleMapsScript = (key: string) => {
    if ((window as any).google && (window as any).google.maps) {
      initMap();
      return;
    }
    const scriptId = "google-maps-js-sdk";
    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry,drawing`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initMap();
    };
    document.head.appendChild(script);
  };

  // Initialize interactive Google Map
  const initMap = () => {
    if (!mapRef.current || !(window as any).google) return;
    const google = (window as any).google;

    const mapOptions = {
      center: { lat: 28.6139, lng: 77.2090 }, // Delhi NCR
      zoom: 12,
      styles: DarkMapStyle,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false
    };

    const map = new google.maps.Map(mapRef.current, mapOptions);
    googleMapObj.current = map;

    // Traffic Layer
    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);
    trafficLayerRef.current = trafficLayer;

    // Directions Renderer
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#3b82f6",
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });
    directionsRendererRef.current = directionsRenderer;
  };

  // Debounced Places Autocomplete for Pickup
  useEffect(() => {
    if (!pickupInput || pickupInput.length < 2) {
      setPickupSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      setPickupLoading(true);
      fetchPlacesAutocomplete(pickupInput)
        .then(res => setPickupSuggestions(res.data))
        .catch(err => console.error("Pickup places error:", err))
        .finally(() => setPickupLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [pickupInput]);

  // Debounced Places Autocomplete for Destination
  useEffect(() => {
    if (!destInput || destInput.length < 2) {
      setDestSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      setDestLoading(true);
      fetchPlacesAutocomplete(destInput)
        .then(res => setDestSuggestions(res.data))
        .catch(err => console.error("Destination places error:", err))
        .finally(() => setDestLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [destInput]);

  // Recalculate Distance & Directions whenever pickup, destination, or mode changes
  useEffect(() => {
    if (!pickupInput || !destInput || pickupInput === destInput) return;

    setCalcLoading(true);
    const mode = vehicleType === "Transit" ? "transit" : "driving";

    Promise.all([
      fetchDistanceMatrix(pickupInput, destInput, mode),
      fetchDirections(pickupInput, destInput, mode)
    ])
      .then(([matrixRes, dirRes]) => {
        setMatrixData(matrixRes.data);
        setDirectionsData(dirRes.data);
        renderRouteOnMap(dirRes.data);
      })
      .catch(err => console.error("Route calculation error:", err))
      .finally(() => setCalcLoading(false));
  }, [pickupInput, destInput, vehicleType]);

  // Render Route Polyline & Markers on Google Map
  const renderRouteOnMap = (dir: DirectionsResult) => {
    if (!googleMapObj.current || !(window as any).google) return;
    const google = (window as any).google;
    const map = googleMapObj.current;

    if (dir.originCoords && dir.destinationCoords) {
      const bounds = new google.maps.LatLngBounds();
      const p1 = new google.maps.LatLng(dir.originCoords.lat, dir.originCoords.lng);
      const p2 = new google.maps.LatLng(dir.destinationCoords.lat, dir.destinationCoords.lng);
      bounds.extend(p1);
      bounds.extend(p2);
      map.fitBounds(bounds);

      // Origin Marker
      if (originMarkerRef.current) originMarkerRef.current.setMap(null);
      originMarkerRef.current = new google.maps.Marker({
        position: p1,
        map: map,
        title: "Pickup Point",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#10b981",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2
        }
      });

      // Destination Marker
      if (destMarkerRef.current) destMarkerRef.current.setMap(null);
      destMarkerRef.current = new google.maps.Marker({
        position: p2,
        map: map,
        title: "Destination Point",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2
        }
      });
    }
  };

  // Swap Locations handler
  const handleSwap = () => {
    const temp = pickupInput;
    setPickupInput(destInput);
    setDestInput(temp);
  };

  // Fare calculations
  const distanceKm = matrixData ? (matrixData.distanceMeters / 1000.0) : 5.0;

  const fares: Record<string, number> = {
    Bike: Math.round(15 + distanceKm * 7),
    Auto: Math.round(25 + distanceKm * 12),
    Sedan: Math.round(50 + distanceKm * 16),
    Premium: Math.round(120 + distanceKm * 25),
    Transit: Math.round(10 + distanceKm * 3)
  };

  const etas: Record<string, number> = {
    Bike: Math.round((distanceKm / 45) * 60) + 1,
    Auto: Math.round((distanceKm / 35) * 60) + 2,
    Sedan: Math.round((distanceKm / 40) * 60) + 2,
    Premium: Math.round((distanceKm / 50) * 60) + 1,
    Transit: Math.round((distanceKm / 30) * 60) + 3
  };

  const handleBook = () => {
    if (!pickupInput || !destInput || pickupInput === destInput) {
      setError("Please select distinct Pickup and Destination locations.");
      return;
    }

    setLoading(true);
    setError(null);
    clearTimers();

    bookRide({
      pickupLocation: pickupInput,
      destination: destInput,
      vehicleType: vehicleType,
      userEmail: email
    })
      .then(res => {
        setBooking(res.data);
        setCountdown(res.data.eta || 45);
        setSuccessMsg(`Ride successfully booked! Matched with driver ${res.data.driverName}`);
        startPolling(res.data.id);

        // Start countdown
        countdownTimer.current = window.setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              if (countdownTimer.current) window.clearInterval(countdownTimer.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      })
      .catch(err => {
        setError(err.response?.data?.error || "Failed to book ride. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  const startPolling = (id: number) => {
    statusTimer.current = window.setInterval(() => {
      fetchRideStatus(id)
        .then(res => {
          setBooking(res.data);
          updateDriverMarker(res.data.currentCoords);

          if (res.data.status === "Completed") {
            clearTimers();
            setSuccessMsg("Your trip has been completed! Thank you for riding with WorldNewz.");
            loadHistory();
          }
        })
        .catch(err => console.error("Error polling ride status:", err));
    }, 3000);
  };

  // Update Live Driver Marker Position on Map
  const updateDriverMarker = (coords?: { lat: number; lng: number }) => {
    if (!coords || !googleMapObj.current || !(window as any).google) return;
    const google = (window as any).google;
    const map = googleMapObj.current;

    const pos = new google.maps.LatLng(coords.lat, coords.lng);
    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new google.maps.Marker({
        position: pos,
        map: map,
        title: "Assigned Driver",
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2
        }
      });
    } else {
      driverMarkerRef.current.setPosition(pos);
    }
  };

  const toggleTraffic = () => {
    if (!trafficLayerRef.current) return;
    if (showTraffic) {
      trafficLayerRef.current.setMap(null);
      setShowTraffic(false);
    } else {
      trafficLayerRef.current.setMap(googleMapObj.current);
      setShowTraffic(true);
    }
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0b0f17", color: "#f3f4f6", paddingBottom: "60px" }}>
      <SEOMeta 
        title="Transportation & Cab Booking | Google Maps Platform | WorldNewzs"
        description="Book cabs, bikes, auto rickshaws, and public transit with real-time Google Maps Platform integration, Places Autocomplete, and Directions API."
        keywords={["WorldNewz cabs", "Google Maps transportation", "Uber replica", "Ola replica", "Delhi metro transit", "distance matrix fare", "online cab booking"]}
        canonical="https://worldnewzs.in/transportation"
      />
      <JSONLDBreadcrumb 
        crumbs={[
          { name: "Home", url: "https://worldnewzs.in" },
          { name: "Transportation", url: "https://worldnewzs.in/transportation" }
        ]}
      />

      <Box className="wrap" sx={{ maxWidth: "1240px", margin: "0 auto", px: { xs: 2, sm: 3, md: 3.5 }, pt: 4, pb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: "left" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 900, 
                background: "linear-gradient(90deg, #3b82f6 0%, #10b981 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily: "'Outfit', 'Inter', sans-serif"
              }}
            >
              WorldNewz Transit 🚗
            </Typography>
            <Chip 
              label="GOOGLE MAPS ENABLED" 
              size="small" 
              sx={{ backgroundColor: "#10b981", color: "black", fontWeight: 900, fontSize: "0.75rem" }} 
            />
          </Box>
          <Typography variant="body1" color="text.secondary">
            Powered by Google Maps Platform (Directions, Distance Matrix, Places Autocomplete, and Transit API).
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{successMsg}</Alert>}

        <Grid container spacing={3}>
          {/* Booking & Search Controls Panel */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper 
              elevation={4} 
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                backgroundColor: "#111827", 
                border: "1px solid rgba(255,255,255,0.08)" 
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                <NavigationIcon sx={{ color: "#3b82f6" }} /> Where to?
              </Typography>

              {/* Pickup Location Autocomplete */}
              <Box sx={{ position: "relative", mb: 2 }}>
                <Autocomplete
                  freeSolo
                  id="pickup-location-input"
                  options={pickupSuggestions.map(s => s.description)}
                  value={pickupInput}
                  onInputChange={(_, newValue) => setPickupInput(newValue)}
                  renderInput={(params) => (
                    <TextField 
                      {...params}
                      label="Pickup Location"
                      placeholder="Type city or landmark..."
                      variant="outlined"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <LocationOnIcon sx={{ color: "#10b981", mr: 1 }} />
                        ),
                        endAdornment: (
                          <React.Fragment>
                            {pickupLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </React.Fragment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#1f2937",
                          borderRadius: 3,
                          color: "white"
                        }
                      }}
                    />
                  )}
                />
              </Box>

              {/* Swap Locations Button */}
              <Box sx={{ display: "flex", justifyContent: "center", my: -1, zIndex: 2, position: "relative" }}>
                <Tooltip title="Swap Pickup & Destination">
                  <IconButton 
                    id="swap-locations-button"
                    onClick={handleSwap}
                    sx={{ backgroundColor: "#3b82f6", color: "white", "&:hover": { backgroundColor: "#2563eb" } }}
                  >
                    <SwapVertIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Destination Location Autocomplete */}
              <Box sx={{ position: "relative", mb: 3, mt: 1 }}>
                <Autocomplete
                  freeSolo
                  id="destination-location-input"
                  options={destSuggestions.map(s => s.description)}
                  value={destInput}
                  onInputChange={(_, newValue) => setDestInput(newValue)}
                  renderInput={(params) => (
                    <TextField 
                      {...params}
                      label="Destination"
                      placeholder="Type destination landmark..."
                      variant="outlined"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <LocationOnIcon sx={{ color: "#ef4444", mr: 1 }} />
                        ),
                        endAdornment: (
                          <React.Fragment>
                            {destLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </React.Fragment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "#1f2937",
                          borderRadius: 3,
                          color: "white"
                        }
                      }}
                    />
                  )}
                />
              </Box>

              {/* Distance Matrix Quick Summary Card */}
              {calcLoading ? (
                <LinearProgress sx={{ my: 2, borderRadius: 1 }} />
              ) : matrixData && (
                <Box sx={{ p: 2, mb: 3, borderRadius: 3, backgroundColor: "#1f2937", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Google Distance</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#60a5fa" }}>{matrixData.distanceText}</Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Est. Duration</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#34d399" }}>{matrixData.durationText}</Typography>
                  </Box>
                </Box>
              )}

              {/* Vehicle Category Selector */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "text.secondary" }}>
                Select Travel Mode & Category
              </Typography>

              <Grid container spacing={1.5} sx={{ mb: 3 }}>
                {[
                  { type: "Bike", icon: <DirectionsBikeIcon />, label: "Bike", fare: fares.Bike, eta: etas.Bike },
                  { type: "Auto", icon: <ElectricRickshawIcon />, label: "Auto", fare: fares.Auto, eta: etas.Auto },
                  { type: "Sedan", icon: <LocalTaxiIcon />, label: "Cab", fare: fares.Sedan, eta: etas.Sedan },
                  { type: "Premium", icon: <StarsIcon />, label: "Luxury", fare: fares.Premium, eta: etas.Premium },
                  { type: "Transit", icon: <SubwayIcon />, label: "Metro/Bus", fare: fares.Transit, eta: etas.Transit }
                ].map((item) => {
                  const isSelected = vehicleType === item.type;
                  return (
                    <Grid size={{ xs: 2.4 }} key={item.type}>
                      <CardActionArea 
                        id={`vehicle-type-${item.type.toLowerCase()}`}
                        onClick={() => setVehicleType(item.type)} 
                        sx={{ borderRadius: 2 }}
                      >
                        <Paper 
                          elevation={isSelected ? 4 : 1}
                          sx={{ 
                            p: 1.5, 
                            textAlign: "center", 
                            borderRadius: 2, 
                            backgroundColor: isSelected ? "rgba(59, 130, 246, 0.15)" : "#1f2937",
                            border: isSelected ? "2px solid #3b82f6" : "1px solid rgba(255,255,255,0.05)",
                            color: isSelected ? "#60a5fa" : "white"
                          }}
                        >
                          <Box sx={{ fontSize: 24, mb: 0.5 }}>{item.icon}</Box>
                          <Typography variant="caption" sx={{ fontWeight: 800, display: "block", lineHeight: 1 }}>
                            {item.label}
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, mt: 0.5, color: isSelected ? "#34d399" : "white" }}>
                            ₹{item.fare}
                          </Typography>
                        </Paper>
                      </CardActionArea>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Book Action Button */}
              <Button
                id="book-ride-button"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                onClick={handleBook}
                sx={{ 
                  py: 1.8, 
                  borderRadius: 3, 
                  fontWeight: 900, 
                  fontSize: "1.1rem",
                  backgroundColor: "#3b82f6",
                  "&:hover": { backgroundColor: "#2563eb" }
                }}
              >
                {loading ? <CircularProgress size={26} color="inherit" /> : `Book ${vehicleType} (₹${fares[vehicleType]})`}
              </Button>
            </Paper>

            {/* Turn-by-Turn Directions Steps Preview */}
            {directionsData && directionsData.steps.length > 0 && (
              <Paper 
                elevation={3} 
                sx={{ mt: 3, p: 2.5, borderRadius: 4, backgroundColor: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <DirectionsBusIcon sx={{ color: "#34d399" }} /> Directions Route Steps ({directionsData.steps.length})
                </Typography>
                <Box sx={{ maxHeight: 220, overflowY: "auto", pr: 1 }}>
                  {directionsData.steps.map((step, idx) => (
                    <Box key={idx} sx={{ mb: 1.5, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                      <Chip label={idx + 1} size="small" sx={{ height: 20, fontSize: "0.7rem", backgroundColor: "#3b82f6", color: "white" }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{step.instruction}</Typography>
                        <Typography variant="caption" color="text.secondary">{step.distance} • {step.duration}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}
          </Grid>

          {/* Map & Live Tracking Window */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper 
              elevation={4} 
              sx={{ 
                height: 520, 
                borderRadius: 4, 
                overflow: "hidden", 
                border: "1px solid rgba(255,255,255,0.08)",
                position: "relative",
                backgroundColor: "#0d1117"
              }}
            >
              {/* Map Toolbar */}
              <Box 
                sx={{ 
                  position: "absolute", 
                  top: 16, 
                  right: 16, 
                  zIndex: 10, 
                  display: "flex", 
                  gap: 1, 
                  backgroundColor: "rgba(17, 24, 39, 0.85)", 
                  backdropFilter: "blur(8px)",
                  p: 1, 
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.1)"
                }}
              >
                <Tooltip title="Toggle Traffic Overlay">
                  <IconButton 
                    id="toggle-traffic-button"
                    onClick={toggleTraffic} 
                    size="small" 
                    sx={{ color: showTraffic ? "#34d399" : "text.secondary" }}
                  >
                    <TrafficIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Google Map Canvas Container */}
              <Box ref={mapRef} id="google-map-container" sx={{ width: "100%", height: "100%" }} />
            </Paper>

            {/* Active Booking Live Tracking Card */}
            {booking && (
              <Paper 
                elevation={4} 
                sx={{ 
                  mt: 3, 
                  p: 3, 
                  borderRadius: 4, 
                  backgroundColor: "#111827", 
                  border: "1px solid rgba(255,255,255,0.08)" 
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon sx={{ color: "#34d399" }} />
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      Active Ride Status: <span style={{ color: "#3b82f6" }}>{booking.status}</span>
                    </Typography>
                  </Box>
                  <Chip 
                    icon={<AccessTimeIcon />} 
                    label={`ETA: ${countdown}s`} 
                    color="primary" 
                    variant="outlined" 
                  />
                </Box>

                <LinearProgress 
                  variant="determinate" 
                  value={
                    booking.status === "Requested" ? 15 :
                    booking.status === "Accepted" ? 40 :
                    booking.status === "Arrived" ? 65 :
                    booking.status === "InProgress" ? 85 : 100
                  } 
                  sx={{ mb: 3, height: 8, borderRadius: 4 }}
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">Driver Assigned</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{booking.driverName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">Vehicle Details</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{booking.vehicleNumber} ({booking.vehicleType})</Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Ride History Ledger */}
            {history.length > 0 && (
              <Paper 
                elevation={3} 
                sx={{ mt: 3, p: 3, borderRadius: 4, backgroundColor: "#111827", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <HistoryIcon sx={{ color: "#3b82f6" }} /> Recent Trip History
                </Typography>
                <Stack spacing={1.5}>
                  {history.slice(0, 3).map((item) => (
                    <Box 
                      key={item.id} 
                      sx={{ 
                        p: 2, 
                        borderRadius: 3, 
                        backgroundColor: "#1f2937", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center" 
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {item.pickupLocation} ➔ {item.destination}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.vehicleType} • ₹{item.price} • {new Date(item.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip label={item.status} size="small" color={item.status === "Completed" ? "success" : "default"} />
                    </Box>
                  ))}
                </Stack>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>
    </main>
  );
};

export default TransportationPage;
