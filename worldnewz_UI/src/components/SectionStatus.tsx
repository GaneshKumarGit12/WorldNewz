import React from "react";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

interface SectionStatusProps {
  loading: boolean;
  error: string | null;
  hasData: boolean;
  emptyText: string;
  children: React.ReactNode;
  skeletonCount?: number;
}

const NewsCardSkeleton: React.FC = () => (
  <Card sx={{ borderRadius: 2, overflow: "hidden" }}>
    <Skeleton variant="rectangular" height={180} animation="wave" />
    <CardContent>
      <Skeleton variant="text" height={28} width="90%" animation="wave" />
      <Skeleton variant="text" height={20} width="70%" animation="wave" />
      <Skeleton variant="text" height={20} width="50%" animation="wave" sx={{ mt: 1 }} />
    </CardContent>
  </Card>
);

const SectionStatus: React.FC<SectionStatusProps> = ({
  loading,
  error,
  hasData,
  emptyText,
  children,
  skeletonCount = 9,
}) => {
  if (loading) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
            <NewsCardSkeleton />
          </Grid>
        ))}
      </Grid>
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
