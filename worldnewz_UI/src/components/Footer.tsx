import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Link, useLocation } from "react-router-dom";
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
import { useState, useEffect, useRef } from "react";
import { subscribeNewsletter } from "../api/apiClient";

const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const location = useLocation();

  useEffect(() => {
    setStatus("idle");
    setMessage("");
  }, [location.pathname]);

  const handleSubscribe = async (e: React.FormEvent) => {
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

    try {
      await subscribeNewsletter(trimmed, "", "Direct");
      setStatus("success");
      setMessage("Verification email sent! Check your inbox to activate your subscription.");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.error || "Failed to subscribe. Please try again.");
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
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
      
      await subscribeNewsletter(userEmail, userName, "Google");
      setStatus("success");
      setMessage(`Thank you ${userName}! You have successfully subscribed to the newsletter with ${userEmail}.`);
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.error || "Failed to subscribe using Google Account. Please try manually.");
    }
  };

  const credentialCallbackRef = useRef(handleGoogleCredentialResponse);
  useEffect(() => {
    credentialCallbackRef.current = handleGoogleCredentialResponse;
  }, [handleGoogleCredentialResponse]);

  useEffect(() => {
    let resizeTimeout: any = null;

    const renderGoogleButton = () => {
      const googleObj = (window as any).google;
      const btnContainer = document.getElementById("google-subscribe-btn");
      if (btnContainer) {
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (isLocalhost) {
          btnContainer.innerHTML = `
            <button type="button" id="local-gsi-btn" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:380px;height:40px;border-radius:20px;border:none;background:#1a73e8;color:#ffffff;font-weight:600;font-size:13.5px;cursor:pointer;font-family:var(--sans, sans-serif);box-shadow:0 2px 6px rgba(26,115,232,0.3);transition:background 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24" style="flex-shrink:0;"><path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
              <span>Subscribe with Google</span>
            </button>
          `;
          const btnElement = document.getElementById("local-gsi-btn");
          if (btnElement) {
            btnElement.onclick = () => {
              handleGoogleCredentialResponse({
                credential: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRldkB3b3JsZG5ld3pzLmluIiwibmFtZSI6IkxvY2FsIERldiBSZWFkZXIifQ.signature"
              });
            };
          }
          return;
        }

        if (googleObj) {
          // Clear previous button content to avoid duplication
          btnContainer.innerHTML = "";
          
          // Measure parent container width
          const containerWidth = btnContainer.getBoundingClientRect().width || 380;
          // Clamp width: minimum 196px, maximum 380px (original style)
          const buttonWidth = Math.max(196, Math.min(380, Math.floor(containerWidth)));

          // Initialize Google Sign-In only once globally with ux_mode popup to prevent CSP frame-ancestors warnings
          if (!(window as any).__google_gsi_initialized) {
            googleObj.accounts.id.initialize({
              client_id: "39502935670-j17fuc8sb87tv7ds2efs97crcdu1vrbm.apps.googleusercontent.com",
              ux_mode: "popup",
              auto_select: false,
              itp_support: true,
              use_fedcm_for_prompt: true,
              callback: (res: any) => credentialCallbackRef.current(res),
            });
            try {
              googleObj.accounts.id.cancel(); // Cancel automatic iframe prompt
            } catch (e) {
              // Ignore cancel errors if prompt not active
            }
            (window as any).__google_gsi_initialized = true;
          }

          googleObj.accounts.id.renderButton(btnContainer, {
            theme: "filled_blue",
            size: "medium",
            text: "signup_with",
            shape: "pill",
            width: buttonWidth
          });
        }
      }
    };

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        renderGoogleButton();
      }, 250);
    };

    const googleObj = (window as any).google;
    if (googleObj) {
      renderGoogleButton();
      window.addEventListener("resize", handleResize);
    } else {
      let script = document.getElementById("google-gsi-client") as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script");
        script.id = "google-gsi-client";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }

      const handleScriptLoad = () => {
        renderGoogleButton();
        window.addEventListener("resize", handleResize);
      };

      script.addEventListener("load", handleScriptLoad);

      return () => {
        window.removeEventListener("resize", handleResize);
        clearTimeout(resizeTimeout);
        script.removeEventListener("load", handleScriptLoad);
      };
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);
  return (
    <Box
      component="footer"
      aria-label="Site footer"
      sx={{
        mt: 6,
        py: 5,
        px: { xs: 2, sm: 4, md: 6 },
        backgroundColor: "var(--ink, #10172A)",
        color: "#9AA2B4",
        borderTop: "1px solid #1E293B",
      }}
    >
      {/* ─── Newsletter Signup section ─── */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 3, md: 4 },
          borderRadius: 1,
          backgroundColor: "#162035",
          border: "1px solid #232E48",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: "center",
          gap: 3
        }}
      >
        <Box sx={{ maxWidth: 550, textAlign: { xs: "center", md: "left" } }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "var(--serif)", color: "white", mb: 0.5, letterSpacing: "-0.01em" }}>
            Subscribe to the WorldNewzs Newsletter
          </Typography>
          <Typography variant="body2" sx={{ color: "#9AA2B4", lineHeight: 1.5, fontFamily: "var(--sans)" }}>
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
              id="newsletter-email-input"
              name="email"
              placeholder="Your email address"
              variant="outlined"
              size="small"
              fullWidth
              autoComplete="email"
              inputProps={{ "aria-label": "Your email address" }}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              disabled={status === "loading" || status === "success"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: "#7C86A0", fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: {
                  color: "white",
                  backgroundColor: "#10172A",
                  borderRadius: 1,
                  fontFamily: "var(--sans)",
                  "& fieldset": { borderColor: "#2E3A58" },
                  "&:hover fieldset": { borderColor: "#4C5670 !important" },
                  "&.Mui-focused fieldset": { borderColor: "var(--red, #B7222B) !important" },
                }
              }}
            />
            <Button
              id="btn-newsletter-subscribe"
              type="submit"
              variant="contained"
              disabled={status === "loading" || status === "success"}
              sx={{
                borderRadius: 1,
                px: 3,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "var(--red, #B7222B)",
                color: "white",
                boxShadow: "none",
                minWidth: 110,
                fontFamily: "var(--sans)",
                "&:hover": {
                  backgroundColor: "var(--red-deep, #8E1B22)",
                },
                "&.Mui-disabled": {
                  backgroundColor: status === "success" ? "#22c55e" : "rgba(255,255,255,0.12)",
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
                <Typography variant="caption" sx={{ px: 1.5, color: "#7C86A0", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, fontFamily: "var(--mono)" }}>
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
                    borderRadius: "4px"
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

      <Divider sx={{ borderColor: "#1E293B", mb: 4 }} />
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
          <Box component={Link} to="/" sx={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 1, mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: "var(--serif, 'Source Serif 4', Georgia, serif)", color: "white", letterSpacing: "-0.01em", fontSize: "22px" }}>
              WorldNew<Typography component="span" sx={{ color: "var(--red, #B7222B)", fontFamily: "inherit", fontWeight: 700, fontSize: "inherit" }}>z</Typography>s
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
              { label: "Services", to: "/services" },
              { label: "Gaming", to: "/gaming" },
              { label: "Cartoons", to: "/cartoons" },
              { label: "Polls", to: "/polls" },
              { label: "GK Badge Quiz", to: "/badge-quiz" },
              { label: "Stocks", to: "/stocks" },
              { label: "Bookmarks", to: "/bookmarks" },
              { label: "Editorial Briefings", to: "/editorial-briefings" },
              { label: "Editorial Guidelines", to: "/editorial-guidelines" },
              { label: "About Us", to: "/about" },
              { label: "Contact Us", to: "/contact" },
              { label: "Privacy Policy", to: "/privacy-policy" },
              { label: "Terms", to: "/terms" },
              { label: "Disclaimer", to: "/disclaimer" },
              { label: "RSS Feed", to: "/rss/discover", isExternal: true },
            ].map((link) => (
              <MuiLink
                key={link.to}
                {...(link.isExternal ? { href: link.to } : { component: Link, to: link.to })}
                underline="hover"
                sx={{ color: "#9AA2B4", "&:hover": { color: "#FFFFFF" }, fontSize: "0.85rem", fontFamily: "var(--sans)" }}
                aria-label={link.label}
              >
                {link.label}
              </MuiLink>
            ))}
          </Box>
        </Box>

        {/* Right Side: Social Media Icons */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton 
            id="btn-social-youtube"
            component="a"
            href="https://www.youtube.com/@ganeshkumar56"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "#9AA2B4", "&:hover": { color: "var(--red)" } }} 
            aria-label="YouTube"
          >
            <YouTubeIcon />
          </IconButton>
          <IconButton 
            id="btn-social-x"
            component="a"
            href="https://x.com/ganeshkumard1"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "#9AA2B4", "&:hover": { color: "#FFFFFF" } }} 
            aria-label="X (Twitter)"
          >
            <XIcon />
          </IconButton>
          <IconButton 
            id="btn-social-facebook"
            component="a"
            href="https://www.facebook.com/profile.php?id=61589266599006"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "#9AA2B4", "&:hover": { color: "#FFFFFF" } }} 
            aria-label="Facebook"
          >
            <FacebookIcon />
          </IconButton>
          <IconButton 
            id="btn-social-linkedin"
            component="a"
            href="https://www.linkedin.com/in/ganesh-kumar-devarasetty-b4743621/recent-activity/all/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "#9AA2B4", "&:hover": { color: "#FFFFFF" } }} 
            aria-label="LinkedIn"
          >
            <LinkedInIcon />
          </IconButton>
          <IconButton 
            id="btn-social-instagram"
            component="a"
            href="https://www.instagram.com/ganeshkumard12/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "#9AA2B4", "&:hover": { color: "var(--red)" } }} 
            aria-label="Instagram"
          >
            <InstagramIcon />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#1E293B", mb: 2, mt: 2 }} />
      <Typography variant="caption" sx={{ color: "#7C86A0", display: "block", textAlign: "center", mb: 0.5, fontFamily: "var(--mono)" }}>
        © {new Date().getFullYear()} WorldNewzs. Reporting, verified. Built for local validation & newsroom integrity.
      </Typography>
      <Typography variant="caption" sx={{ color: "#5C6474", display: "block", textAlign: "center", fontFamily: "var(--mono)", fontSize: "10.5px" }}>
        Independent editorial standards • Privacy-first platform • Strict AdSense content-commerce isolation
      </Typography>
    </Box>
  );
};

export default Footer;