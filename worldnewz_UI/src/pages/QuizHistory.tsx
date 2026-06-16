import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
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
import CardContent from "@mui/material/CardContent";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import StarsIcon from "@mui/icons-material/Stars";

import { fetchQuizHistory, fetchQuizLeaderboard } from "../api/apiClient";
import type { QuizSubmissionHistoryItem } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";

const QuizHistory: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [leaderboardData, setLeaderboardData] = useState<QuizSubmissionHistoryItem[]>([]);
  const [historyData, setHistoryData] = useState<QuizSubmissionHistoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<QuizSubmissionHistoryItem[]>([]);
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
        fetchQuizHistory(),
        fetchQuizLeaderboard()
      ]);

      setHistoryData(historyRes.data);
      setLeaderboardData(leaderboardRes.data);
      
      // Default view is Leaderboard (tab index 0)
      setFilteredData(leaderboardRes.data);
    } catch (err: any) {
      setError("Failed to load quiz history and leaderboard from server.");
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

  // Define columns for DataGrid
  const columns: GridColDef[] = [
    { 
      field: "id", 
      headerName: "Rank", 
      width: 100, 
      sortable: true,
      renderCell: (params) => {
        let content;
        if (tabValue === 0) {
          const index = filteredData.findIndex(item => item.id === params.row.id);
          if (index === 0) {
            content = <Chip label="1st 👑" size="small" sx={{ fontWeight: 900, color: "#fff", background: "linear-gradient(45deg, #ffb300, #ff8f00)", px: 1.5, py: 0.5, border: "none" }} />;
          } else if (index === 1) {
            content = <Chip label="2nd 🥈" size="small" sx={{ fontWeight: 900, color: "#fff", background: "linear-gradient(45deg, #9ca3af, #4b5563)", px: 1.5, py: 0.5, border: "none" }} />;
          } else if (index === 2) {
            content = <Chip label="3rd 🥉" size="small" sx={{ fontWeight: 900, color: "#fff", background: "linear-gradient(45deg, #b45309, #78350f)", px: 1.5, py: 0.5, border: "none" }} />;
          } else {
            content = <Typography variant="body2" sx={{ fontWeight: 700, pl: 1 }}>#{index + 1}</Typography>;
          }
        } else {
          content = <Typography variant="body2">#{params.value}</Typography>;
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
      headerName: "Player Name", 
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
      field: "score", 
      headerName: "Correct Answers", 
      width: 130, 
      sortable: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {params.value} / 10
          </Typography>
        </Box>
      )
    },
    { 
      field: "coins", 
      headerName: "Gold Coins Earned", 
      width: 170, 
      sortable: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
          <Chip
            icon={<StarsIcon style={{ color: "#ffb300" }} />}
            label={`${params.value} Coins`}
            variant="outlined"
            size="small"
            sx={{ 
              fontWeight: 800, 
              color: "warning.main", 
              borderColor: "rgba(255,179,0,0.3)", 
              backgroundColor: "rgba(255,179,0,0.04)"
            }}
          />
        </Box>
      )
    },
    { 
      field: "percentage", 
      headerName: "Accuracy", 
      width: 110, 
      sortable: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary" }}>
            {params.value}%
          </Typography>
        </Box>
      )
    },
    { 
      field: "status", 
      headerName: "Badge Status", 
      width: 160, 
      sortable: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        let label = "Beginner";
        let color: "error" | "info" | "warning" = "error";
        
        if (params.value === "Green") {
          label = "Grandmaster 👑";
          color = "warning";
        } else if (params.value === "Orange") {
          label = "Scholar 🧠";
          color = "info";
        }

        return (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
            <Chip 
              label={label} 
              color={color} 
              size="small" 
              sx={{ fontWeight: 800, textTransform: "uppercase", fontSize: "0.75rem" }} 
            />
          </Box>
        );
      }
    },
    { 
      field: "submittedAt", 
      headerName: "Date Play", 
      width: 180, 
      sortable: true,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" color="text.secondary">
            {new Date(params.value).toLocaleString(undefined, { 
              month: "short", 
              day: "numeric", 
              hour: "2-digit", 
              minute: "2-digit" 
            })}
          </Typography>
        </Box>
      )
    }
  ];

  const dynamicKeywordsData = useKeywords("quiz-history");
  const defaultKeywords = ["quiz leaderboard", "gk quiz rank", "gold coins scoreboard", "trivia leaderboard online", "quiz history log", "badges statistics"];
  const combinedKeywords = dynamicKeywordsData
    ? [...new Set([...defaultKeywords, ...dynamicKeywordsData.primary, ...dynamicKeywordsData.longtail, ...dynamicKeywordsData.trending])]
    : defaultKeywords;
  const descriptionToUse = dynamicKeywordsData?.metaDesc || "View the live Leaderboard and Submission history for our General Knowledge Badge Quiz. Check top players, total gold coins, and accuracy ranks.";

  return (
    <>
      <SEOMeta
        title="GK Quiz Leaderboard & Coins History | WorldNewzs"
        description={descriptionToUse}
        keywords={combinedKeywords}
        canonical="https://worldnewzs.in/quiz-history"
      />
      <JSONLDBreadcrumb
        crumbs={[
          { name: "Home", url: "https://worldnewzs.in" },
          { name: "GK Badge Quiz", url: "https://worldnewzs.in/badge-quiz" },
          { name: "Leaderboard & History", url: "https://worldnewzs.in/quiz-history" }
        ]}
      />

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Navigation back and header info */}
        <Box sx={{ mb: 4 }}>
          <Button 
            component={Link} 
            to="/badge-quiz" 
            startIcon={<ArrowBackIcon />}
            color="warning"
            sx={{ mb: 3, fontWeight: 700, textTransform: "none", borderRadius: 2 }}
          >
            Back to Active GK Quiz
          </Button>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <EmojiEventsIcon sx={{ fontSize: 40, color: "warning.main" }} />
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 900 }}>
                Leaderboard & History Log
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track coin achievements, daily player logs, and accuracy percentages.
              </Typography>
            </Box>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>
            {error}
          </Alert>
        )}

        {/* Tab Controls & Search */}
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 4, 
            border: "1px solid", 
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            mb: 4
          }}
        >
          <Box 
            sx={{ 
              p: 2, 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              flexWrap: "wrap", 
              gap: 2, 
              borderBottom: "1px solid", 
              borderColor: "divider" 
            }}
          >
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                '& .MuiTabs-indicator': { backgroundColor: 'warning.main' },
                '& .MuiTab-root.Mui-selected': { color: 'warning.main' }
              }}
            >
              <Tab 
                label="Coin Leaderboard" 
                icon={<EmojiEventsIcon />} 
                iconPosition="start"
                sx={{ textTransform: "none", fontWeight: 700, px: { xs: 1.5, sm: 3 } }} 
              />
              <Tab 
                label="Submission Log" 
                icon={<HistoryIcon />} 
                iconPosition="start"
                sx={{ textTransform: "none", fontWeight: 700, px: { xs: 1.5, sm: 3 } }} 
              />
            </Tabs>

            <TextField
              size="small"
              placeholder="Search by Player or Status..."
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ minWidth: { xs: "100%", sm: 260 } }}
              slotProps={{
                input: {
                  sx: { borderRadius: 3 },
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" fontSize="small" />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Box>

          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 12 }}>
                <CircularProgress color="warning" />
              </Box>
            ) : (
              <Box sx={{ height: 600, width: "100%" }}>
                <DataGrid
                  rows={filteredData}
                  columns={columns}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: 10, page: 0 },
                    },
                  }}
                  pageSizeOptions={[10, 20, 50]}
                  disableRowSelectionOnClick
                  rowHeight={65}
                  sx={{
                    border: "none",
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "action.hover",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      fontWeight: 800
                    },
                    "& .MuiDataGrid-columnHeaderTitle": {
                      fontWeight: 800
                    },
                    "& .MuiDataGrid-cell": {
                      borderBottom: "1px solid",
                      borderColor: "action.hover"
                    },
                    "& .MuiDataGrid-row:hover": {
                      backgroundColor: "action.hover"
                    }
                  }}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default QuizHistory;
