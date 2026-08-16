import React from "react";
import { Box } from "@mui/material";

export interface WzChatbotIconProps {
  size?: number | string;
  variant?: "tile" | "circle" | "transparent";
  fontSize?: number | string;
  borderRadius?: number | string;
  bg?: string;
  zColor?: string;
  uppercase?: boolean;
  sx?: object;
  className?: string;
}

export const WzChatbotIcon: React.FC<WzChatbotIconProps> = ({
  size = 36,
  variant = "tile",
  fontSize,
  borderRadius,
  bg = "#10172A",
  zColor = "#C4272F",
  uppercase = false,
  sx = {},
  className = "",
}) => {
  const numericSize = typeof size === "number" ? size : parseInt(String(size), 10) || 36;
  const calculatedFontSize = fontSize || `${Math.round(numericSize * 0.48)}px`;
  const computedRadius =
    borderRadius !== undefined
      ? borderRadius
      : variant === "circle"
      ? "50%"
      : variant === "transparent"
      ? "0"
      : `${Math.max(4, Math.round(numericSize * 0.22))}px`;

  return (
    <Box
      className={`wz-chatbot-icon ${className}`}
      sx={{
        width: size,
        height: size,
        borderRadius: computedRadius,
        backgroundColor: variant === "transparent" ? "transparent" : bg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Source Serif 4', Georgia, serif",
        fontWeight: 700,
        color: "#ffffff",
        lineHeight: 1,
        userSelect: "none",
        flexShrink: 0,
        boxShadow: variant === "tile" ? "0 2px 8px rgba(16, 23, 42, 0.25)" : "none",
        transition: "all 0.2s ease-in-out",
        ...sx,
      }}
    >
      <span style={{ fontSize: calculatedFontSize, display: "inline-block", transform: "translateY(-0.5px)" }}>
        W<span style={{ color: zColor }}>{uppercase ? "Z" : "z"}</span>
      </span>
    </Box>
  );
};

export default WzChatbotIcon;
