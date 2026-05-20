import { SEOMeta } from '../seo/SEOMeta';
import { JSONLDBreadcrumb } from '../seo/JSONLDSchemas';
import { Container, Typography, Box } from '@mui/material';

const LAST_UPDATED = '2026-05-10';
const SITE_NAME = 'WorldNewz';
const SITE_URL = 'https://world-newz.vercel.app';
const CONTACT_EMAIL = 'ganeshkumard56@gmail.com';

export const TermsPage = () => (
  <>
    <SEOMeta
      title="Terms & Conditions | WorldNewz"
      description="WorldNewz Terms and Conditions — the rules and guidelines governing your use of the WorldNewz news aggregation platform."
      canonical={`${SITE_URL}/terms`}
    />
    <JSONLDBreadcrumb crumbs={[
      { name: 'Home', url: SITE_URL },
      { name: 'Terms & Conditions', url: `${SITE_URL}/terms` }
    ]} />

    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box component="main">
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Terms &amp; Conditions
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>Last Updated:</strong> {LAST_UPDATED}
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing or using {SITE_NAME} at <a href={SITE_URL}>{SITE_URL}</a> ("Service"),
            you agree to be bound by these Terms and Conditions ("Terms"). If you disagree with
            any part, you may not access the Service.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            2. Description of Service
          </Typography>
          <Typography variant="body1" paragraph>
            {SITE_NAME} is a news aggregation platform that collects and displays news content
            from various third-party sources. We do not create original news content and are
            not responsible for the accuracy or timeliness of third-party content.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            3. Intellectual Property
          </Typography>
          <Typography variant="body1" paragraph>
            The {SITE_NAME} platform, including its design, logos, and original code, is owned by
            {SITE_NAME} and protected by intellectual property laws. News content displayed belongs
            to the respective publishers.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            4. Contact
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about these Terms, please contact us at:
          </Typography>
          <Typography variant="body1">
            <strong>{SITE_NAME} Legal</strong><br />
            Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br />
            Website: <a href={SITE_URL}>{SITE_URL}</a>
          </Typography>
        </Box>
      </Box>
    </Container>
  </>
);

export default TermsPage;
