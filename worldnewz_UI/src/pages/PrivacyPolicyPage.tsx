import { SEOMeta } from '../seo/SEOMeta';
import { JSONLDBreadcrumb } from '../seo/JSONLDSchemas';
import { Container, Typography, Box } from '@mui/material';

const LAST_UPDATED = '2026-05-23';
const SITE_NAME = 'WorldNewzs';
const SITE_URL = 'https://worldnewzs.in';
const CONTACT_EMAIL = 'ganeshkumard56@gmail.com';

export const PrivacyPolicyPage = () => (
  <>
    <SEOMeta
      title="Privacy Policy | WorldNewzs"
      description="WorldNewzs Privacy Policy — how we collect, use, and protect your data when you use our news aggregation service."
      canonical={`${SITE_URL}/privacy-policy`}
      noIndex={false}
    />
    <JSONLDBreadcrumb crumbs={[
      { name: 'Home', url: SITE_URL },
      { name: 'Privacy Policy', url: `${SITE_URL}/privacy-policy` }
    ]} />

    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box component="section" itemScope itemType="https://schema.org/WebPage">
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Privacy Policy
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>Last Updated:</strong> {LAST_UPDATED} | <strong>Effective Date:</strong> {LAST_UPDATED}
        </Typography>

        {/* Section 1 */}
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

        {/* Section 2 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            2. Information We Collect
          </Typography>
          <Typography variant="h6" component="h3" gutterBottom>
            2.1 Information You Provide
          </Typography>
          <Typography variant="body1" paragraph>
            We may collect information that you voluntarily provide to us when you use our Service, including:
          </Typography>
          <ul>
            <li>Email address (if you subscribe to newsletters or contact us)</li>
            <li>Name (if you register for an account or submit a contact form)</li>
            <li>Communication data (messages, feedback, or inquiries you send us)</li>
            <li>Comments and engagement data (likes, dislikes, bookmarks you create on articles)</li>
          </ul>
          <Typography variant="h6" component="h3" gutterBottom>
            2.2 Automatically Collected Information
          </Typography>
          <Typography variant="body1" paragraph>
            When you access our Service, we may automatically collect certain information about your device and usage, including:
          </Typography>
          <ul>
            <li>IP address and approximate geolocation</li>
            <li>Browser type, version, and language preferences</li>
            <li>Operating system and device information</li>
            <li>Pages visited, time spent on pages, referring and exit URLs</li>
            <li>Cookies and similar tracking technologies (see Section 5 below)</li>
            <li>Interaction data such as clicks, scrolls, and search queries</li>
          </ul>
        </Box>

        {/* Section 3 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            3. How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We use the information we collect for the following purposes:
          </Typography>
          <ul>
            <li>Provide, maintain, and improve the Service</li>
            <li>Personalize your news experience based on reading preferences</li>
            <li>Send newsletters and updates (with your explicit consent)</li>
            <li>Analyze usage patterns to improve performance, content curation, and SEO</li>
            <li>Detect, prevent, and address fraud, abuse, or security issues</li>
            <li>Comply with legal obligations and enforce our Terms of Service</li>
            <li>Display personalized advertisements through Google AdSense (with your consent)</li>
          </ul>
        </Box>

        {/* Section 4 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            4. Google AdSense &amp; Third-Party Advertising
          </Typography>
          <Typography variant="body1" paragraph>
            We partner with third-party advertising vendors, including Google, to serve ads when you visit our website. Google uses cookies to serve ads based on your prior visits to {SITE_NAME} and other websites on the Internet.
          </Typography>
          <Typography variant="body1" paragraph>
            Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visits to our site and/or other sites on the Internet. You can opt out of personalized advertising by visiting Google's <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Ads Settings</a> or by visiting <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.
          </Typography>
          <Typography variant="body1" paragraph>
            We use Google AdSense (Publisher ID: ca-pub-7547748414764075) and Google Analytics (Measurement ID: G-JD24Y5Y78Z) on our Service.
          </Typography>
        </Box>

        {/* Section 5 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            5. Cookie Policy
          </Typography>
          <Typography variant="body1" paragraph>
            Cookies are small text files stored on your device when you visit a website. We use the following types of cookies:
          </Typography>
          <Typography variant="h6" component="h3" gutterBottom>
            5.1 Essential Cookies
          </Typography>
          <Typography variant="body1" paragraph>
            These cookies are necessary for the basic functionality of the Service, such as storing your cookie consent preference and theme (dark/light mode) settings. They are stored in your browser's localStorage and do not track you across websites.
          </Typography>
          <Typography variant="h6" component="h3" gutterBottom>
            5.2 Analytics Cookies
          </Typography>
          <Typography variant="body1" paragraph>
            We use Google Analytics (G-JD24Y5Y78Z) to understand how visitors interact with our Service. These cookies collect anonymized data about page views, session duration, and traffic sources.
          </Typography>
          <Typography variant="h6" component="h3" gutterBottom>
            5.3 Advertising Cookies
          </Typography>
          <Typography variant="body1" paragraph>
            Google AdSense uses cookies to serve personalized advertisements. These cookies may track your browsing activity across websites to provide targeted ads. You may opt out at any time via <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
          </Typography>
          <Typography variant="h6" component="h3" gutterBottom>
            5.4 Managing Cookies
          </Typography>
          <Typography variant="body1" paragraph>
            You can manage or delete cookies through your browser settings. Most browsers allow you to block or delete cookies. However, blocking essential cookies may affect the functionality of our Service. You can also change your cookie preference by clearing your browser's localStorage for our domain.
          </Typography>
        </Box>

        {/* Section 6 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            6. Your Privacy Rights (GDPR)
          </Typography>
          <Typography variant="body1" paragraph>
            If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have certain data protection rights under the General Data Protection Regulation (GDPR). These include:
          </Typography>
          <ul>
            <li><strong>Right to Access:</strong> You have the right to request copies of your personal data.</li>
            <li><strong>Right to Rectification:</strong> You have the right to request that we correct any information you believe is inaccurate or incomplete.</li>
            <li><strong>Right to Erasure:</strong> You have the right to request that we delete your personal data, subject to certain legal exceptions.</li>
            <li><strong>Right to Restrict Processing:</strong> You have the right to request that we restrict the processing of your personal data under certain conditions.</li>
            <li><strong>Right to Data Portability:</strong> You have the right to request that we transfer your data to another organization, or directly to you, in a structured, machine-readable format.</li>
            <li><strong>Right to Object:</strong> You have the right to object to our processing of your personal data for direct marketing purposes.</li>
          </ul>
          <Typography variant="body1" paragraph>
            To exercise any of these rights, please contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We will respond to your request within 30 days.
          </Typography>
        </Box>

        {/* Section 7 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            7. California Privacy Rights (CCPA)
          </Typography>
          <Typography variant="body1" paragraph>
            If you are a California resident, the California Consumer Privacy Act (CCPA) grants you additional rights regarding your personal information:
          </Typography>
          <ul>
            <li><strong>Right to Know:</strong> You have the right to request disclosure of the categories and specific pieces of personal information we have collected about you.</li>
            <li><strong>Right to Delete:</strong> You have the right to request deletion of your personal information, subject to certain exceptions.</li>
            <li><strong>Right to Opt-Out:</strong> You have the right to opt out of the "sale" of your personal information.</li>
            <li><strong>Right to Non-Discrimination:</strong> You have the right not to be discriminated against for exercising your CCPA rights.</li>
          </ul>
          <Typography variant="body1" paragraph>
            <strong>Do Not Sell My Personal Information:</strong> {SITE_NAME} does NOT sell your personal information to third parties. We do not engage in the sale of personal data as defined by the CCPA.
          </Typography>
          <Typography variant="body1" paragraph>
            Categories of personal information collected include: identifiers (email, IP address), internet/network activity (browsing history, interactions with ads), and geolocation data (approximate location from IP).
          </Typography>
          <Typography variant="body1" paragraph>
            To exercise your CCPA rights, contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </Typography>
        </Box>

        {/* Section 8 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            8. Children's Privacy (COPPA)
          </Typography>
          <Typography variant="body1" paragraph>
            Our Service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under age 13 without verification of parental consent, we will take steps to delete that information promptly. If you believe we may have collected information from a child under 13, please contact us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </Typography>
        </Box>

        {/* Section 9 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            9. Data Retention
          </Typography>
          <Typography variant="body1" paragraph>
            We retain your personal information only for as long as necessary to fulfill the purposes described in this Privacy Policy, unless a longer retention period is required or permitted by law. Specifically:
          </Typography>
          <ul>
            <li><strong>Contact form submissions:</strong> Retained for up to 12 months, then deleted.</li>
            <li><strong>Analytics data:</strong> Retained per Google Analytics' standard retention settings (14 months by default).</li>
            <li><strong>Cookie consent preferences:</strong> Stored indefinitely in your browser's localStorage until you clear it.</li>
            <li><strong>Bookmarks and comments:</strong> Stored locally in your browser's localStorage and not transmitted to our servers.</li>
          </ul>
        </Box>

        {/* Section 10 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            10. International Data Transfers
          </Typography>
          <Typography variant="body1" paragraph>
            Your information may be transferred to, stored, and processed in countries other than your country of residence. Our servers and third-party service providers (including Google) may be located in different jurisdictions. By using our Service, you consent to the transfer of your information to countries that may have different data protection laws than your country. We take reasonable steps to ensure your data is treated securely and in accordance with this Privacy Policy.
          </Typography>
        </Box>

        {/* Section 11 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            11. Changes to This Privacy Policy
          </Typography>
          <Typography variant="body1" paragraph>
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. When we make material changes, we will notify you by posting a prominent notice on our Service and updating the "Last Updated" date at the top of this page. Your continued use of the Service after any changes constitutes your acceptance of the revised Privacy Policy.
          </Typography>
        </Box>

        {/* Section 12 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            12. Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
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
