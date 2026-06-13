import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { fetchPollsHistory, fetchLeaderboard } from "../api/apiClient";
import type { PollSubmissionHistoryItem } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";

const PollsHistory: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<PollSubmissionHistoryItem[]>([]);
  const [historyData, setHistoryData] = useState<PollSubmissionHistoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<PollSubmissionHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tabValue, setTabValue] = useState<number>(0); // 0: Leaderboard, 1: History

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [historyRes, leaderboardRes] = await Promise.all([
        fetchPollsHistory(),
        fetchLeaderboard()
      ]);

      setHistoryData(historyRes.data);
      setLeaderboardData(leaderboardRes.data);
      
      // Default view is Leaderboard (tab index 0)
      setFilteredData(leaderboardRes.data);
    } catch (err: any) {
      setError("Failed to load polls history and leaderboard from server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSearchQuery(""); // Clear search on tab change
    
    if (newValue === 0) {
      setFilteredData(leaderboardData);
    } else {
      setFilteredData(historyData);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    const activeDataset = tabValue === 0 ? leaderboardData : historyData;

    if (!query) {
      setFilteredData(activeDataset);
    } else {
      const lower = query.toLowerCase();
      const filtered = activeDataset.filter(
        (item) =>
          item.name.toLowerCase().includes(lower) ||
          item.email.toLowerCase().includes(lower) ||
          item.status.toLowerCase().includes(lower)
      );
      setFilteredData(filtered);
    }
  };

  // Define columns for Material-UI DataGrid matching Name, Email, Percentage, Status
  const columns: GridColDef[] = [
    { 
      field: "id", 
      headerName: "Rank / ID", 
      width: 120, 
      sortable: true,
      renderCell: (params) => {
        let content;
        if (tabValue === 0) {
          const index = filteredData.findIndex(item => item.id === params.row.id);
          if (index === 0) {
            content = <Chip label="1st 🥇" size="small" sx={{ fontWeight: 900, color: "#fff", background: "linear-gradient(45deg, #f59e0b, #d97706)", px: 1.5, py: 0.5, border: "none" }} />;
          } else if (index === 1) {
            content = <Chip label="2nd 🥈" size="small" sx={{ fontWeight: 900, color: "#fff", background: "linear-gradient(45deg, #9ca3af, #4b5563)", px: 1.5, py: 0.5, border: "none" }} />;
          } else if (index === 2) {
            content = <Chip label="3rd 🥉" size="small" sx={{ fontWeight: 900, color: "#fff", background: "linear-gradient(45deg, #b45309, #78350f)", px: 1.5, py: 0.5, border: "none" }} />;
          } else {
            content = <Typography variant="body2" sx={{ fontWeight: 700, pl: 1 }}>#{index + 1}</Typography>;
          }
        } else {
          content = <Typography variant="body2">{params.value}</Typography>;
        }
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            {content}
          </Box>
        );
      }
    },
    { 
      field: "name", 
      headerName: "Name", 
      flex: 1.2, 
      sortable: true,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: "email", 
      headerName: "Email Address", 
      flex: 1.5, 
      sortable: true,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" color="text.secondary">
            {params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: "percentage", 
      headerName: "Score Percentage", 
      width: 150, 
      type: "number",
      sortable: true,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" sx={{ fontWeight: 900, color: "primary.main" }}>
            {params.value}%
          </Typography>
        </Box>
      )
    },
    { 
      field: "status", 
      headerName: "Status Rating", 
      width: 180, 
      sortable: true,
      renderCell: (params) => {
        const status = params.value as string;
        let color = "#ef4444";
        let label = "Needs Work";
        let animationClass = "animate-pulse-red";
        if (status === "Green") {
          color = "#22c55e";
          label = "Excellent";
          animationClass = "animate-pulse-green";
        } else if (status === "Orange") {
          color = "#f59e0b";
          label = "Good";
          animationClass = "animate-pulse-orange";
        }

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, height: "100%" }}>
            {/* Pulsing Status Dot */}
            <Box 
              className={animationClass}
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: color,
                display: "inline-block"
              }}
            />
            {/* Status Chip text */}
            <Typography variant="body2" sx={{ fontWeight: 800, color: color }}>
              {label}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: "submittedAt", 
      headerName: "Submitted Date", 
      width: 180, 
      sortable: true,
      renderCell: (params) => {
        let formattedDate = params.value as string;
        try {
          if (formattedDate) {
            // Append Z if it is not present so browser treats it as UTC
            const utcString = formattedDate.endsWith("Z") ? formattedDate : formattedDate + "Z";
            const dateObj = new Date(utcString);
            formattedDate = dateObj.toLocaleString(navigator.language, {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true
            });
          }
        } catch (e) {
          console.error("Error formatting date", e);
        }
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Typography variant="caption" color="text.secondary">
              {formattedDate}
            </Typography>
          </Box>
        );
      }
    }
  ];

  const dynamicKeywordsData = useKeywords("polls-history");
  const defaultKeywords = ["polls archives", "polls history", "historical opinion polls", "voting metrics", "public trends", "historical data"];
  const combinedKeywords = dynamicKeywordsData
    ? [...new Set([...defaultKeywords, ...dynamicKeywordsData.primary, ...dynamicKeywordsData.longtail, ...dynamicKeywordsData.trending])]
    : defaultKeywords;
  const descriptionToUse = dynamicKeywordsData?.metaDesc || "Explore the archives of historical opinion polls on WorldNewzs. View voting metrics and public trends over time.";

  return (
    <>
      <SEOMeta
        title="Opinion Polls Archives & Leaderboard | WorldNewzs"
        description={descriptionToUse}
        keywords={combinedKeywords}
        canonical="https://worldnewzs.in/polls-history"
      />
      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: "https://worldnewzs.in" },
          { name: "Opinion Polls", url: "https://worldnewzs.in/polls" },
          { name: "Polls History", url: "https://worldnewzs.in/polls-history" },
        ]}
      />

      {/* Embedded Animations CSS for status dot pulsing */}
      <style>{`
        @keyframes pulse-green {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1.4); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        @keyframes pulse-orange {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
          70% { transform: scale(1.4); box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        @keyframes pulse-red {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.4); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animate-pulse-green { animation: pulse-green 1.5s infinite; }
        .animate-pulse-orange { animation: pulse-orange 1.5s infinite; }
        .animate-pulse-red { animation: pulse-red 1.5s infinite; }
      `}</style>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Navigation back */}
        <Button
          component={Link}
          to="/polls"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3, textTransform: "none", fontWeight: 700 }}
        >
          Back to Timed Polls
        </Button>

        {/* Title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
          <EmojiEventsIcon sx={{ fontSize: 42, color: "warning.main" }} />
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 900 }}>
              Rankings & Archives
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View user leaderboard rankings and check historical user validation statistics.
            </Typography>
          </Box>
        </Box>

        {/* Loading and Error */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={50} />
          </Box>
        )}

        {error && !loading && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>
            {error}
          </Alert>
        )}

        {/* Main Grid Card */}
        {!loading && !error && (
          <Card sx={{ 
            borderRadius: 4, 
            boxShadow: "0 6px 25px rgba(0,0,0,0.06)", 
            border: "1px solid", 
            borderColor: "divider",
            backgroundColor: "background.paper"
          }}>
            {/* Tabs Header */}
            <Box sx={{ borderBottom: 1, borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, flexWrap: "wrap", gap: 2 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                textColor="primary"
                indicatorColor="primary"
                sx={{
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    py: 2.5
                  }
                }}
              >
                <Tab icon={<WorkspacePremiumIcon />} iconPosition="start" label="Leaderboard Rankings" />
                <Tab icon={<HistoryIcon />} iconPosition="start" label="All Submissions Log" />
              </Tabs>

              {/* Search Field */}
              <TextField
                placeholder={tabValue === 0 ? "Search leaderboard..." : "Search submissions..."}
                value={searchQuery}
                onChange={handleSearchChange}
                size="small"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ maxWidth: 260, width: "100%", my: 1.5 }}
              />
            </Box>

            {/* Leaderboard Welcome Alert */}
            {tabValue === 0 && (
              <Box sx={{ p: 3, pb: 0 }}>
                <Alert severity="info" icon={<EmojiEventsIcon />} sx={{ borderRadius: 3 }}>
                  This Leaderboard showcases the poll submissions from all participants ranked by their scores.
                </Alert>
              </Box>
            )}

            <Box sx={{ height: 500, width: "100%", p: 2 }}>
              <DataGrid
                rows={filteredData}
                columns={columns}
                rowHeight={70}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 5, page: 0 }
                  }
                }}
                pageSizeOptions={[5, 10, 25]}
                disableRowSelectionOnClick
                sx={{
                  border: "none",
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "action.hover",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    fontWeight: 900,
                  },
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "action.hover",
                  },
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  },
                }}
              />
            </Box>
          </Card>
        )}
      </Container>
    </>
  );
};

export default PollsHistory;
