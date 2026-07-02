import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Drawer, List, ListItem, ListItemButton, ListItemText, Collapse, Divider } from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

import { newsPillarLinks, lifestylePillarLinks, explorePillarLinks, playPillarLinks } from "../../utils/navigationConfig";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  categoriesOpen?: boolean;
  onCategoriesToggle?: () => void;
  isDark: boolean;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  isDark
}) => {
  const location = useLocation();
  const [newsOpen, setNewsOpen] = useState(true);
  const [lifestyleOpen, setLifestyleOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [playOpen, setPlayOpen] = useState(false);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { backgroundColor: isDark ? "#161b22" : "#0a0a0a", color: "white" } }}
    >
      <List sx={{ width: 270 }}>
        {/* Pillar 1: News */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setNewsOpen(!newsOpen)} sx={{ color: "#c83a15", fontWeight: "bold" }}>
            <ListItemText primary="📰 News Pillar" primaryTypographyProps={{ sx: { fontWeight: "700", fontSize: "0.95rem" } }} />
            {newsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={newsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 1.5 }}>
            {newsPillarLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <ListItem key={link.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={link.path}
                    onClick={onClose}
                    sx={{
                      fontWeight: isActive ? "bold" : "normal",
                      color: isActive ? "#c83a15" : "rgba(255,255,255,0.85)",
                      "&:hover": { color: "#ff8a65" },
                    }}
                  >
                    <ListItemText primary={link.label} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 1 }} />

        {/* Pillar 2: Lifestyle */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setLifestyleOpen(!lifestyleOpen)}>
            <ListItemText primary="🌿 Lifestyle" primaryTypographyProps={{ sx: { fontWeight: "700", fontSize: "0.95rem" } }} />
            {lifestyleOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={lifestyleOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 1.5 }}>
            {lifestylePillarLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <ListItem key={link.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={link.path}
                    onClick={onClose}
                    sx={{
                      fontWeight: isActive ? "bold" : "normal",
                      color: isActive ? "#c83a15" : "rgba(255,255,255,0.85)",
                      "&:hover": { color: "#ff8a65" },
                    }}
                  >
                    <ListItemText primary={link.label} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 1 }} />

        {/* Pillar 3: Explore / Extras */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setExploreOpen(!exploreOpen)}>
            <ListItemText primary="🚀 Explore / Extras" primaryTypographyProps={{ sx: { fontWeight: "700", fontSize: "0.95rem" } }} />
            {exploreOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={exploreOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 1.5 }}>
            {explorePillarLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <ListItem key={link.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={link.path}
                    onClick={onClose}
                    sx={{
                      fontWeight: isActive ? "bold" : "normal",
                      color: isActive ? "#c83a15" : "rgba(255,255,255,0.85)",
                      "&:hover": { color: "#ff8a65" },
                    }}
                  >
                    <ListItemText primary={link.label} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 1 }} />

        {/* Pillar 4: Play */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => setPlayOpen(!playOpen)}>
            <ListItemText primary="🎮 Play & Interactive" primaryTypographyProps={{ sx: { fontWeight: "700", fontSize: "0.95rem" } }} />
            {playOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={playOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 1.5 }}>
            {playPillarLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <ListItem key={link.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={link.path}
                    onClick={onClose}
                    sx={{
                      fontWeight: isActive ? "bold" : "normal",
                      color: isActive ? "#c83a15" : "rgba(255,255,255,0.85)",
                      "&:hover": { color: "#ff8a65" },
                    }}
                  >
                    <ListItemText primary={link.label} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Collapse>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 1 }} />
        {[
          { label: "Facebook Settings", path: "/facebook-settings" },
          { label: "About Us", path: "/about" },
          { label: "Contact Us", path: "/contact" }
        ].map((link) => (
          <ListItem key={link.path} disablePadding>
            <ListItemButton
              component={Link}
              to={link.path}
              onClick={onClose}
              sx={{
                fontWeight: location.pathname === link.path ? "bold" : "normal",
                color: location.pathname === link.path ? "#c83a15" : "rgba(255,255,255,0.7)",
                "&:hover": { color: "#ff8a65" },
              }}
            >
              <ListItemText primary={link.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};
