import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, IconButton, Badge, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { AuthContext } from 'contexts/AuthContext';
import { useAuth } from 'hooks/useAuth';
import { useNotification } from 'contexts/NotificationContext';
import { logger } from 'utils/logger';

export default function NavBar() {
  const authContext = useContext(AuthContext);
  const { logout } = useAuth();
  const { history, historyOpen, toggleHistory } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  if (!authContext) {
    logger.error('[NavBar] AuthContext no está disponible');
    return null;
  }

  const { user } = authContext;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleName = (rol) => {
    const roles = {
      admin: 'Administrador',
      secretaria: 'Secretaria',
      alfabetizador: 'Alfabetizador',
      docente: 'Docente',
      estudiante: 'Estudiante',
      coordinador_convivencia: 'Coordinador de Convivencia'
    };
    return roles[rol] || 'Usuario';
  };

  const getPageName = (pathname) => {
    const routes = {
      // Admin
      '/app/dashboard/admin': 'Panel de Administrador',
      '/dashboard': 'Panel de Administrador',
      '/dashboard/admin': 'Panel de Administrador',

      // Secretaría
      '/app/dashboard/secretaria': 'Panel de Secretaria',
      '/dashboard/secretaria': 'Panel de Secretaria',

      // Coordinación
      '/app/dashboard/coordinador': 'Panel de Coordinación',
      '/dashboard/coordinador': 'Panel de Coordinación',

      // Estudiantes
      '/app/estudiantes': 'Gestion de Estudiantes',
      '/estudiantes': 'Gestion de Estudiantes',
      '/app/estudiantes/gestion': 'Gestion de Estudiantes',
      '/estudiantes/gestion': 'Gestion de Estudiantes',
      '/app/estudiantes/nuevo': 'Nuevo Estudiante',
      '/estudiantes/nuevo': 'Nuevo Estudiante',
      '/app/estudiantes/codigos': 'Codigos QR',
      '/estudiantes/codigos': 'Codigos QR',
      '/app/estudiantes/pendientes': 'Estudiantes Pendientes',
      '/estudiantes/pendientes': 'Estudiantes Pendientes',
      '/app/estudiantes/validados': 'Estudiantes Validados',
      '/estudiantes/validados': 'Estudiantes Validados',
      '/app/estudiantes/rechazados': 'Estudiantes Rechazados',
      '/estudiantes/rechazados': 'Estudiantes Rechazados',

      // Usuarios
      '/app/usuarios': 'Gestion de Usuarios',
      '/usuarios': 'Gestion de Usuarios',

      // QR
      '/app/qr-codes': 'Codigos QR',
      '/qr-codes': 'Codigos QR',
      '/app/qr': 'Gestion de QR',
      '/qr': 'Gestion de QR',
      '/app/qr/pruebas': 'Panel de Pruebas QR',
      '/qr/pruebas': 'Panel de Pruebas QR',

      // Asistencia
      '/app/asistencia/scanner': 'Escanear Codigo QR',
      '/asistencia/scanner': 'Escanear Codigo QR',
      '/app/asistencia/historial': 'Historial de Asistencia',
      '/asistencia/historial': 'Historial de Asistencia',

      // Justificaciones
      '/app/justificaciones': 'Gestion de Justificaciones',
      '/justificaciones': 'Gestion de Justificaciones',
      '/app/justificaciones/pendientes': 'Justificaciones Pendientes',
      '/justificaciones/pendientes': 'Justificaciones Pendientes',
      '/app/justificaciones/aprobadas': 'Justificaciones Aprobadas',
      '/justificaciones/aprobadas': 'Justificaciones Aprobadas',
      '/app/justificaciones/rechazadas': 'Justificaciones Rechazadas',
      '/justificaciones/rechazadas': 'Justificaciones Rechazadas',
      '/app/justificaciones/nueva': 'Nueva Justificacion',
      '/justificaciones/nueva': 'Nueva Justificacion',

      // Alfabetizadores
      '/app/alfabetizadores': 'Gestion de Alfabetizadores',
      '/alfabetizadores': 'Gestion de Alfabetizadores',
      '/app/alfabetizadores/horas': 'Control de Horas',
      '/alfabetizadores/horas': 'Control de Horas',
      '/app/alfabetizadores/sesiones': 'Sesiones de Trabajo',
      '/alfabetizadores/sesiones': 'Sesiones de Trabajo',

      // Reportes
      '/app/reportes/historial-completo': 'Historial Completo',
      '/reportes/historial-completo': 'Historial Completo',
      '/app/reportes/analisis': 'Reportes y Analisis',
      '/reportes/analisis': 'Reportes y Analisis',

      // Configuración
      '/app/configuracion': 'Configuracion del Sistema',
      '/configuracion': 'Configuracion del Sistema',
      '/app/configuracion/sistema': 'Configuracion del Sistema',
      '/configuracion/sistema': 'Configuracion del Sistema',

      // Respaldo
      '/app/respaldos': 'Respaldo de Datos',
      '/respaldos': 'Respaldo de Datos',

      // Panel de Estudiante
      '/app/dashboard/estudiante': 'Mi Panel de Estudiante',
      '/app/mi-perfil': 'Mi Perfil',
      '/app/mis-asistencias': 'Mis Asistencias',
      '/app/generar-qr': 'Mi Codigo QR',
      '/app/mis-justificaciones': 'Mis Justificaciones',
      '/app/mis-justificaciones/crear': 'Crear Justificacion',
      '/app/mis-justificaciones/pendientes': 'Mis Justificaciones Pendientes',
      '/app/mis-justificaciones/historial': 'Historial de Justificaciones'
    };

    if (routes[pathname]) {
      return routes[pathname];
    }

    for (const [route, name] of Object.entries(routes)) {
      if (pathname.startsWith(route) && route !== '/') {
        return name;
      }
    }

    return 'Sistema Escolar IESADEP';
  };

  return (
    <Box sx={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', marginLeft: { xs: 0, lg: '140px' }, width: { md: 'calc(100% - 48px)', lg: 'calc(95% - 280px)', xl: 'calc(1600px - 280px)' }, maxWidth: 'calc(1600px - 280px)', backgroundColor: 'rgba(30, 30, 40, 0.95)', backdropFilter: 'blur(20px)', borderRadius: 5, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', zIndex: 1100, transition: 'all 0.3s ease', display: { xs: 'none', lg: 'flex' }, alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', '&:hover': { boxShadow: '0 12px 40px rgba(74, 144, 226, 0.25)', transform: 'translateX(-50%) translateY(-2px)' } }}>
      {/* 🔔 Botón de Historial de Notificaciones (Reemplaza Lupa y Chat) */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title={historyOpen ? "Cerrar Historial" : "Ver Notificaciones"} placement="bottom">
          <IconButton
            data-notification-button
            onClick={toggleHistory}
            sx={{
              color: historyOpen ? '#4a90e2' : 'rgba(255, 255, 255, 0.8)',
              backgroundColor: historyOpen ? 'rgba(74, 144, 226, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(74, 144, 226, 0.2)',
                transform: 'scale(1.05)'
              }
            }}
          >
            <Badge
              badgeContent={history.length}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  animation: history.length > 0 ? 'badgePulse 2s ease-in-out infinite' : 'none',
                  '@keyframes badgePulse': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.2)' }
                  }
                }
              }}
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.3px', paddingRight: 1.5, borderRight: '2px solid rgba(74, 144, 226, 0.3)' }}>{getRoleName(user?.rol)}</Box>
        <Box sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.5px' }}>{getPageName(location.pathname)}</Box>
      </Box>
      <Tooltip title="Cerrar Sesion" placement="bottom"><IconButton onClick={handleLogout} sx={{ color: '#ff4757', backgroundColor: 'rgba(255, 71, 87, 0.1)', borderRadius: 2, padding: '10px', transition: 'all 0.3s ease', '&:hover': { backgroundColor: 'rgba(255, 71, 87, 0.2)', transform: 'scale(1.05)' } }}><LogoutIcon /></IconButton></Tooltip>
    </Box>
  );
}
