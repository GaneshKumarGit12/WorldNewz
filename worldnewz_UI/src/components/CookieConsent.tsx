import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Slide } from '@mui/material';
import CookieIcon from '@mui/icons-material/Cookie';

export const getCookieConsent = (): 'accepted' | 'declined' | null => {
  return localStorage.getItem('worldnewz_cookie_consent') as 'accepted' | 'declined' | null;
};

export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('worldnewz_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('worldnewz_cookie_consent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('worldnewz_cookie_consent', 'declined');
    setVisible(false);
  };

  return (
    <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          left: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          maxWidth: { sm: 640 },
          mx: { sm: 'auto' },
          p: 3,
          zIndex: 9999,
          borderRadius: 4,
          backgroundColor: (theme) => 
            theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.85)' 
              : 'rgba(22, 27, 34, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid',
          borderColor: (theme) => 
            theme.palette.mode === 'light' 
              ? 'rgba(200, 58, 21, 0.15)' 
              : 'rgba(200, 58, 21, 0.25)',
          boxShadow: (theme) => 
            theme.palette.mode === 'light' 
              ? '0 10px 40px rgba(0,0,0,0.06)' 
              : '0 10px 45px rgba(0,0,0,0.4)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2.5 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <CookieIcon color="primary" sx={{ fontSize: 32, mt: 0.25, flexShrink: 0 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Cookie Consent & Privacy
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6, fontSize: '0.85rem' }}>
                We use cookies to improve your browsing experience, display personalized ads via Google AdSense, and analyze site metrics. By clicking "Accept All", you consent to our use of cookies.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end', mt: { xs: 1, sm: 0 }, flexShrink: 0 }}>
            <Button 
              variant="outlined" 
              size="small" 
              color="inherit" 
              onClick={handleDecline} 
              sx={{ 
                textTransform: 'none', 
                px: 2, 
                borderRadius: 2, 
                fontWeight: 600,
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'text.primary',
                  backgroundColor: 'action.hover'
                }
              }}
            >
              Reject
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              color="primary"
              onClick={handleAccept} 
              sx={{ 
                textTransform: 'none', 
                px: 2.5, 
                borderRadius: 2, 
                fontWeight: 700,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                  backgroundColor: '#ab3212'
                }
              }}
            >
              Accept All
            </Button>
          </Box>
        </Box>
      </Paper>
    </Slide>
  );
};

export default CookieConsent;
