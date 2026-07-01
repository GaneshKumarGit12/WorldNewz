import { Link } from 'react-router-dom';
import { SEOMeta } from '../seo/SEOMeta';
import { JSONLDBreadcrumb } from '../seo/JSONLDSchemas';
import { Container, Typography, Box, Grid, Card, CardContent, Avatar, Divider, List, ListItem, ListItemText, ListItemIcon, Button } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PolicyIcon from '@mui/icons-material/Policy';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';

const SITE_URL = 'https://worldnewzs.in';

export const AboutPage = () => {
  return (
    <>
      <SEOMeta
        title="About Us | WorldNewzs"
        description="Learn about WorldNewzs, our core editorial mission to deliver transparent and fact-checked global news, our curation pipeline, and our editorial team."
        canonical={`${SITE_URL}/about`}
      />
      <JSONLDBreadcrumb crumbs={[
        { name: 'Home', url: SITE_URL },
        { name: 'About Us', url: `${SITE_URL}/about` }
      ]} />

      <Container maxWidth="md" sx={{ py: 6 }}>
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
                background: 'linear-gradient(45deg, #c83a15, #ff7043)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              About WorldNewzs
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '650px', mx: 'auto', fontWeight: 400, mt: 2 }}>
              Your trusted global news aggregator. We analyze, verify, and present the stories that shape our world with uncompromised integrity.
            </Typography>
          </Box>

          <Divider sx={{ mb: 6 }} />

          {/* Mission & Vision */}
          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 800, color: 'text.primary' }}>
                Our Mission
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
                In an era dominated by clickbait and information overload, finding clear and reliable news is harder than ever. WorldNewzs was founded with a singular commitment: to empower global readers by providing a clean, objective, and comprehensive window into international headlines. We bridge diverse viewpoints to offer a balanced narrative.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 800, color: 'text.primary' }}>
                Advanced Curation & AI Verification
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
                We go far beyond syndicating raw RSS feeds. Our engineering pipeline uses natural language processing and advanced filters to remove duplicates, prioritize media-rich reporting (complete with photos, videos, and context), and provide AI-assisted key briefings so you get to the core details instantly.
              </Typography>
            </Grid>
          </Grid>

          {/* Editorial Process & Curation Workflow */}
          <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 6, borderLeft: '5px solid #c83a15' }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <VerifiedUserIcon color="primary" /> Editorial Curation & Verification Process
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
              To ensure that we comply with standard Search Engine and Google News E-E-A-T guidelines, all articles surfaced on WorldNewzs undergo a multi-layered verification process:
            </Typography>
            <List>
              {[
                { 
                  title: '1. Reputable Source Whitelisting', 
                  desc: 'We only index publishers with public editorial boards, transparent authorship, and a history of factual reporting. We explicitly exclude unverified blogs or user-generated forums.' 
                },
                { 
                  title: '2. Multi-Source Fact Checking', 
                  desc: 'When major breaking news occurs, our system matches related reports across multiple global outlets. If claims cannot be verified across at least two independent credible publishers, they are flagged and delayed from main feeds.' 
                },
                { 
                  title: '3. Clickbait & Bias Mitigation', 
                  desc: 'Titles are analyzed for sensationalism. Our curation desk enforces clean, direct headlines and downranks clickbait or emotionally loaded syntax.' 
                },
                { 
                  title: '4. Continuous Human Audits', 
                  desc: 'Our editorial desk runs 24/7 audits of the automated pipelines, ensuring prompt removal of incorrect indexing, duplicates, or low-quality layouts.' 
                }
              ].map((item, index) => (
                <ListItem key={index} alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                  <ListItemText
                    primary={item.title}
                    secondary={item.desc}
                    primaryTypographyProps={{ sx: { fontWeight: 700, color: 'text.primary' } }}
                    secondaryTypographyProps={{ sx: { mt: 0.5, color: 'text.secondary', lineHeight: 1.6 } }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Standards & Guidelines Section */}
          <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 6 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AutoAwesomeIcon color="primary" /> Editorial Integrity & Correction Policy
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 3 }}>
              Credibility is our most valuable asset. We hold ourselves and our partners to these core principles:
            </Typography>
            <List>
              {[
                { title: 'Transparency & Attributions', desc: 'Every single article matches its original verified source URL. We display clear canonical anchors to respect content creators and original publishers.' },
                { title: 'Fact-Correction Policy', desc: 'If we discover or are notified that an indexed source has published incorrect facts, we update or completely remove the story from our feeds within 24 hours.' },
                { title: 'Political Neutrality', desc: 'WorldNewzs does not align with any political party, organization, or ideology. Our objective is to present diverse global viewpoints neutrally.' },
                { title: 'User Protection & Moderation', desc: 'Our comment boards are actively moderated to prevent harassment, misinformation, and spam while encouraging healthy editorial discussion.' }
              ].map((item, index) => (
                <ListItem key={index} alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <CheckCircleOutlineIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    secondary={item.desc}
                    primaryTypographyProps={{ sx: { fontWeight: 700, color: 'text.primary' } }}
                    secondaryTypographyProps={{ sx: { mt: 0.5, color: 'text.secondary', lineHeight: 1.5 } }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Editorial Team */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
            Our Editorial Board
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card sx={{ display: 'flex', p: 3, alignItems: 'flex-start', gap: 2.5, height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem', fontWeight: 'bold' }}>GK</Avatar>
                <CardContent sx={{ p: '0 !important' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Ganesh Kumar
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Founder & Editor-in-Chief
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                    Oversees the algorithms, content guidelines, curation architecture, and core system technologies.
                  </Typography>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="primary" 
                    startIcon={<AlternateEmailIcon />} 
                    href="mailto:ganeshkumard56@gmail.com"
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Contact Ganesh
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card sx={{ display: 'flex', p: 3, alignItems: 'flex-start', gap: 2.5, height: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'grey.700', fontSize: '1.5rem', fontWeight: 'bold' }}>ED</Avatar>
                <CardContent sx={{ p: '0 !important' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    Editorial Desk
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    News Verification & Audits
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                    Monitors feed indexing, reviews reports of errors, filters low-quality layout articles, and manages moderation.
                  </Typography>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    color="inherit" 
                    startIcon={<PolicyIcon />} 
                    href="/contact"
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Submit Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 6 }} />

          {/* Curation Pipeline & E-E-A-T Curation Essay */}
          <Box sx={{ mt: 6 }}>
            <Typography 
              variant="h4" 
              component="h2" 
              gutterBottom 
              sx={{ 
                fontWeight: 900, 
                letterSpacing: -0.5,
                background: 'linear-gradient(45deg, #c83a15, #ff7043)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3
              }}
            >
              The Modern Frontier of Digital Journalism & Algorithmic News Curation
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8, mb: 3 }}>
              In the contemporary digital landscape, information is generated at a pace never seen before in human history. Every second, thousands of articles, reports, opinions, and breaking updates are published across the globe. While this vast flow of data ensures unprecedented access to information, it also introduces significant challenges: echo chambers, media bias, sensationalized clickbait, and duplicate stories that clutter reader feeds. Finding objective, high-quality, and transparent news has become a complex task.
            </Typography>

            <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8, mb: 4 }}>
              WorldNewzs was established to address this challenge. As a premier global news aggregator, our core mission is to serve as an objective, clear, and comprehensive lens through which readers can view international events. We believe that access to verified, diverse, and well-contextualized news is a fundamental pillar of an informed global society. By combining advanced natural language processing (NLP) algorithms with strict editorial standards, WorldNewzs curates a streamlined stream of headlines that matter, free from the noise and clutter of the raw internet.
            </Typography>

            <Grid container spacing={4} sx={{ mb: 6 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 800 }}>
                  Intelligent Curation Architecture
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
                  At the heart of WorldNewzs is a sophisticated, multi-layered curation engine. We do not simply syndicate raw feeds or display unfiltered RSS streams. Instead, our technology stack works in real-time to ingest, filter, categorize, and prioritize content from thousands of whitelisted, reputable sources.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ pl: 2.5, borderLeft: '3px solid #c83a15' }}>
                  <Typography variant="body2" color="text.secondary" component="div">
                    <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                      <li style={{ marginBottom: '8px' }}>
                        <strong>Reputable Source Auditing:</strong> Processing only from publishers with public editorial boards, transparent authorship, and a documented history of accuracy.
                      </li>
                      <li style={{ marginBottom: '8px' }}>
                        <strong>Algorithmic Deduplication:</strong> Analyzing semantic similarity across titles and bodies to group duplicate articles and maintain homepage cleanliness.
                      </li>
                      <li style={{ marginBottom: '8.18' }}>
                        <strong>Contextual Enrichment:</strong> Fetching rich metadata, structured JSON-LD data, and optimized image URLs for proper attribution.
                      </li>
                    </ul>
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 800, mt: 4, mb: 2 }}>
              Combating Clickbait, Misinformation, and Sensationalism
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8, mb: 3 }}>
              One of the greatest threats to digital media is the rise of sensationalism. Headlines are frequently designed to provoke emotional reactions rather than convey factual summaries. WorldNewzs uses advanced filtering to combat this trend. Our sentiment analysis models evaluate headlines for emotionally charged language, clickbait patterns (such as exaggerated questions or incomplete statements designed to force a click), and extreme political bias. Articles that fail these checks are automatically downranked or flagged for manual review. This ensures that the stories displayed on our home page are informative, direct, and balanced, providing a quiet and focused environment for news consumption.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8, mb: 4 }}>
              Furthermore, we continuously update our vocabulary database to recognize emerging clickbait styles and manipulative phrases. Journalistic integrity is a moving target in the digital age, and our engineering systems evolve dynamically to ensure that sensationalized editorial practices do not contaminate our index, preserving our reputation as a trusted primary news resource.
            </Typography>

            <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 800, mt: 4, mb: 2 }}>
              Active Reader Community
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8, mb: 3 }}>
              We believe that news should not be a one-way street. WorldNewzs is designed to be an interactive platform where global citizens can engage with content, bookmark key reports for future reference, and participate in civilized, moderated discussions. Our built-in bookmarking system allows you to save articles locally so you never lose track of important investigations or ongoing stories. Additionally, our comment sections foster healthy community engagement. We actively moderate all comment boards to prevent harassment, hate speech, and spam, ensuring that the dialogue remains constructive, educational, and respectful. By giving readers a voice, we transform passive news consumption into an active, collaborative discovery process.
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8, mb: 4 }}>
              Our user feedback loops also play an important role. When readers flag incorrect titles or broken links in the comment sections, our editorial team immediately reviews the reports, validating that our automated system remains aligned with user expectations and high-quality browsing.
            </Typography>

            <Box sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider', mt: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Contact & Inquiries
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
                We highly value feedback, corrections, and inquiries from our global audience. If you spot a factual error in an indexed article, have a business proposal, or need technical support, you can easily reach us via our Contact Us page.
              </Typography>
              <Button variant="contained" component={Link} to="/contact" color="primary" sx={{ borderRadius: 2, textTransform: 'none' }}>
                Get In Touch
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default AboutPage;
