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