import React from 'react';
import { Box, Typography, Button, Card, CardContent, Alert } from '@mui/material';
import { Refresh as RefreshCw, Home, Warning as AlertTriangle } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(_error) {
    // Actualiza el estado para mostrar la interfaz de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Puedes registrar el error en un servicio de logging aquí
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // En desarrollo, mostrar detalles del error
    if (import.meta.env.DEV) {
      console.group('🐛 Error Boundary - Detalles completos');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Stack:', error.stack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Interfaz de error personalizada
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          padding={3}
          bgcolor="background.default"
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent>
              <Box textAlign="center" mb={3}>
                <AlertTriangle size={64} color="#f57c00" style={{ marginBottom: 16 }} />
                <Typography variant="h4" gutterBottom color="error">
                  ¡Oops! Algo salió mal
                </Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                  Ha ocurrido un error inesperado en la aplicación. No te preocupes, 
                  nuestro equipo ha sido notificado.
                </Typography>
              </Box>

              {import.meta.env.DEV && this.state.error && (
                <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Error técnico (solo visible en desarrollo):
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                    {this.state.error.toString()}
                  </Typography>
                </Alert>
              )}

              <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<RefreshCw size={20} />}
                  onClick={this.handleRetry}
                  sx={{ minWidth: 140 }}
                >
                  Reintentar
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<Home size={20} />}
                  onClick={this.handleGoHome}
                  sx={{ minWidth: 140 }}
                >
                  Ir al inicio
                </Button>
              </Box>

              {this.state.retryCount > 2 && (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    Si el problema persiste después de varios intentos, 
                    por favor contacta al administrador del sistema.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Typography variant="caption" color="textSecondary" sx={{ mt: 2 }}>
            ID del Error: {Date.now()} | Intentos: {this.state.retryCount}
          </Typography>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;