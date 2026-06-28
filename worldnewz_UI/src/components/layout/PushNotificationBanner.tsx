import React from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CloseIcon from "@mui/icons-material/Close";

interface PushNotificationBannerProps {
  onEnable: () => void;
  onDismiss: () => void;
  isDark: boolean;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  onEnable,
  onDismiss,
  isDark
}) => {
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 24,
        left: 24,
        zIndex: 2000,
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        color: isDark ? "#f3f4f6" : "#111827",
        p: 2.5,
        borderRadius: "16px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
        border: "1px solid",
        borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
        maxWidth: 380,
        animation: "slideUp 0.4s ease-out",
        "@keyframes slideUp": {
          from: { transform: "translateY(100px)", opacity: 0 },
          to: { transform: "translateY(0)", opacity: 1 }
        }
      }}
    >
      <Box sx={{ display: "flex", gap: 1.5, position: "relative" }}>
        <Box
          sx={{
            backgroundColor: "rgba(200, 58, 21, 0.1)",
            borderRadius: "12px",
            p: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "fit-content"
          }}
        >
          <NotificationsActiveIcon sx={{ color: "#c83a15", fontSize: 28 }} />
        </Box>
        <Box sx={{ pr: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: -0.2 }}>
            Stay Updated! 🔔
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? "#9ca3af" : "#4b5563", lineHeight: 1.4, mb: 2 }}>
            Enable push notifications to receive real-time alerts about breaking news, election results, and local happenings.
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={onEnable}
              sx={{
                background: "linear-gradient(135deg, #c83a15, #f857a6)",
                color: "white",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "8px",
                "&:hover": {
                  filter: "brightness(1.1)",
                  boxShadow: "0 4px 10px rgba(200, 58, 21, 0.3)"
                }
              }}
            >
              Allow Alerts
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={onDismiss}
              sx={{
                color: isDark ? "#9ca3af" : "#4b5563",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                }
              }}
            >
              Later
            </Button>
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={onDismiss}
          sx={{
            position: "absolute",
            top: -8,
            right: -8,
            color: isDark ? "#9ca3af" : "#4b5563"
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Box>
  );
};
export default PushNotificationBanner;
