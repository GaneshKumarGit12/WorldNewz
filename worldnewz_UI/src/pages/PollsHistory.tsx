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
import type { PollHistoryItem } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";

const PollsHistory: React.FC = () => {
  const [historyData, setHistoryData] = useState<PollHistoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<PollHistoryItem[]>([]);
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
      setError("Failed to load polls history from server.");
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
          item.question.toLowerCase().includes(lower) ||
          item.description.toLowerCase().includes(lower) ||
          item.optionsBreakdown.toLowerCase().includes(lower)
      );
      setFilteredData(filtered);
    }
  };

  // Define columns for Material-UI DataGrid
  const columns: GridColDef[] = [
    { 
      field: "id", 
      headerName: "ID", 
      width: 70, 
      sortable: true 
    },
    { 
      field: "question", 
      headerName: "Poll Question", 
      flex: 1.5, 
      sortable: true,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {params.row.question}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.description}
          </Typography>
        </Box>
      )
    },
    { 
      field: "createdAt", 
      headerName: "Created Date", 
      width: 150, 
      sortable: true 
    },
    { 
      field: "totalVotes", 
      headerName: "Total Votes", 
      width: 120, 
      type: "number",
      sortable: true,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main" }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: "optionsBreakdown", 
      headerName: "Options breakdown & percentages", 
      flex: 2, 
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ py: 1, whiteSpace: "normal", wordWrap: "break-word" }}>
          <Typography variant="caption" sx={{ fontFamily: "monospace", display: "block" }}>
            {params.value}
          </Typography>
        </Box>
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
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
              Polls Archives
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search and analyze historical opinion poll trends and breakdown percentages.
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
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Main Grid Card */}
        {!loading && !error && (
          <Card sx={{ borderRadius: 4, boxShadow: "0 6px 20px rgba(0,0,0,0.06)", border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
              <TextField
                placeholder="Search historic polls..."
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
                    fontWeight: 700,
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
