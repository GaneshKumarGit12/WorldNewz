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
import { useTheme } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";

import { fetchPollsHistory, fetchLeaderboard, adminLogin, fetchDbStorage, deletePollHistory } from "../api/apiClient";
import type { PollSubmissionHistoryItem, DbStorageResponse } from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";
import { JSONLDBreadcrumb } from "../seo/JSONLDSchemas";
import { useKeywords } from "../seo/useKeywords";

const PollsHistory: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [leaderboardData, setLeaderboardData] = useState<PollSubmissionHistoryItem[]>([]);
  const [historyData, setHistoryData] = useState<PollSubmissionHistoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<PollSubmissionHistoryItem[]>([]);
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
        fetchPollsHistory(),
        fetchLeaderboard()
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
      setError("Failed to load polls history and leaderboard from server.");
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
      await deletePollHistory(deleteId, adminToken);
      
      // Reload history and storage
      await loadData();
      
      setDeleteConfirmOpen(false);
      setDeleteId(null);
    } catch (err: any) {
      console.error("Failed to delete poll submission:", err);
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
              <Typography variant="caption" sx={{ fontWeight: 900, color: "primary.main", bgcolor: isDark ? "rgba(25,118,210,0.08)" : "rgba(25,118,210,0.04)", px: 1.5, py: 0.5, borderRadius: 2 }}>
                {storageInfo ? `${storageInfo.percentageUsed}% used` : "0.00% used"}
              </Typography>
            </Box>

            <Box sx={{ width: "100%", height: 8, bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", borderRadius: 4, overflow: "hidden", mb: 1 }}>
              <Box 
                sx={{ 
                  width: `${storageInfo ? Math.max(0.1, Math.min(100, storageInfo.percentageUsed)) : 0}%`, 
                  height: "100%", 
                  background: "linear-gradient(90deg, #1976d2, #42a5f5)", 
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
                color="primary"
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
                columns={columnsToRender}
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

        {/* Admin Login Dialog */}
        <Dialog 
          open={loginOpen} 
          onClose={() => setLoginOpen(false)}
          PaperProps={{
            sx: { borderRadius: 4, p: 2, maxWidth: 400, width: "100%" }
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, pb: 0.5 }}>Admin Authentication</DialogTitle>
          <Typography variant="caption" color="text.secondary" sx={{ px: 3, display: "block", mb: 1 }}>
            Credentials: <b>ganeshd12</b> / <b>EndPointPG@293</b>
          </Typography>
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
              <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 800, textTransform: "none", borderRadius: 2, px: 3 }}>
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
              This action will permanently delete this poll submission from the persistent database. This cannot be undone.
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

export default PollsHistory;
