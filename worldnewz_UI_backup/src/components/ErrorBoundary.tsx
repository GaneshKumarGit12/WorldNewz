import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Typography, Button, Container } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center', minHeight: '60vh' }}>
          <WarningAmberIcon
            sx={{
              fontSize: 64,
              color: 'warning.main',
              mb: 3,
            }}
          />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
            Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 420, mx: 'auto' }}>
            An unexpected error occurred while loading this page. This has been logged and our team will look into it. Please try reloading the page.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<RefreshIcon />}
            onClick={this.handleReload}
            sx={{
              textTransform: 'none',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            Reload Page
          </Button>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
