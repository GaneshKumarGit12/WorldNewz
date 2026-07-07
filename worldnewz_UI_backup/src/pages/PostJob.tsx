import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  FormControlLabel, 
  Switch, 
  Breadcrumbs, 
  Link,
  Grid,
  MenuItem,
  Alert,
  Avatar,
  Divider
} from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import HomeIcon from "@mui/icons-material/Home";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StarIcon from "@mui/icons-material/Star";
import { postJob } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";

const jobTypesOptions = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Temporary"
];

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "HR Director at TechFlow",
    avatar: "",
    text: "We posted a Senior React Developer position on WorldNewzs Jobs and were overwhelmed by the response. Over 120 qualified applicants within a week! The SEO optimization is top-notch."
  },
  {
    name: "Marcus Aurelius",
    role: "Talent Acquisition at Digitally",
    avatar: "",
    text: "WorldNewzs provides an incredibly simple and streamlined portal for posting jobs. It took us less than 5 minutes to submit our listing, and candidates started applying immediately."
  },
  {
    name: "Elena Rostova",
    role: "Co-Founder at CyberLaunch",
    avatar: "",
    text: "The integration and visibility across search engines is amazing. Our job postings ranked on Google Jobs within 24 hours. We will definitely use this service for our future hires!"
  }
];

const PostJob: React.FC = () => {
  const navigate = useNavigate();
  
  // Form State
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [remote, setRemote] = useState(false);
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  
  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newSlug, setNewSlug] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!title.trim() || !companyName.trim() || !description.trim() || !url.trim() || !location.trim()) {
      setError("Please fill in all required fields (Job Title, Company Name, Location, Description, and Application URL/Email).");
      setLoading(false);
      return;
    }

    try {
      const parsedTags = tags ? tags.split(",").map(t => t.trim()).filter(t => t) : [];
      const jobData = {
        title,
        companyName,
        location,
        remote,
        url,
        description: description.replace(/\n/g, "<br />"), // Convert line breaks to HTML breaks
        tags: parsedTags,
        jobTypes: [jobType]
      };

      const response = await postJob(jobData);
      if (response.data && response.data.success) {
        setSuccess("Your job posting has been successfully published!");
        setNewSlug(response.data.slug);
        // Clear fields
        setTitle("");
        setCompanyName("");
        setLocation("");
        setUrl("");
        setTags("");
        setDescription("");
        setRemote(false);
      } else {
        setError("Failed to submit job posting. Please try again.");
      }
    } catch (err: any) {
      console.error("Error posting job:", err);
      setError(err.response?.data?.error || "An error occurred while posting your job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: "80vh", maxWidth: 1000, mx: "auto" }}>
      <SEOMeta
        title="Post a Job – Reach Top Talent Instantly"
        description="Submit your job opening on WorldNewzs. Get high-quality applications for developer, design, and remote roles from a global audience."
        canonical="https://worldnewzs.in/jobs/post-job"
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
        <Link 
          underline="hover" 
          color="inherit" 
          onClick={() => navigate("/jobs")} 
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <WorkIcon sx={{ mr: 0.5, fontSize: 'inherit' }} />
          Jobs
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
          Post a Job
        </Typography>
      </Breadcrumbs>

      {/* Action Button: Back */}
      <Button 
        variant="text" 
        color="success" 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate("/jobs")}
        sx={{ mb: 3, textTransform: "none", fontWeight: 600 }}
      >
        Back to Jobs Board
      </Button>

      {/* Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
          Post a Job Opening
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Fill out the details below to publish your job listing. Reach developers, designers, and remote workers globally.
        </Typography>
      </Box>

      {/* Main Grid */}
      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        
        {/* Form Column */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ boxShadow: "none", border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Provide information about the job posting
              </Typography>

              {success && (
                <Box sx={{ mb: 3 }}>
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {success}
                    </Typography>
                    {newSlug && (
                      <Button 
                        size="small" 
                        color="success" 
                        variant="contained"
                        onClick={() => navigate(`/jobs/detail/${newSlug}`)}
                        sx={{ mt: 1, textTransform: "none", fontWeight: 600 }}
                      >
                        View Posted Job
                      </Button>
                    )}
                  </Alert>
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                  id="postjob-title"
                  required
                  fullWidth
                  label="Job Title"
                  placeholder="e.g. Senior Full-Stack Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  size="small"
                />

                <TextField
                  id="postjob-company"
                  required
                  fullWidth
                  label="Company Name"
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  size="small"
                />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      id="postjob-location"
                      required
                      fullWidth
                      label="Location"
                      placeholder="e.g. Berlin, Germany or Remote"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      id="postjob-jobtype"
                      select
                      fullWidth
                      label="Job Type"
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      size="small"
                    >
                      {jobTypesOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <TextField
                  id="postjob-url"
                  required
                  fullWidth
                  label="Application Link or Contact Email"
                  placeholder="e.g. https://careers.company.com/apply or jobs@company.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  size="small"
                  type="text"
                />

                <TextField
                  id="postjob-tags"
                  fullWidth
                  label="Skills / Tags"
                  placeholder="e.g. React, TypeScript, Node.js (comma-separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  size="small"
                  helperText="Separate tags with commas"
                />

                <FormControlLabel
                  control={
                    <Switch
                      id="postjob-remote-switch"
                      checked={remote}
                      onChange={(e) => setRemote(e.target.checked)}
                      color="success"
                    />
                  }
                  label="This is a Remote position"
                />

                <TextField
                  id="postjob-description"
                  required
                  fullWidth
                  multiline
                  rows={8}
                  label="Job Description"
                  placeholder="Describe the responsibilities, requirements, and benefits of the role..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  size="small"
                />

                <Button
                  id="postjob-submit-btn"
                  type="submit"
                  variant="contained"
                  color="success"
                  disabled={loading}
                  sx={{ textTransform: "none", fontWeight: 700, py: 1.25, borderRadius: 2 }}
                >
                  {loading ? "Publishing..." : "Publish Job Posting 🚀"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Testimonials Column */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0 }}>
              What our customer says posting
            </Typography>

            {testimonials.map((t, idx) => (
              <Card 
                key={idx} 
                sx={{ 
                  boxShadow: "none", 
                  border: "1px solid", 
                  borderColor: "divider", 
                  borderRadius: 3, 
                  bgcolor: "action.hover",
                  transition: "transform 0.2s ease-in-out",
                  "&:hover": { transform: "translateY(-4px)" }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", color: "warning.main", gap: 0.25, mb: 1.5 }}>
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} sx={{ fontSize: "1.1rem" }} />
                    ))}
                  </Box>
                  <Typography variant="body2" sx={{ fontStyle: "italic", mb: 2, color: "text.primary", lineHeight: 1.6 }}>
                    "{t.text}"
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: "success.main", fontSize: "0.85rem", fontWeight: 700, width: 36, height: 36 }}>
                      {t.name.split(" ").map(n => n[0]).join("")}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.role}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>

      </Grid>

      {/* Attribution footer */}
      <Box sx={{ mt: 6, p: 2, borderRadius: 2, bgcolor: "action.hover", textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Jobs management system integrated with <Link href="https://www.arbeitnow.com/" target="_blank" rel="noopener noreferrer" sx={{ color: "success.main", fontWeight: 600 }}>Arbeitnow</Link>. 
          By using this service, you agree to the terms of service of the job provider.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, fontSize: "0.75rem", fontStyle: "italic" }}>
          Every Job and Job posting coming under arbeitnow.com
        </Typography>
      </Box>
    </Box>
  );
};

export default PostJob;
