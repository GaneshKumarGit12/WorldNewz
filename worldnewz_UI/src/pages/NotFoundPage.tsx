import { useNavigate } from 'react-router-dom';
import { Typography, Button, Container } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import { SEOMeta } from '../seo/SEOMeta';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOMeta
        title="Page Not Found"
        description="The page you are looking for does not exist on WorldNewzs."
        noIndex={true}
      />
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center', minHeight: '60vh' }}>
        <SentimentDissatisfiedIcon
          sx={{
            fontSize: 80,
            color: 'primary.main',
            mb: 3,
            opacity: 0.7,
          }}
        />
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 800,
            mb: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1.5 }}>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
          Sorry, the page you're looking for doesn't exist or has been moved. Try heading back to our homepage for the latest news.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          sx={{
            textTransform: 'none',
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          Back to Homepage
        </Button>
      </Container>
    </>
  );
};

export default NotFoundPage;
