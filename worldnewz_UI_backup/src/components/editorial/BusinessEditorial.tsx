import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import { useColorMode } from '../../context/ThemeContext';

export const BusinessEditorial: React.FC = () => {
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
          background: 'linear-gradient(45deg, #FF9900, #FF5500)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 3,
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }
        }}
      >
        The Global Business Landscape: Macroeconomics, Markets, and Curation Standards
      </Typography>
      <Divider sx={{ mb: 4 }} />

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
            The Evolution of Global Commerce and Corporations
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            Modern business and commerce have evolved through a series of structural shifts, transitioning from regional agricultural trade networks to a highly integrated global market. The rise of mercantile capitalism in the 16th and 17th centuries established joint-stock companies, allowing investors to pool capital and distribute risk for maritime trade. The Industrial Revolution of the 18th century transformed production from agrarian, craft-based economies to mechanized factory systems, leading to rapid urbanization and the growth of public stock exchanges. The legal formalization of the limited liability corporation in the 19th century further accelerated corporate growth, enabling large-scale infrastructure investments like transcontinental railroads. In the mid-20th century, the Bretton Woods Agreement established the modern international monetary system, laying the groundwork for globalization, free trade agreements, and multinational corporations.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            The late 20th and early 21st centuries have been defined by financialization and the digital economy. The rise of the internet enabled real-time global capital flows and the growth of e-commerce platforms that bypass brick-and-mortar storefronts. This transition created new corporate giants built on data assets rather than physical infrastructure. Simultaneously, the rise of the venture capital model enabled rapid growth for technological startups, transforming local concepts into global enterprises. Today, businesses must navigate complex supply chains, changing consumer preferences, and the transition to sustainability, all while operating in an environment of rapid digital transformation.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            Understanding these economic shifts is crucial for analyzing modern corporate strategies and market trends. Corporate decisions, whether related to supply chain re-alignment or sustainability, are shaped by long-term macroeconomic cycles and institutional regulations. WorldNewzs aims to provide the comprehensive context necessary to analyze these developments, helping readers understand the systemic factors behind corporate filings and market indicators.
          </Typography>

          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700, mt: 4 }}>
            Contemporary Market Shifts: Central Bank Policies, Supply Chains, and ESG
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            The current economic environment is heavily influenced by central bank policies as monetary authorities navigate inflation dynamics and interest rate cycles. Central bank interest rate adjustments shape borrowing costs, investment levels, and stock market valuations globally. Additionally, businesses are restructuring their supply chains, transitioning from "just-in-time" logistics to "just-in-case" strategies to build resilience against geopolitical disruptions and natural events. This shift requires significant investments in local manufacturing and regional distribution networks.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            Environmental, Social, and Governance (ESG) criteria have also become core factors in institutional investing. Investors analyze how companies manage carbon footprints, labor relations, board diversity, and corporate transparency. As regulatory bodies implement mandatory climate risk reporting, corporate disclosure and compliance have become central elements of strategic planning, influencing corporate reputation and capital access.
          </Typography>

          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700, mt: 4 }}>
            Expert Opinions: Macroeconomics, Recession Risks, and Inflation
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            Leading economists emphasize the need for balanced fiscal and monetary policy to support long-term growth. Dr. Gita Gopinath, First Deputy Managing Director of the IMF, highlights that structural reforms and supply-side policies are essential to address debt levels and promote inclusive growth. Our business vertical tracks these expert analyses to help investors and business leaders navigate changing economic environments.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            To read detailed market reports and corporate announcements, consult the <Link href="https://www.bbc.com/news/business" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>BBC Business News Desk</Link> and the <Link href="https://www.reuters.com/business/" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>Reuters Business Section</Link>.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            To analyze how legislative updates and international trade deals affect corporate operations, visit our <Link href="/politics" sx={{ fontWeight: 700 }}>Politics News</Link> vertical. To track the latest software tools and tech startup funding announcements, read our <Link href="/technology" sx={{ fontWeight: 700 }}>Technology News</Link> section.
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Key Financial Benchmarks
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Global GDP Growth:</strong> The International Monetary Fund (IMF) estimates global real GDP growth to remain at approximately 3.2% annually over the next fiscal cycle.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Venture Capital:</strong> Global VC funding volumes have stabilized, with increased allocations toward Artificial Intelligence infrastructure and clean energy startups.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Supply Chain Budgets:</strong> Over 60% of multinational corporations report increasing their capital expenditure to support nearshoring and logistics diversification.
            </Typography>
          </Box>
          <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Corporate Curation Policy
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Our business news desk focuses on verified corporate filings, regulatory disclosures, economic research papers, and official central bank updates. We exclude speculative market rumors and promotional press releases to deliver high-quality, actionable business intelligence.
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 5 }}>
        <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Frequently Asked Questions (FAQs)
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            How do you verify corporate statements and financial reports?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Our automated pipelines ingest corporate disclosures directly from verified market registries and stock exchange databases (such as the SEC, BSE, and London Stock Exchange). We cross-reference company announcements with independent audit reports and regulatory filings to ensure all financial updates are accurate and transparent.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            Do you cover macroeconomic research and central bank minutes?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Yes, we track and summarize reports from major central banks (such as the Federal Reserve, RBI, and ECB) and international economic institutions (like the IMF and World Bank). Our desk provides clear, accessible summaries of policy shifts and economic forecasts to help readers understand their broader implications.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            How do you filter out speculative market rumors and clickbait stock analysis?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            WorldNewzs excludes speculative day-trading forums, promotional investment newsletters, and unverified analyst chatters. We focus on factual data, documented corporate actions, and research from established economic institutions to ensure our market coverage remains reliable and objective.
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};
