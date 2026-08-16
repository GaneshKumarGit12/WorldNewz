import React, { useState, useEffect } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { useTheme } from "@mui/material/styles";

// Icons
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import StorageIcon from "@mui/icons-material/Storage";
import EmailIcon from "@mui/icons-material/Email";
import PollIcon from "@mui/icons-material/Poll";
import QuizIcon from "@mui/icons-material/Quiz";
import StarsIcon from "@mui/icons-material/Stars";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// API & SEO
import { 
  adminLogin, 
  fetchDbStorage, 
  fetchSubscribers, 
  deleteSubscriber, 
  fetchPollsHistory, 
  deletePollHistory, 
  fetchQuizHistory, 
  deleteQuizHistory,
  verifySubscriber,
  testSmtpSettings
} from "../api/apiClient";
import type { 
  DbStorageResponse, 
  NewsletterSubscriber, 
  PollSubmissionHistoryItem, 
  QuizSubmissionHistoryItem 
} from "../api/apiClient";
import { SEOMeta } from "../seo/SEOMeta";

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Auth States
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem("adminToken"));
  const [adminUsername, setAdminUsername] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<number>(0); // 0: Subscribers, 1: Polls, 2: Quiz

  // Data States
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [polls, setPolls] = useState<PollSubmissionHistoryItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSubmissionHistoryItem[]>([]);
  const [storageInfo, setStorageInfo] = useState<DbStorageResponse | null>(null);
  
  // Loading & Error States
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Delete Confirmation dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: "subscriber" | "poll" | "quiz" } | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // SMTP Settings Test States
  const [smtpTestEmail, setSmtpTestEmail] = useState<string>("ganeshkumard56@gmail.com");
  const [smtpTestLoading, setSmtpTestLoading] = useState<boolean>(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load storage size (even if unauthenticated, but endpoint might need auth or not; it doesn't strictly need it in AdminController, but let's load it)
  const loadStorage = async () => {
    try {
      const res = await fetchDbStorage();
      setStorageInfo(res.data);
    } catch (err) {
      console.error("Failed to load database storage details:", err);
    }
  };

  // Load data depending on the active tab
  const loadTabData = async (token: string) => {
    setDataLoading(true);
    setDataError(null);
    try {
      if (activeTab === 0) {
        const res = await fetchSubscribers(token);
        setSubscribers(res.data);
      } else if (activeTab === 1) {
        const res = await fetchPollsHistory();
        setPolls(res.data);
      } else if (activeTab === 2) {
        const res = await fetchQuizHistory();
        setQuizzes(res.data);
      }
      // Refresh storage info
      loadStorage();
    } catch (err: any) {
      console.error("Error fetching tab data:", err);
      setDataError("Failed to fetch records. Please verify your authentication session.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadStorage();
  }, []);

  useEffect(() => {
    if (adminToken) {
      loadTabData(adminToken);
    }
  }, [adminToken, activeTab]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setAuthLoading(true);

    try {
      const res = await adminLogin(adminUsername, adminPassword);
      if (res.data && res.data.token) {
        localStorage.setItem("adminToken", res.data.token);
        setAdminToken(res.data.token);
        setAdminUsername("");
        setAdminPassword("");
      } else {
        setLoginError("Login succeeded but no token was returned.");
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.error || "Invalid administrator credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setAdminToken(null);
    setSubscribers([]);
    setPolls([]);
    setQuizzes([]);
  };

  // Trigger Delete confirmation
  const handleDeleteClick = (id: number, type: "subscriber" | "poll" | "quiz") => {
    setDeleteTarget({ id, type });
    setDeleteConfirmOpen(true);
  };

  // Execute delete action
  const handleConfirmDelete = async () => {
    if (!deleteTarget || !adminToken) return;
    setDeleting(true);
    try {
      const { id, type } = deleteTarget;
      if (type === "subscriber") {
        await deleteSubscriber(id, adminToken);
      } else if (type === "poll") {
        await deletePollHistory(id, adminToken);
      } else if (type === "quiz") {
        await deleteQuizHistory(id, adminToken);
      }
    } catch (err: any) {
      console.error("Delete operation failed:", err);
      alert(err.response?.data?.error || "Delete operation failed.");
    } finally {
      // Always refresh local state list to synchronize with database
      loadTabData(adminToken);
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      setDeleting(false);
    }
  };

  const handleVerifyClick = async (id: number) => {
    if (!adminToken) return;
    try {
      await verifySubscriber(id, adminToken);
      loadTabData(adminToken);
    } catch (err: any) {
      console.error("Manual verification failed:", err);
      alert(err.response?.data?.error || "Manual verification failed.");
    }
  };

  const handleTestSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpTestEmail || !adminToken) return;
    setSmtpTestLoading(true);
    setSmtpTestResult(null);
    try {
      const res = await testSmtpSettings(smtpTestEmail, adminToken);
      setSmtpTestResult({ success: true, message: res.data.message });
    } catch (err: any) {
      console.error("SMTP test failed:", err);
      setSmtpTestResult({ 
        success: false, 
        message: err.response?.data?.error || "SMTP verification failed. Connection refused or invalid credentials." 
      });
    } finally {
      setSmtpTestLoading(false);
    }
  };

  // Formatting helper for Date Strings
  const formatDateTime = (dateStr: string) => {
    try {
      if (!dateStr) return "N/A";
      const utcString = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
      const dateObj = new Date(utcString);
      return dateObj.toLocaleString(navigator.language, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Filter lists based on search query
  const getFilteredSubscribers = () => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return subscribers;
    return subscribers.filter(s => 
      s.email.toLowerCase().includes(q) || 
      s.name.toLowerCase().includes(q) || 
      s.subscriptionType.toLowerCase().includes(q)
    );
  };

  const getFilteredPolls = () => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return polls;
    return polls.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.email.toLowerCase().includes(q) || 
      p.status.toLowerCase().includes(q)
    );
  };

  const getFilteredQuizzes = () => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return quizzes;
    return quizzes.filter(z => 
      z.name.toLowerCase().includes(q) || 
      z.email.toLowerCase().includes(q) || 
      z.status.toLowerCase().includes(q)
    );
  };



  // Columns Definitions for grids
  const subscriberColumns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    { 
      field: "email", 
      headerName: "Subscriber Email", 
      flex: 1.5,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: "name", 
      headerName: "Full Name", 
      flex: 1.2,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2">
            {params.value || "Anonymous"}
          </Typography>
        </Box>
      )
    },
    { 
      field: "subscriptionType", 
      headerName: "Method", 
      width: 120,
      renderCell: (params) => {
        const type = params.value as string;
        const isGoogle = type?.toLowerCase() === "google";
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Chip 
              label={type} 
              size="small" 
              color={isGoogle ? "primary" : "secondary"}
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
          </Box>
        );
      }
    },
    {
      field: "isVerified",
      headerName: "Status",
      width: 140,
      renderCell: (params) => {
        const verified = params.value as boolean;
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Chip 
              label={verified ? "Verified" : "Pending"} 
              size="small" 
              color={verified ? "success" : "warning"}
              sx={{ fontWeight: 800 }}
            />
          </Box>
        );
      }
    },
    { 
      field: "subscribedAt", 
      headerName: "Subscribed Date", 
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(params.value)}
          </Typography>
        </Box>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 140,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, height: "100%" }}>
          {!params.row.isVerified && (
            <Tooltip title="Verify Subscriber Manually">
              <IconButton
                id={`verify-subscriber-btn-${params.row.id}`}
                color="success"
                size="small"
                onClick={() => handleVerifyClick(params.row.id)}
                sx={{ "&:hover": { transform: "scale(1.15)", backgroundColor: "rgba(34, 197, 94, 0.08)" } }}
                aria-label="Verify subscriber"
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton
            id={`delete-subscriber-btn-${params.row.id}`}
            color="error"
            size="small"
            onClick={() => handleDeleteClick(params.row.id, "subscriber")}
            sx={{ "&:hover": { transform: "scale(1.15)", backgroundColor: "rgba(239, 68, 68, 0.08)" } }}
            aria-label="Delete subscriber"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  const pollColumns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    { 
      field: "name", 
      headerName: "Participant Name", 
      flex: 1.2,
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
      headerName: "Score %", 
      width: 120,
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
      headerName: "Status", 
      width: 140,
      renderCell: (params) => {
        const status = params.value as string;
        let color = "#ef4444";
        let label = "Needs Work";
        if (status === "Green") {
          color = "#22c55e";
          label = "Excellent";
        } else if (status === "Orange") {
          color = "#f59e0b";
          label = "Good";
        }
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, height: "100%" }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color }} />
            <Typography variant="body2" sx={{ fontWeight: 800, color }}>
              {label}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: "submittedAt", 
      headerName: "Submission Date", 
      width: 220,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(params.value)}
          </Typography>
        </Box>
      )
    },
    {
      field: "deleteAction",
      headerName: "Action",
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <IconButton
            id={`delete-poll-btn-${params.row.id}`}
            color="error"
            size="small"
            onClick={() => handleDeleteClick(params.row.id, "poll")}
            sx={{ "&:hover": { transform: "scale(1.15)", backgroundColor: "rgba(239, 68, 68, 0.08)" } }}
            aria-label="Delete poll submission"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  const quizColumns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    { 
      field: "name", 
      headerName: "Player Name", 
      flex: 1.2,
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
      headerName: "Score", 
      width: 110,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {params.value} / 10
          </Typography>
        </Box>
      )
    },
    { 
      field: "coins", 
      headerName: "Coins", 
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Chip
            icon={<StarsIcon style={{ color: "#ffb300", fontSize: "16px" }} />}
            label={`${params.value}`}
            size="small"
            sx={{ 
              fontWeight: 800, 
              color: "warning.main", 
              borderColor: "rgba(255,179,0,0.3)", 
              backgroundColor: "rgba(255,179,0,0.04)"
            }}
            variant="outlined"
          />
        </Box>
      )
    },
    { 
      field: "percentage", 
      headerName: "Percentage", 
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 800 }}>
            {params.value}%
          </Typography>
        </Box>
      )
    },
    { 
      field: "submittedAt", 
      headerName: "Date Play", 
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(params.value)}
          </Typography>
        </Box>
      )
    },
    {
      field: "deleteAction",
      headerName: "Action",
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <IconButton
            id={`delete-quiz-btn-${params.row.id}`}
            color="error"
            size="small"
            onClick={() => handleDeleteClick(params.row.id, "quiz")}
            sx={{ "&:hover": { transform: "scale(1.15)", backgroundColor: "rgba(239, 68, 68, 0.08)" } }}
            aria-label="Delete quiz submission"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <main style={{ minHeight: "85vh", paddingBottom: "40px" }}>
      <SEOMeta 
        title="Admin Control Center Portal | WorldNewz" 
        description="Access the secure administrative control center for WorldNewz. View database stats, manage subscribers, polls, and quiz submissions." 
        keywords={["admin portal", "worldnewzs admin", "newsletter subscriber management", "polls admin", "quiz admin"]} 
        canonical="https://worldnewzs.in/admin" 
      />

      <Box className="wrap" sx={{ maxWidth: "1240px", margin: "0 auto", px: { xs: 2, sm: 3, md: 3.5 }, mt: 4 }}>
        
        {/* Central Header title */}
        <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography 
              component="h1" 
              variant="h4" 
              sx={{ 
                fontWeight: 950, 
                fontFamily: "'Outfit', sans-serif",
                background: "linear-gradient(45deg, #c83a15, #ff7043)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              WORLDNEWZ Admin Control Center
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Unified dashboard for managing subscribers, user polls responses, and GK Quiz attempts database.
            </Typography>
          </Box>
          
          {adminToken && (
            <Button
              id="admin-logout-btn"
              variant="outlined"
              color="error"
              onClick={handleLogout}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 3 }}
            >
              Sign Out Securely
            </Button>
          )}
        </Box>

        {/* Auth Check layout */}
        {!adminToken ? (
          <Box sx={{ maxWidth: 450, mx: "auto", mt: 8 }}>
            <Card 
              sx={{ 
                borderRadius: 4, 
                border: "1px solid", 
                borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
                backgroundColor: isDark ? "rgba(22,27,34,0.6)" : "#ffffff",
                backdropFilter: "blur(12px)",
                boxShadow: isDark ? "0 10px 40px rgba(0,0,0,0.5)" : "0 10px 40px rgba(0,0,0,0.05)"
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                  <Box sx={{ p: 1, borderRadius: 2, backgroundColor: "primary.main", color: "white", display: "flex" }}>
                    <LockIcon />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, fontFamily: "'Outfit', sans-serif" }}>
                      Administrator Login
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Enter your authorized administrator credentials to access database options.
                    </Typography>
                  </Box>
                </Box>

                {loginError && (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {loginError}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleLoginSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <TextField
                    id="admin-username-input"
                    label="Username"
                    variant="outlined"
                    fullWidth
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    autoComplete="username"
                  />
                  <TextField
                    id="admin-password-input"
                    label="Password"
                    type="password"
                    variant="outlined"
                    fullWidth
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <Button
                    id="admin-login-submit-btn"
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={authLoading}
                    sx={{ 
                      py: 1.25, 
                      borderRadius: 3, 
                      fontWeight: 800, 
                      textTransform: "none",
                      background: "linear-gradient(45deg, #c83a15, #ff7043)",
                      color: "white",
                      "&:hover": {
                        background: "linear-gradient(45deg, #b72a08, #f4511e)"
                      }
                    }}
                  >
                    {authLoading ? <CircularProgress size={24} color="inherit" /> : "Authenticate Admin"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Stats and Diagnostics Grid */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" }, gap: 3 }}>
              {/* Database storage stats card */}
              <Card 
                sx={{ 
                  borderRadius: 4, 
                  border: "1px solid", 
                  borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
                  background: isDark ? "linear-gradient(135deg, #161b22 0%, #0d1117 100%)" : "#ffffff",
                  boxShadow: "none"
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    <Box 
                      sx={{ 
                        p: 1.5, 
                        borderRadius: 3, 
                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", 
                        color: "primary.main",
                        display: "flex" 
                      }}
                    >
                      <StorageIcon />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase" }}>
                        Database Storage Statistics
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {storageInfo?.formattedSize || "Analyzing..."} / {storageInfo?.formattedMaxSize || "1.00 GB"} ({storageInfo?.percentageUsed || 0}% Used)
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={storageInfo?.percentageUsed || 0} 
                        color={ (storageInfo?.percentageUsed || 0) > 80 ? "error" : "primary" }
                        sx={{ height: 8, borderRadius: 4, mt: 1.5 }}
                      />
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, textAlign: { sm: "right", xs: "left" } }}>
                      <Typography variant="caption" color="text.secondary">
                        DB Engine Provider
                      </Typography>
                      <Chip 
                        label={storageInfo?.dbProvider || "Sqlite"} 
                        color="success" 
                        size="small" 
                        sx={{ fontWeight: 800 }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* SMTP test settings card */}
              <Card 
                sx={{ 
                  borderRadius: 4, 
                  border: "1px solid", 
                  borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
                  background: isDark ? "linear-gradient(135deg, #161b22 0%, #0d1117 100%)" : "#ffffff",
                  boxShadow: "none"
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box 
                        sx={{ 
                          p: 1, 
                          borderRadius: 2, 
                          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", 
                          color: "primary.main",
                          display: "flex" 
                        }}
                      >
                        <EmailIcon fontSize="small" />
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        SMTP Mail Server Diagnostics
                      </Typography>
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      Verify if your server's environment variables (such as SMTP_PASS App Password) are configured and authenticating correctly.
                    </Typography>

                    <Box component="form" onSubmit={handleTestSmtp} sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                      <TextField
                        id="smtp-test-email-input"
                        label="Destination Email"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={smtpTestEmail}
                        onChange={(e) => setSmtpTestEmail(e.target.value)}
                        placeholder="e.g. user@gmail.com"
                        sx={{ backgroundColor: "background.paper", borderRadius: 2 }}
                      />
                      <Button
                        id="smtp-test-send-btn"
                        type="submit"
                        variant="contained"
                        disabled={smtpTestLoading}
                        sx={{ 
                          textTransform: "none", 
                          fontWeight: 800, 
                          borderRadius: 2.5,
                          px: 3,
                          py: 1,
                          whiteSpace: "nowrap"
                        }}
                      >
                        {smtpTestLoading ? <CircularProgress size={20} color="inherit" /> : "Send Test"}
                      </Button>
                    </Box>

                    {smtpTestResult && (
                      <Alert 
                        severity={smtpTestResult.success ? "success" : "error"} 
                        sx={{ 
                          borderRadius: 2, 
                          fontSize: "0.85rem",
                          "& .MuiAlert-message": { wordBreak: "break-word" }
                        }}
                      >
                        {smtpTestResult.message}
                      </Alert>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Main Tabs interface */}
            <Box>
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs 
                  value={activeTab} 
                  onChange={(_, val) => setActiveTab(val)} 
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    "& .MuiTab-root": {
                      textTransform: "none",
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      minHeight: 50,
                      fontFamily: "'Outfit', sans-serif"
                    }
                  }}
                >
                  <Tab 
                    id="admin-tab-0" 
                    icon={<EmailIcon fontSize="small" />} 
                    iconPosition="start" 
                    label="Newsletter Subscribers" 
                  />
                  <Tab 
                    id="admin-tab-1" 
                    icon={<PollIcon fontSize="small" />} 
                    iconPosition="start" 
                    label="Poll Submissions" 
                  />
                  <Tab 
                    id="admin-tab-2" 
                    icon={<QuizIcon fontSize="small" />} 
                    iconPosition="start" 
                    label="GK Quiz Submissions" 
                  />
                </Tabs>
              </Box>

              {/* Data search box */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  id="admin-grid-search-filter"
                  variant="outlined"
                  size="small"
                  placeholder="Filter records by name, email, or metadata..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                  sx={{ maxWidth: 450, backgroundColor: "background.paper", borderRadius: 2 }}
                />
              </Box>

              {dataError && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {dataError}
                </Alert>
              )}

              {/* Tab Panels */}
              <Box sx={{ mt: 2 }}>
                {activeTab === 0 && (
                  <section>
                    <header>
                      <Typography component="h2" variant="h5" sx={{ fontWeight: 900, mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <EmailIcon color="primary" /> Newsletter Subscribers
                      </Typography>
                    </header>
                    <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)", boxShadow: "none" }}>
                      <Box sx={{ height: 500, width: "100%" }}>
                        <DataGrid
                          rows={getFilteredSubscribers()}
                          columns={subscriberColumns}
                          loading={dataLoading}
                          pageSizeOptions={[5, 10, 20]}
                          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                          disableRowSelectionOnClick
                          sx={{ border: "none" }}
                        />
                      </Box>
                    </Card>
                  </section>
                )}

                {activeTab === 1 && (
                  <section>
                    <header>
                      <Typography component="h2" variant="h5" sx={{ fontWeight: 900, mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <PollIcon color="primary" /> User Polls Submissions
                      </Typography>
                    </header>
                    <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)", boxShadow: "none" }}>
                      <Box sx={{ height: 500, width: "100%" }}>
                        <DataGrid
                          rows={getFilteredPolls()}
                          columns={pollColumns}
                          loading={dataLoading}
                          pageSizeOptions={[5, 10, 20]}
                          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                          disableRowSelectionOnClick
                          sx={{ border: "none" }}
                        />
                      </Box>
                    </Card>
                  </section>
                )}

                {activeTab === 2 && (
                  <section>
                    <header>
                      <Typography component="h2" variant="h5" sx={{ fontWeight: 900, mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <QuizIcon color="primary" /> GK Quiz Attempts
                      </Typography>
                    </header>
                    <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)", boxShadow: "none" }}>
                      <Box sx={{ height: 500, width: "100%" }}>
                        <DataGrid
                          rows={getFilteredQuizzes()}
                          columns={quizColumns}
                          loading={dataLoading}
                          pageSizeOptions={[5, 10, 20]}
                          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                          disableRowSelectionOnClick
                          sx={{ border: "none" }}
                        />
                      </Box>
                    </Card>
                  </section>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="delete-confirm-title"
        aria-describedby="delete-confirm-description"
        PaperProps={{
          sx: { borderRadius: 4, px: 1, py: 0.5 }
        }}
      >
        <DialogTitle id="delete-confirm-title" sx={{ fontWeight: 900 }}>
          Confirm Database Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" id="delete-confirm-description">
            Are you absolutely sure you want to delete this {deleteTarget?.type} record from the system database? This action is permanent and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            id="delete-confirm-cancel-btn"
            onClick={() => setDeleteConfirmOpen(false)} 
            disabled={deleting}
            sx={{ fontWeight: 800, textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button 
            id="delete-confirm-confirm-btn"
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleting}
            sx={{ fontWeight: 800, textTransform: "none", px: 2, borderRadius: 2 }}
          >
            {deleting ? "Deleting..." : "Permanently Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};

export default AdminDashboard;
