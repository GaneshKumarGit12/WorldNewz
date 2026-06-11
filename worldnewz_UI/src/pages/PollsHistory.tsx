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
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import { fetchPollsHistory } from "../api/apiClient";
import type { PollSubmissionHistoryItem } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";

const PollsHistory: React.FC = () => {

  const [historyData, setHistoryData] = useState<PollSubmissionHistoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<PollSubmissionHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchPollsHistory();
      setHistoryData(response.data);
      setFilteredData(response.data);
    } catch (err: any) {
      setError("Failed to load polls submissions history from server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    if (!query) {
      setFilteredData(historyData);
    } else {
      const lower = query.toLowerCase();
      const filtered = historyData.filter(
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
      headerName: "ID", 
      width: 70, 
      sortable: true 
    },
    { 
      field: "name", 
      headerName: "Name", 
      flex: 1.2, 
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 700, mt: 1.5 }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: "email", 
      headerName: "Email Address", 
      flex: 1.5, 
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: "percentage", 
      headerName: "Score Percentage", 
      width: 150, 
      type: "number",
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 900, color: "primary.main", mt: 1.5 }}>
          {params.value}%
        </Typography>
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.5 }}>
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
      renderCell: (params) => (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.8, display: "block" }}>
          {params.value}
        </Typography>
      )
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
        title="Opinion Polls Archives & History | WorldNewzs"
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
          Back to Active Polls
        </Button>

        {/* Title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
          <HistoryIcon sx={{ fontSize: 40, color: "primary.main" }} />
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 900 }}>
              Submissions Archives
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search and analyze user evaluation ratings and status benchmarks over time.
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
            boxShadow: "0 6px 20px rgba(0,0,0,0.06)", 
            border: "1px solid", 
            borderColor: "divider",
            backgroundColor: "background.paper"
          }}>
            <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
              <TextField
                placeholder="Search by name, email or status..."
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
                sx={{ maxWidth: 300, width: "100%" }}
              />
            </Box>

            <Box sx={{ height: 500, width: "100%" }}>
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
                    fontWeight: 800,
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
