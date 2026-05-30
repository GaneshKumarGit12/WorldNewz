import React, { useState } from 'react';
import { SEOMeta } from '../seo/SEOMeta';
import { JSONLDBreadcrumb } from '../seo/JSONLDSchemas';
import { Container, Typography, Box, Grid, TextField, Button, Alert, Card, CardContent, Divider } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const SITE_URL = 'https://worldnewzs.in';
const CONTACT_EMAIL = 'ganeshkumard56@gmail.com';

export const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    // Success simulation
    setError(null);
    setSubmitted(true);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <>
      <SEOMeta
        title="Contact Us | WorldNewzs"
        description="Get in touch with the WorldNewzs team. Send us feedback, suggest news sources, or inquire about partnership opportunities."
        canonical={`${SITE_URL}/contact`}
      />
      <JSONLDBreadcrumb crumbs={[
        { name: 'Home', url: SITE_URL },
        { name: 'Contact Us', url: `${SITE_URL}/contact` }
      ]} />

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box component="main">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
              Contact Us
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto', fontWeight: 400 }}>
              Have questions, feedback, or business inquiries? We'd love to hear from you.
            </Typography>
          </Box>

          <Divider sx={{ mb: 6 }} />

          <Grid container spacing={4}>
            {/* Contact Details */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                Get In Touch
              </Typography>
              
              <Card sx={{ mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', borderRadius: 2 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
                  <EmailIcon color="primary" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Email Address</Typography>
                    <Typography variant="body2" color="text.secondary">
                      <a href={`mailto:${CONTACT_EMAIL}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {CONTACT_EMAIL}
                      </a>
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', borderRadius: 2 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
                  <LocationOnIcon color="primary" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Headquarters</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ganesh CO, India
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, lineHeight: 1.6 }}>
                For general support, feedback, copyright reports, or advertising inquiries, please use the contact form or send us an email directly. We typically reply within 24–48 business hours.
              </Typography>
            </Grid>

            {/* Contact Form */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Box 
                component="form" 
                onSubmit={handleSubmit} 
                sx={{ 
                  p: 4, 
                  bgcolor: 'background.paper', 
                  borderRadius: 3, 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)' 
                }}
              >
                <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
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
                      fullWidth
                      label="Message"
                      variant="outlined"
                      multiline
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      endIcon={<SendIcon />}
                      fullWidth
                    >
                      Send Message
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </>
  );
};

export default ContactPage;
