import React from "react";
import { Zoom, Fab } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

interface BackToTopProps {
  show: boolean;
  onClick: () => void;
}

export const BackToTop: React.FC<BackToTopProps> = ({ show, onClick }) => {
  return (
    <Zoom in={show}>
      <Fab
        color="primary"
        size="small"
        aria-label="scroll back to top"
        onClick={onClick}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
          background: "linear-gradient(135deg, #c83a15, #f857a6)",
          boxShadow: "0 4px 12px rgba(200, 58, 21, 0.4)",
          "&:hover": {
            filter: "brightness(1.1)",
          }
        }}
      >
        <KeyboardArrowUpIcon sx={{ color: "white" }} />
      </Fab>
    </Zoom>
  );
};
export default BackToTop;
