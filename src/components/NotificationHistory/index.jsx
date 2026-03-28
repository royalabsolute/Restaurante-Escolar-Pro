import { Box, Typography, IconButton, Button } from '@mui/material';
import { useEffect } from 'react';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  QrCodeScanner as QrCodeScannerIcon,
  ErrorOutline as ErrorOutlineIcon,
  Delete as DeleteIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useNotification } from 'contexts/NotificationContext';

const NotificationHistory = () => {
  const { history, historyOpen, toggleHistory, clearHistory } = useNotification();

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!historyOpen) return;

    const handleClickOutside = (event) => {
      const panel = document.getElementById('notification-history-panel');
      const button = document.querySelector('[data-notification-button]');
      
      if (panel && !panel.contains(event.target) && button && !button.contains(event.target)) {
        toggleHistory();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [historyOpen, toggleHistory]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon sx={{ fontSize: 20, color: '#00e676' }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 20, color: '#ff1744' }} />;
      case 'warning':
        return <WarningIcon sx={{ fontSize: 20, color: '#ff6d00' }} />;
      case 'info':
        return <InfoIcon sx={{ fontSize: 20, color: '#00b0ff' }} />;
      case 'qr-success':
        return <QrCodeScannerIcon sx={{ fontSize: 20, color: '#00ff88' }} />;
      case 'qr-duplicate':
        return <WarningIcon sx={{ fontSize: 20, color: '#ff9100' }} />;
      case 'qr-error':
        return <ErrorOutlineIcon sx={{ fontSize: 20, color: '#ff1744' }} />;
      case 'attendance-registered':
        return <CheckCircleIcon sx={{ fontSize: 20, color: '#00b0ff' }} />;
      default:
        return <InfoIcon sx={{ fontSize: 20, color: '#00b0ff' }} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return '#00e676';
      case 'error': return '#ff1744';
      case 'warning': return '#ff6d00';
      case 'info': return '#00b0ff';
      case 'qr-success': return '#00ff88';
      case 'qr-duplicate': return '#ff9100';
      case 'qr-error': return '#ff1744';
      case 'attendance-registered': return '#00b0ff';
      default: return '#00b0ff';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // segundos

    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return date.toLocaleDateString();
  };

  if (!historyOpen) return null;

  return (
    <Box
      id="notification-history-panel"
      sx={{
        position: 'fixed',
        top: '100px',
        left: '50%',
        marginLeft: { xs: 0, lg: '120px' },
        transform: 'translateX(-50%)',
        width: '420px',
        maxWidth: 'calc(100vw - 40px)',
        maxHeight: '65vh',
        backgroundColor: 'rgba(18, 18, 24, 0.98)',
        backdropFilter: 'blur(40px) saturate(180%)',
        borderRadius: '20px',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        zIndex: 1098,
        overflow: 'hidden',
        animation: 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        '@keyframes slideDown': {
          from: {
            opacity: 0,
            transform: 'translateX(-50%) translateY(-20px) scale(0.96)',
          },
          to: {
            opacity: 1,
            transform: 'translateX(-50%) translateY(0) scale(1)',
          },
        },
      }}
    >
      {/* Header Moderno */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <HistoryIcon 
            sx={{ 
              fontSize: 20, 
              color: '#6366f1',
            }} 
          />
          <Typography
            sx={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.92)',
              letterSpacing: '-0.01em',
            }}
          >
            Historial de Notificaciones
          </Typography>
          {history.length > 0 && (
            <Box
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                padding: '3px 8px',
                borderRadius: '8px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              {history.length}
            </Box>
          )}
        </Box>
        <IconButton
          onClick={toggleHistory}
          size="small"
          sx={{
            color: 'rgba(255, 255, 255, 0.6)',
            width: 32,
            height: 32,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.9)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Lista de notificaciones con scroll moderno */}
      <Box
        sx={{
          maxHeight: 'calc(65vh - 110px)',
          overflowY: 'auto',
          padding: '10px',
          '&::-webkit-scrollbar': {
            width: '5px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(99, 102, 241, 0.3)',
            borderRadius: '10px',
            '&:hover': {
              background: 'rgba(99, 102, 241, 0.5)',
            },
          },
        }}
      >
        {history.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 20px',
              color: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            <HistoryIcon sx={{ fontSize: 56, mb: 2, opacity: 0.2 }} />
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.5)' }}>
              Sin notificaciones
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', mt: 0.5, color: 'rgba(255, 255, 255, 0.3)' }}>
              El historial aparecerá aquí
            </Typography>
          </Box>
        ) : (
          history.map((notification) => {
            const color = getNotificationColor(notification.type);
            return (
              <Box
                key={notification.id}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.2,
                  padding: '10px 12px',
                  marginBottom: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: `1px solid rgba(255, 255, 255, 0.04)`,
                  borderLeft: `2.5px solid ${color}`,
                  transition: 'all 0.15s ease',
                  cursor: 'default',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderLeftWidth: '3px',
                    transform: 'translateX(2px)',
                  },
                }}
              >
                {/* Icono compacto */}
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '10px',
                    backgroundColor: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getNotificationIcon(notification.type)}
                </Box>

                {/* Contenido compacto */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {notification.title && (
                    <Typography
                      sx={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.88)',
                        mb: 0.2,
                        lineHeight: 1.3,
                      }}
                    >
                      {notification.title}
                    </Typography>
                  )}
                  <Typography
                    sx={{
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.65)',
                      lineHeight: 1.35,
                      mb: 0.4,
                    }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.68rem',
                      color: 'rgba(255, 255, 255, 0.35)',
                      fontWeight: 500,
                    }}
                  >
                    {formatTimestamp(notification.timestamp)}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* Footer compacto con botón Limpiar */}
      {history.length > 0 && (
        <Box
          sx={{
            padding: '10px 12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
          }}
        >
          <Button
            onClick={clearHistory}
            startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
            sx={{
              color: '#ef4444',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'none',
              padding: '6px 14px',
              borderRadius: '10px',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Limpiar Historial
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default NotificationHistory;
