import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Affiliate disclosure banner as per user-provided wording.
 */
export const AffiliateDisclosure: React.FC = () => (
  <Box
    sx={{
      width: '100%',
      bgcolor: 'background.paper',
      borderTop: '1px solid',
      borderColor: 'divider',
      py: 1,
      px: 2,
      mt: 2,
    }}
    role="region"
    aria-label="Affiliate disclosure"
  >
    <Typography variant="caption" align="center" color="text.secondary">
      This site contains affiliate links. If you buy through them, we may earn a commission at no extra cost to you — helping us keep the site running.
    </Typography>
  </Box>
);

export default AffiliateDisclosure;
