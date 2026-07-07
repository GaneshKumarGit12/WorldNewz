import React from "react";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";

interface SectionStatusProps {
  loading: boolean;
  error: string | null;
  hasData: boolean;
  emptyText: string;
  children: React.ReactNode;
  skeletonCount?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns?: any;
}

const NewsCardSkeleton: React.FC = () => (
  <Card sx={{ borderRadius: 2, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
    <Box sx={{ position: "relative", paddingTop: "56.25%" }}>
      {/* Category Tag skeleton */}
      <Skeleton 
        variant="rectangular" 
        sx={{ position: "absolute", top: 8, left: 8, width: 60, height: 20, borderRadius: 1, zIndex: 2 }} 
        animation="wave" 
      />
      <Skeleton 
        variant="rectangular" 
        sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} 
        animation="wave" 
      />
    </Box>
    <CardContent sx={{ flexGrow: 1, p: 1.5, pb: 0 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        {/* Avatar skeleton */}
        <Skeleton variant="circular" width={24} height={24} animation="wave" sx={{ mt: 0.5 }} />
        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          {/* Title skeleton */}
          <Skeleton variant="text" height={20} width="90%" animation="wave" />
          <Skeleton variant="text" height={20} width="70%" animation="wave" sx={{ mb: 1 }} />
          
          {/* Summary skeleton */}
          <Skeleton variant="text" height={14} width="95%" animation="wave" />
          <Skeleton variant="text" height={14} width="90%" animation="wave" />
          <Skeleton variant="text" height={14} width="80%" animation="wave" sx={{ mb: 1.5 }} />
          
          {/* Meta skeleton */}
          <Skeleton variant="text" height={14} width="40%" animation="wave" sx={{ mb: 1.5 }} />

          {/* Why it matters skeleton */}
          <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 1, bgcolor: "action.hover", borderLeft: "3px solid #ccc" }}>
            <Skeleton variant="text" height={12} width="30%" animation="wave" sx={{ mb: 0.5 }} />
            <Skeleton variant="text" height={14} width="90%" animation="wave" />
          </Box>
        </Box>
      </Box>
    </CardContent>
    <Box sx={{ display: "flex", justifyContent: "space-between", px: 1.5, pb: 1.5, pl: 5.5, mt: 2 }}>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Skeleton variant="circular" width={18} height={18} animation="wave" />
        <Skeleton variant="circular" width={18} height={18} animation="wave" />
        <Skeleton variant="circular" width={18} height={18} animation="wave" />
      </Box>
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Skeleton variant="circular" width={18} height={18} animation="wave" />
        <Skeleton variant="circular" width={18} height={18} animation="wave" />
      </Box>
    </Box>
  </Card>
);

const SectionStatus: React.FC<SectionStatusProps> = ({
  loading,
  error,
  hasData,
  emptyText,
  children,
  skeletonCount = 6,
  columns = { xs: 12, sm: 6, md: 4, lg: 3 },
}) => {
  if (loading) {
    return (
      <Box sx={{ width: "100%" }}>
        {/* Top Slim linear progress loader */}
        <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <Grid size={columns} key={i}>
              <NewsCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!hasData) {
    return <Alert severity="info">{emptyText}</Alert>;
  }

  return <>{children}</>;
};

export default SectionStatus;
