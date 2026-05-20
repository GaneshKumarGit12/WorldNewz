import { SEOMeta } from '../seo/SEOMeta';
import { JSONLDBreadcrumb } from '../seo/JSONLDSchemas';
import { Container, Typography, Box } from '@mui/material';

const LAST_UPDATED = '2026-05-10';
const SITE_NAME = 'WorldNewz';
const SITE_URL = 'https://world-newz.vercel.app';
const CONTACT_EMAIL = 'privacy@worldnewz.com';

export const PrivacyPolicyPage = () => (
  <>
    <SEOMeta
      title="Privacy Policy | WorldNewz"
      description="WorldNewz Privacy Policy — how we collect, use, and protect your data when you use our news aggregation service."
      canonical={`${SITE_URL}/privacy-policy`}
      noIndex={false}
    />
    <JSONLDBreadcrumb crumbs={[
      { name: 'Home', url: SITE_URL },
      { name: 'Privacy Policy', url: `${SITE_URL}/privacy-policy` }
    ]} />

    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box component="main" itemScope itemType="https://schema.org/WebPage">
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Privacy Policy
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>Last Updated:</strong> {LAST_UPDATED} | <strong>Effective Date:</strong> {LAST_UPDATED}
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            1. Introduction
          </Typography>
          <Typography variant="body1" paragraph>
            Welcome to {SITE_NAME} ("we," "our," or "us"). We operate the news aggregation platform
            at <a href={SITE_URL}>{SITE_URL}</a> ("Service"). This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our Service.
            Please read this Privacy Policy carefully. By using the Service, you consent to
            the practices described herein.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            2. Information We Collect
          </Typography>
          <Typography variant="h6" component="h3" gutterBottom>
            2.1 Information You Provide
          </Typography>
          <ul>
            <li>Email address (if you subscribe to newsletters)</li>
            <li>Name (if you register for an account)</li>
            <li>Communication data (if you contact us)</li>
          </ul>
          <Typography variant="h6" component="h3" gutterBottom>
            2.2 Automatically Collected Information
          </Typography>
          <ul>
            <li>IP address and approximate geolocation</li>
            <li>Browser type, version, and language</li>
            <li>Operating system and device information</li>
            <li>Pages visited, time spent, referring URLs</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            3. How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We use the information we collect to:
          </Typography>
          <ul>
            <li>Provide, maintain, and improve the Service</li>
            <li>Personalize your news experience based on reading preferences</li>
            <li>Send newsletters and updates (with your consent)</li>
            <li>Analyze usage patterns to improve performance and SEO</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            4. Google AdSense & Third-Party Advertising
          </Typography>
          <Typography variant="body1" paragraph>
            We partner with third-party advertising vendors, including Google, to serve ads when you visit our website. Google uses cookies to serve ads based on your prior visits to WorldNewz and other websites on the internet.
          </Typography>
          <Typography variant="body1" paragraph>
            Google’s use of advertising cookies enables it and its partners to serve ads to our users based on their visits to our site and/or other sites on the Internet. You can opt out of personalized advertising by visiting Google's <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Ads Settings</a> or by visiting <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            5. Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about this Privacy Policy, please contact us at:
          </Typography>
          <Typography variant="body1">
            <strong>{SITE_NAME}</strong><br />
            Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br />
            Website: <a href={SITE_URL}>{SITE_URL}</a>
          </Typography>
        </Box>
      </Box>
    </Container>
  </>
);

export default PrivacyPolicyPage;
