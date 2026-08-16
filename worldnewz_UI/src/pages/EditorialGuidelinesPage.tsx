import { SEOMeta } from '../seo/SEOMeta';
import { JSONLDBreadcrumb } from '../seo/JSONLDSchemas';
import { Container, Box, Typography, Card, CardContent, Grid, List, ListItem, ListItemIcon, ListItemText, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SearchIcon from '@mui/icons-material/Search';
import GavelIcon from '@mui/icons-material/Gavel';

const SITE_URL = 'https://worldnewzs.in';

interface GuidelineItem {
  title: string;
  description: string;
  allowed: string[];
  notAllowed: string[];
}

const EDITORIAL_GUIDELINES: GuidelineItem[] = [
  {
    title: 'Source Quality & Verification',
    description: 'All articles must come from verified, reputable news organizations with transparent editorial boards and fact-checking processes.',
    allowed: [
      'Major news organizations (Reuters, AP, BBC, etc.)',
      'Established beat journalists and correspondents',
      'Official government/institutional statements',
      'Peer-reviewed research and studies',
      'Direct quotes from named sources'
    ],
    notAllowed: [
      'Anonymous sources without verification',
      'User-generated content forums',
      'Unverified blogs or personal websites',
      'Clickbait or sensationalist sources',
      'Content without author attribution'
    ]
  },
  {
    title: 'Content Originality & Attribution',
    description: 'We add editorial value through curation, analysis, and original synthesis while maintaining full transparency about sources.',
    allowed: [
      'Original contextual analysis linking multiple sources',
      'Expert editorial commentary on breaking news',
      'Data visualization and infographics based on primary sources',
      'Fact-checking and verification of claims',
      'Clear canonical links to original sources'
    ],
    notAllowed: [
      'Republishing full articles without added value',
      'Duplicate content across multiple pages',
      'Hidden or unclear source attribution',
      'Copy-pasting without editorial modification',
      'Content without originality markers'
    ]
  },
  {
    title: 'Factual Accuracy & Corrections',
    description: 'We maintain strict factual accuracy standards and promptly correct any errors through transparent correction policies.',
    allowed: [
      'Updates and revisions with "Updated:" timestamps',
      'Correction notices with full transparency',
      'Multiple source verification before publication',
      'Transparent retraction when necessary',
      'Clear labeling of developing stories'
    ],
    notAllowed: [
      'Publication of unverified claims',
      'Silent edits without noting changes',
      'Republication of debunked information',
      'Misleading headlines that contradict content',
      'Misrepresentation of sources'
    ]
  },
  {
    title: 'Editorial Independence & Neutrality',
    description: 'WorldNewzs maintains strict editorial independence and neutral coverage regardless of political, commercial, or ideological pressures.',
    allowed: [
      'Multi-perspective coverage of political events',
      'Separation of news from opinion/analysis',
      'Disclosure of potential conflicts of interest',
      'Fair representation of different viewpoints',
      'Focus on factual reporting over advocacy'
    ],
    notAllowed: [
      'Biased or one-sided political coverage',
      'Undisclosed paid or sponsored content',
      'Advocacy presented as news reporting',
      'Conflict of interest without disclosure',
      'Suppression of newsworthy information'
    ]
  },
  {
    title: 'AI Usage & Transparency',
    description: 'AI tools are used only to enhance our editorial process, with full transparency about AI involvement and human editorial oversight.',
    allowed: [
      'AI-assisted headline generation (edited by humans)',
      'Automated duplicate detection and filtering',
      'NLP-powered content classification',
      'Sentiment analysis for contextual briefings',
      'AI as an editorial tool with human oversight'
    ],
    notAllowed: [
      'Fully AI-generated content without human review',
      'AI content presented without disclosure',
      'Machine learning without editorial verification',
      'Automated publishing without human oversight',
      'Hidden AI usage in content creation'
    ]
  },
  {
    title: 'Audience Engagement & Moderation',
    description: 'Reader comments are welcomed and moderated to maintain a respectful, factual discussion environment.',
    allowed: [
      'Healthy editorial discussion and debate',
      'Constructive criticism of article coverage',
      'Factual corrections and additional context',
      'Civil disagreement and different perspectives',
      'Attribution of commenter credentials when relevant'
    ],
    notAllowed: [
      'Harassment, hate speech, or discrimination',
      'Spam or commercial promotion',
      'Misinformation or false claims',
      'Personal attacks on journalists or sources',
      'Off-topic or irrelevant discussions'
    ]
  }
];

export const EditorialGuidelinesPage = () => {
  const guidelineTitles = EDITORIAL_GUIDELINES.slice(0, 3).map(g => g.title).join(", ");
  const dynamicDesc = `Editorial Guidelines: ${guidelineTitles}. Learn about our source verification, content originality, and factual accuracy policies on WorldNewzs.`;

  return (
    <>
      <SEOMeta
        title="Editorial Guidelines | WorldNewzs"
        description={dynamicDesc.substring(0, 155) + "..."}
        canonical={`${SITE_URL}/editorial-guidelines`}
      />
      <JSONLDBreadcrumb crumbs={[
        { name: 'Home', url: SITE_URL },
        { name: 'Editorial Guidelines', url: `${SITE_URL}/editorial-guidelines` }
      ]} />

      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box component="section">
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
              Editorial Guidelines & Standards
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '700px', mx: 'auto', fontWeight: 400 }}>
              Our commitment to journalistic integrity, factual accuracy, and editorial independence. These standards guide every decision we make about what content appears on WorldNewzs.
            </Typography>
          </Box>

          <Divider sx={{ mb: 6 }} />

          {/* Core Principles */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
              Core Editorial Principles
            </Typography>
            <Grid container spacing={3}>
              {[
                {
                  icon: <VerifiedUserIcon sx={{ fontSize: '2.5rem', color: 'success.main' }} />,
                  title: 'Verification First',
                  desc: 'Every story is verified against multiple credible sources before publication.'
                },
                {
                  icon: <SearchIcon sx={{ fontSize: '2.5rem', color: 'primary.main' }} />,
                  title: 'Radical Transparency',
                  desc: 'We disclose our sources, methods, and any potential conflicts of interest.'
                },
                {
                  icon: <GavelIcon sx={{ fontSize: '2.5rem', color: 'info.main' }} />,
                  title: 'Editorial Independence',
                  desc: 'Our editorial decisions are never influenced by commercial or political interests.'
                }
              ].map((principle, idx) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                  <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                      {principle.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      {principle.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {principle.desc}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Detailed Guidelines */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 800, mb: 4 }}>
              Detailed Content Standards
            </Typography>
            
            {EDITORIAL_GUIDELINES.map((guideline, idx) => (
              <Box key={idx} sx={{ mb: 5 }}>
                <Card sx={{ borderTop: '4px solid', borderTopColor: 'primary.main' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      {guideline.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                      {guideline.description}
                    </Typography>

                    <Grid container spacing={3}>
                      {/* Allowed */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : '#e8f5e9', borderRadius: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: (theme) => theme.palette.mode === 'dark' ? 'success.light' : 'success.dark' }}>
                            <CheckCircleIcon /> Allowed
                          </Typography>
                          <List sx={{ p: 0 }}>
                            {guideline.allowed.map((item, i) => (
                              <ListItem key={i} sx={{ p: 0, mb: 1 }}>
                                <ListItemIcon sx={{ minWidth: 32, color: 'success.main' }}>
                                  <CheckCircleIcon sx={{ fontSize: '1.2rem' }} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={item}
                                  primaryTypographyProps={{ variant: 'body2', sx: { fontWeight: 500 } }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </Grid>

                      {/* Not Allowed */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.15)' : '#ffebee', borderRadius: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: (theme) => theme.palette.mode === 'dark' ? 'error.light' : 'error.dark' }}>
                            <CancelIcon /> Not Allowed
                          </Typography>
                          <List sx={{ p: 0 }}>
                            {guideline.notAllowed.map((item, i) => (
                              <ListItem key={i} sx={{ p: 0, mb: 1 }}>
                                <ListItemIcon sx={{ minWidth: 32, color: 'error.main' }}>
                                  <CancelIcon sx={{ fontSize: '1.2rem' }} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={item}
                                  primaryTypographyProps={{ variant: 'body2', sx: { fontWeight: 500 } }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>

          {/* Factual Verification & Attribution Framework */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
              Fact-Checking & Attribution Policies
            </Typography>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: '100%', p: 1 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                      Multi-Layer Fact-Checking Protocol
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7, color: 'text.secondary' }}>
                      Our automated and manual curation systems are bound by a strict factual verification workflow before any information is summarized or presented as a briefing:
                    </Typography>
                    <Typography component="div" variant="body2" sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'primary.main', color: 'text.secondary' }}>
                      <ol style={{ margin: 0, paddingLeft: '15px' }}>
                        <li style={{ marginBottom: '8px' }}><strong>Source Integrity Analysis:</strong> Every incoming RSS feed and license partner content is filtered through an authority-indexing registry to confirm current licensing and journalistic credentials.</li>
                        <li style={{ marginBottom: '8px' }}><strong>Cross-Referencing:</strong> A single claim must be reported by at least three independent verified agencies before it is considered confirmed. Conflicting reports are automatically flagged for editorial desk review.</li>
                        <li style={{ marginBottom: '8px' }}><strong>Semantic Cleansing:</strong> Our Natural Language Processing (NLP) tools parse text to separate objective factual statements from opinion pieces, editorial bias, and sensationalist adjectives.</li>
                        <li style={{ marginBottom: '8px' }}><strong>Final Human Review:</strong> All curated briefs, especially in Politics and Business categories, are reviewed by our editors to verify dates, statistics, and proper contextual framing.</li>
                      </ol>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: '100%', p: 1 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                      Attribution & Direct Linking Policy
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7, color: 'text.secondary' }}>
                      WorldNewzs respects intellectual property rights and prioritizes original source transparency. Our attribution standards guarantee:
                    </Typography>
                    <Typography component="div" variant="body2" sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'primary.main', color: 'text.secondary' }}>
                      <ul style={{ margin: 0, paddingLeft: '15px', listStyleType: 'disc' }}>
                        <li style={{ marginBottom: '8px' }}><strong>Canonical Referencing:</strong> All aggregated articles feature direct, follow-canonical outbound links to the original publisher's landing page, ensuring proper SEO credit.</li>
                        <li style={{ marginBottom: '8px' }}><strong>Journalist Citation:</strong> Wherever possible, the name of the original reporter and agency is explicitly displayed alongside the publication date and source logo.</li>
                        <li style={{ marginBottom: '8px' }}><strong>No Inlining of Full Text:</strong> We only display summaries, key highlights, and editorial context (e.g. "Why It Matters"). Full article body texts are never scraped or stored.</li>
                        <li style={{ marginBottom: '8px' }}><strong>Fair Use Compliance:</strong> Headings, brief snippets, and thumbnail images are utilized in full compliance with global news reporting fair use doctrines.</li>
                      </ul>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Source Whitelisting */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
              Our Source Network
            </Typography>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  WorldNewzs curates content from over 10,000 verified news sources globally, including:
                </Typography>
                <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'background.paper' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Source Category</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Examples</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Verification Method</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        {
                          category: 'Tier 1 News Agencies',
                          examples: 'Reuters, AP News, AFP, BBC',
                          method: 'Direct feed integration with editorial verification'
                        },
                        {
                          category: 'Major Publications',
                          examples: 'Financial Times, New York Times, Guardian',
                          method: 'Content licensing and RSS feeds'
                        },
                        {
                          category: 'Specialty Publications',
                          examples: 'Nature, Science Magazine, Industry Reports',
                          method: 'Editorial review of publication credentials'
                        },
                        {
                          category: 'Regional News',
                          examples: '500+ local and regional outlets',
                          method: 'Source verification and editorial oversight'
                        }
                      ].map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{row.category}</TableCell>
                          <TableCell>{row.examples}</TableCell>
                          <TableCell>{row.method}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>

          {/* Reporting Issues */}
          <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 2, borderLeft: '4px solid', borderLeftColor: 'warning.main' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Report Editorial Issues
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              If you believe any article violates these guidelines or contains factual errors:
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Email our editorial team"
                  secondary="Send details to editorial@worldnewzs.in with the article link and concern"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Use the Report Feature"
                  secondary="Click 'Report Issue' on any article to submit feedback"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Join Our Discussion"
                  secondary="Comment on articles or visit /about for more contact options"
                />
              </ListItem>
            </List>
            <Typography variant="caption" color="text.secondary">
              We review all reports within 24 hours and maintain transparency about corrections and retractions.
            </Typography>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default EditorialGuidelinesPage;
