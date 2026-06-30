import React, { useEffect, useState, useRef } from "react";
import { 
  Box, Container, Typography, Grid, Paper, Select, MenuItem, InputLabel, 
  FormControl, Button, Card, CardContent, Divider, Rating, 
  LinearProgress, Alert, Snackbar, CardActionArea 
} from "@mui/material";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import LocalTaxiIcon from "@mui/icons-material/LocalTaxi";
import ElectricRickshawIcon from "@mui/icons-material/ElectricRickshaw";
import StarsIcon from "@mui/icons-material/Stars";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { bookRide, fetchRideStatus, fetchRideHistory, fetchLocations } from "../api/apiClient";
import type { RideBooking } from "../api/apiClient";

// Landmarks and coordinates for Delhi simulation
const DelhiLandmarks = [
  { name: "Connaught Place", x: 250, y: 150, lat: 28.6304, lng: 77.2177 },
  { name: "India Gate", x: 300, y: 220, lat: 28.6129, lng: 77.2295 },
  { name: "Delhi Airport (IGI)", x: 80, y: 380, lat: 28.5562, lng: 77.1000 },
  { name: "Red Fort", x: 350, y: 80, lat: 28.6562, lng: 77.2410 },
  { name: "Lotus Temple", x: 420, y: 350, lat: 28.5535, lng: 77.2588 },
  { name: "Qutub Minar", x: 180, y: 450, lat: 28.5244, lng: 77.1855 },
  { name: "Akshardham Temple", x: 480, y: 200, lat: 28.6127, lng: 77.2773 }
];

export const TransportationPage: React.FC = () => {
  const [locations, setLocations] = useState<string[]>([]);
  const [pickup, setPickup] = useState<string>("Connaught Place");
  const [destination, setDestination] = useState<string>("India Gate");
  const [vehicleType, setVehicleType] = useState<string>("Sedan");
  const email = "user@worldnewzs.in";
  const [booking, setBooking] = useState<RideBooking | null>(null);
  const [history, setHistory] = useState<RideBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  
  const statusTimer = useRef<number | null>(null);
  const countdownTimer = useRef<number | null>(null);

  // Load locations and booking history
  useEffect(() => {
    fetchLocations()
      .then(res => setLocations(res.data))
      .catch(() => setLocations(DelhiLandmarks.map(l => l.name)));

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

  // Distance estimation in degrees mapped to simulated kilometers
  const getDistance = (loc1: string, loc2: string): number => {
    const l1 = DelhiLandmarks.find(l => l.name.toLowerCase() === loc1.toLowerCase());
    const l2 = DelhiLandmarks.find(l => l.name.toLowerCase() === loc2.toLowerCase());
    if (!l1 || !l2) return 5.5; // fallback
    const dist = Math.sqrt(Math.pow(l1.lat - l2.lat, 2) + Math.pow(l1.lng - l2.lng, 2)) * 111.12;
    return Math.max(1.2, parseFloat(dist.toFixed(1)));
  };

  const distance = getDistance(pickup, destination);

  // Fare calculations
  const fares: Record<string, number> = {
    Bike: Math.round(15 + distance * 7),
    Auto: Math.round(25 + distance * 12),
    Sedan: Math.round(50 + distance * 16),
    Premium: Math.round(120 + distance * 25)
  };

  const etas: Record<string, number> = {
    Bike: Math.round((distance / 45) * 60) + 1,
    Auto: Math.round((distance / 35) * 60) + 2,
    Sedan: Math.round((distance / 40) * 60) + 2,
    Premium: Math.round((distance / 50) * 60) + 1
  };

  const handleBook = () => {
    if (pickup === destination) {
      setError("Pickup location and Destination cannot be the same.");
      return;
    }

    setLoading(true);
    setError(null);
    clearTimers();

    bookRide({
      pickupLocation: pickup,
      destination: destination,
      vehicleType: vehicleType,
      userEmail: email
    })
      .then(res => {
        setBooking(res.data);
        setCountdown(res.data.eta || 45);
        setSuccessMsg(`Ride successfully booked! Matched with driver ${res.data.driverName}`);
        
        // Start polling for status updates
        startPolling(res.data.id);
        startCountdown();
        loadHistory();
      })
      .catch(err => {
        setError(err.message || "Failed to book ride. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const startPolling = (bookingId: number) => {
    statusTimer.current = window.setInterval(() => {
      fetchRideStatus(bookingId)
        .then(res => {
          setBooking(res.data);
          if (res.data.status === "Completed") {
            clearTimers();
            setSuccessMsg("Hurray! You have safely reached your destination.");
            loadHistory();
          }
        })
        .catch(err => {
          console.error("Error polling ride status:", err);
        });
    }, 2000);
  };

  const startCountdown = () => {
    countdownTimer.current = window.setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownTimer.current) window.clearInterval(countdownTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Convert vehicle type to icon
  const getVehicleIcon = (type: string, size: "small" | "large" = "small") => {
    const s = size === "large" ? 42 : 24;
    switch (type.toLowerCase()) {
      case "bike":
        return <DirectionsBikeIcon sx={{ fontSize: s, color: "#10b981" }} />;
      case "auto":
        return <ElectricRickshawIcon sx={{ fontSize: s, color: "#f59e0b" }} />;
      case "premium":
        return <StarsIcon sx={{ fontSize: s, color: "#8b5cf6" }} />;
      default:
        return <LocalTaxiIcon sx={{ fontSize: s, color: "#3b82f6" }} />;
    }
  };

  const pickupNode = DelhiLandmarks.find(l => l.name === pickup);
  const destNode = DelhiLandmarks.find(l => l.name === destination);

  // Calculate current simulated position on map
  let cabCoords = pickupNode ? { x: pickupNode.x, y: pickupNode.y } : { x: 250, y: 150 };
  if (booking && pickupNode && destNode) {
    const startX = pickupNode.x;
    const startY = pickupNode.y;
    const endX = destNode.x;
    const endY = destNode.y;

    if (booking.status === "InProgress") {
      // Driver moving to destination. For mock visualization we map progress:
      const totalSec = booking.eta || 45;
      const progress = Math.min(1.0, (totalSec - countdown) / totalSec);
      cabCoords = {
        x: startX + (endX - startX) * progress,
        y: startY + (endY - startY) * progress
      };
    } else if (booking.status === "Accepted") {
      // Driver approaching pickup from a mock location
      const mockDriverX = (startX + 100) % 500;
      const mockDriverY = (startY - 50 + 500) % 500;
      const totalSec = 12;
      const progress = Math.min(1.0, (totalSec - Math.max(0, countdown - (booking.eta - 12))) / totalSec);
      cabCoords = {
        x: mockDriverX + (startX - mockDriverX) * progress,
        y: mockDriverY + (startY - mockDriverY) * progress
      };
    } else if (booking.status === "Completed") {
      cabCoords = { x: endX, y: endY };
    }
  }

  return (
    <main style={{ paddingBottom: "32px" }}>
      <SEOMeta 
        title="Cab Booking & Transportation Services | WorldNewzs" 
        description="Book local cabs, bikes, auto-rickshaws, and premium taxis on WorldNewzs. Estimate fares, track drivers in real-time, and check ride timings in Delhi NCR." 
        keywords={["cab booking", "taxi service", "uber", "ola", "realtime map", "delhi cab booking", "transportation services"]} 
        canonical="https://worldnewzs.in/transportation" 
      />
      <JSONLDBreadcrumb crumbs={[
        { name: "Home", url: "https://worldnewzs.in" },
        { name: "Transportation", url: "https://worldnewzs.in/transportation" }
      ]} />

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 900, 
            letterSpacing: -0.5, 
            mb: 1, 
            fontFamily: "'Outfit', 'Inter', sans-serif" 
          }}
        >
          MetroRide Cab Booking 🚗
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Experience instant cab matching, accurate pricing tiers, and real-time interactive vector routes.
        </Typography>

        <Grid container spacing={3}>
          {/* Left Column: Ride Booking and Status */}
          <Grid size={{ xs: 12, md: 5, lg: 4 }} component="section" aria-label="Booking Control Panel">
            <Paper elevation={3} sx={{ p: 3, borderRadius: 4, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Request a Ride
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel id="pickup-label">Pickup Location</InputLabel>
                    <Select
                      labelId="pickup-label"
                      id="pickup-select"
                      value={pickup}
                      label="Pickup Location"
                      onChange={(e) => setPickup(e.target.value)}
                    >
                      {locations.map(loc => (
                        <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel id="destination-label">Where To (Destination)</InputLabel>
                    <Select
                      labelId="destination-label"
                      id="destination-select"
                      value={destination}
                      label="Where To (Destination)"
                      onChange={(e) => setDestination(e.target.value)}
                    >
                      {locations.map(loc => (
                        <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1.5 }}>
                SELECT VEHICLE CLASS
              </Typography>

              <Grid container spacing={1.5}>
                {(["Bike", "Auto", "Sedan", "Premium"] as const).map(type => {
                  const isSelected = vehicleType === type;
                  return (
                    <Grid size={{ xs: 6 }} key={type}>
                      <Card 
                        sx={{ 
                          border: isSelected ? "2px solid #f59e0b" : "1px solid rgba(255,255,255,0.08)",
                          backgroundColor: isSelected ? "rgba(245, 158, 11, 0.08)" : "transparent",
                          borderRadius: 3,
                          transition: "all 0.2s ease-in-out",
                          "&:hover": { transform: "translateY(-2px)" }
                        }}
                      >
                        <CardActionArea 
                          id={`select-vehicle-${type.toLowerCase()}`}
                          onClick={() => setVehicleType(type)}
                          sx={{ p: 2, textAlign: "center" }}
                        >
                          {getVehicleIcon(type, "large")}
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1 }}>
                            {type}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: "#f59e0b" }}>
                            ₹{fares[type]}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            ETA: {etas[type]} mins
                          </Typography>
                        </CardActionArea>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              <Button
                id="book-ride-submit-btn"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || (booking !== null && booking.status !== "Completed")}
                onClick={handleBook}
                sx={{ 
                  mt: 3, 
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                  "&:hover": { background: "linear-gradient(135deg, #d97706, #b45309)" }
                }}
              >
                {loading ? "Matching Drivers..." : (booking !== null && booking.status !== "Completed" ? "Trip Active" : "Book Ride Now")}
              </Button>
            </Paper>

            {/* Ride Status Panel */}
            {booking && booking.status !== "Completed" && (
              <Card sx={{ p: 2, borderRadius: 4, borderLeft: "6px solid #f59e0b", mb: 3 }}>
                <CardContent sx={{ p: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
                    RIDE IN PROGRESS
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
                    Status: {booking.status === "Requested" ? "Driver Match Pending..." : booking.status}
                  </Typography>

                  <LinearProgress 
                    variant={booking.status === "Requested" ? "indeterminate" : "determinate"} 
                    value={
                      booking.status === "Accepted" ? 25 :
                      booking.status === "Arrived" ? 50 :
                      booking.status === "InProgress" ? 75 : 0
                    }
                    sx={{ height: 8, borderRadius: 4, mb: 3 }} 
                  />

                  <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.05)" }}>
                      {getVehicleIcon(booking.vehicleType, "large")}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {booking.driverName || "Driver Matched"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {booking.vehicleNumber || "Vehicle plate info"}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                        <Rating value={4.8} precision={0.1} size="small" readOnly />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>(4.8)</Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <Typography variant="body2" color="text.secondary">Estimated Time Remaining:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 0.5 }}>
                      <AccessTimeIcon fontSize="inherit" /> {countdown} sec
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "space-between", py: 1 }}>
                    <Typography variant="body2" color="text.secondary">Total Fare Amount:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "#f59e0b" }}>
                      ₹{booking.price}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Right Column: Delhi Interactive Map Vector */}
          <Grid size={{ xs: 12, md: 7, lg: 8 }} component="section" aria-label="Interactive Delhi Route Map">
            <Paper 
              elevation={3} 
              sx={{ 
                p: 2, 
                borderRadius: 4, 
                backgroundColor: "#0d1117", 
                border: "1px solid rgba(255,255,255,0.08)",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <Typography variant="subtitle1" sx={{ color: "white", fontWeight: 700, mb: 1.5, px: 1 }}>
                Interactive Vector Route Map (Delhi NCR)
              </Typography>

              {/* Map SVG */}
              <Box sx={{ width: "100%", height: { xs: 350, sm: 500 }, position: "relative" }}>
                <svg 
                  width="100%" 
                  height="100%" 
                  viewBox="0 0 600 500" 
                  style={{ background: "#0a0c10", borderRadius: "12px" }}
                >
                  {/* Grid Lines background */}
                  <defs>
                    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Connecting Roads (Vector lines) */}
                  <line x1="250" y1="150" x2="300" y2="220" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <line x1="300" y1="220" x2="420" y2="350" stroke="rgba(255,255,255,0.08)" strokeWidth="3" strokeDasharray="5,5" />
                  <line x1="250" y1="150" x2="350" y2="80" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <line x1="80" y1="380" x2="250" y2="150" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <line x1="180" y1="450" x2="300" y2="220" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  <line x1="300" y1="220" x2="480" y2="200" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />

                  {/* Draw selected path route line */}
                  {pickupNode && destNode && (
                    <line 
                      x1={pickupNode.x} 
                      y1={pickupNode.y} 
                      x2={destNode.x} 
                      y2={destNode.y} 
                      stroke="#f59e0b" 
                      strokeWidth="5" 
                      strokeLinecap="round"
                      opacity="0.8" 
                    />
                  )}

                  {/* Delhi Landmarks (Nodes) */}
                  {DelhiLandmarks.map((lm) => {
                    const isPickup = lm.name === pickup;
                    const isDest = lm.name === destination;
                    return (
                      <g key={lm.name} style={{ cursor: "pointer" }} onClick={() => {
                        // Interactive node selection
                        if (pickup === lm.name) return;
                        setDestination(lm.name);
                      }}>
                        <circle 
                          cx={lm.x} 
                          cy={lm.y} 
                          r={isPickup || isDest ? 14 : 9} 
                          fill={isPickup ? "#10b981" : (isDest ? "#ef4444" : "#1f2937")} 
                          stroke={isPickup || isDest ? "#ffffff" : "rgba(255,255,255,0.2)"}
                          strokeWidth="2" 
                        />
                        {isPickup && (
                          <circle 
                            cx={lm.x} 
                            cy={lm.y} 
                            r="22" 
                            fill="none" 
                            stroke="#10b981" 
                            strokeWidth="1.5" 
                            opacity="0.6"
                          >
                            <animate attributeName="r" values="14;25" dur="1.8s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <text 
                          x={lm.x} 
                          y={lm.y - 18} 
                          textAnchor="middle" 
                          fill={isPickup || isDest ? "#ffffff" : "rgba(255,255,255,0.5)"} 
                          fontSize="11" 
                          fontWeight={isPickup || isDest ? "bold" : "normal"}
                        >
                          {lm.name}
                        </text>
                      </g>
                    );
                  })}

                  {/* Simulated Moving Driver Icon */}
                  {booking && booking.status !== "Completed" && (
                    <g transform={`translate(${cabCoords.x - 12}, ${cabCoords.y - 12})`}>
                      <circle cx="12" cy="12" r="14" fill="#f59e0b" opacity="0.3">
                        <animate attributeName="r" values="10;20" dur="1.2s" repeatCount="indefinite" />
                      </circle>
                      <foreignObject width="24" height="24">
                        <div style={{ fontSize: "18px", textAlign: "center", lineHeight: "24px" }}>
                          🚕
                        </div>
                      </foreignObject>
                    </g>
                  )}
                </svg>

                {/* Map Floating Legend */}
                <Box 
                  sx={{ 
                    position: "absolute", 
                    bottom: 16, 
                    left: 16, 
                    backgroundColor: "rgba(13, 17, 23, 0.9)", 
                    borderRadius: 2, 
                    p: 1.5,
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#10b981" }} />
                    <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>Pickup Point</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#ef4444" }} />
                    <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>Destination Point</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#f59e0b" }} />
                    <Typography variant="caption" sx={{ color: "white", fontWeight: 700 }}>Active Ride Coordinate</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* History Section */}
        <section aria-label="Ride Booking History" style={{ marginTop: "40px" }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <HistoryIcon /> Booking History
          </Typography>

          {history.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 4 }}>
              <Typography color="text.secondary">No ride history available for {email}. Make your first booking above!</Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {history.map(item => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                  <Card sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.06)" }}>
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {getVehicleIcon(item.vehicleType)}
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {item.vehicleType}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#f59e0b" }}>
                          ₹{item.price}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                        <LocationOnIcon sx={{ fontSize: 16, color: "#10b981" }} />
                        <Typography variant="body2" noWrap>
                          From: {item.pickupLocation}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                        <LocationOnIcon sx={{ fontSize: 16, color: "#ef4444" }} />
                        <Typography variant="body2" noWrap>
                          To: {item.destination}
                        </Typography>
                      </Box>

                      <Divider sx={{ mb: 1.5 }} />

                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <CheckCircleIcon sx={{ fontSize: 14, color: "#10b981" }} />
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "#10b981" }}>
                            {item.status}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </section>
      </Container>

      {/* Snackbar alerts */}
      <Snackbar
        open={successMsg !== null}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg(null)}
      >
        <Alert severity="success" sx={{ width: "100%", borderRadius: 3, fontWeight: 700 }}>
          {successMsg}
        </Alert>
      </Snackbar>

      <Snackbar
        open={error !== null}
        autoHideDuration={5000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" sx={{ width: "100%", borderRadius: 3, fontWeight: 700 }}>
          {error}
        </Alert>
      </Snackbar>
    </main>
  );
};

export default TransportationPage;
