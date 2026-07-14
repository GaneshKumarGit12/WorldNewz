import { SEOMeta } from '../seo/SEOMeta';
import { JSONLDBreadcrumb } from '../seo/JSONLDSchemas';
import { Container, Typography, Box, Link } from '@mui/material';

const LAST_UPDATED = '2026-07-14';
const SITE_NAME = 'WorldNewzs';
const SITE_URL = 'https://worldnewzs.in';

export const DisclaimerPage = () => {
  return (
    <>
      <SEOMeta
        title={`Disclaimer | ${SITE_NAME}`}
        description={`${SITE_NAME} Disclaimer — how we analyze multiple news sources to provide unique editorial summaries, column reviews, and analytical insights.`}
        canonical={`${SITE_URL}/disclaimer`}
        noIndex={false}
      />
      <JSONLDBreadcrumb crumbs={[
        { name: 'Home', url: SITE_URL },
        { name: 'Disclaimer', url: `${SITE_URL}/disclaimer` }
      ]} />

      <Container maxWidth="md" sx={{ py: 6, minHeight: "70vh" }}>
        <Box component="main" itemScope itemType="https://schema.org/WebPage">
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Disclaimer
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Last Updated:</strong> {LAST_UPDATED} | <strong>Effective Date:</strong> {LAST_UPDATED}
          </Typography>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              1. Editorial Summaries & Curation Process
            </Typography>
            <Typography variant="body1" paragraph>
              {SITE_NAME} is an independent online news analysis and opinion platform. We analyze multiple news sources to provide unique editorial summaries and insights. Our process is designed to synthesize and interpret news coverage, giving readers deeper context, critical summaries, and analytical columns rather than simple repubishing or copy-pasting of wire reports.
            </Typography>
            <Typography variant="body1" paragraph>
              Our editorial staff regularly cross-references and evaluates reports across global outlets to write original commentary, explainers, and editorials. Any insights, opinions, or forecasts published on this website are those of {SITE_NAME} editors and columnists.
            </Typography>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              2. Accuracy & Reference Content
            </Typography>
            <Typography variant="body1" paragraph>
              While we strive to maintain the highest standards of analytical accuracy, the news environment changes rapidly. WorldNewzs uses third-party primary news wires and published press statements as reference materials. We make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, or availability of the primary third-party stories linked or referenced.
            </Typography>
            <Typography variant="body1" paragraph>
              Any reliance you place on the synthesized information or reference material is strictly at your own risk. In no event will {SITE_NAME} be liable for any loss or damage arising from the use of this website.
            </Typography>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              3. External Outbound Links
            </Typography>
            <Typography variant="body1" paragraph>
              In our editorial analysis, we include links to external authoritative news outlets (e.g., BBC, Reuters, Associated Press) to credit source reporting and provide readers with additional details. {SITE_NAME} does not own, control, or monitor the content, privacy policies, or practices of these external websites. We do not endorse the opinions expressed or content hosted on those external domains.
            </Typography>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              4. Advertising Policy & Content Separation
            </Typography>
            <Typography variant="body1" paragraph>
              {SITE_NAME} displays advertisements through Google AdSense to fund our independent analysis operations. To comply with AdSense quality policies, all advertising components (such as display ads and link cards) are visually distinguished and clearly separated from our editorial content blocks. We do not place ads in positions that encourage accidental clicks or compromise the reading layout.
            </Typography>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              5. Intellectual Property
            </Typography>
            <Typography variant="body1" paragraph>
              The original written commentaries, editorial column analyses, custom graphics, and overall site layout are the exclusive property of {SITE_NAME}. Trademarks, logo marks, and screenshots from third-party outlets referenced in our analysis remain the property of their respective owners, used here under descriptive fair-use guidelines.
            </Typography>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
              6. Contact Details
            </Typography>
            <Typography variant="body1" paragraph>
              If you have any questions or feedback regarding this Disclaimer or our curation process, please reach out to us at <Link href={`mailto:ganeshkumard56@gmail.com`}>ganeshkumard56@gmail.com</Link>.
            </Typography>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default DisclaimerPage;
