import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Drawer, List, ListItem, ListItemButton, ListItemText, Collapse, Divider, Badge } from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

import { primaryNavLinks, secondaryNavLinks } from "../../utils/navigationConfig";

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

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { backgroundColor: isDark ? "#161b22" : "#0a0a0a", color: "white" } }}
    >
      <List sx={{ width: 250 }}>
        {primaryNavLinks.map((link) => {
          const isHighlighted = link.highlight;
          const isActive = location.pathname === link.path || (link.path === "/jobs" && location.pathname.startsWith("/jobs"));
          
          const buttonContent = (
            <ListItemButton
              component={Link}
              to={link.path}
              onClick={onClose}
              sx={isHighlighted ? {
                background: link.highlightColor || "linear-gradient(135deg, #00c6ff, #0072ff)",
                color: "white",
                borderRadius: "12px",
                fontWeight: "bold",
                justifyContent: "center",
                textAlign: "center",
                border: isActive ? "2px solid #fff" : "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                "& .MuiListItemText-primary": {
                  fontWeight: "700 !important",
                  fontSize: "0.95rem"
                },
                "&:hover": {
                  filter: "brightness(1.1)",
                }
              } : {
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
          );

          const itemContent = link.badge ? (
            <Badge
              badgeContent={link.badge}
              color="error"
              sx={{
                width: "100%",
                "& .MuiBadge-badge": {
                  fontSize: "0.6rem",
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
          );

          return (
            <ListItem key={link.path} disablePadding sx={isHighlighted ? { px: 2, py: 0.5 } : {}}>
              {itemContent}
            </ListItem>
          );
        })}

        {/* Collapsible Mobile Secondary Categories */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={onCategoriesToggle}
            sx={{
              color: secondaryNavLinks.some(l => location.pathname === l.path) ? "#c83a15" : "white",
              "&:hover": { color: "#ff8a65" },
            }}
          >
            <ListItemText 
              primary="More Categories" 
              primaryTypographyProps={{ 
                sx: { fontWeight: secondaryNavLinks.some(l => location.pathname === l.path) ? "bold" : "normal" } 
              }} 
            />
            {categoriesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={categoriesOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 2 }}>
            {secondaryNavLinks.map((link) => (
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
