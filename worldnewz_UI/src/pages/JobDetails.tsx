import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Chip, 
  CircularProgress, 
  Link,
  Divider
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BusinessIcon from "@mui/icons-material/Business";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LaunchIcon from "@mui/icons-material/Launch";
import { fetchJobDetail } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { BreadcrumbNav } from "../components/BreadcrumbNav";

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

const JobDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getDetail = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetchJobDetail(slug);
        if (response.data) {
          setJob(response.data);
        } else {
          setError("Job details could not be found.");
        }
      } catch (err: any) {
        console.error("Error loading job details:", err);
        setError("Could not retrieve job details. It may have expired or been removed.");
      } finally {
        setLoading(false);
      }
    };

    getDetail();
  }, [slug]);

  const getApplyLink = (url: string) => {
    if (!url) return "#";
    if (url.includes("@") && !url.startsWith("mailto:")) {
      return `mailto:${url}?subject=Application for ${encodeURIComponent(job?.title || "Job Opportunity")}`;
    }
    return url;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  if (error || !job) {
    return (
      <Box sx={{ p: 4, textAlign: "center", minHeight: "60vh" }}>
        <Typography color="error" variant="h6" sx={{ mb: 2 }}>
          {error || "Job details not found."}
        </Typography>
        <Button 
          variant="outlined" 
          color="success" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate("/jobs")}
        >
          Back to Jobs Board
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: "80vh", maxWidth: 900, mx: "auto" }}>
      <SEOMeta
        title={`${job.title} at ${job.company_name} – WorldNewzs Jobs`}
        description={`Apply for ${job.title} at ${job.company_name} in ${job.location}. ${job.remote ? "Remote work available." : ""} Read full details and apply now.`}
        canonical={`https://worldnewzs.in/jobs/detail/${job.slug}`}
      />

      {/* Breadcrumbs */}
      <BreadcrumbNav
        items={[
          { label: "Jobs", path: "/jobs" },
          { label: job.title }
        ]}
      />

      {/* Action Button: Back */}
      <Button 
        id="job-details-back-btn"
        variant="text" 
        color="success" 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate("/jobs")}
        sx={{ mb: 3, textTransform: "none", fontWeight: 600 }}
      >
        Back to Jobs Board
      </Button>

      {/* Main Card */}
      <Card sx={{ boxShadow: "none", border: "1px solid", borderColor: "divider", borderRadius: 3, mb: 4 }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          
          {/* Header Info */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1, color: "text.primary", lineHeight: 1.2 }}>
                {job.title}
              </Typography>
              
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, color: "text.secondary", mt: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <BusinessIcon sx={{ fontSize: "1.1rem" }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {job.company_name}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <LocationOnIcon sx={{ fontSize: "1.1rem" }} />
                  <Typography variant="body1">
                    {job.location}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CalendarTodayIcon sx={{ fontSize: "1.1rem" }} />
                  <Typography variant="body1">
                    Posted on {new Date(job.created_at * 1000).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              {job.isLocal && (
                <Chip label="Direct Post" color="primary" variant="filled" sx={{ fontWeight: 700 }} />
              )}
              {job.remote && (
                <Chip label="Remote" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Job Tags */}
          {job.tags && job.tags.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: "uppercase", fontSize: "0.75rem", color: "text.secondary" }}>
                Tags & Skills
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {job.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" sx={{ fontWeight: 600, fontSize: "0.75rem" }} />
                ))}
              </Box>
            </Box>
          )}

          {/* Apply Banner CTA */}
          <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "success.light", color: "success.contrastText", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 4, opacity: 0.95 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Interested in this role?
              </Typography>
              <Typography variant="body2">
                Apply directly using the official application option.
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              color="success" 
              href={getApplyLink(job.url)} 
              target="_blank" 
              rel="noopener noreferrer"
              endIcon={<LaunchIcon />}
              sx={{ fontWeight: 700, px: 3, py: 1, textTransform: "none", borderRadius: 2 }}
            >
              Apply for Job
            </Button>
          </Box>

          {/* Description Section */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Job Description & Requirements
          </Typography>
          
          <Box 
            className="job-description-content"
            sx={{ 
              color: "text.primary", 
              lineHeight: 1.6,
              fontSize: "0.95rem",
              "& p": { mb: 2 },
              "& ul, & ol": { pl: 3, mb: 2 },
              "& li": { mb: 1 },
              "& h2, & h3": { fontWeight: 700, mt: 3, mb: 1.5 },
              "& strong": { fontWeight: 700 }
            }}
            dangerouslySetInnerHTML={{ __html: job.description }}
          />

          {/* Bottom CTA */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Button 
              variant="contained" 
              color="success" 
              size="large"
              href={getApplyLink(job.url)} 
              target="_blank" 
              rel="noopener noreferrer"
              endIcon={<LaunchIcon />}
              sx={{ fontWeight: 700, px: 4, py: 1.5, textTransform: "none", borderRadius: 2 }}
            >
              Apply for this Job
            </Button>
          </Box>

        </CardContent>
      </Card>

      {/* Attribution footer */}
      <Box sx={{ mt: 6, p: 2, borderRadius: 2, bgcolor: "action.hover", textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Jobs details aggregated from <Link href="https://www.arbeitnow.com/" target="_blank" rel="noopener noreferrer" sx={{ color: "success.main", fontWeight: 600 }}>Arbeitnow</Link>. 
          By using this service, you agree to the terms of service of the job provider.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, fontSize: "0.75rem", fontStyle: "italic" }}>
          Every Job and Job posting coming under arbeitnow.com
        </Typography>
      </Box>
    </Box>
  );
};

export default JobDetails;
