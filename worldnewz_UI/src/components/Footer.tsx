import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
import MuiLink from "@mui/material/Link";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import YouTubeIcon from "@mui/icons-material/YouTube";
import XIcon from "@mui/icons-material/X";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import EmailIcon from "@mui/icons-material/Email";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { useState, useEffect } from "react";

const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    // Simulate API subscription
    setTimeout(() => {
      setStatus("success");
      setMessage("Thank you for subscribing! Check your inbox for updates.");
      setEmail("");
    }, 1200);
  };

  const handleGoogleCredentialResponse = (response: any) => {
    try {
      setStatus("loading");
      setMessage("");
      // Decode JWT token safely
      const base64Url = response.credential.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const profile = JSON.parse(jsonPayload);
      
      const userEmail = profile.email;
      const userName = profile.name || "Subscriber";
      
      // Simulate API subscription with Google Email
      setTimeout(() => {
        setStatus("success");
        setMessage(`Thank you ${userName}! You have successfully subscribed to the newsletter with ${userEmail}.`);
        setEmail("");
      }, 1000);
    } catch (err) {
      setStatus("error");
      setMessage("Failed to subscribe using Google Account. Please try manually.");
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    
    script.onload = () => {
      const googleObj = (window as any).google;
      if (googleObj) {
        googleObj.accounts.id.initialize({
          client_id: "39502935670-j17fuc8sb87tv7ds2efs97crcdu1vrbm.apps.googleusercontent.com",
          callback: handleGoogleCredentialResponse,
        });
        const btnContainer = document.getElementById("google-subscribe-btn");
        if (btnContainer) {
          googleObj.accounts.id.renderButton(btnContainer, {
            theme: "filled_blue",
            size: "medium",
            text: "signup_with",
            shape: "pill",
            width: 380
          });
        }
      }
    };

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {
        // Ignore if already removed or not attached
      }
    };
  }, []);
  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        py: 4,
        px: { xs: 2, sm: 4, md: 6 },
        backgroundColor: "#0a0a0a",
        color: "rgba(255,255,255,0.7)",
      }}
    >
      {/* ─── Newsletter Signup section ─── */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          background: "linear-gradient(135deg, #161b22 0%, #0d1117 100%)",
          border: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: "center",
          gap: 3
        }}
      >
        <Box sx={{ maxWidth: 550, textAlign: { xs: "center", md: "left" } }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "white", mb: 0.5, letterSpacing: 0.5 }}>
            Subscribe to the WorldNewzs Newsletter
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
            Get curated editorial briefings, breaking news alerts, and premium factual analysis delivered directly to your inbox daily.
          </Typography>
        </Box>

        <Box 
          component="form" 
          onSubmit={handleSubscribe} 
          sx={{ 
            width: { xs: "100%", md: "auto" }, 
            display: "flex", 
            flexDirection: "column", 
            gap: 1.5,
            minWidth: { md: 380 }
          }}
        >
          <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
            <TextField
              placeholder="Your email address"
              variant="outlined"
              size="small"
              fullWidth
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              disabled={status === "loading" || status === "success"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: "rgba(255,255,255,0.4)", fontSize: 20 }} />
                  </InputAdornment>
                ),
                sx: {
                  color: "white",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderRadius: 2.5,
                  "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3) !important" },
                  "&.Mui-focused fieldset": { borderColor: "#ff8a65 !important" },
                }
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={status === "loading" || status === "success"}
              sx={{
                borderRadius: 2.5,
                px: 3,
                textTransform: "none",
                fontWeight: 700,
                background: "linear-gradient(135deg, #ff8a65 0%, #c83a15 100%)",
                color: "white",
                boxShadow: "none",
                minWidth: 110,
                "&:hover": {
                  background: "linear-gradient(135deg, #ff9e80 0%, #d84315 100%)",
                },
                "&.Mui-disabled": {
                  background: status === "success" ? "#22c55e" : "rgba(255,255,255,0.12)",
                  color: status === "success" ? "white" : "rgba(255,255,255,0.3)"
                }
              }}
            >
              {status === "loading" ? (
                <CircularProgress size={20} color="inherit" />
              ) : status === "success" ? (
                <CheckCircleIcon sx={{ fontSize: 20 }} />
              ) : (
                "Subscribe"
              )}
            </Button>
          </Box>

          {status !== "success" && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", my: 0.5 }}>
                <Divider sx={{ flexGrow: 1, borderColor: "rgba(255,255,255,0.08)" }} />
                <Typography variant="caption" sx={{ px: 1.5, color: "rgba(255,255,255,0.3)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>
                  or
                </Typography>
                <Divider sx={{ flexGrow: 1, borderColor: "rgba(255,255,255,0.08)" }} />
              </Box>

              <Box 
                id="google-subscribe-btn" 
                sx={{ 
                  width: "100%", 
                  display: "flex", 
                  justifyContent: "center",
                  minHeight: 40,
                  "& iframe": {
                    borderRadius: "20px"
                  }
                }} 
              />
            </>
          )}

          {status === "error" && (
            <Alert 
              severity="error" 
              variant="outlined" 
              sx={{ 
                py: 0, 
                px: 1.5,
                borderColor: "rgba(244,67,54,0.3)",
                color: "#f44336",
                "& .MuiAlert-icon": { color: "#f44336", mr: 1, fontSize: 18 }
              }}
            >
              {message}
            </Alert>
          )}

          {status === "success" && (
            <Alert 
              severity="success" 
              variant="outlined" 
              sx={{ 
                py: 0, 
                px: 1.5,
                borderColor: "rgba(76,175,80,0.3)",
                color: "#4caf50",
                "& .MuiAlert-icon": { color: "#4caf50", mr: 1, fontSize: 18 }
              }}
            >
              {message}
            </Alert>
          )}
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 4 }} />
      <Box 
        sx={{ 
          display: "flex", 
          flexDirection: { xs: "column", md: "row" }, 
          justifyContent: "space-between", 
          alignItems: { xs: "center", md: "center" },
          gap: 3,
          mb: 3
        }}
      >
        {/* Left Side: Brand & Links */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: { xs: "center", md: "flex-start" } }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
            <Box
              component="img"
              src="/logo.svg"
              alt="WorldNewzs Logo"
              sx={{ 
                height: 30, 
                width: 30, 
                mr: 1.5 
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 800, color: "white", letterSpacing: 2 }}>
              WORLDNEWZS
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: { xs: "center", md: "flex-start" } }}>
            {[
              { label: "Home", to: "/" },
              { label: "Sports", to: "/sports" },
              { label: "Money", to: "/money" },
              { label: "Weather", to: "/weather" },
              { label: "Shopping", to: "/shopping" },
              { label: "Travel", to: "/travel" },
              { label: "Food", to: "/food" },
              { label: "Entertainment", to: "/entertainment" },
              { label: "Bookmarks", to: "/bookmarks" },
              { label: "Editorial Briefings", to: "/editorial-briefings" },
              { label: "Editorial Guidelines", to: "/editorial-guidelines" },
              { label: "About Us", to: "/about" },
              { label: "Contact Us", to: "/contact" },
              { label: "Privacy Policy", to: "/privacy-policy" },
              { label: "Terms", to: "/terms" },
              { label: "RSS Feed", to: "/rss/discover", isExternal: true },
            ].map((link) => (
              <MuiLink
                key={link.to}
                {...(link.isExternal ? { href: link.to } : { component: Link, to: link.to })}
                underline="hover"
                sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "primary.main" }, fontSize: "0.875rem" }}
              >
                {link.label}
              </MuiLink>
            ))}
          </Box>
        </Box>

        {/* Right Side: Social Media Icons */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton 
            component="a"
            href="https://www.youtube.com/@ganeshkumar56"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "primary.main" } }} 
            aria-label="YouTube"
          >
            <YouTubeIcon />
          </IconButton>
          <IconButton 
            component="a"
            href="https://x.com/ganeshkumard1"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "primary.main" } }} 
            aria-label="X (Twitter)"
          >
            <XIcon />
          </IconButton>
          <IconButton 
            component="a"
            href="https://www.facebook.com/profile.php?id=61589266599006"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "primary.main" } }} 
            aria-label="Facebook"
          >
            <FacebookIcon />
          </IconButton>
          <IconButton 
            component="a"
            href="https://www.linkedin.com/in/ganesh-kumar-devarasetty-b4743621/recent-activity/all/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "primary.main" } }} 
            aria-label="LinkedIn"
          >
            <LinkedInIcon />
          </IconButton>
          <IconButton 
            component="a"
            href="https://www.instagram.com/ganeshkumard12/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "primary.main" } }} 
            aria-label="Instagram"
          >
            <InstagramIcon />
          </IconButton>
        </Box>
      </Box>

      <Typography 
        variant="caption" 
        sx={{ 
          color: "rgba(255,255,255,0.4)", 
          display: "block", 
          textAlign: "center", 
          mb: 2.5, 
          maxWidth: 720, 
          mx: "auto", 
          lineHeight: 1.6,
          fontStyle: "italic"
        }}
      >
        <strong>News Source Disclaimer:</strong> WorldNewzs is a news aggregation platform. All headlines, article summaries, images, and brand assets are aggregated and curated from independent third-party sources. We do not produce original reporting or conduct independent journalism. Views expressed in aggregated content are solely those of the original publishers.
      </Typography>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 2 }} />
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", display: "block", textAlign: "center" }}>
        © {new Date().getFullYear()} WorldNewzs. Powered by Ganesh CO.
      </Typography>
    </Box>
  );
};

export default Footer;