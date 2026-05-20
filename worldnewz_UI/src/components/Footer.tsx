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

const Footer: React.FC = () => {
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
          <Typography variant="h6" sx={{ fontWeight: 800, color: "white", letterSpacing: 2, mb: 1 }}>
            🌐 WORLDNEWZ
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: { xs: "center", md: "flex-start" } }}>
            {[
              { label: "Home", to: "/" },
              { label: "Sports", to: "/sports" },
              { label: "Money", to: "/money" },
              { label: "Weather", to: "/weather" },
              { label: "Shopping", to: "/shopping" },
              { label: "Bookmarks", to: "/bookmarks" },
              { label: "About Us", to: "/about" },
              { label: "Contact Us", to: "/contact" },
              { label: "Privacy Policy", to: "/privacy-policy" },
              { label: "Terms", to: "/terms" },
            ].map((link) => (
              <MuiLink
                key={link.to}
                component={Link}
                to={link.to}
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

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 2 }} />
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", display: "block", textAlign: "center" }}>
        © {new Date().getFullYear()} WorldNewz. Powerd by Ganesh CO.
      </Typography>
    </Box>
  );
};

export default Footer;