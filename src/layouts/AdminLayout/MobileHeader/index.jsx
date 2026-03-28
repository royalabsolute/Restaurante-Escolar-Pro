import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Collapse, List, ListItem, ListItemIcon, ListItemText, Divider, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import QrCodeIcon from '@mui/icons-material/QrCode';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import BackupIcon from '@mui/icons-material/Backup';
import ScienceIcon from '@mui/icons-material/Science';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

// project imports
import { AuthContext } from 'contexts/AuthContext';
import { useAuth } from 'hooks/useAuth';
import { useMenuByRole } from 'hooks/useMenuByRole';
import { useNotification } from 'contexts/NotificationContext';

// -----------------------|| MOBILE HEADER - DYNAMIC ISLAND STYLE ||-----------------------//

export default function MobileHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  
  const { user } = useContext(AuthContext);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { menuItems } = useMenuByRole();
  const { notification, clearNotification } = useNotification();

  // Escuchar cambios en las notificaciones
  useEffect(() => {
    if (notification) {
      setNotificationData(notification);
      // Pequeño delay para la animación
      setTimeout(() => setShowNotification(true), 50);
      
      // Auto-ocultar después de 5 segundos
      const timer = setTimeout(() => {
        setShowNotification(false);
        setTimeout(() => {
          clearNotification();
          setNotificationData(null);
        }, 400);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setShowNotification(false);
    }
  }, [notification, clearNotification]);

  const handleMenuToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
    setTimeout(() => {
      clearNotification();
      setNotificationData(null);
    }, 400);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Obtener icono y color según tipo de notificación
  const getNotificationStyle = () => {
    if (!notificationData) return { icon: null, color: '#00b0ff' };
    
    switch (notificationData.type) {
      case 'success':
        return {
          icon: <CheckCircleIcon sx={{ fontSize: 20 }} />,
          color: '#00e676' // Verde más vivo
        };
      case 'error':
        return {
          icon: <ErrorIcon sx={{ fontSize: 20 }} />,
          color: '#ff1744' // Rojo más vivo y brillante
        };
      case 'warning':
        return {
          icon: <WarningIcon sx={{ fontSize: 20 }} />,
          color: '#ff6d00' // Naranja más vivo
        };
      case 'info':
      default:
        return {
          icon: <InfoIcon sx={{ fontSize: 20 }} />,
          color: '#00b0ff' // Azul más vivo
        };
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  // Mapeo de iconos para cada ruta
  const iconMap = {
    '/app/dashboard': <DashboardIcon />,
    '/app/estudiantes/gestion': <SchoolIcon />,
    '/app/qr': <QrCodeIcon />,
    '/app/justificaciones': <AssignmentIcon />,
    '/app/asistencia/scanner': <BarChartIcon />,
    '/app/reportes/historial-completo': <AssessmentIcon />,
    '/app/configuracion': <SettingsIcon />,
    '/app/respaldos': <BackupIcon />,
    '/app/qr/test': <ScienceIcon />,
  };

  // Obtener rol del usuario
  const getRoleName = (rol) => {
    const roles = {
      'admin': 'Administrador',
      'secretaria': 'Secretaría',
      'alfabetizador': 'Alfabetizador',
      'docente': 'Docente',
      'estudiante': 'Estudiante'
    };
    return roles[rol] || 'Usuario';
  };

  // Función para renderizar items del menú recursivamente
  const renderMenuItems = (items) => {
    return items?.map((item, index) => {
      if (item.type === 'group' && item.children) {
        const isLastGroup = index === items.length - 1;
        return (
          <Box key={`group-${index}`}>
            <Typography
              sx={{
                px: 2,
                py: 1,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#4A90E2',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {item.title}
            </Typography>
            {renderMenuItems(item.children)}
            {!isLastGroup && (
              <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
            )}
          </Box>
        );
      }

      if (item.type === 'item' && item.url) {
        const icon = iconMap[item.url] || <DashboardIcon />;
        return (
          <ListItem
            button
            key={`item-${index}`}
            onClick={() => handleNavigation(item.url)}
            disableRipple
            disableTouchRipple
            sx={{
              py: 1.5,
              px: 2,
              borderRadius: 2,
              mx: 1,
              transition: 'all 0.2s ease',
              outline: 'none !important',
              border: 'none !important',
              '&:hover': {
                backgroundColor: 'rgba(74, 144, 226, 0.15)',
                transform: 'translateX(4px)',
              },
              '&:focus': {
                outline: 'none !important',
                border: 'none !important',
              },
              '&:focus-visible': {
                outline: 'none !important',
                border: 'none !important',
              },
              '&::after': {
                display: 'none !important',
              },
              '&::before': {
                display: 'none !important',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: '#4A90E2' }}>
              {icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.title}
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.9)'
              }}
            />
          </ListItem>
        );
      }

      return null;
    });
  };

  return (
    <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
      {/* Isla Dinámica Principal */}
      <Box
        sx={{
          position: 'fixed',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: {
            xs: 'calc(100% - 24px)',
            sm: 'calc(100% - 32px)',
          },
          maxWidth: '500px',
          backgroundColor: 'rgba(30, 30, 40, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: mobileOpen ? 5 : 5,
          boxShadow: mobileOpen 
            ? '0 12px 48px rgba(0, 0, 0, 0.4)' 
            : '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 1201,
          transition: 'all 0.3s ease',
        }}
      >
        {/* Header de la Isla */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
          }}
        >
          {/* Botón de Cerrar Sesión - Ahora a la izquierda */}
          <IconButton
            onClick={handleLogout}
            sx={{
              color: '#ff4757',
              backgroundColor: 'rgba(255, 71, 87, 0.1)',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 71, 87, 0.2)',
                transform: 'scale(1.05)',
              }
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>

          {/* Rol del Usuario - Centro */}
          <Typography
            sx={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.8)',
              flex: 1,
              textAlign: 'center',
              px: 2,
            }}
          >
            {user ? getRoleName(user.rol) : 'Panel'}
          </Typography>

          {/* Botón de Menú - Derecha */}
          <IconButton
            onClick={handleMenuToggle}
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              backgroundColor: mobileOpen ? 'rgba(74, 144, 226, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(74, 144, 226, 0.2)',
                transform: 'scale(1.05)',
              }
            }}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Box>

        {/* Notificación desplegable desde la isla */}
        {notificationData && (
          <Box
            sx={{
              maxHeight: showNotification ? '150px' : '0',
              opacity: showNotification ? 1 : 0,
              overflow: 'hidden',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transformOrigin: 'top center',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 2,
                pr: 1,
                backgroundColor: 'rgba(30, 30, 40, 0.98)',
                position: 'relative',
              }}
            >
              {/* Borde inferior de color según tipo */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  backgroundColor: getNotificationStyle().color,
                  boxShadow: `0 0 10px ${getNotificationStyle().color}`,
                }}
              />

              {/* Icono */}
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: `${getNotificationStyle().color}15`,
                  border: `2px solid ${getNotificationStyle().color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: getNotificationStyle().color,
                }}
              >
                {getNotificationStyle().icon}
              </Box>

              {/* Mensaje */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {notificationData.title && (
                  <Typography
                    variant="subtitle2"
                    fontWeight="600"
                    fontSize="0.875rem"
                    color="white"
                    sx={{ mb: 0.3 }}
                  >
                    {notificationData.title}
                  </Typography>
                )}
                <Typography
                  variant="body2"
                  fontSize="0.8rem"
                  color="rgba(255,255,255,0.8)"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {notificationData.message}
                </Typography>
              </Box>

              {/* Botón cerrar */}
              <IconButton
                size="small"
                onClick={handleCloseNotification}
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                  },
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>

              {/* Barra de progreso que se desvanece */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '3px',
                  bgcolor: getNotificationStyle().color,
                  boxShadow: `0 0 10px ${getNotificationStyle().color}`,
                  animation: showNotification ? 'shrinkAndFade 5s linear' : 'none',
                  '@keyframes shrinkAndFade': {
                    '0%': { 
                      width: '100%',
                      opacity: 0.9
                    },
                    '80%': { 
                      width: '20%',
                      opacity: 0.7
                    },
                    '100%': { 
                      width: '0%',
                      opacity: 0
                    },
                  },
                }}
              />
            </Box>
          </Box>
        )}

        {/* Menú Desplegable */}
        <Collapse in={mobileOpen} timeout="auto">
          <Box
            sx={{
              backgroundColor: 'rgba(30, 30, 40, 0.98)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              borderRadius: '0 0 20px 20px',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(74, 144, 226, 0.5)',
                borderRadius: '10px',
                '&:hover': {
                  background: 'rgba(74, 144, 226, 0.7)',
                },
              },
            }}
          >
            <List 
              sx={{ 
                py: 1.5, 
                pb: 1.5,
                '& .MuiListItem-root:last-child': {
                  mb: 0
                },
                '& .MuiListItem-root': {
                  outline: 'none !important',
                  border: 'none !important',
                  '&:focus': {
                    outline: 'none !important',
                    border: 'none !important',
                  },
                  '&:focus-visible': {
                    outline: 'none !important',
                    border: 'none !important',
                  },
                  '&::after': {
                    display: 'none !important',
                  },
                  '&::before': {
                    display: 'none !important',
                  }
                },
                '&::after': {
                  display: 'none !important',
                },
                '&::before': {
                  display: 'none !important',
                }
              }}
            >
              {renderMenuItems(menuItems?.items)}
            </List>
          </Box>
        </Collapse>
      </Box>

      {/* Overlay cuando el menú está abierto */}
      {mobileOpen && (
        <Box
          onClick={handleMenuToggle}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
            transition: 'all 0.3s ease',
          }}
        />
      )}
    </Box>
  );
}
