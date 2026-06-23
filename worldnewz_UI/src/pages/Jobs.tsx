import React, { useState, useEffect, useMemo } from "react";
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Chip, 
  CircularProgress, 
  TextField, 
  FormControlLabel, 
  Switch, 
  Breadcrumbs, 
  Link,
  Pagination,
  InputAdornment
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import WorkIcon from "@mui/icons-material/Work";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BusinessIcon from "@mui/icons-material/Business";
import SearchIcon from "@mui/icons-material/Search";
import HomeIcon from "@mui/icons-material/Home";
import { fetchJobs } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";

interface Job {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number;
  isLocal?: boolean;
}

const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [locationTerm, setLocationTerm] = useState<string>("");
  const [remoteOnly, setRemoteOnly] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchJobs(page);
        if (response.data && Array.isArray(response.data.data)) {
          setJobs(response.data.data);
          // Set arbitrary total pages based on response metadata or default to 5
          const currentPage = response.data.meta?.current_page || page;
          setTotalPages(response.data.meta?.next ? currentPage + 1 : currentPage);
        } else {
          setError("Failed to load jobs listings.");
        }
      } catch (err: any) {
        console.error("Error loading jobs:", err);
        setError("Could not retrieve job listings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [page]);

  // Client-side filtering for Search, Location, and Remote
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchSearch = searchTerm === "" || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchLocation = locationTerm === "" || 
        job.location.toLowerCase().includes(locationTerm.toLowerCase());

      const matchRemote = !remoteOnly || job.remote === true;

      const matchTag = !selectedTag || job.tags.includes(selectedTag);

      return matchSearch && matchLocation && matchRemote && matchTag;
    });
  }, [jobs, searchTerm, locationTerm, remoteOnly, selectedTag]);

  // Extract all unique tags from active jobs for a filter row
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    jobs.forEach(job => {
      if (Array.isArray(job.tags)) {
        job.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).slice(0, 12); // Limit to top 12 tags
  }, [jobs]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: "80vh" }}>
      <SEOMeta
        title="Jobs – Latest Career Opportunities & Remote Openings"
        description="Explore the latest job listings, career openings, visa sponsorship, and remote employment opportunities on WorldNewzs."
        canonical="https://worldnewzs.in/jobs"
      />

      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          underline="hover" 
          color="inherit" 
          onClick={() => navigate("/")} 
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <HomeIcon sx={{ mr: 0.5, fontSize: 'inherit' }} />
          Home
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
          <WorkIcon sx={{ mr: 0.5, fontSize: 'inherit' }} />
          Jobs
        </Typography>
      </Breadcrumbs>

      {/* Header and Title */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <WorkIcon color="success" sx={{ fontSize: 36 }} />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Latest Job Opportunities
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="success"
          startIcon={<WorkIcon />}
          onClick={() => navigate("/jobs/post-job")}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3, py: 1 }}
        >
          Post a Job 💼
        </Button>
      </Box>

      {/* Filter panel */}
      <Card sx={{ p: 2, mb: 3, boxShadow: "none", bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search job title, company, or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Filter by location (e.g. Germany, Munich)..."
              value={locationTerm}
              onChange={(e) => setLocationTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOnIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  color="success"
                />
              }
              label="Remote Only"
            />
            { (searchTerm || locationTerm || remoteOnly || selectedTag) && (
              <Button 
                size="small" 
                color="error" 
                variant="outlined"
                onClick={() => {
                  setSearchTerm("");
                  setLocationTerm("");
                  setRemoteOnly(false);
                  setSelectedTag(null);
                }}
              >
                Clear Filters
              </Button>
            )}
          </Grid>
        </Grid>

        {/* Tags Quick Filter */}
        {availableTags.length > 0 && (
          <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
              Filter by Tag:
            </Typography>
            {availableTags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                color={selectedTag === tag ? "success" : "default"}
                variant={selectedTag === tag ? "filled" : "outlined"}
                sx={{ cursor: "pointer", fontSize: "0.7rem", fontWeight: 600 }}
              />
            ))}
          </Box>
        )}
      </Card>

      {/* Main Content Area */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
          <CircularProgress color="success" />
        </Box>
      ) : error ? (
        <Typography color="error" align="center" sx={{ py: 4, fontWeight: 500 }}>
          {error}
        </Typography>
      ) : filteredJobs.length === 0 ? (
        <Typography align="center" color="text.secondary" sx={{ py: 8 }}>
          No matching jobs found. Try clearing or relaxing your search filters.
        </Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {filteredJobs.map((job) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={job.slug}>
                <Card 
                  sx={{ 
                    height: "100%", 
                    display: "flex", 
                    flexDirection: "column", 
                    boxShadow: "none", 
                    border: "1px solid", 
                    borderColor: "divider",
                    borderRadius: 2,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                      borderColor: "success.main"
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                        {job.title}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                        {job.isLocal && (
                          <Chip 
                            label="Direct" 
                            size="small" 
                            color="primary" 
                            variant="filled" 
                            sx={{ fontSize: "0.65rem", fontWeight: 700, height: 20 }} 
                          />
                        )}
                        {job.remote && (
                          <Chip 
                            label="Remote" 
                            size="small" 
                            color="success" 
                            variant="outlined" 
                            sx={{ fontSize: "0.65rem", fontWeight: 700, height: 20 }} 
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Company details */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary", mb: 0.5 }}>
                      <BusinessIcon sx={{ fontSize: "0.9rem" }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {job.company_name}
                      </Typography>
                    </Box>

                    {/* Location details */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary", mb: 2 }}>
                      <LocationOnIcon sx={{ fontSize: "0.9rem" }} />
                      <Typography variant="body2">
                        {job.location}
                      </Typography>
                    </Box>

                    {/* Tags list */}
                    {job.tags && job.tags.length > 0 && (
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}>
                        {job.tags.slice(0, 3).map((tag) => (
                          <Chip 
                            key={tag} 
                            label={tag} 
                            size="small" 
                            sx={{ fontSize: "0.65rem", height: 18, bgcolor: "action.selected" }} 
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0, justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary">
                      {job.created_at ? new Date(job.created_at * 1000).toLocaleDateString() : ""}
                    </Typography>
                    <Button 
                      size="small" 
                      color="success" 
                      variant="contained" 
                      onClick={() => navigate(`/jobs/detail/${job.slug}`)}
                      sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1 }}
                    >
                      Apply Now
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              variant="outlined"
              shape="rounded"
            />
          </Box>
        </>
      )}

      {/* Attribution footer */}
      <Box sx={{ mt: 6, p: 2, borderRadius: 2, bgcolor: "action.hover", textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Jobs data powered by <Link href="https://www.arbeitnow.com/" target="_blank" rel="noopener noreferrer" sx={{ color: "success.main", fontWeight: 600 }}>Arbeitnow</Link>. 
          By using this service, you agree to the terms of service of the job provider.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, fontSize: "0.75rem", fontStyle: "italic" }}>
          Every Job and Job posting coming under arbeitnow.com
        </Typography>
      </Box>
    </Box>
  );
};

export default Jobs;
