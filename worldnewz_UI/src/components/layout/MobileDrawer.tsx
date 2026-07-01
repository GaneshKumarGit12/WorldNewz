import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Drawer, List, ListItem, ListItemButton, ListItemText, Collapse, Divider, Badge } from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

import { coreNewsLinks, exploreLinks, utilityLinks, moreNewsLinks } from "../../utils/navigationConfig";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  categoriesOpen: boolean;
  onCategoriesToggle: () => void;
  isDark: boolean;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  categoriesOpen,
  onCategoriesToggle,
  isDark
}) => {
  const location = useLocation();
  const [exploreOpen, setExploreOpen] = useState(false);
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { backgroundColor: isDark ? "#161b22" : "#0a0a0a", color: "white" } }}
    >
      <List sx={{ width: 250 }}>
        {/* Core News */}
        {coreNewsLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <ListItem key={link.path} disablePadding>
              <ListItemButton
                component={Link}
                to={link.path}
                onClick={onClose}
                sx={{
                  fontWeight: isActive ? "bold" : "normal",
                  color: isActive ? "#c83a15" : "white",
                  "&:hover": { color: "#ff8a65" },
                  borderRadius: "8px",
                  mx: 1,
                  my: 0.25,
                  "& .MuiListItemText-primary": {
                    fontWeight: isActive ? "700" : "500",
                    fontSize: "0.95rem"
                  }
                }}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            </ListItem>
          );
        })}

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 1 }} />

        {/* Collapsible Explore / Features */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setExploreOpen(!exploreOpen)}
            sx={{
              color: exploreLinks.some(l => location.pathname === l.path) ? "#c83a15" : "white",
              "&:hover": { color: "#ff8a65" },
            }}
          >
            <ListItemText 
              primary="Explore" 
              primaryTypographyProps={{ 
                sx: { fontWeight: exploreLinks.some(l => location.pathname === l.path) ? "bold" : "normal" } 
              }} 
            />
            {exploreOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={exploreOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 2 }}>
            {exploreLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const buttonContent = (
                <ListItemButton
                  component={Link}
                  to={link.path}
                  onClick={onClose}
                  sx={{
                    fontWeight: isActive ? "bold" : "normal",
                    color: isActive ? "#c83a15" : "rgba(255,255,255,0.7)",
                    "&:hover": { color: "#ff8a65" },
                  }}
                >
                  <ListItemText primary={link.label} />
                </ListItemButton>
              );

              return (
                <ListItem key={link.path} disablePadding>
                  {link.badge ? (
                    <Badge
                      badgeContent={link.badge}
                      color="error"
                      sx={{
                        width: "100%",
                        "& .MuiBadge-badge": {
                          fontSize: "0.55rem",
                          fontWeight: "bold",
                          height: 14,
                          minWidth: 14,
                          top: 10,
                          right: 20,
                        },
                      }}
                    >
                      {buttonContent}
                    </Badge>
                  ) : (
                    buttonContent
                  )}
                </ListItem>
              );
            })}
          </List>
        </Collapse>

        {/* Collapsible Utilities */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setUtilitiesOpen(!utilitiesOpen)}
            sx={{
              color: utilityLinks.some(l => location.pathname === l.path || (l.path === "/jobs" && location.pathname.startsWith("/jobs"))) ? "#c83a15" : "white",
              "&:hover": { color: "#ff8a65" },
            }}
          >
            <ListItemText 
              primary="Utilities" 
              primaryTypographyProps={{ 
                sx: { fontWeight: utilityLinks.some(l => location.pathname === l.path || (l.path === "/jobs" && location.pathname.startsWith("/jobs"))) ? "bold" : "normal" } 
              }} 
            />
            {utilitiesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={utilitiesOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 2 }}>
            {utilityLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path === "/jobs" && location.pathname.startsWith("/jobs"));
              return (
                <ListItem key={link.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={link.path}
                    onClick={onClose}
                    sx={{
                      fontWeight: isActive ? "bold" : "normal",
                      color: isActive ? "#c83a15" : "rgba(255,255,255,0.7)",
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

        {/* Collapsible Mobile Secondary Categories */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={onCategoriesToggle}
            sx={{
              color: moreNewsLinks.some(l => location.pathname === l.path) ? "#c83a15" : "white",
              "&:hover": { color: "#ff8a65" },
            }}
          >
            <ListItemText 
              primary="Categories" 
              primaryTypographyProps={{ 
                sx: { fontWeight: moreNewsLinks.some(l => location.pathname === l.path) ? "bold" : "normal" } 
              }} 
            />
            {categoriesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={categoriesOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 2 }}>
            {moreNewsLinks.map((link) => (
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
