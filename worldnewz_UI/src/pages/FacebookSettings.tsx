import React, { useState, useEffect } from "react";
import { SEOMeta } from "../seo/SEOMeta";
import {
  fetchFacebookSettings,
  fetchFacebookPages,
  saveFacebookSettings,
  toggleFacebookPage,
  deleteFacebookPage,
  testFacebookPost
} from "../api/apiClient";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";

// Icons
import FacebookIcon from "@mui/icons-material/Facebook";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

interface FacebookPage {
  pageId: string;
  pageName: string;
  accessToken: string;
  maskedToken: string;
  isActive: boolean;
  category?: string;
  lastPostTime?: string | Date;
}

const FacebookSettings: React.FC = () => {
  const [userToken, setUserToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedSettings, setSavedSettings] = useState<FacebookPage[]>([]);
  const [fetchedPages, setFetchedPages] = useState<FacebookPage[]>([]);
  const [hasFetched, setHasFetched] = useState(false);

  // Snackbar Notification
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "info"
  });

  const showMsg = (message: string, severity: "success" | "error" | "info" = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Load saved settings from database
  const loadSavedSettings = async () => {
    setLoading(true);
    try {
      const response = await fetchFacebookSettings();
      // Map API fields (maskedToken / isActive etc.)
      const data = (response.data || []).map((item: any) => ({
        pageId: item.pageId,
        pageName: item.pageName,
        accessToken: item.maskedToken, // Keep masked token for display/saving (backend resolves it if it contains ...)
        maskedToken: item.maskedToken,
        isActive: item.isActive,
        lastPostTime: item.lastPostTime
      }));
      setSavedSettings(data);
    } catch (err: any) {
      console.error(err);
      showMsg("Failed to load existing Facebook settings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedSettings();
  }, []);

  // Fetch pages from Facebook using User Access Token
  const handleFetchPages = async () => {
    if (!userToken.trim()) {
      showMsg("Please enter a valid Facebook User Access Token", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchFacebookPages(userToken.trim());
      const pages = (response.data || []).map((item: any) => ({
        pageId: item.pageId,
        pageName: item.pageName,
        accessToken: item.accessToken, // Keep raw token for saving
        maskedToken: item.maskedToken,
        isActive: true, // Default to true for newly fetched pages
        category: item.category
      }));

      if (pages.length === 0) {
        showMsg("No pages found under this Facebook Account", "info");
      } else {
        setFetchedPages(pages);
        setHasFetched(true);
        showMsg(`Successfully fetched ${pages.length} page(s) from Facebook!`, "success");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.details || err.message || "Failed to fetch pages";
      showMsg(`Error: ${errorMsg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Toggle active status for saved page settings
  const handleToggleActive = async (pageId: string) => {
    try {
      const response = await toggleFacebookPage(pageId);
      const updatedIsActive = response.data.isActive;
      
      // Update in savedSettings state
      setSavedSettings(prev =>
        prev.map(p => (p.pageId === pageId ? { ...p, isActive: updatedIsActive } : p))
      );
      showMsg(`Page status updated successfully`, "success");
    } catch (err: any) {
      showMsg("Failed to update status", "error");
    }
  };

  // Toggle active status for newly fetched pages
  const handleToggleFetchedActive = (pageId: string) => {
    setFetchedPages(prev =>
      prev.map(p => (p.pageId === pageId ? { ...p, isActive: !p.isActive } : p))
    );
  };

  // Delete page config
  const handleDeletePage = async (pageId: string) => {
    if (!window.confirm("Are you sure you want to remove this Facebook page configuration?")) {
      return;
    }

    try {
      await deleteFacebookPage(pageId);
      setSavedSettings(prev => prev.filter(p => p.pageId !== pageId));
      showMsg("Page configuration removed successfully", "success");
    } catch (err: any) {
      showMsg("Failed to remove page configuration", "error");
    }
  };

  // Save config (newly fetched pages)
  const handleSaveSettings = async () => {
    if (fetchedPages.length === 0) return;

    setLoading(true);
    try {
      const payload = fetchedPages.map(p => ({
        pageId: p.pageId,
        pageName: p.pageName,
        accessToken: p.accessToken,
        isActive: p.isActive
      }));

      await saveFacebookSettings(payload);
      showMsg("Facebook page settings saved successfully!", "success");
      setFetchedPages([]);
      setHasFetched(false);
      setUserToken("");
      // Reload settings from database
      await loadSavedSettings();
    } catch (err: any) {
      showMsg("Failed to save settings: " + (err.response?.data?.error || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  // Trigger test post
  const handleTestPost = async (pageId: string) => {
    showMsg("Sending test post, please wait...", "info");
    try {
      const response = await testFacebookPost(pageId);
      showMsg(response.data.message || "Test post succeeded!", "success");
      loadSavedSettings(); // Refresh last post time
    } catch (err: any) {
      const details = err.response?.data?.details || err.response?.data?.error || err.message;
      showMsg(`Test post failed: ${details}`, "error");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 1200, mx: "auto", minHeight: "70vh" }}>
      <SEOMeta
        title="Facebook Automation Integration"
        description="Configure automated news feed posting to Facebook Pages using API settings."
        canonical="https://worldnewzs.in/facebook-settings"
        noIndex={true}
      />

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4, flexWrap: "wrap" }}>
        <FacebookIcon color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
            Facebook Automation Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure dynamic posting of news updates directly to your Facebook Pages.
          </Typography>
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          variant="outlined"
          size="small"
          onClick={loadSavedSettings}
          sx={{ ml: "auto" }}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Form & Help */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Add/Update Facebook Token
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter a Facebook User Access Token to fetch the pages you manage. The backend will extract individual long-lived Page Access Tokens and save them securely.
            </Typography>

            <TextField
              fullWidth
              label="Facebook User Access Token"
              variant="outlined"
              type={showToken ? "text" : "password"}
              value={userToken}
              onChange={(e) => setUserToken(e.target.value)}
              placeholder="EAAr8NUGXPpQ..."
              disabled={loading}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle token visibility"
                      onClick={() => setShowToken(!showToken)}
                      edge="end"
                    >
                      {showToken ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleFetchPages}
              disabled={loading || !userToken.trim()}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FacebookIcon />}
              sx={{ py: 1.2, fontWeight: "bold" }}
            >
              {loading ? "Fetching..." : "Fetch Managed Pages"}
            </Button>
          </Paper>

          <Paper elevation={1} sx={{ p: 3, borderRadius: 2, bgcolor: "action.hover" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <HelpOutlineIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Setup Guidance
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              To authorize WorldNewz to post to your pages, obtain a token with the following scopes using the Facebook Developer tools:
            </Typography>
            <Box sx={{ pl: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: "list-item" }}>
                <code>pages_show_list</code>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: "list-item" }}>
                <code>pages_read_engagement</code>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: "list-item" }}>
                <code>pages_manage_posts</code>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: "list-item" }}>
                <code>pages_manage_engagement</code>
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Use the official{" "}
              <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2", textDecoration: "none", fontWeight: "bold" }}>
                Facebook Graph API Explorer
              </a>{" "}
              to generate your temporary or long-lived User Access Token.
            </Typography>
          </Paper>
        </Grid>

        {/* Right Column: Managed Pages */}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* New Fetched Pages Section */}
          {hasFetched && fetchedPages.length > 0 && (
            <Paper elevation={3} sx={{ p: 3, mb: 4, border: "1px solid", borderColor: "primary.main", borderRadius: 2 }}>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                New Pages Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select which pages you want to import/update, then click Save.
              </Typography>

              <Grid container spacing={2}>
                {fetchedPages.map((page) => (
                  <Grid size={{ xs: 12 }} key={page.pageId}>
                    <Card variant="outlined" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {page.pageName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Page ID: {page.pageId} | Category: {page.category || "N/A"}
                        </Typography>
                        <Typography variant="caption" color="success.main" sx={{ wordBreak: "break-all" }}>
                          Token loaded successfully.
                        </Typography>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={page.isActive}
                            onChange={() => handleToggleFetchedActive(page.pageId)}
                            color="primary"
                          />
                        }
                        label={page.isActive ? "Import Active" : "Import Inactive"}
                        labelPlacement="start"
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ display: "flex", gap: 2, mt: 3, justifyContent: "flex-end" }}>
                <Button variant="outlined" color="secondary" onClick={() => { setFetchedPages([]); setHasFetched(false); }}>
                  Cancel
                </Button>
                <Button variant="contained" color="success" onClick={handleSaveSettings}>
                  Save Page Configurations
                </Button>
              </Box>
            </Paper>
          )}

          {/* Active Saved Settings Section */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Configured Pages ({savedSettings.length})
            </Typography>

            {savedSettings.length === 0 ? (
              <Alert severity="info">
                No Facebook pages are configured yet. Paste a token in the form on the left to add one.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {savedSettings.map((page) => (
                  <Grid size={{ xs: 12 }} key={page.pageId}>
                    <Card sx={{ p: 1.5, borderLeft: "4px solid", borderLeftColor: page.isActive ? "success.main" : "text.disabled" }}>
                      <CardContent sx={{ pb: 1 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {page.pageName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                              ID: {page.pageId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                              Token: <code>{page.maskedToken}</code>
                            </Typography>
                            {page.lastPostTime && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Last Post: {new Date(page.lastPostTime).toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={page.isActive}
                                  onChange={() => handleToggleActive(page.pageId)}
                                  color="success"
                                  size="small"
                                />
                              }
                              label={page.isActive ? "Active" : "Inactive"}
                              labelPlacement="start"
                              sx={{ mr: 0, mb: 1 }}
                            />
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              {page.isActive ? (
                                <Tooltip title="Page posting is active">
                                  <CheckCircleIcon color="success" fontSize="small" />
                                </Tooltip>
                              ) : (
                                <Tooltip title="Posting disabled">
                                  <ErrorIcon color="error" fontSize="small" />
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                      <Divider />
                      <CardActions sx={{ justifyContent: "flex-end" }}>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeletePage(page.pageId)}
                        >
                          Remove
                        </Button>
                        <Button
                          size="small"
                          color="primary"
                          variant="outlined"
                          startIcon={<SendIcon />}
                          onClick={() => handleTestPost(page.pageId)}
                          disabled={!page.isActive}
                        >
                          Test Post
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Toast notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: "100%" }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FacebookSettings;
