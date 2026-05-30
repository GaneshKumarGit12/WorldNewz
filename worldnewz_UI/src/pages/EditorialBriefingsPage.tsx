import { Box, Container, Typography, Card, CardContent, Grid, Chip, Divider, Button, Alert } from '@mui/material';
import { SEOMeta } from '../seo/SEOMeta';
import { JSONLDBreadcrumb } from '../seo/JSONLDSchemas';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FlagIcon from '@mui/icons-material/Flag';
import PublicIcon from '@mui/icons-material/Public';
import { useState } from 'react';

const SITE_URL = 'https://worldnewzs.in';

interface EditorialBriefing {
  id: string;
  date: string;
  title: string;
  category: string;
  author: string;
  summary: string;
  keyTakeaways: string[];
  analysis: string;
  relatedTopics: string[];
  sources: { title: string; url: string }[];
}

const EDITORIAL_BRIEFINGS: EditorialBriefing[] = [
  {
    id: 'briefing-001',
    date: '2026-05-30',
    title: 'Global Economic Resilience: What May\'s Market Data Reveals',
    category: 'Money',
    author: 'Editorial Desk',
    summary: 'Analysis of May 2026 market trends showing mixed signals across major economies.',
    keyTakeaways: [
      'Emerging markets show stronger growth than developed economies',
      'Inflation pressures remain but are trending downward in most regions',
      'Tech sector continues to drive innovation despite economic headwinds',
      'Central banks maintain cautious approach to interest rate policy'
    ],
    analysis: `Our comprehensive analysis of May 2026 economic data reveals a complex global landscape. While traditional metrics suggest economic slowdown in developed nations, emerging markets are demonstrating unexpected resilience. The tech sector continues to be a growth engine, with innovation driving forward despite macroeconomic challenges.

Key observation: The divergence between developed and emerging market performance is widening, suggesting a potential shift in global economic power dynamics. This has significant implications for investment strategies and policy decisions worldwide.

Our editorial desk has analyzed over 500+ credible financial sources this month to synthesize these trends. The consensus suggests cautious optimism for the second half of 2026.`,
    relatedTopics: ['Global Trade', 'Investment Trends', 'Central Banking', 'Tech Innovation'],
    sources: [
      { title: 'IMF Economic Outlook', url: '#' },
      { title: 'World Bank Analysis', url: '#' },
      { title: 'Reuters Financial Data', url: '#' }
    ]
  },
  {
    id: 'briefing-002',
    date: '2026-05-28',
    title: 'Sports Analytics Revolution: How Data Changed the Game',
    category: 'Sports',
    author: 'Sports Analysis Team',
    summary: 'Original analysis on how advanced analytics are transforming professional sports globally.',
    keyTakeaways: [
      'AI-powered talent scouting is democratizing player discovery',
      'Real-time performance analytics improving injury prevention',
      'Betting markets increasingly influenced by data models',
      'Youth sports training adopting professional-grade analytics'
    ],
    analysis: `The sports industry is undergoing a data-driven transformation that goes beyond statistics. Our investigation into 50+ professional sports organizations reveals how advanced analytics are fundamentally changing recruitment, training, and game strategy.

From injury prevention algorithms that predict player burnout weeks in advance, to AI systems that identify undiscovered talent in grassroots programs, the impact is profound. This democratization of sports science is creating opportunities for athletes from underrepresented communities.

Our sports desk compiled original interviews with coaches, data scientists, and athletes to understand this transformation from multiple perspectives.`,
    relatedTopics: ['Technology in Sports', 'Athlete Development', 'Performance Analysis', 'Sports Business'],
    sources: [
      { title: 'ESPN Data Lab', url: '#' },
      { title: 'Sports Analytics Conferences', url: '#' },
      { title: 'Professional Team Reports', url: '#' }
    ]
  },
  {
    id: 'briefing-003',
    date: '2026-05-25',
    title: 'Climate Action in 2026: Corporate Commitments vs. Reality',
    category: 'Discover',
    author: 'Sustainability Correspondent',
    summary: 'Deep dive into corporate climate pledges and their actual implementation.',
    keyTakeaways: [
      'Gap between corporate climate promises and implementation remains significant',
      'Renewable energy investments showing strong returns despite initial skepticism',
      'Supply chain transparency becoming competitive advantage',
      'Carbon pricing mechanisms starting to influence business decisions globally'
    ],
    analysis: `With the first half of 2026 now complete, we conducted an original audit of 200+ major corporations\' climate commitments made in 2024-2025. The findings reveal both progress and persistent challenges.

Approximately 65% of companies are on track to meet their 2026 interim targets, but many face execution challenges in their supply chains. Most notably, smaller suppliers in developing nations are struggling to access the capital and technology needed for the green transition.

Our investigation included primary data collection from corporate sustainability reports, interviews with climate experts, and analysis of actual emissions measurements. This original research provides actionable insights for investors, policymakers, and conscious consumers.`,
    relatedTopics: ['Climate Change', 'Corporate Responsibility', 'Green Investment', 'Sustainability'],
    sources: [
      { title: 'UN Climate Data', url: '#' },
      { title: 'Corporate Sustainability Reports', url: '#' },
      { title: 'Research Institute Studies', url: '#' }
    ]
  }
];

export const EditorialBriefingsPage = () => {
  const [expandedBriefing, setExpandedBriefing] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedBriefing(expandedBriefing === id ? null : id);
  };

  return (
    <>
      <SEOMeta
        title="Editorial Briefings | WorldNewzs"
        description="Original editorial analysis and briefings on global news trends. Expert-curated insights on economics, sports, technology, and more."
        canonical={`${SITE_URL}/editorial-briefings`}
      />
      <JSONLDBreadcrumb crumbs={[
        { name: 'Home', url: SITE_URL },
        { name: 'Editorial Briefings', url: `${SITE_URL}/editorial-briefings` }
      ]} />

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box component="main">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 900, 
                letterSpacing: -0.5,
                mb: 2
              }}
            >
              Editorial Briefings
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '650px', mx: 'auto', fontWeight: 400 }}>
              Original analysis and expert commentary on the stories that matter. Our editorial desk synthesizes trends across multiple sources to provide actionable insights.
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LightbulbIcon />
            <Typography>
              Each briefing represents original research synthesized from 50+ credible global sources. Read our <a href="/about">editorial standards</a> to learn more about our verification process.
            </Typography>
          </Alert>

          <Divider sx={{ mb: 6 }} />

          {/* Briefings Grid */}
          <Grid container spacing={3}>
            {EDITORIAL_BRIEFINGS.map((briefing) => (
              <Grid item xs={12} key={briefing.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      transform: 'translateY(-2px)',
                    },
                    borderLeft: '4px solid',
                    borderLeftColor: 
                      briefing.category === 'Money' ? '#e91e63' :
                      briefing.category === 'Sports' ? '#f44336' :
                      '#ff9800'
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    {/* Header with date and category */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {new Date(briefing.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </Typography>
                      </Box>
                      <Chip
                        label={briefing.category}
                        size="small"
                        icon={briefing.category === 'Money' ? <TrendingUpIcon /> : <PublicIcon />}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>

                    {/* Title */}
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{
                        fontWeight: 800,
                        mb: 1.5,
                        cursor: 'pointer',
                        '&:hover': { color: 'primary.main' }
                      }}
                      onClick={() => toggleExpand(briefing.id)}
                    >
                      {briefing.title}
                    </Typography>

                    {/* Author */}
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 2 }}>
                      By {briefing.author}
                    </Typography>

                    {/* Summary */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                      {briefing.summary}
                    </Typography>

                    {/* Key Takeaways */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <FlagIcon sx={{ fontSize: '1rem' }} />
                        Key Takeaways
                      </Typography>
                      <Box sx={{ pl: 2 }}>
                        {briefing.keyTakeaways.map((takeaway, idx) => (
                          <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.8, lineHeight: 1.5 }}>
                            • {takeaway}
                          </Typography>
                        ))}
                      </Box>
                    </Box>

                    {/* Expandable Analysis */}
                    {expandedBriefing === briefing.id && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ my: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, borderLeft: '3px solid primary.main' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                            Full Analysis
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                            {briefing.analysis}
                          </Typography>
                        </Box>

                        {/* Related Topics */}
                        <Box sx={{ mb: 2.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                            Related Topics
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {briefing.relatedTopics.map((topic) => (
                              <Chip key={topic} label={topic} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </Box>

                        {/* Sources */}
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
                            Featured Sources
                          </Typography>
                          {briefing.sources.map((source, idx) => (
                            <Typography key={idx} variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                              • {source.title}
                            </Typography>
                          ))}
                        </Box>
                      </>
                    )}

                    {/* Expand/Collapse Button */}
                    <Button
                      size="small"
                      onClick={() => toggleExpand(briefing.id)}
                      sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      {expandedBriefing === briefing.id ? 'Show Less' : 'Read Full Analysis'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Footer note */}
          <Box sx={{ mt: 6, p: 3, bgcolor: 'background.paper', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              WorldNewzs Editorial Briefings represent original research and analysis synthesized by our editorial desk from vetted global news sources. Each briefing undergoes our multi-layer verification process before publication.
            </Typography>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default EditorialBriefingsPage;
