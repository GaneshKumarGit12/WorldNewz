import { SEOMeta } from '../seo/SEOMeta';
import { JSONLDBreadcrumb } from '../seo/JSONLDSchemas';
import { Container, Typography, Box } from '@mui/material';

const LAST_UPDATED = '2026-05-22';
const SITE_NAME = 'WorldNewzs';
const SITE_URL = 'http://worldnewzs.in';
const CONTACT_EMAIL = 'ganeshkumard56@gmail.com';

export const TermsPage = () => (
  <>
    <SEOMeta
      title="Terms & Conditions | WorldNewzs"
      description="WorldNewzs Terms and Conditions — the rules and guidelines governing your use of the WorldNewzs news aggregation platform."
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

        {/* Section 1 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing or using {SITE_NAME} at <a href={SITE_URL}>{SITE_URL}</a> ("Service"),
            you agree to be bound by these Terms and Conditions ("Terms"). If you disagree with
            any part, you may not access the Service. These Terms apply to all visitors, users,
            and others who access or use the Service.
          </Typography>
        </Box>

        {/* Section 2 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            2. Description of Service
          </Typography>
          <Typography variant="body1" paragraph>
            {SITE_NAME} is an intelligent news platform that curates, enriches, and presents news from verified
            third-party sources with original editorial commentary, AI-powered summaries, contextual analysis,
            and unique editorial perspectives. While source news content belongs to its respective publishers,
            all editorial enrichments, summaries, insights, and "Why It Matters" analyses are original {SITE_NAME} content.
          </Typography>
          <Typography variant="body1" paragraph>
            The Service aggregates news across multiple categories including General, Sports, Business, Technology,
            Health, Science, Shopping, Travel, Food, and Entertainment. We verify sources and prioritize content
            from trusted outlets including Reuters, BBC, and Associated Press.
          </Typography>
        </Box>

        {/* Section 3 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            3. Intellectual Property
          </Typography>
          <Typography variant="body1" paragraph>
            The {SITE_NAME} platform, including its design, logos, editorial commentary, AI-generated summaries,
            original analysis, and source code, is owned by {SITE_NAME} and protected by intellectual property
            laws. News headlines and source content displayed on the platform belong to their respective publishers
            and are used under fair use principles for news aggregation and commentary.
          </Typography>
          <Typography variant="body1" paragraph>
            You may not reproduce, distribute, modify, or create derivative works from any part of the Service
            without prior written permission, except as permitted by applicable law.
          </Typography>
        </Box>

        {/* Section 4 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            4. User Conduct
          </Typography>
          <Typography variant="body1" paragraph>
            When using our Service, you agree not to:
          </Typography>
          <ul>
            <li>Use automated tools, bots, scrapers, or crawlers to access or extract data from the Service without our explicit written permission</li>
            <li>Attempt to gain unauthorized access to any part of the Service, its servers, or any connected systems</li>
            <li>Engage in any activity that disrupts, damages, or interferes with the Service, including denial-of-service (DDoS) attacks</li>
            <li>Impersonate any person or entity, or falsely represent your affiliation with any person or entity</li>
            <li>Post or transmit harmful, threatening, abusive, defamatory, or otherwise objectionable content through comments or feedback forms</li>
            <li>Use the Service for any illegal purpose or in violation of any applicable laws or regulations</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service's software or technology</li>
          </ul>
        </Box>

        {/* Section 5 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            5. Third-Party Content &amp; Links
          </Typography>
          <Typography variant="body1" paragraph>
            The Service displays news content aggregated from various third-party sources. While we make reasonable
            efforts to verify sources and curate content from trusted outlets, we do not guarantee the accuracy,
            completeness, or timeliness of any third-party content. {SITE_NAME} is not responsible for the content,
            opinions, or practices of any third-party sources.
          </Typography>
          <Typography variant="body1" paragraph>
            Our Service may contain links to external websites or resources. These links are provided for your
            convenience only. We have no control over the content or availability of these external sites and
            are not responsible for any content, advertising, products, or other materials available on them.
          </Typography>
        </Box>

        {/* Section 6 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            6. Disclaimer of Warranties
          </Typography>
          <Typography variant="body1" paragraph>
            THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND,
            EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
            FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR ACCURACY.
          </Typography>
          <Typography variant="body1" paragraph>
            We do not warrant that: (a) the Service will be uninterrupted, timely, secure, or error-free;
            (b) the results obtained from the Service will be accurate or reliable; (c) the quality of
            any news content, information, or other material obtained through the Service will meet your
            expectations; or (d) any errors in the Service will be corrected.
          </Typography>
        </Box>

        {/* Section 7 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            7. Limitation of Liability
          </Typography>
          <Typography variant="body1" paragraph>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {SITE_NAME}, ITS OWNER, AFFILIATES, AND
            CONTRIBUTORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR
            OTHER INTANGIBLE LOSSES, RESULTING FROM: (a) YOUR USE OR INABILITY TO USE THE SERVICE;
            (b) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SERVERS; (c) ANY INTERRUPTION OR CESSATION
            OF TRANSMISSION TO OR FROM THE SERVICE; (d) ANY THIRD-PARTY CONTENT ACCESSED THROUGH THE SERVICE.
          </Typography>
        </Box>

        {/* Section 8 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            8. Indemnification
          </Typography>
          <Typography variant="body1" paragraph>
            You agree to defend, indemnify, and hold harmless {SITE_NAME}, its owner, and any affiliates
            from and against any claims, damages, obligations, losses, liabilities, costs, or expenses
            (including attorneys' fees) arising from: (a) your use of the Service; (b) your violation
            of these Terms; (c) your violation of any third-party rights; or (d) any content you submit
            or transmit through the Service.
          </Typography>
        </Box>

        {/* Section 9 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            9. Advertising
          </Typography>
          <Typography variant="body1" paragraph>
            The Service displays third-party advertisements provided by Google AdSense. These advertisements
            are served by Google and its advertising partners. {SITE_NAME} is not responsible for the content,
            accuracy, or opinions expressed in any advertisements displayed on the Service.
          </Typography>
          <Typography variant="body1" paragraph>
            Advertisement content and targeting are determined by Google based on its advertising policies.
            Users are encouraged to review Google's <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">advertising policies</a> and <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">privacy policy</a> for more information.
          </Typography>
        </Box>

        {/* Section 10 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            10. Termination
          </Typography>
          <Typography variant="body1" paragraph>
            We reserve the right to suspend or terminate your access to the Service at any time, without
            prior notice or liability, for any reason, including but not limited to a breach of these Terms.
            Upon termination, your right to use the Service will immediately cease. All provisions of these
            Terms that by their nature should survive termination shall survive, including ownership provisions,
            warranty disclaimers, indemnity, and limitations of liability.
          </Typography>
        </Box>

        {/* Section 11 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            11. Governing Law
          </Typography>
          <Typography variant="body1" paragraph>
            These Terms shall be governed by and construed in accordance with the laws of India, without
            regard to its conflict of law provisions. Any disputes arising under or in connection with
            these Terms shall be subject to the exclusive jurisdiction of the courts located in India.
          </Typography>
        </Box>

        {/* Section 12 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            12. Modifications to Terms
          </Typography>
          <Typography variant="body1" paragraph>
            {SITE_NAME} reserves the right to modify or replace these Terms at any time at our sole discretion.
            When we make material changes, we will update the "Last Updated" date at the top of this page and
            may post a notice on the Service. Your continued use of the Service after any changes to these Terms
            constitutes your acceptance of the revised Terms. It is your responsibility to review these Terms
            periodically for changes.
          </Typography>
        </Box>

        {/* Section 13 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            13. Contact
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
