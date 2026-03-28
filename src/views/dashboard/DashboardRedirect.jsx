import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'hooks/useAuth';
import { Box, CircularProgress, Typography } from '@mui/material';

const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 DashboardRedirect - Estado:', { user, loading });
    console.log('🔍 DashboardRedirect - Rol del usuario:', user?.rol);

    if (!loading && user?.rol) {
      const roleRedirects = {
        admin: '/app/dashboard/admin',
        secretaria: '/app/dashboard/secretaria',
        coordinador_convivencia: '/app/dashboard/coordinador', // Panel propio de coordinación
        escaner: '/app/dashboard/escaner',
        alfabetizador: '/app/asistencia/scanner',
        docente: '/app/dashboard/docente',
        estudiante: '/app/dashboard/estudiante',
        invitado: '/app/dashboard/guest'
      };

      const redirectUrl = roleRedirects[user.rol];
      console.log('🎯 DashboardRedirect - URL de redirección:', redirectUrl);

      if (redirectUrl) {
        console.log('✅ DashboardRedirect - Navegando a:', redirectUrl);
        navigate(redirectUrl, { replace: true });
      } else {
        console.warn('⚠️ DashboardRedirect - Rol no reconocido:', user.rol);
        navigate('/app/dashboard/admin', { replace: true }); // Fallback
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="h6" color="textSecondary">
          Cargando dashboard...
        </Typography>
      </Box>
    );
  }

  return null;
};

export default DashboardRedirect;
