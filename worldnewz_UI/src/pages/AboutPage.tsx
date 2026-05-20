import { SEOMeta } from '../seo/SEOMeta';
import { JSONLDBreadcrumb } from '../seo/JSONLDSchemas';
import { Container, Typography, Box, Grid, Card, CardContent, Avatar, Divider, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const SITE_URL = 'https://world-newz.vercel.app';

export const AboutPage = () => {
  return (
    <>
      <SEOMeta
        title="About Us | WorldNewz"
        description="Learn more about WorldNewz, our mission to deliver curated, high-quality global news, and our editorial standards for credibility."
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
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
              About WorldNewz
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto', fontWeight: 400 }}>
              Your trusted global news aggregator. We scan, verify, and curate the stories that shape our world.
            </Typography>
          </Box>

          <Divider sx={{ mb: 6 }} />

          {/* Mission & Vision */}
          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
                Our Mission
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.7 }}>
                In an era of information overload, finding reliable updates can be daunting. WorldNewz was established with a singular mission: to provide a clean, unbiased, and comprehensive window into global headlines. We bring together diverse perspectives in sports, technology, business, travel, and more.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
                Unique Curation & Technology
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.7 }}>
                We don't just syndicate feed URLs. Our advanced categorization pipeline filters out duplicates, sorts news by media richness (prioritizing visual and complete stories), and provides custom key briefings so you can digest essential details immediately.
              </Typography>
            </Grid>
          </Grid>

          {/* Editorial Guidelines Section (Huge for E-E-A-T) */}
          <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', mb: 6 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon color="primary" /> Editorial Standards & Guidelines
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 3 }}>
              To meet the highest standards of journalistic trust (E-E-A-T), we adhere to the following curation principles:
            </Typography>
            <List>
              {[
                { title: 'Fact-Checking & Verifiability', desc: 'We only source news from established publishers with verifiable track records and clear author attributions.' },
                { title: 'Anti-Sensationalism', desc: 'Our algorithms actively downrank clickbait titles and prioritize factual, informative headlines.' },
                { title: 'Diverse Perspectives', desc: 'When covering controversial global issues, we strive to link multiple viewpoints to provide complete objectivity.' },
                { title: 'User Agency', desc: 'We value user engagement. Our readers can bookmark stories, leave feedback, and discuss current events in our comment sections.' }
              ].map((item, index) => (
                <ListItem key={index} alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                    <CheckCircleOutlineIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    secondary={item.desc}
                    primaryTypographyProps={{ sx: { fontWeight: 600, color: 'text.primary' } }}
                    secondaryTypographyProps={{ sx: { mt: 0.5, color: 'text.secondary' } }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Editorial Team (E-E-A-T Requirement) */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
            Editorial Board
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card sx={{ display: 'flex', p: 2, alignItems: 'center', gap: 2, height: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', borderRadius: 2 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.5rem', fontWeight: 'bold' }}>GK</Avatar>
                <CardContent sx={{ p: '0 !important' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Ganesh Kumar
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                    Editor-in-Chief & Founder
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Oversees the curation filters, content guidelines, and technical developments.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card sx={{ display: 'flex', p: 2, alignItems: 'center', gap: 2, height: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', borderRadius: 2 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'secondary.main', fontSize: '1.5rem', fontWeight: 'bold' }}>ED</Avatar>
                <CardContent sx={{ p: '0 !important' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Editorial Desk
                  </Typography>
                  <Typography variant="caption" color="secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                    News Curation & Verification Team
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monitors dynamic news indexing pipelines to ensure sources are verified and high-quality.
                  </Typography>
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
