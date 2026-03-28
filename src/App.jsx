// third party
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// ❌ ELIMINADO: ToastContainer ya no se usa
// import { ToastContainer } from 'react-toastify';
import { Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
// ❌ ELIMINADO: CSS de react-toastify ya no se necesita
// import 'react-toastify/dist/ReactToastify.css';

// project imports
import router from 'routes';
import { AuthProvider } from 'contexts/AuthContext';
import { NotificationProvider } from 'contexts/NotificationContext';
import ErrorBoundary from 'components/ErrorBoundary';

// Componente de carga personalizado
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: 2
    }}
  >
    <CircularProgress size={60} />
    <Typography variant="h6" color="text.secondary">
      Cargando...
    </Typography>
  </Box>
);

// theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
});

// -----------------------|| APP ||-----------------------//

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <AuthProvider>
            <Suspense fallback={<LoadingFallback />}>
              <RouterProvider router={router} />
            </Suspense>
            {/* ❌ ELIMINADO: ToastContainer - Ahora usamos NotificationBar integrada con la isla dinámica
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
            */}
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
