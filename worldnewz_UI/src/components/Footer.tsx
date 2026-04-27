import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Link } from "react-router-dom";
import MuiLink from "@mui/material/Link";
import Divider from "@mui/material/Divider";

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        py: 3,
        px: 4,
        backgroundColor: "#0a0a0a",
        color: "rgba(255,255,255,0.7)",
        textAlign: "center",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800, color: "white", letterSpacing: 2, mb: 1 }}>
        🌐 WORLDNEWZ
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 2, mb: 2 }}>
        {[
          { label: "Home", to: "/" },
          { label: "Sports", to: "/sports" },
          { label: "Money", to: "/money" },
          { label: "Weather", to: "/weather" },
          { label: "Shopping", to: "/shopping" },
          { label: "Bookmarks", to: "/bookmarks" },
        ].map((link) => (
          <MuiLink
            key={link.to}
            component={Link}
            to={link.to}
            underline="hover"
            sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "white" }, fontSize: "0.875rem" }}
          >
            {link.label}
          </MuiLink>
        ))}
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 2 }} />
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
        © {new Date().getFullYear()} WorldNewz. Powerd by Ganesh CO.
      </Typography>
    </Box>
  );
};

export default Footer;