import React from "react";
import { Box, Button } from "@mui/material";
import { Link } from "react-router-dom";

export const AmazonStrip: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundColor: "#191e26",
        color: "#ffffff",
        py: 0.8,
        px: 2,
        fontSize: "0.82rem",
        fontWeight: 700,
        borderBottom: "2px solid #FF9900",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        flexWrap: "wrap",
        zIndex: 1100,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Box component="span" sx={{ color: "#FF9900" }}>🔥 DEALS OF THE DAY:</Box>
        <span>Exclusive Indian Shopping Offers & Flash Deals!</span>
      </Box>
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
        <Button
          component={Link}
          to="/amazon-products"
          size="small"
          sx={{
            color: "#191e26",
            backgroundColor: "#FF9900",
            fontWeight: 800,
            fontSize: "0.7rem",
            px: 1.5,
            py: 0.2,
            borderRadius: "4px",
            textTransform: "none",
            minHeight: 0,
            lineHeight: 1.5,
            "&:hover": {
              backgroundColor: "#ffaa33"
            }
          }}
        >
          Browse Deals Hub 🛍️
        </Button>
        <a
          href="https://www.amazon.in?&linkCode=ll2&tag=ganeshd12-21&linkId=309384296fe1c1e72569a81c50402f7a&ref_=as_li_ss_tl"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#FF9900", textDecoration: "underline", fontSize: "0.8rem", display: "inline-flex", alignItems: "center" }}
        >
          Shop Direct on Amazon India ↗
        </a>
      </Box>
    </Box>
  );
};
