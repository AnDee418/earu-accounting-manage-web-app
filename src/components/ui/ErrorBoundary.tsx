'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Divider,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.handleReset} />;
    }

    return this.props.children;
  }
}

// デフォルトのエラー表示コンポーネント
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="400px"
      p={3}
    >
      <Card 
        sx={{ 
          maxWidth: 600, 
          width: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            <ErrorIcon 
              sx={{ 
                fontSize: 64, 
                color: 'error.main',
                mb: 2,
              }} 
            />
            <Typography variant="h5" gutterBottom fontWeight={600}>
              申し訳ございません
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              予期しないエラーが発生しました。下記のボタンをクリックして再試行してください。
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" gap={2} justifyContent="center" mb={3}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={resetError}
              size="large"
            >
              再読み込み
            </Button>
            <Button
              variant="outlined"
              startIcon={<BugReportIcon />}
              onClick={() => {
                // エラーレポート機能（将来実装予定）
                console.log('Error report:', { error });
              }}
            >
              エラーレポート
            </Button>
          </Box>

          {isDevelopment && error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                開発者向け情報:
              </Typography>
              <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
                {error.name}: {error.message}
                {error.stack && '\n\n' + error.stack}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export { ErrorBoundary, DefaultErrorFallback };
export type { ErrorFallbackProps };
export default ErrorBoundary;
