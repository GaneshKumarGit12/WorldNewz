import React, { useState } from 'react';
import { SEOMeta } from '../seo/SEOMeta';
import { JSONLDBreadcrumb } from '../seo/JSONLDSchemas';
import { Container, Typography, Box, Grid, TextField, Button, Alert, Card, CardContent, Divider } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { submitContactForm } from '../api/apiClient';

const SITE_URL = 'https://worldnewzs.in';
const CONTACT_EMAIL = 'ganeshkumard56@gmail.com';

export const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await submitContactForm({ name, email, subject, message });
      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err?.message || 'An error occurred while sending your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEOMeta
        title="Contact Us | WorldNewzs"
        description="Get in touch with the WorldNewzs team. Contact details, office hours, query resolution timelines, and location information."
        canonical={`${SITE_URL}/contact`}
      />
      <JSONLDBreadcrumb crumbs={[
        { name: 'Home', url: SITE_URL },
        { name: 'Contact Us', url: `${SITE_URL}/contact` }
      ]} />

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box component="section">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 900,
                background: 'linear-gradient(45deg, #c83a15, #ff7043)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Contact Us
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto', fontWeight: 400, mt: 2 }}>
              Have questions, feedback, or business inquiries? The WorldNewzs team is here to assist.
            </Typography>
          </Box>

          <Divider sx={{ mb: 6 }} />

          <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 800 }}>
                What to include in your message
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                If you are contacting us about a correction, inquiry, partnership, or feedback, please include the page URL, a short description of the issue, and any screenshots or references that help us respond quickly.
              </Typography>
            </CardContent>
          </Card>

          <Grid container spacing={4} sx={{ mb: 6 }}>
            {/* Contact Details & SLA Info */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
                Get In Touch
              </Typography>
              
              {/* Email Card */}
              <Card sx={{ mb: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
                  <EmailIcon color="primary" sx={{ fontSize: 30 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Email Address</Typography>
                    <Typography variant="body2" color="text.secondary">
                      <a href={`mailto:${CONTACT_EMAIL}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500 }}>
                        {CONTACT_EMAIL}
                      </a>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Office Hours Card */}
              <Card sx={{ mb: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
                  <AccessTimeIcon color="primary" sx={{ fontSize: 30 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Office Hours</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Mon – Fri, 9:00 AM – 6:00 PM IST
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* SLA Timeline Card */}
              <Card sx={{ mb: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
                  <QuestionAnswerIcon color="primary" sx={{ fontSize: 30 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Resolution Timeline</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, lineHeight: 1.4 }}>
                      • Editorial corrections: &lt; 24 Hours<br />
                      • General queries: &lt; 48 Hours
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Headquarters Location */}
              <Card sx={{ mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
                  <LocationOnIcon color="primary" sx={{ fontSize: 30 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Headquarters</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Ganesh CO, India
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Contact Form */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Box 
                component="form" 
                onSubmit={handleSubmit} 
                sx={{ 
                  p: 4, 
                  bgcolor: 'background.paper', 
                  borderRadius: 4, 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
                  Send a Message
                </Typography>

                {submitted && (
                  <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSubmitted(false)}>
                    Thank you! Your message has been sent successfully. We will get back to you shortly.
                  </Alert>
                )}

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      id="contact-name"
                      fullWidth
                      label="Your Name"
                      variant="outlined"
                      size="small"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      id="contact-email"
                      fullWidth
                      label="Your Email"
                      variant="outlined"
                      size="small"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      id="contact-subject"
                      fullWidth
                      label="Subject"
                      variant="outlined"
                      size="small"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      id="contact-message"
                      fullWidth
                      label="Message"
                      variant="outlined"
                      multiline
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button
                      id="contact-submit-btn"
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={submitting}
                      endIcon={submitting ? undefined : <SendIcon />}
                      fullWidth
                      sx={{ py: 1, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                    >
                      {submitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>

          {/* Styled Headquarters Location Map Placeholder Card */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
              Our Location
            </Typography>
            <Card sx={{ 
              height: 320, 
              borderRadius: 4, 
              overflow: 'hidden', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid', 
              borderColor: 'divider',
              position: 'relative'
            }}>
              {/* Styled Mock Map Graphic Background */}
              <Box sx={{ 
                width: '100%', 
                height: '100%', 
                backgroundColor: (theme) => theme.palette.mode === 'light' ? '#eceff1' : '#1e293b',
                backgroundImage: `radial-gradient(circle, rgba(200, 58, 21, 0.05) 1.5px, transparent 1.5px)`,
                backgroundSize: '24px 24px',
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center',
                position: 'relative',
                p: 3
              }}>
                {/* Decorative Grid Lines */}
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '1px',
                  backgroundColor: 'rgba(200, 58, 21, 0.1)',
                }} />
                <Box sx={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: '1px',
                  backgroundColor: 'rgba(200, 58, 21, 0.1)',
                }} />
                
                {/* Central Radar Wave effect */}
                <Box sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  border: '2px solid rgba(200, 58, 21, 0.3)',
                  position: 'absolute',
                  animation: 'pulse 3s infinite ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }} />

                {/* Map Pin */}
                <LocationOnIcon color="primary" sx={{ fontSize: 60, zIndex: 2, filter: 'drop-shadow(0px 8px 12px rgba(200, 58, 21, 0.4))' }} />
                
                {/* Floating Glassmorphic Location Info Box */}
                <Box sx={{
                  mt: 2,
                  p: 2,
                  zIndex: 2,
                  borderRadius: 3,
                  backgroundColor: (theme) => theme.palette.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(22,27,34,0.9)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid',
                  borderColor: 'divider',
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  maxWidth: 280
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>WorldNewzs Headquarters</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.85rem' }}>
                    Ganesh CO, India
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1, fontWeight: 700 }}>
                    Lat: 20.5937° N | Lon: 78.9629° E
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default ContactPage;
