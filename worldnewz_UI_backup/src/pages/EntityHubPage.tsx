import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Box, Typography, Chip, Alert, LinearProgress, Button } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import TopicIcon from "@mui/icons-material/Topic";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { fetchSearch } from "../api/apiClient";
import type { Article } from "../types";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDCollectionPage, JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import NewsGrid from "../components/NewsGrid";
import { useBookmarks } from "../hooks/useBookmarks";
import { useComments } from "../hooks/useComments";

const SITE_URL = "https://worldnewzs.in";

export const EntityHubPage: React.FC = () => {
  const { entityType, entityName } = useParams<{ entityType: string; entityName: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const { 
    getEngagement, 
    toggleLike, 
    toggleDislike, 
    addComment, 
    deleteComment, 
    likeComment, 
    dislikeComment 
  } = useComments();

  const formattedName = (entityName || "")
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const getIcon = () => {
    switch (entityType?.toLowerCase()) {
      case "company": return <BusinessIcon fontSize="large" color="primary" />;
      case "person": return <PersonIcon fontSize="large" color="primary" />;
      default: return <TopicIcon fontSize="large" color="primary" />;
    }
  };

  useEffect(() => {
    if (!entityName) return;

    setLoading(true);
    setError(null);

    fetchSearch({ query: formattedName, pageSize: 12 })
      .then((res) => {
        const results = Array.isArray(res.data?.results) ? res.data.results : [];
        const mapped: Article[] = results.map((item: any) => ({
          ...item,
          imageUrl: item.urlToImage || item.imageUrl,
          category: item.category || (typeof item.source === "string" ? item.source : item.source?.name) || "News"
        }));
        setArticles(mapped);
      })
      .catch((err) => {
        console.error("Error fetching entity hub articles:", err);
        setError("Failed to load news stories for this entity.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [entityName, formattedName]);

  const canonicalUrl = `${SITE_URL}/${entityType}/${entityName}`;

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: "80vh" }}>
      <SEOMeta
        title={`${formattedName} News & Latest Updates | WorldNewzs Entity Hub`}
        description={`Read all curated breaking news, briefings, and analysis about ${formattedName} on WorldNewzs.`}
        keywords={[formattedName, `${formattedName} news`, `${formattedName} updates`, entityType || "topic"]}
        canonical={canonicalUrl}
      />

      <JSONLDCollectionPage
        title={`${formattedName} News Hub`}
        description={`Curated news coverage and analysis regarding ${formattedName}.`}
        url={canonicalUrl}
        articles={articles.map(a => ({
          title: a.headline || a.title,
          url: a.url || `${SITE_URL}/read-article/${(a as any).id || "story"}`
        }))}
      />

      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: SITE_URL },
          { name: entityType ? entityType.charAt(0).toUpperCase() + entityType.slice(1) : "Entity", url: `${SITE_URL}/${entityType || "topic"}` },
          { name: formattedName, url: canonicalUrl }
        ]}
      />

      {/* Entity Header Banner */}
      <Box
        sx={{
          p: { xs: 3, sm: 4 },
          mb: 4,
          borderRadius: 3,
          background: "linear-gradient(135deg, rgba(200, 58, 21, 0.08) 0%, rgba(26, 26, 46, 0.12) 100%)",
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 2.5,
          flexWrap: "wrap"
        }}
      >
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
          }}
        >
          {getIcon()}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Chip label={(entityType || "Topic").toUpperCase()} size="small" color="primary" sx={{ fontWeight: 800, fontSize: "0.7rem" }} />
            <Chip label="Evergreen Entity Hub" size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />
          </Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 900, fontSize: { xs: "1.8rem", sm: "2.5rem" } }}>
            {formattedName}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time aggregated storyline, background briefings, and recent articles about <strong>{formattedName}</strong>.
          </Typography>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ py: 6, width: "100%" }}>
          <Typography variant="h6" align="center" sx={{ mb: 2 }}>Loading Entity Hub Content...</Typography>
          <LinearProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

      {!loading && articles.length === 0 && (
        <Alert severity="info" sx={{ mb: 4 }}>
          No recent news stories found for <strong>{formattedName}</strong>. Check back soon for automated updates!
        </Alert>
      )}

      {!loading && articles.length > 0 && (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
            Latest Coverage ({articles.length} Stories)
          </Typography>
          <NewsGrid
            articles={articles}
            onBookmark={addBookmark}
            onRemoveBookmark={removeBookmark}
            isBookmarked={isBookmarked}
            onLike={toggleLike}
            onDislike={toggleDislike}
            onAddComment={addComment}
            onDeleteComment={deleteComment}
            onLikeComment={likeComment}
            onDislikeComment={dislikeComment}
            getEngagement={getEngagement}
          />
        </Box>
      )}

      <Box sx={{ mt: 6, display: "flex", justifyContent: "center" }}>
        <Button component={Link} to="/" startIcon={<ArrowBackIcon />} variant="outlined">
          Return to Discover
        </Button>
      </Box>
    </Container>
  );
};

export default EntityHubPage;
