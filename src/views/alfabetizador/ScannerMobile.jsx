import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, Typography, Fab, Stack, Paper, 
  IconButton, Zoom, Fade, Badge
} from '@mui/material';
import { 
  CameraAlt as CameraIcon, 
  PersonAdd as SuplenteIcon,
  Logout as LogoutIcon,
  Timeline as StatsIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Components & Services
import QRScannerEngine from '../asistencia/components/QRScannerEngine';
import ApiService from 'services/ApiService';
import SocketService from 'services/SocketService';
import { useNotification } from 'contexts/NotificationContext';

const ScannerMobile = () => {
  const navigate = useNavigate();
  const { showQRSuccess, showQRError } = useNotification();
  
  // States
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [suplentesHoy, setSuplentesHoy] = useState(0);
  const [lastScan, setLastScan] = useState(null); // { status: 'success'|'error', message: '' }
  const [processing, setProcessing] = useState(false);

  // Sound Refs (Optional, if we have sounds)
  const audioSuccess = useRef(new Audio('/assets/sounds/success.mp3'));
  const audioError = useRef(new Audio('/assets/sounds/error.mp3'));

  useEffect(() => {
    // Cargar conteo inicial
    const loadStats = async () => {
      try {
        const res = await ApiService.get('/reportes/asistencia-hoy');
        if (res.status === 'SUCCESS') {
          const suplentes = res.data.filter(a => a.es_suplente || a.metodo_registro === 'suplente').length;
          setSuplentesHoy(suplentes);
        }
      } catch (err) {
        console.error('Error loading stats:', err);
      }
    };

    loadStats();
    
    // Conectar sockets para actualizaciones mutuas
    SocketService.connect();
    
    return () => {
      // No desconectar globalmente si el usuario sigue en la app, 
      // pero podríamos limpiar listeners específicos si hubiera.
    };
  }, []);

  const handleScan = useCallback(async (code) => {
    if (!code || processing) return;
    
    setProcessing(true);
    try {
      // Usar la nueva ruta especializada para alfabetizadores
      const res = await ApiService.post('/alfabetizador/scan', { codigo_qr: code });
      
      if (res.status === 'SUCCESS') {
        const data = res.data;
        if (data.es_suplente) {
          setSuplentesHoy(data.numero_suplente);
          setLastScan({ status: 'success', message: `Suplente #${data.numero_suplente} Registrado` });
        } else {
          setLastScan({ status: 'success', message: `${data.estudiante.nombre} Registrado` });
        }
        // audioSuccess.current.play().catch(() => {});
      }
    } catch (err) {
      setLastScan({ status: 'error', message: err.response?.data?.message || 'Error de lectura' });
      // audioError.current.play().catch(() => {});
    } finally {
      setProcessing(false);
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setLastScan(null), 3000);
    }
  }, [processing]);

  const handleManualSuplente = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const res = await ApiService.post('/alfabetizador/suplente-registro', {});
      if (res.status === 'SUCCESS') {
        setSuplentesHoy(res.data.numero_suplente);
        setLastScan({ status: 'success', message: `Suplente #${res.data.numero_suplente} (Manual)` });
        showQRSuccess(`Suplente #${res.data.numero_suplente}`, 'Registro Manual');
      }
    } catch (err) {
      showQRError(err.response?.data?.message || 'Error en registro manual');
    } finally {
      setProcessing(false);
      setTimeout(() => setLastScan(null), 3000);
    }
  };

  const handleLogout = () => {
    // Lógica de logout delegada al servicio de Auth si existiera, o simple redirect
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Box sx={{ 
      height: '100dvh', // Dynamic viewport height para móviles
      width: '100vw', 
      bgcolor: '#000', 
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Header Minimalista */}
      <Box sx={{ 
        p: 2, 
        zIndex: 10, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)'
      }}>
        <Box>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1 }}>
            SADEP
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
            Alfabetizador Universal
          </Typography>
        </Box>
        <IconButton onClick={handleLogout} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }}>
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Visor de Cámara */}
      <Box sx={{ flexGrow: 1, position: 'relative', bgcolor: '#111' }}>
        <AnimatePresence>
          {isCameraActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', height: '100%' }}
            >
              <QRScannerEngine onScan={handleScan} active={isCameraActive} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay de Feedback de Escaneo */}
        <AnimatePresence>
          {lastScan && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              style={{
                position: 'absolute',
                top: '20%',
                left: '10%',
                right: '10%',
                zIndex: 100
              }}
            >
              <Paper sx={{ 
                p: 2, 
                borderRadius: 4, 
                textAlign: 'center',
                bgcolor: lastScan.status === 'success' ? 'rgba(76, 175, 80, 0.95)' : 'rgba(244, 67, 54, 0.95)',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  {lastScan.status === 'success' ? <SuccessIcon /> : <ErrorIcon />}
                  <Typography variant="subtitle1" fontWeight="bold">
                    {lastScan.message}
                  </Typography>
                </Box>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Barra Inferior de Acción */}
      <Box sx={{ 
        p: 3, 
        pb: 5,
        zIndex: 10,
        background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3
      }}>
        
        {/* Contador de Suplentes (WOW) */}
        <motion.div whileTap={{ scale: 0.95 }}>
          <Paper sx={{ 
            px: 3, py: 1.5, 
            borderRadius: 5, 
            bgcolor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <StatsIcon sx={{ color: '#2196f3' }} />
            <Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, display: 'block', mb: -0.5 }}>
                SUPLENTES HOY
              </Typography>
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 900 }}>
                {suplentesHoy}
              </Typography>
            </Box>
          </Paper>
        </motion.div>

        {/* Botón Gigante de Suplente Manual */}
        <Stack direction="row" spacing={4} alignItems="center">
           <Zoom in={true} style={{ transitionDelay: '300ms' }}>
            <Fab 
              color="primary" 
              onClick={handleManualSuplente}
              disabled={processing}
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: '#2196f3',
                boxShadow: '0 0 20px rgba(33, 150, 243, 0.5)',
                '&:hover': { bgcolor: '#1976d2' }
              }}
            >
              <Badge badgeContent="+" color="error" sx={{ '& .MuiBadge-badge': { fontSize: 20, height: 24, minWidth: 24, borderRadius: '50%' } }}>
                <SuplenteIcon sx={{ fontSize: 35 }} />
              </Badge>
            </Fab>
          </Zoom>
        </Stack>

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
          Presiona para registrar suplente sin código QR
        </Typography>
      </Box>

      {/* Animación de Escaneo Estilo Laser */}
      <Box sx={{
        position: 'absolute',
        top: '40%',
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(to right, transparent, #2196f3, transparent)',
        boxShadow: '0 0 15px #2196f3',
        zIndex: 5,
        animation: 'scan-laser 3s infinite ease-in-out'
      }} />

      <style>
        {`
          @keyframes scan-laser {
            0% { top: 30%; opacity: 0; }
            50% { opacity: 1; }
            100% { top: 70%; opacity: 0; }
          }
        `}
      </style>
    </Box>
  );
};

export default ScannerMobile;
