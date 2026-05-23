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
      // Small delay to make the entrance smooth
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
        elevation={10}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          left: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          maxWidth: { sm: 600 },
          mx: { sm: 'auto' },
          p: 2.5,
          zIndex: 9999,
          borderRadius: 3,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
            <CookieIcon color="primary" sx={{ fontSize: 28, mt: 0.5, flexShrink: 0 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                We value your privacy
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                We use cookies to enhance your browsing experience, serve personalized ads or content via Google AdSense, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end', mt: { xs: 1.5, sm: 0 }, flexShrink: 0 }}>
            <Button 
              variant="text" 
              size="small" 
              color="inherit" 
              onClick={handleDecline} 
              sx={{ textTransform: 'none', px: 2 }}
            >
              Reject
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              onClick={handleAccept} 
              sx={{ textTransform: 'none', px: 2.5 }}
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
