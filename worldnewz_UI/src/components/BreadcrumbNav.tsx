import React from "react";
import { Box, Typography, Link as MuiLink } from "@mui/material";
import { Link } from "react-router-dom";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items }) => {
  return (
    <Box
      component="nav"
      aria-label="breadcrumb"
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 0.6,
        py: 0.9,
        px: 1.6,
        mb: 3,
        borderRadius: "8px",
        backgroundColor: (theme) =>
          theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "#FFFFFF",
        border: (theme) =>
          `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"}`,
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "0 2px 8px rgba(0,0,0,0.35)"
            : "0 1px 3px rgba(0,0,0,0.04)",
        fontFamily: "var(--sans, 'IBM Plex Sans', sans-serif)",
      }}
    >
      {/* Home Link */}
      <MuiLink
        component={Link}
        to="/"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          color: (theme) =>
            theme.palette.mode === "dark" ? "#CBD5E1" : "#4B5563",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: "13px",
          fontFamily: "var(--sans, 'IBM Plex Sans', sans-serif)",
          transition: "color 0.15s ease",
          "&:hover": {
            color: (theme) =>
              theme.palette.mode === "dark" ? "#F43F5E" : "#B7222B",
          },
        }}
      >
        <HomeOutlinedIcon sx={{ fontSize: "16px", color: "inherit" }} />
        <span>Home</span>
      </MuiLink>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <NavigateNextIcon
              sx={{
                fontSize: "15px",
                color: (theme) =>
                  theme.palette.mode === "dark" ? "#64748B" : "#9CA3AF",
                flexShrink: 0,
              }}
            />
            {isLast || !item.path ? (
              <Typography
                component="span"
                sx={{
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#F8FAFC" : "#111827",
                  fontWeight: 700,
                  fontSize: "13px",
                  fontFamily: "var(--sans, 'IBM Plex Sans', sans-serif)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: { xs: "200px", sm: "380px", md: "560px" },
                  display: "inline-block",
                  verticalAlign: "middle",
                }}
                title={item.label}
              >
                {item.label}
              </Typography>
            ) : (
              <MuiLink
                component={Link}
                to={item.path}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.4,
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#CBD5E1" : "#4B5563",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  fontFamily: "var(--sans, 'IBM Plex Sans', sans-serif)",
                  transition: "color 0.15s ease",
                  "&:hover": {
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#F43F5E" : "#B7222B",
                  },
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </MuiLink>
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
};
