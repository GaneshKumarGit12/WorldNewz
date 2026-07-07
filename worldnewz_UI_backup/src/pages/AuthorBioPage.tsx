import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Box, Typography, Avatar, Grid, Card, CardMedia, CardContent, Button, Divider, Alert, CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import EmailIcon from "@mui/icons-material/Email";
import SchoolIcon from "@mui/icons-material/School";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { AUTHORS } from "../utils/authors";
import { fetchSports, fetchMoney, fetchSearch, fetchTravel, fetchFood, fetchEntertainment, fetchWeather } from "../api/apiClient";
import type { Article } from "../types";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";

const getArticlesFetch = (slug: string) => {
  switch (slug) {
    case "marcus-sterling":
      return () => fetchSports({ pageSize: 6 });
    case "elena-rostova":
      return () => fetchMoney({ pageSize: 6 });
    case "derrick-storm":
      return () => fetchWeather({ pageSize: 6 });
    case "maya-patel":
      return () => fetchTravel({ pageSize: 6 });
    case "julian-vance":
      return () => fetchFood({ pageSize: 6 });
    case "chloe-devereaux":
      return () => fetchEntertainment({ pageSize: 6 });
    case "aris-thorne":
      return () => fetchSearch({ category: "technology", pageSize: 6 });
    case "clara-vance":
      return () => fetchSearch({ category: "science", pageSize: 6 });
    default:
      return () => fetchSearch({ query: "news", pageSize: 6 });
  }
};

const AuthorBioPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const author = slug ? AUTHORS[slug] : null;

  useEffect(() => {
    if (!author) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchFunc = getArticlesFetch(author.slug);

    fetchFunc()
      .then((res) => {
        const data = Array.isArray(res.data?.articles) 
          ? res.data.articles 
          : (Array.isArray(res.data?.results) ? res.data.results : []);
        
        const formatted = data.map((a: any) => ({
          ...a,
          imageUrl: a.urlToImage || a.imageUrl || a.image,
          category: a.category || author.specialty.split(" ")[0]
        }));
        
        setArticles(formatted.slice(0, 6));
      })
      .catch((err) => {
        console.error("Error fetching author articles:", err);
        setError("Unable to load articles curated by this author.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug, author]);

  if (!author) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">Author profile not found.</Alert>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/")} sx={{ mt: 3 }}>
          Back to Homepage
        </Button>
      </Container>
    );
  }

  const getAvatarBg = (specialty: string) => {
    const spec = specialty.toLowerCase();
    if (spec.includes("sports")) return "#f44336";
    if (spec.includes("business") || spec.includes("finance")) return "#e91e63";
    if (spec.includes("tech")) return "#2196f3";
    if (spec.includes("science") || spec.includes("astro")) return "#4caf50";
    if (spec.includes("meteorology") || spec.includes("weather")) return "#00bcd4";
    if (spec.includes("travel")) return "#009688";
    if (spec.includes("food") || spec.includes("culinary")) return "#9c27b0";
    if (spec.includes("entertainment")) return "#673ab7";
    return "#ff9800";
  };

  return (
    <>
      <SEOMeta
        title={`${author.name} - ${author.title} | WorldNewzs`}
        description={`Read the professional bio and articles curated by ${author.name}, ${author.title} specializing in ${author.specialty} for WorldNewzs.`}
        canonical={`https://worldnewzs.in/author/${author.slug}`}
      />
      
      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: "https://worldnewzs.in" },
          { name: "Authors", url: "https://worldnewzs.in/about" },
          { name: author.name, url: `https://worldnewzs.in/author/${author.slug}` }
        ]}
      />

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{ mb: 4 }}
        >
          Back
        </Button>

        {/* Profile Card */}
        <Card 
          sx={{ 
            boxShadow: "0 12px 32px rgba(0,0,0,0.15)", 
            borderRadius: 3, 
            overflow: "hidden", 
            mb: 6,
            bgcolor: "background.paper",
            p: { xs: 3, sm: 5 }
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", justifyContent: "center" }}>
              <Avatar 
                sx={{ 
                  width: 140, 
                  height: 140, 
                  fontSize: "3.5rem", 
                  fontWeight: 800,
                  bgcolor: getAvatarBg(author.specialty),
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
                }}
              >
                {author.avatar}
              </Avatar>
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
                  {author.name}
                </Typography>
                <VerifiedUserIcon color="primary" sx={{ fontSize: 28 }} />
              </Box>

              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600, mb: 2 }}>
                {author.title}
              </Typography>

              {/* Education & Specialty Tags */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, bgcolor: "action.hover", px: 1.5, py: 0.5, borderRadius: 2 }}>
                  <SchoolIcon fontSize="small" color="action" />
                  <Typography variant="caption" sx={{ fontWeight: 550 }}>
                    {author.education}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, bgcolor: "action.hover", px: 1.5, py: 0.5, borderRadius: 2 }}>
                  <VerifiedUserIcon fontSize="small" color="action" />
                  <Typography variant="caption" sx={{ fontWeight: 550 }}>
                    Specialty: {author.specialty}
                  </Typography>
                </Box>
              </Box>

              {/* Bio Text */}
              <Typography variant="body1" sx={{ lineHeight: 1.7, color: "text.primary", mb: 3 }}>
                {author.bio}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* Social links */}
              <Box sx={{ display: "flex", gap: 2 }}>
                {author.socials.twitter && (
                  <Button 
                    variant="text" 
                    startIcon={<TwitterIcon />} 
                    component="a" 
                    href={author.socials.twitter} 
                    target="_blank"
                    rel="noopener noreferrer"
                    color="inherit"
                  >
                    Twitter
                  </Button>
                )}
                {author.socials.linkedin && (
                  <Button 
                    variant="text" 
                    startIcon={<LinkedInIcon />} 
                    component="a" 
                    href={author.socials.linkedin} 
                    target="_blank"
                    rel="noopener noreferrer"
                    color="inherit"
                  >
                    LinkedIn
                  </Button>
                )}
                <Button 
                  variant="text" 
                  startIcon={<EmailIcon />} 
                  component="a" 
                  href={`mailto:editorial@worldnewzs.in?subject=Attn:%20${encodeURIComponent(author.name)}`}
                  color="inherit"
                >
                  Contact
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* Curated Feed */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
            Curated Briefings by {author.name}
          </Typography>

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {error && <Alert severity="warning">{error}</Alert>}

          {!loading && !error && articles.length === 0 && (
            <Typography variant="body1" color="text.secondary">
              No recent briefings curated by this author.
            </Typography>
          )}

          {!loading && articles.length > 0 && (
            <Grid container spacing={3}>
              {articles.map((art, idx) => {
                const titleSlug = art.title?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().substring(0, 50) || "article";
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={idx}>
                    <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", borderRadius: 2 }}>
                      {art.imageUrl && (
                        <CardMedia
                          component="img"
                          height="180"
                          image={art.imageUrl}
                          alt={art.title}
                          sx={{ objectFit: "cover" }}
                        />
                      )}
                      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                        <Typography variant="subtitle2" color="primary" sx={{ textTransform: "uppercase", fontWeight: 700, mb: 1, fontSize: "0.7rem" }}>
                          {art.category}
                        </Typography>
                        <Typography 
                          variant="h6" 
                          component={Link}
                          to={`/article/${titleSlug}`}
                          state={{ article: art }}
                          sx={{ 
                            fontWeight: 700, 
                            lineHeight: 1.3, 
                            mb: 1, 
                            fontSize: "1rem", 
                            textDecoration: "none", 
                            color: "text.primary",
                            "&:hover": { color: "primary.main" },
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                          }}
                        >
                          {art.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            fontSize: "0.8rem", 
                            mb: 2,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            flexGrow: 1
                          }}
                        >
                          {art.summary || art.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Source: {typeof art.source === "string" ? art.source : (art.source?.name || "News")}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </Container>
    </>
  );
};

export default AuthorBioPage;
