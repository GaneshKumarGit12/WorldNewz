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
        </Box>
      </Container>
    </>
  );
};

export default AboutPage;
