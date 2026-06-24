import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import { useColorMode } from '../../context/ThemeContext';

const BaseEditorialWrapper: React.FC<{ title: string; gradient: string; children: React.ReactNode }> = ({ title, gradient, children }) => {
  const { mode } = useColorMode();
  const isDark = mode === 'dark';
  return (
    <Paper
      elevation={0}
      sx={{
        mt: 4,
        mb: 6,
        p: { xs: 3, sm: 4, md: 5 },
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.03)',
      }}
    >
      <Typography
        variant="h4"
        component="h2"
        gutterBottom
        sx={{
          fontWeight: 800,
          background: gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 3,
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }
        }}
      >
        {title}
      </Typography>
      <Divider sx={{ mb: 4 }} />
      {children}
    </Paper>
  );
};

export const MoneyEditorial: React.FC = () => (
  <BaseEditorialWrapper title="Personal Finance: Wealth Management, Tax Strategies, and Guidelines" gradient="linear-gradient(45deg, #00b09b, #96c93d)">
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Navigating Personal Wealth and Financial Security
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          Personal finance is the foundation of long-term security, enabling citizens to manage assets, plan for retirement, and protect against economic uncertainty. Modern wealth management involves budgeting, debt management, investment allocation, tax optimization, and estate planning.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          As financial markets become more complex, individuals must avoid speculative schemes and focus on diversified, research-based investment strategies. Understanding asset classes, interest rate implications, and tax policies helps readers make informed decisions to preserve and grow their wealth.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          To verify tax changes and interest rate announcements, visit the <Link href="https://www.reuters.com/business/finance/" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>Reuters Finance Hub</Link>. To analyze how government regulations affect corporate investment structures, visit our <Link href="/business" sx={{ fontWeight: 700 }}>Business News</Link> section.
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Curation Policy</Typography>
          <Typography variant="body2" color="text.secondary">
            Our finance desk monitors updates from certified financial institutions. We filter out speculative get-rich-quick promotions to deliver high-quality, actionable wealth advice.
          </Typography>
        </Box>
      </Grid>
    </Grid>

    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>Frequently Asked Questions (FAQs)</Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Do you provide personalized financial advice?</Typography>
        <Typography variant="body2" color="text.secondary">No, our articles are for educational and informational purposes only. We encourage readers to consult certified financial planners for personal guidance.</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>How do you confirm interest rates and tax deadlines?</Typography>
        <Typography variant="body2" color="text.secondary">We utilize datasets published directly by central banks and national tax departments to ensure accuracy.</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Are retirement planning articles verified?</Typography>
        <Typography variant="body2" color="text.secondary">Yes, all retirement and asset management guidelines are written by experienced financial planners and analysts.</Typography>
      </Box>
    </Box>
  </BaseEditorialWrapper>
);

export const WeatherEditorial: React.FC = () => (
  <BaseEditorialWrapper title="Meteorological Curation: Climatology, Forecasts, and Information Standards" gradient="linear-gradient(45deg, #3a7bd5, #3a6073)">
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
          The Importance of Precise Meteorological Data
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          Weather forecasts are critical for daily planning, agricultural management, and public safety. Accurate weather reporting requires collecting telemetry from radar networks, satellite systems, and atmospheric stations, translating raw data into actionable forecasts.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          As climate change increases the frequency of severe weather events, real-time warning integration is essential. By cross-referencing meteorological updates with local emergency departments, we ensure readers receive timely safety information.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          To check international meteorological indicators and climate trends, visit the <Link href="https://www.bbc.com/weather" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>BBC Weather Portal</Link>. To analyze how weather patterns impact regional agricultural markets, visit our <Link href="/business" sx={{ fontWeight: 700 }}>Business News</Link> section.
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Curation Policy</Typography>
          <Typography variant="body2" color="text.secondary">
            Our weather desk tracks data from national meteorological bodies, ensuring all local and global forecasts are verified and free from sensationalized clickbait claims.
          </Typography>
        </Box>
      </Grid>
    </Grid>

    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>Frequently Asked Questions (FAQs)</Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Where does your weather data originate?</Typography>
        <Typography variant="body2" color="text.secondary">We fetch telemetry from national agencies (such as the IMD, NOAA, and ECMWF) and verify it through emergency networks.</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Do you provide real-time air quality index (AQI) forecasts?</Typography>
        <Typography variant="body2" color="text.secondary">Yes, our local forecasts include real-time AQI metrics, UV advisories, and humidity readings.</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>How do you broadcast severe weather warnings?</Typography>
        <Typography variant="body2" color="text.secondary">Severe alerts are automatically pinned to the weather dashboard, prioritizing public safety guidelines.</Typography>
      </Box>
    </Box>
  </BaseEditorialWrapper>
);

export const ShoppingEditorial: React.FC = () => (
  <BaseEditorialWrapper title="Consumer Curation: Shopping Guides, Affiliate Verification, and Standards" gradient="linear-gradient(45deg, #f12711, #f5af19)">
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Helping Consumers Navigate Modern Digital Commerce
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          The digital marketplace offers unprecedented convenience, but it also exposes buyers to artificial reviews, counterfeit goods, and fake discounts. Helping consumers navigate these challenges requires objective testing, testing verification, and clear price analyses.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          Consumer reporting evaluates build quality, usability, warranty terms, and actual discount metrics. By auditing commercial deals, we protect readers from artificial price hikes and highlight verified savings on products that deliver real value.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          To verify consumer rights policies and international retail trends, consult the <Link href="https://www.bbc.com/news/topics/c7y0z5d28gpt" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>BBC Consumer Affairs desk</Link>. To explore the details of semiconductor manufacturing and consumer gadget hardware, read our <Link href="/technology" sx={{ fontWeight: 700 }}>Technology News</Link> section.
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Curation Policy</Typography>
          <Typography variant="body2" color="text.secondary">
            Our shopping vertical reviews discount codes, product quality claims, and seller history, filtering out fake deals to protect consumers from online fraud.
          </Typography>
        </Box>
      </Grid>
    </Grid>

    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>Frequently Asked Questions (FAQs)</Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>How does WorldNewzs select product deals?</Typography>
        <Typography variant="body2" color="text.secondary">We audit price histories, merchant ratings, and customer reviews to ensure featured deals offer genuine discounts.</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Do you receive commissions from affiliate links?</Typography>
        <Typography variant="body2" color="text.secondary">Yes, some deals contain affiliate links. We receive a small commission at no additional cost to you, supporting our independent journalism.</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>How do you confirm product recalls and safety warnings?</Typography>
        <Typography variant="body2" color="text.secondary">We monitor notices from national food and product safety offices (such as FDA and BIS) to post alerts immediately.</Typography>
      </Box>
    </Box>
  </BaseEditorialWrapper>
);

export const TravelEditorial: React.FC = () => (
  <BaseEditorialWrapper title="Travel Guide: Ecotourism, Transit Safety, and Editorial Guidelines" gradient="linear-gradient(45deg, #11998e, #38ef7d)">
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
          The Shift Toward Ecotourism and Sustainable Travel
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          Travel is a powerful tool for cultural exchange, but it also has environmental and social impacts on local communities. Modern travel guidelines prioritize sustainable ecotourism, cultural respect, and transit safety.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          Verifying travel advisories involves monitoring visa changes, transit regulations, and environmental updates. By providing accurate information, we help travelers plan safe journeys that support local economies while minimizing environmental impact.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          To verify international visa requirements and transit safety advisories, visit the <Link href="https://www.bbc.com/travel" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>BBC Travel Guide</Link>. To analyze how exchange rate fluctuations affect travel budgets, visit our <Link href="/business" sx={{ fontWeight: 700 }}>Business News</Link> section.
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Curation Policy</Typography>
          <Typography variant="body2" color="text.secondary">
            Our travel section lists verified transit advisories, eco-friendly hotel guides, and cultural insights, avoiding commercial travel ads.
          </Typography>
        </Box>
      </Grid>
    </Grid>

    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>Frequently Asked Questions (FAQs)</Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>How do you confirm international transit safety alerts?</Typography>
        <Typography variant="body2" color="text.secondary">We utilize notices published directly by national transportation departments and global health organizations.</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Do you feature budget backpacking itineraries?</Typography>
        <Typography variant="body2" color="text.secondary">Yes, we provide guides detailing budget-friendly travel routes, public transit links, and homestays.</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>How often are visa rules updated?</Typography>
        <Typography variant="body2" color="text.secondary">Our system checks for visa and entry regulation updates weekly, updating guides as policies evolve.</Typography>
      </Box>
    </Box>
  </BaseEditorialWrapper>
);

export const FoodEditorial: React.FC = () => (
  <BaseEditorialWrapper title="Culinary Arts: Nutrition Science, Food Safety, and Editorial Rules" gradient="linear-gradient(45deg, #f857a6, #ff5858)">
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
          The Intersection of Gastronomy and Nutrition Science
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          Food is both a cultural expression and the fuel that drives human health. Culinary journalism explores cooking techniques and dietary patterns, while incorporating evidence-based nutrition science and food safety.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          Verifying recipes and nutrition advice requires consulting certified dietitians and food safety agencies. By providing verified guidelines, we help cooks prepare nutritious meals safely, free from fad diets or unscientific claims.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          To read culinary reviews and food safety notifications, consult the <Link href="https://www.bbc.co.uk/food" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>BBC Food Portal</Link>. To analyze how new technology models are used in automated agricultural systems, read our <Link href="/technology" sx={{ fontWeight: 700 }}>Technology News</Link> section.
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Curation Policy</Typography>
          <Typography variant="body2" color="text.secondary">
            Our food section publishes recipes, kitchen safety guides, and nutrition advice verified by dietitians, avoiding commercial diet promotions.
          </Typography>
        </Box>
      </Grid>
    </Grid>

    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>Frequently Asked Questions (FAQs)</Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Do you check food recall notices?</Typography>
        <Typography variant="body2" color="text.secondary">Yes, we publish notices from national food safety regulators immediately to protect public health.</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Are nutrition guidelines written by dietitians?</Typography>
        <Typography variant="body2" color="text.secondary">All dietary and health advice is reviewed by certified nutritionists to ensure scientific accuracy.</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Do you feature traditional cooking techniques?</Typography>
        <Typography variant="body2" color="text.secondary">Yes, we explore regional cooking traditions, ingredient histories, and fermentation methods.</Typography>
      </Box>
    </Box>
  </BaseEditorialWrapper>
);

export const EntertainmentEditorial: React.FC = () => (
  <BaseEditorialWrapper title="Entertainment Desk: Pop Culture, Arts Industry, and Editorial Guidelines" gradient="linear-gradient(45deg, #fc466b, #3f5efb)">
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
          The Evolution of the Creative Industries and Media
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          The entertainment industry has shifted from physical venues and scheduled broadcasts to digital streaming platforms, connecting creators directly with global audiences. Our desk covers movie reviews, music releases, and theatre events, while analyzing the industry's economic structures.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          Verifying industry news requires checking statements from production studios, talent guilds, and film festivals, avoiding unfounded gossip. This commitment to objective reporting ensures that our entertainment coverage remains professional and accurate.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          To verify film festival updates and entertainment reviews, consult the <Link href="https://www.bbc.com/news/entertainment_and_arts" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>BBC Entertainment Desk</Link>. To analyze how streaming platforms affect media stocks, visit our <Link href="/business" sx={{ fontWeight: 700 }}>Business News</Link> section.
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Curation Policy</Typography>
          <Typography variant="body2" color="text.secondary">
            Our entertainment desk covers movie reviews, music releases, and industry shifts, filtering out clickbait gossip to prioritize factual reporting.
          </Typography>
        </Box>
      </Grid>
    </Grid>

    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>Frequently Asked Questions (FAQs)</Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>How do you select films for review?</Typography>
        <Typography variant="body2" color="text.secondary">We review films from global festivals and major streaming networks, evaluating build quality and artistic value.</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Do you cover the economics of streaming services?</Typography>
        <Typography variant="body2" color="text.secondary">Yes, we track subscriber metrics, production budgets, and IP laws affecting the creative sector.</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Are interview transcripts verified?</Typography>
        <Typography variant="body2" color="text.secondary">All interview quotes are verified directly with studio press offices or verified recordings.</Typography>
      </Box>
    </Box>
  </BaseEditorialWrapper>
);

export const ServicesEditorial: React.FC = () => (
  <BaseEditorialWrapper title="Online Services: Platform Reviews, Security Audits, and Standards" gradient="linear-gradient(45deg, #13f1fc, #0470dc)">
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Evaluating Modern Software-as-a-Service and Digital Utilities
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          As businesses move tasks to the cloud, software services (SaaS) and digital utilities have become critical infrastructure. Selecting these tools requires evaluating feature checklists, pricing structures, data compliance, and user reviews.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          Our services section reviews SaaS tools, API platforms, and cloud utilities. By auditing provider claims, we help managers select tools that meet modern security requirements.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          To verify cloud infrastructure compliance standards, visit the <Link href="https://www.reuters.com/technology/" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>Reuters Tech Portal</Link>. To analyze how tech stock movements affect SaaS prices, visit our <Link href="/business" sx={{ fontWeight: 700 }}>Business News</Link> section.
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>Curation Policy</Typography>
          <Typography variant="body2" color="text.secondary">
            Our services desk publishes SaaS reviews, utility updates, and cloud news, filtering out sponsored placements to ensure objective reviews.
          </Typography>
        </Box>
      </Grid>
    </Grid>

    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>Frequently Asked Questions (FAQs)</Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>How does WorldNewzs select SaaS products for review?</Typography>
        <Typography variant="body2" color="text.secondary">We select products based on user metrics, API flexibility, security history, and pricing value.</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Do you verify software security standards?</Typography>
        <Typography variant="body2" color="text.secondary">Yes, we check SOC 2 compliance, encryption practices, and data retention policies listed by vendors.</Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Can developer tools be submitted for review?</Typography>
        <Typography variant="body2" color="text.secondary">Yes, developers can submit products for testing through our support desk.</Typography>
      </Box>
    </Box>
  </BaseEditorialWrapper>
);
