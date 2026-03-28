import { Box, Typography, IconButton } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  QrCodeScanner as QrCodeScannerIcon,
  ErrorOutline as ErrorOutlineIcon
} from '@mui/icons-material';
import { useNotification } from 'contexts/NotificationContext';
import { useAuth } from 'hooks/useAuth';

const NotificationBar = () => {
  const { notifications, removeNotification } = useNotification();
  const MAX_VISIBLE = 5;

  const handleCloseNotification = (id) => {
    removeNotification(id);
  };

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'success':
        return { 
          icon: <CheckCircleIcon sx={{ fontSize: 40 }} />, 
          color: '#10b981', 
          bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.05) 100%)',
          iconBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          glow: 'rgba(16, 185, 129, 0.4)', 
          animation: 'bounce' 
        };
      case 'error':
        return { 
          icon: <ErrorIcon sx={{ fontSize: 40 }} />, 
          color: '#ef4444', 
          bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.05) 100%)',
          iconBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          glow: 'rgba(239, 68, 68, 0.4)', 
          animation: 'bounce' 
        };
      case 'warning':
        return { 
          icon: <WarningIcon sx={{ fontSize: 40 }} />, 
          color: '#f59e0b', 
          bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.05) 100%)',
          iconBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          glow: 'rgba(245, 158, 11, 0.4)', 
          animation: 'bounce' 
        };
      case 'info':
        return { 
          icon: <InfoIcon sx={{ fontSize: 40 }} />, 
          color: '#3b82f6', 
          bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.05) 100%)',
          iconBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          glow: 'rgba(59, 130, 246, 0.4)', 
          animation: 'bounce' 
        };
      case 'qr-success':
        return { 
          icon: <QrCodeScannerIcon sx={{ fontSize: 40 }} />, 
          color: '#00ff88', 
          bgGradient: 'linear-gradient(135deg, rgba(0, 255, 136, 0.25) 0%, rgba(0, 200, 100, 0.08) 100%)',
          iconBg: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
          glow: 'rgba(0, 255, 136, 0.6)', 
          animation: 'pulse' 
        };
      case 'qr-duplicate':
        return { 
          icon: <WarningIcon sx={{ fontSize: 40 }} />, 
          color: '#ff9100', 
          bgGradient: 'linear-gradient(135deg, rgba(255, 145, 0, 0.25) 0%, rgba(230, 120, 0, 0.08) 100%)',
          iconBg: 'linear-gradient(135deg, #ff9100 0%, #e67800 100%)',
          glow: 'rgba(255, 145, 0, 0.6)', 
          animation: 'shake' 
        };
      case 'qr-error':
        return { 
          icon: <ErrorOutlineIcon sx={{ fontSize: 40 }} />, 
          color: '#ff1744', 
          bgGradient: 'linear-gradient(135deg, rgba(255, 23, 68, 0.25) 0%, rgba(220, 20, 60, 0.08) 100%)',
          iconBg: 'linear-gradient(135deg, #ff1744 0%, #dc143c 100%)',
          glow: 'rgba(255, 23, 68, 0.6)', 
          animation: 'vibrate' 
        };
      case 'attendance-registered':
        return { 
          icon: <CheckCircleIcon sx={{ fontSize: 40 }} />, 
          color: '#00b0ff', 
          bgGradient: 'linear-gradient(135deg, rgba(0, 176, 255, 0.25) 0%, rgba(0, 140, 210, 0.08) 100%)',
          iconBg: 'linear-gradient(135deg, #00b0ff 0%, #008cd2 100%)',
          glow: 'rgba(0, 176, 255, 0.6)', 
          animation: 'confetti' 
        };
      default:
        return { 
          icon: <InfoIcon sx={{ fontSize: 40 }} />, 
          color: '#3b82f6', 
          bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.05) 100%)',
          iconBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          glow: 'rgba(59, 130, 246, 0.4)', 
          animation: 'bounce' 
        };
    }
  };

  if (notifications.length === 0) return null;

  const visibleNotifications = notifications.slice(0, MAX_VISIBLE);
  const hiddenCount = Math.max(0, notifications.length - MAX_VISIBLE);

  return (
    <>
      {/* 📚 STACK DE NOTIFICACIONES - Desktop */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          position: 'fixed',
          top: '90px', // Separación de la isla dinámica
          left: '50%',
          transform: 'translateX(-50%)',
          marginLeft: { lg: '140px' },
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          zIndex: 1099,
          gap: 1.5,
          padding: 0, // Sin padding para eliminar márgenes
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '10px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.5)',
            },
          },
        }}
      >
        {/* Renderizar cada notificación del stack */}
        {visibleNotifications.map((notification) => {
          const { icon, color, bgGradient, iconBg, glow, animation } = getNotificationStyle(notification.type);
          
          return (
            <Box
              key={notification.id}
              onClick={() => handleCloseNotification(notification.id)}
              sx={{
                cursor: 'pointer',
                animation: 'slideInFromTop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '@keyframes slideInFromTop': {
                  from: {
                    transform: 'translateY(-20px)',
                    opacity: 0,
                  },
                  to: {
                    transform: 'translateY(0)',
                    opacity: 1,
                  },
                },
              }}
            >
              <Box
                className={`${animation === 'shake' ? 'notification-box-shake' : ''} ${animation === 'vibrate' ? 'notification-box-vibrate' : ''}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                  padding: '18px 24px',
                  background: bgGradient,
                  backgroundColor: 'rgba(17, 24, 39, 0.98)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  borderRadius: '12px',
                  boxShadow: 'none', // Sin sombras externas
                  border: `1.5px solid ${color}50`,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    boxShadow: 'none', // Sin sombras en hover
                    transform: 'translateY(-1px)',
                    border: `1.5px solid ${color}70`,
                    backgroundColor: 'rgba(17, 24, 39, 1)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, ${color} 0%, ${color}90 100%)`,
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: '-30%',
                    right: '-30%',
                    width: '150%',
                    height: '150%',
                    background: `radial-gradient(circle, ${color}12 0%, transparent 60%)`,
                    pointerEvents: 'none',
                  }
                }}
              >
                {/* Icono flotante con gradiente */}
                <Box
                  className={`${animation === 'pulse' ? 'notification-icon-pulse' : ''} ${animation === 'confetti' ? 'notification-icon-confetti' : ''}`}
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '10px',
                    background: iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: '#ffffff',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: 'none', // Sin sombras
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: '-1px',
                      borderRadius: '11px',
                      padding: '1px',
                      background: `linear-gradient(135deg, ${color}60, ${color}30, transparent)`,
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                    },
                    '&:hover': {
                      transform: 'scale(1.03)',
                      boxShadow: 'none', // Sin sombras en hover
                    }
                  }}
                >
                  <Box sx={{ fontSize: '2.2rem', display: 'flex', alignItems: 'center', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
                    {icon}
                  </Box>
                </Box>

                {/* Mensaje con mejor tipografía */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {notification.title && (
                    <Typography
                      sx={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        letterSpacing: '0.2px',
                        mb: 0.5,
                        textShadow: `0 1px 8px ${color}50, 0 1px 2px rgba(0,0,0,0.4)`,
                        lineHeight: 1.3,
                      }}
                    >
                      {notification.title}
                    </Typography>
                  )}
                  <Typography
                    sx={{
                      fontSize: '0.95rem',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontWeight: 500,
                      letterSpacing: '0.2px',
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                    }}
                  >
                    {notification.message}
                  </Typography>
                </Box>

                {/* Botón cerrar mejorado */}
                <IconButton
                  size="medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseNotification(notification.id);
                  }}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '8px',
                    '&:hover': {
                      bgcolor: 'rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      transform: 'rotate(90deg) scale(1.05)',
                      boxShadow: 'none', // Sin sombras
                    },
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: 'none', // Sin sombras
                  }}
                >
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
          );
        })}

        {/* 📋 Indicador "+ N más" si hay notificaciones ocultas */}
        {hiddenCount > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 28px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)',
              backgroundColor: 'rgba(17, 24, 39, 0.9)',
              backdropFilter: 'blur(30px)',
              borderRadius: '12px',
              border: '1.5px solid rgba(59, 130, 246, 0.4)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: 'none', // Sin sombras
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(37, 99, 235, 0.25) 100%)',
                transform: 'scale(1.02)',
                boxShadow: 'none', // Sin sombras en hover
                border: '1.5px solid rgba(59, 130, 246, 0.6)',
              },
            }}
          >
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.95rem', fontWeight: 600 }}>
              <Box component="span" sx={{ fontSize: '1.1rem' }}>📋</Box>
              + {hiddenCount} notificación{hiddenCount > 1 ? 'es' : ''} más
            </Typography>
          </Box>
        )}
      </Box>

      {/* ✨ Animaciones CSS */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { 
              transform: scale(1); 
              box-shadow: 0 8px 24px var(--glow), 0 0 40px var(--color);
            }
            50% { 
              transform: scale(1.08); 
              box-shadow: 0 12px 32px var(--glow), 0 0 60px var(--color);
            }
          }

          @keyframes shake {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            10% { transform: translateX(-10px) rotate(-2deg); }
            20% { transform: translateX(10px) rotate(2deg); }
            30% { transform: translateX(-10px) rotate(-2deg); }
            40% { transform: translateX(10px) rotate(2deg); }
            50% { transform: translateX(-8px) rotate(-1deg); }
            60% { transform: translateX(8px) rotate(1deg); }
            70% { transform: translateX(-6px) rotate(-1deg); }
            80% { transform: translateX(6px) rotate(1deg); }
            90% { transform: translateX(-3px) rotate(0deg); }
          }

          @keyframes vibrate {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            10% { transform: translate(-4px, -4px) rotate(-1deg); }
            20% { transform: translate(4px, 4px) rotate(1deg); }
            30% { transform: translate(-4px, 4px) rotate(-1deg); }
            40% { transform: translate(4px, -4px) rotate(1deg); }
            50% { transform: translate(-3px, 3px) rotate(-1deg); }
            60% { transform: translate(3px, -3px) rotate(1deg); }
            70% { transform: translate(-2px, -2px) rotate(0deg); }
            80% { transform: translate(2px, 2px) rotate(0deg); }
            90% { transform: translate(-1px, 1px) rotate(0deg); }
          }

          @keyframes confetti {
            0% { 
              transform: scale(0.3) rotate(0deg); 
              opacity: 0;
              filter: hue-rotate(0deg);
            }
            25% {
              transform: scale(0.8) rotate(90deg);
              opacity: 1;
              filter: hue-rotate(45deg);
            }
            50% { 
              transform: scale(1.2) rotate(180deg); 
              opacity: 1;
              filter: hue-rotate(90deg);
            }
            75% {
              transform: scale(0.95) rotate(270deg);
              opacity: 1;
              filter: hue-rotate(135deg);
            }
            100% { 
              transform: scale(1) rotate(360deg); 
              opacity: 1;
              filter: hue-rotate(0deg);
            }
          }

          @keyframes bounce {
            0%, 100% { 
              transform: translateY(0) scale(1); 
            }
            25% {
              transform: translateY(-8px) scale(1.02);
            }
            50% { 
              transform: translateY(0) scale(1); 
            }
            75% {
              transform: translateY(-4px) scale(1.01);
            }
          }

          .notification-icon-pulse {
            animation: pulse 2s ease-in-out infinite;
          }

          .notification-box-shake {
            animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97);
          }

          .notification-box-vibrate {
            animation: vibrate 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
          }

          .notification-icon-confetti {
            animation: confetti 1s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        `}
      </style>
    </>
  );
};

export default NotificationBar;
