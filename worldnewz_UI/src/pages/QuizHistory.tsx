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

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";

import { fetchQuizHistory, fetchQuizLeaderboard, adminLogin, fetchDbStorage, deleteQuizHistory } from "../api/apiClient";
import type { QuizSubmissionHistoryItem, DbStorageResponse } from "../api/apiClient";
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

  // Admin and database storage states
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem("adminToken"));
  const [loginOpen, setLoginOpen] = useState<boolean>(false);
  const [adminUsername, setAdminUsername] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<DbStorageResponse | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadStorage = async () => {
    try {
      const res = await fetchDbStorage();
      setStorageInfo(res.data);
    } catch (err) {
      console.error("Failed to load database storage details:", err);
    }
  };

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
      if (tabValue === 0) {
        setFilteredData(leaderboardRes.data);
      } else {
        setFilteredData(historyRes.data);
      }
      
      // Fetch DB storage
      loadStorage();
    } catch (err: any) {
      setError("Failed to load quiz history and leaderboard from server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    setLoginOpen(true);
    setLoginError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await adminLogin(adminUsername, adminPassword);
      if (res.data && res.data.token) {
        localStorage.setItem("adminToken", res.data.token);
        setAdminToken(res.data.token);
        setLoginOpen(false);
        setAdminUsername("");
        setAdminPassword("");
      } else {
        setLoginError("Failed to login. No token returned.");
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || err.message || "Invalid administrator credentials.";
      setLoginError(msg);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setAdminToken(null);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId === null || !adminToken) return;
    try {
      setDeleting(true);
      await deleteQuizHistory(deleteId, adminToken);
      
      // Reload history and storage
      await loadData();
      
      setDeleteConfirmOpen(false);
      setDeleteId(null);
    } catch (err: any) {
      console.error("Failed to delete quiz submission:", err);
      alert(err.message || "Failed to delete submission.");
    } finally {
      setDeleting(false);
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

  const columnsToRender = [...columns];
  if (adminToken) {
    columnsToRender.push({
      field: "deleteAction",
      headerName: "Action",
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%" }}>
          <IconButton
            color="error"
            size="small"
            onClick={() => handleDeleteClick(params.row.id)}
            sx={{
              "&:hover": {
                transform: "scale(1.15)",
                backgroundColor: "rgba(239, 68, 68, 0.08)"
              },
              transition: "transform 0.2s"
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    });
  }

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

        {/* Dynamic Database Storage Visualization & Admin controls */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, mb: 4, alignItems: "stretch" }}>
          
          {/* Storage Visualization Card */}
          <Card 
            elevation={0}
            sx={{ 
              flex: 1,
              borderRadius: 4, 
              border: "1px solid", 
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              p: 3,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              backgroundColor: "background.paper"
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "text.primary", letterSpacing: 0.5 }}>
                DATABASE STORAGE
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 900, color: "warning.main", bgcolor: isDark ? "rgba(255,179,0,0.08)" : "rgba(255,179,0,0.04)", px: 1.5, py: 0.5, borderRadius: 2 }}>
                {storageInfo ? `${storageInfo.percentageUsed}% used` : "0.00% used"}
              </Typography>
            </Box>

            <Box sx={{ width: "100%", height: 8, bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderRadius: 4, overflow: "hidden", mb: 1 }}>
              <Box 
                sx={{ 
                  width: `${storageInfo ? Math.max(0.1, Math.min(100, storageInfo.percentageUsed)) : 0}%`, 
                  height: "100%", 
                  background: "linear-gradient(90deg, #ffb300, #ff8f00)", 
                  borderRadius: 4,
                  transition: "width 0.5s ease-in-out" 
                }} 
              />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                {storageInfo?.formattedSize ?? "0.00 MB"} of 1 GB used
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                PostgreSQL Limit: 1 GB
              </Typography>
            </Box>
          </Card>

          {/* Admin Control Card */}
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: 4, 
              border: "1px solid", 
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
              p: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              minWidth: { md: 300 },
              backgroundColor: "background.paper"
            }}
          >
            <Box sx={{ mr: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                ADMIN CONTROLS
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {adminToken ? "Authorized as Administrator." : "Authenticate to manage storage."}
              </Typography>
            </Box>

            {adminToken ? (
              <Button
                variant="outlined"
                color="error"
                startIcon={<LockOpenIcon />}
                onClick={handleLogout}
                sx={{ fontWeight: 800, textTransform: "none", borderRadius: 3 }}
              >
                Log Out
              </Button>
            ) : (
              <Button
                variant="contained"
                color="warning"
                startIcon={<LockIcon />}
                onClick={handleLoginClick}
                sx={{ 
                  fontWeight: 800, 
                  textTransform: "none", 
                  borderRadius: 3,
                  boxShadow: "none",
                  "&:hover": { boxShadow: "none" }
                }}
              >
                Admin Login
              </Button>
            )}
          </Card>
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
                  columns={columnsToRender}
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

        {/* Admin Login Dialog */}
        <Dialog 
          open={loginOpen} 
          onClose={() => setLoginOpen(false)}
          PaperProps={{
            sx: { borderRadius: 4, p: 2, maxWidth: 400, width: "100%" }
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>Admin Authentication</DialogTitle>
          <form onSubmit={handleLoginSubmit}>
            <DialogContent sx={{ py: 1 }}>
              {loginError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {loginError}
                </Alert>
              )}
              <TextField
                margin="dense"
                label="Username"
                type="text"
                fullWidth
                variant="outlined"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
                slotProps={{
                  input: { sx: { borderRadius: 3 } }
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                slotProps={{
                  input: { sx: { borderRadius: 3 } }
                }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pt: 2 }}>
              <Button onClick={() => setLoginOpen(false)} sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="warning" sx={{ fontWeight: 800, textTransform: "none", borderRadius: 2, px: 3 }}>
                Authenticate
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          PaperProps={{
            sx: { borderRadius: 4, p: 1, maxWidth: 380, width: "100%" }
          }}
        >
          <DialogTitle sx={{ fontWeight: 900 }}>Can I delete this user?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              This action will permanently delete this quiz submission from the persistent database. This cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={() => setDeleteConfirmOpen(false)} 
              disabled={deleting}
              sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
            >
              No
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              variant="contained" 
              color="error"
              disabled={deleting}
              sx={{ fontWeight: 800, textTransform: "none", borderRadius: 2, px: 3 }}
            >
              {deleting ? "Deleting..." : "Yes"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default QuizHistory;
