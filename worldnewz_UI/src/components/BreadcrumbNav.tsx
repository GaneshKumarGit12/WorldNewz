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
        backgroundColor: "var(--paper-raise)",
        border: "1px solid var(--line-soft)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
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
          color: "var(--slate)",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: "13px",
          fontFamily: "var(--sans, 'IBM Plex Sans', sans-serif)",
          transition: "color 0.15s ease",
          "&:hover": {
            color: "var(--red, #B7222B)",
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
                color: "var(--slate-light, #8B92A3)",
                flexShrink: 0,
                opacity: 0.8,
              }}
            />
            {isLast || !item.path ? (
              <Typography
                component="span"
                sx={{
                  color: "var(--text, #10172A)",
                  fontWeight: 650,
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
                  color: "var(--slate)",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  fontFamily: "var(--sans, 'IBM Plex Sans', sans-serif)",
                  transition: "color 0.15s ease",
                  "&:hover": {
                    color: "var(--red, #B7222B)",
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
