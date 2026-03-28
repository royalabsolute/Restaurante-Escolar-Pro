import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box, Typography, Grid, Paper, IconButton,
  Tab, Tabs, Fade, Stack, Button
} from '@mui/material';
import {
  QrCodeScanner as QrIcon,
  CameraAlt as CameraIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// Components
import QRScannerEngine from './components/QRScannerEngine';
import ScannerFeedback from './components/ScannerFeedback';
import ScannerStats from './components/ScannerStats';
import ManualStudentSearch from './components/ManualStudentSearch';
import ValidationDialog from './components/ValidationDialog';

// Hooks & Services
import { useNotification } from 'contexts/NotificationContext';
import ApiService from 'services/ApiService';
import useRoleBasedApi from 'hooks/useRoleBasedApi';

const AsistenciaScanner = () => {
  const { showQRSuccess, showQRDuplicate, showQRError, showAttendanceRegistered, showError } = useNotification();

  // Mode & UI States
  const [activeTab, setActiveTab] = useState(0); // 0: Laser, 1: Camera
  const [modalOpen, setModalOpen] = useState(false);

  // Data States
  const [students, setStudents] = useState([]);
  const [asistenciasHoy, setAsistenciasHoy] = useState([]);
  const [student, setStudent] = useState(null);
  const { endpoints } = useRoleBasedApi();

  // Feedback & Processing States
  const [feedback, setFeedback] = useState({ active: false, status: '', message: '' });
  const [processing, setProcessing] = useState(false);

  // Refs
  const scanBufferRef = useRef('');
  const scanTimeoutRef = useRef(null);

  // Stats
  const stats = useMemo(() => {
    const studentsCount = asistenciasHoy.filter(a => !a.suplente_id && a.metodo_registro !== 'suplente').length;
    const suplentesCount = asistenciasHoy.filter(a => a.suplente_id || a.metodo_registro === 'suplente' || a.metodo_registro === 'escaner' && a.id_suplente).length;
    return { studentsCount, suplentesCount };
  }, [asistenciasHoy]);

  // --- Data Loading ---
  const loadInitialData = useCallback(async () => {
    try {
      // Determinar los endpoints correctos según el rol
      const studentsUrl = endpoints?.qr?.students || endpoints?.students?.validated || '/students';
      // Para la asistencia de hoy, usamos el endpoint específico mejorado si está disponible
      // o el endpoint de ApiService que ya está centralizado

      const [estRes, attRes] = await Promise.all([
        ApiService.get(studentsUrl),
        ApiService.getTodayAttendance()
      ]);

      // Manejar diferentes formatos de respuesta del backend para estudiantes
      let studentsData = [];
      if (estRes.status === 'SUCCESS') {
        // Puede venir como array directo en data o dentro de un objeto como 'estudiantes'
        const rawData = estRes.data || [];
        if (Array.isArray(rawData)) {
          studentsData = rawData;
        } else if (rawData.estudiantes && Array.isArray(rawData.estudiantes)) {
          studentsData = rawData.estudiantes;
        } else if (rawData.students && Array.isArray(rawData.students)) {
          studentsData = rawData.students;
        }
      } else if (Array.isArray(estRes)) {
        studentsData = estRes;
      } else if (estRes.data && Array.isArray(estRes.data)) {
        studentsData = estRes.data;
      }

      setStudents(studentsData);
      if (attRes.status === 'SUCCESS') setAsistenciasHoy(attRes.data || []);
      else if (Array.isArray(attRes)) setAsistenciasHoy(attRes);
    } catch (err) {
      console.error('Error loading data:', err);
      // No mostrar error visual aquí para evitar spam si es un 404/403 silencioso
    }
  }, [endpoints]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // --- Scanning Logic ---
  const triggerFeedback = (status, message) => {
    setFeedback({ active: true, status, message });
    setTimeout(() => setFeedback(prev => ({ ...prev, active: false })), 2000);
  };

  const processCode = useCallback(async (code) => {
    if (!code || processing || modalOpen) return;

    setProcessing(true);
    const cleanCode = code.trim().toUpperCase();

    try {
      if (cleanCode.startsWith('QR_SUPLENTE_')) {
        const res = await ApiService.post('/suplente-qr/escanear', { codigo_qr: cleanCode });
        if (res.data?.status === 'SUCCESS') {
          triggerFeedback('success', `Suplente #${res.data.data.numero_suplente} Registrado`);
          showQRSuccess(`Suplente #${res.data.data.numero_suplente}`, 'Suplente Registrado');
          loadInitialData();
        }
        return;
      }

      const res = await ApiService.findStudentByCode(cleanCode);

      if (res.status === 'SUCCESS') {
        setStudent(res.data);
        setModalOpen(true);
        triggerFeedback('success', `${res.data.nombre} identificado`);
        showQRSuccess(`${res.data.nombre} ${res.data.apellidos}`, 'Estudiante Identificado');
      } else if (res.status === 'ALREADY_REGISTERED') {
        setStudent(res.data);
        setModalOpen(true);
        triggerFeedback('already_registered', 'Ya registró asistencia hoy');
        showQRDuplicate(`${res.data.nombre} ya está registrado`, 'Registro Duplicado');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Código no reconocido';
      triggerFeedback('error', msg);
      showQRError(msg, 'Error de Escaneo');
    } finally {
      setProcessing(false);
      scanBufferRef.current = '';
    }
  }, [processing, modalOpen, showQRSuccess, showQRDuplicate, showQRError, loadInitialData]);

  // --- HID Listener ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        if (scanBufferRef.current.length > 5) processCode(scanBufferRef.current);
        scanBufferRef.current = '';
      } else if (e.key.length === 1) {
        scanBufferRef.current += e.key;
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = setTimeout(() => {
          if (scanBufferRef.current.length > 10) processCode(scanBufferRef.current);
          scanBufferRef.current = '';
        }, 300);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [processCode]);

  // --- Manual Actions ---
  const handleSelectStudent = (targetStudent) => {
    const isRegistered = asistenciasHoy.some(a => a.estudiante_id === targetStudent.id);
    setStudent(targetStudent);
    setFeedback(prev => ({ ...prev, status: isRegistered ? 'already_registered' : 'success' }));
    setModalOpen(true);
  };

  const handleConfirmAttendance = async () => {
    if (!student) return;
    try {
      setProcessing(true);
      await ApiService.registrarAsistenciaEstudiante({
        estudiante_id: student.id,
        metodo_registro: activeTab === 1 ? 'escaner' : 'manual'
      });
      showAttendanceRegistered(`¡Buen provecho, ${student.nombre}!`);
      loadInitialData();
      setModalOpen(false);
      setStudent(null);
    } catch (err) {
      showError(err.response?.data?.message || 'Error al registrar');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <ScannerFeedback
        active={feedback.active}
        status={feedback.status}
        message={feedback.message}
      />

      <ValidationDialog
        open={modalOpen}
        onClose={() => { setModalOpen(false); setStudent(null); }}
        student={student}
        status={feedback.status}
        onConfirm={handleConfirmAttendance}
        processing={processing}
      />

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ color: '#1a237e', letterSpacing: -1 }}>
            SISTEMA DE ASISTENCIA
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Restaurante Escolar San Antonio
          </Typography>
        </Box>
        <Paper elevation={0} sx={{ px: 3, py: 1, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
          <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Typography>
        </Paper>
      </Box>

      <ScannerStats
        studentsCount={stats.studentsCount}
        suplentesCount={stats.suplentesCount}
      />

      <Grid container spacing={3}>
        {/* LADO IZQUIERDO: CONTROLES DE ESCANEO */}
        <Grid item xs={12} lg={4} sx={{ alignSelf: 'flex-start' }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<QrIcon />} label="LECTOR LÁSER" sx={{ py: 2.5, fontWeight: 'bold' }} />
              <Tab icon={<CameraIcon />} label="CÁMARA WEB" sx={{ py: 2.5, fontWeight: 'bold' }} />
            </Tabs>

            <Box sx={{ flexGrow: 1, p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Fade in={activeTab === 0} unmountOnExit>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 140, height: 140, borderRadius: '50%',
                      bgcolor: 'primary.50', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto', mb: 4,
                      animation: 'pulse 2s infinite',
                      border: '2px solid',
                      borderColor: 'primary.100'
                    }}
                  >
                    <QrIcon sx={{ fontSize: 70, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h5" fontWeight="800" sx={{ color: '#1a237e', mb: 1 }}>Lector Láser Activo</Typography>
                  <Typography variant="body1" color="text.secondary">Presente el código QR frente al escáner</Typography>
                </Box>
              </Fade>

              <Fade in={activeTab === 1} unmountOnExit>
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QRScannerEngine onScan={processCode} />
                </Box>
              </Fade>
            </Box>

            <Box sx={{ p: 3, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center', fontWeight: 600 }}>
                FUENTE DE ENTRADA: {activeTab === 0 ? 'HID KEYBOARD EMULATOR' : 'WEBCAM INTERFACE'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* LADO DERECHO: BÚSQUEDA Y LISTADO DE ESTUDIANTES */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'white',
              height: '100%',
              minHeight: 500,
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}
          >
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.25' }}>
              <Typography variant="h6" fontWeight="800" color="#1a237e">
                Búsqueda y Registro Manual
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Seleccione un estudiante de la lista para proceder con el registro visual.
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, p: 2 }}>
              <ManualStudentSearch
                students={students}
                asistenciasHoy={asistenciasHoy}
                onRegister={handleSelectStudent}
                processing={processing}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 25px rgba(25, 118, 210, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(25, 118, 210, 0); }
          }
        `}
      </style>
    </Box>
  );
};

export default AsistenciaScanner;
