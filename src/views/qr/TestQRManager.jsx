import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControlLabel,
  Switch,
  Divider,
  LinearProgress,
  Paper,
  Avatar,
  Stack
} from '@mui/material';
import {
  Check as CheckIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import QRCode from 'react-qr-code';
import { useNotification } from 'contexts/NotificationContext';
import ApiService from 'services/ApiService';

const TestQRManager = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUsed, setShowUsed] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '', student: null });

  // Estados para cronómetro y prueba
  const [testStarted, setTestStarted] = useState(false);
  const [testStartTime, setTestStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(null);
  const [testProgress, setTestProgress] = useState({
    scannedCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    totalTime: 0,
    averageTimePerStudent: 0,
    estimatedCompletion: null
  });

  // Historial de pruebas
  const [testHistory, setTestHistory] = useState([]);

  // Estados para escaneo QR - ESCÁNER HID (no cámara)
  const [scannerActive, setScannerActive] = useState(false);
  const [confirmScanDialog, setConfirmScanDialog] = useState({
    open: false,
    student: null,
    scanTime: null
  });
  const [scanHistory, setScanHistory] = useState([]);
  const scannedCodeBuffer = useRef(''); // Buffer para acumular caracteres del escáner
  const scannerTimeoutRef = useRef(null); // Timeout para detectar fin de escaneo

  // Función simplificada para hacer llamadas API usando ApiService
  const apiCall = async (url, options = {}) => {
    try {
      // Remover '/api' del inicio si existe, ya que ApiService lo maneja en su baseURL
      const endpoint = url.startsWith('/api') ? url.substring(4) : url;
      const method = options.method || 'GET';
      const data = options.body ? JSON.parse(options.body) : null; // Si se enviara body como string

      // Usar ApiService para manejar la petición de forma robusta
      const response = await ApiService.request(method, endpoint, data);

      // ApiService devuelve la data directamente
      // Normalizar estructura si es necesario
      if (response && response.success === undefined) {
        // Si el backend devuelve array directo o data pura
        return { success: true, data: response };
      }

      return response;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadTestStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manejar atajos de teclado para el diálogo de confirmación
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (confirmScanDialog.open) {
        if (event.key === 'Enter') {
          event.preventDefault();
          handleAcceptScan();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          handleRejectScan();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmScanDialog.open]);

  // Limpiar escáner al desmontar el componente
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Función para procesar el código escaneado
  const processScannedCode = useCallback((scannedCode) => {
    console.log('🔍 Código original escaneado:', scannedCode);

    // ✅ NORMALIZAR: El escáner HID convierte "_" en "?" - reemplazar de vuelta
    const normalizedCode = scannedCode.replace(/\?/g, '_');
    console.log('🔄 Código normalizado:', normalizedCode);

    // Buscar el estudiante por código QR normalizado
    const student = students.find(s => s.codigo_qr === normalizedCode);

    if (student) {
      // Verificar si ya fue escaneado
      const alreadyScanned = scanHistory.find(s => s.studentId === student.id);

      if (alreadyScanned) {
        console.log('⚠️ Estudiante ya escaneado:', student.nombre);
        showWarning(`${student.nombre} ya fue escaneado anteriormente`, 'QR duplicado');
        return;
      }

      // Mostrar diálogo de confirmación
      console.log('✅ Estudiante encontrado, abriendo diálogo:', student.nombre);

      setConfirmScanDialog({
        open: true,
        student: student,
        scanTime: Date.now()
      });
    } else {
      console.warn('❌ QR no encontrado en lista de estudiantes:', normalizedCode);
      console.log('📋 Códigos disponibles (muestra):', students.slice(0, 3).map(s => s.codigo_qr));
      showError('QR no válido o no pertenece a un estudiante de prueba', 'QR inválido');
    }
  }, [students, scanHistory, showWarning, showError]);

  // 📱 LISTENER PARA ESCÁNER HID - Captura el input del teclado
  useEffect(() => {
    if (!scannerActive || confirmScanDialog.open) return;

    const handleScannerInput = (event) => {
      // ✅ Ignorar COMPLETAMENTE si hay un diálogo abierto
      if (confirmScanDialog.open) {
        return;
      }

      // ✅ Prevenir comportamiento por defecto del Enter
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();

        // El escáner HID presiona Enter al terminar
        const scannedCode = scannedCodeBuffer.current.trim();
        console.log('📱 Código escaneado:', scannedCode);

        if (scannedCode) {
          processScannedCode(scannedCode);
        }

        // Limpiar buffer
        scannedCodeBuffer.current = '';
      } else if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
        // ✅ Acumular solo caracteres normales (no atajos de teclado)
        scannedCodeBuffer.current += event.key;

        // Timeout para limpiar buffer si pasa mucho tiempo sin Enter
        if (scannerTimeoutRef.current) {
          clearTimeout(scannerTimeoutRef.current);
        }
        scannerTimeoutRef.current = setTimeout(() => {
          console.log('⏱️ Timeout - limpiando buffer');
          scannedCodeBuffer.current = '';
        }, 500); // 500ms de timeout
      }
    };

    // ✅ Usar keydown en lugar de keypress (más confiable)
    document.addEventListener('keydown', handleScannerInput);

    return () => {
      document.removeEventListener('keydown', handleScannerInput);
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }
    };
  }, [scannerActive, confirmScanDialog.open, processScannedCode]);

  // Cronómetro para la prueba
  useEffect(() => {
    let interval = null;
    if (testStarted && testStartTime) {
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    } else {
      setCurrentTime(null);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testStarted, testStartTime]);

  // Calcular progreso cuando cambia el tiempo o estudiantes
  useEffect(() => {
    if (testStarted && testStartTime && currentTime) {
      const scannedCount = scanHistory.length;
      const acceptedCount = scanHistory.filter(s => s.accepted).length;
      const rejectedCount = scanHistory.filter(s => !s.accepted).length;
      const totalTime = Math.floor((currentTime - testStartTime) / 1000);
      const averageTimePerStudent = scannedCount > 0 ? totalTime / scannedCount : 0;
      const remainingStudents = students.length - scannedCount;
      const estimatedCompletion = averageTimePerStudent > 0
        ? totalTime + (remainingStudents * averageTimePerStudent)
        : null;

      setTestProgress({
        scannedCount,
        acceptedCount,
        rejectedCount,
        totalTime,
        averageTimePerStudent,
        estimatedCompletion
      });

      // Auto-completar prueba si todos los QR fueron escaneados
      if (scannedCount === students.length && students.length > 0) {
        setTimeout(() => stopTest(), 1000); // Pequeño delay para mostrar el 100%
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, students, testStarted, testStartTime, scanHistory]);

  const testServerConnection = async () => {
    try {
      setLoading(true);
      // Error cleared
      // Success cleared

      console.log('🔍 Testing server connection...');

      // Test 1: Health check
      console.log('🏥 Test 1: Health check');
      await apiCall('/api/test-qr/health');

      // Test 2: Get students
      console.log('👥 Test 2: Get students');
      const studentsResponse = await apiCall('/api/test-qr/test-students');

      // Test 3: Reset (PATCH) 
      console.log('🔄 Test 3: Reset test');
      await apiCall('/api/test-qr/test-students/reset-all', {
        method: 'PATCH'
      });

      showSuccess(`Todos los tests exitosos! Health: ✅ Students: ${studentsResponse.data?.length || 0} Reset: ✅`, '🎉 Tests OK');

      // Recargar estudiantes
      await loadTestStudents();

    } catch (error) {
      console.error('❌ Test failed:', error);
      showError(`Test falló: ${error.message}`, 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadTestStudents = async () => {
    try {
      setLoading(true);
      // Error cleared

      console.log('🔄 Cargando estudiantes de prueba...');

      const response = await apiCall('/api/test-qr/test-students');

      if (response && response.success) {
        console.log('✅ Estudiantes cargados:', response.data.length);
        setStudents(response.data);
        showSuccess(`${response.data.length} estudiantes de prueba cargados`, '✅ Cargados');
      } else {
        showError('No se pudieron cargar los estudiantes de prueba', 'Error de carga');
      }
    } catch (error) {
      console.error('❌ Error loading students:', error);

      if (error.message === 'BACKEND_NOT_RUNNING') {
        showError('Backend no está ejecutándose. Inicia el servidor en puerto 5000', 'Error de conexión');
      } else if (error.message.includes('HTTP')) {
        const statusCode = error.message.split(' ')[1];
        if (statusCode === '404') {
          showError('Ruta no encontrada. Verifica que las rutas estén registradas', 'Error 404');
        } else if (statusCode === '500') {
          showError('Error interno del servidor. Verifica logs del backend', 'Error 500');
        } else {
          showError(`Error del servidor (${statusCode}). Verifica logs del backend`, 'Error del servidor');
        }
      } else {
        showError(error.message, 'Error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para iniciar el escáner HID (listener de teclado)
  const startScanner = () => {
    console.log('🚀 Activando escáner HID...');
    setScannerActive(true);
    showInfo('Escáner HID activo - escanea un código QR', '📷 Escáner activo');
  };

  // Función para detener el escáner HID
  const stopScanner = () => {
    console.log('📷 Escáner HID desactivado');
    setScannerActive(false);
    scannedCodeBuffer.current = '';
    if (scannerTimeoutRef.current) {
      clearTimeout(scannerTimeoutRef.current);
    }
  };

  // Función para aceptar el estudiante escaneado
  const handleAcceptScan = async () => {
    const { student, scanTime } = confirmScanDialog;
    const now = Date.now();
    const scanDuration = Math.floor((now - scanTime) / 1000); // Tiempo que tomó decidir

    // ✅ Cerrar diálogo INMEDIATAMENTE para mejor UX
    setConfirmScanDialog({ open: false, student: null, scanTime: null });

    // Registrar en historial
    const scanRecord = {
      id: Date.now(),
      studentId: student.id,
      studentName: `${student.nombre} ${student.apellidos}`,
      grado: student.grado,
      prioridad: student.prioridad,
      scanTime: new Date(scanTime),
      decisionTime: new Date(now),
      duration: scanDuration,
      accepted: true
    };

    setScanHistory(prev => [...prev, scanRecord]);
    showSuccess(`${student.nombre} ACEPTADO - Tiempo: ${scanDuration}s`, '✅ Aceptado');

    // ✅ Marcar como usado en el backend en segundo plano (no bloquear UI)
    markAsUsed(student.id).catch(error => {
      console.error('Error marcando como usado:', error);
      showWarning(`Error al marcar QR de ${student.nombre} como usado`, '⚠️ Advertencia');
    });

    // El escáner HID sigue activo automáticamente - no necesita reiniciar
  };

  // Función para rechazar el estudiante escaneado
  const handleRejectScan = () => {
    const { student, scanTime } = confirmScanDialog;
    const now = Date.now();
    const scanDuration = Math.floor((now - scanTime) / 1000);

    // ✅ Cerrar diálogo INMEDIATAMENTE
    setConfirmScanDialog({ open: false, student: null, scanTime: null });

    // Registrar en historial como rechazado
    const scanRecord = {
      id: Date.now(),
      studentId: student.id,
      studentName: `${student.nombre} ${student.apellidos}`,
      grado: student.grado,
      prioridad: student.prioridad,
      scanTime: new Date(scanTime),
      decisionTime: new Date(now),
      duration: scanDuration,
      accepted: false
    };

    setScanHistory(prev => [...prev, scanRecord]);
    showInfo(`${student.nombre} RECHAZADO - Tiempo: ${scanDuration}s`, '⏭️ Rechazado');

    // El escáner HID sigue activo automáticamente - no necesita reiniciar
  };

  const markAsUsed = async (studentId) => {
    try {
      const response = await apiCall(`/api/test-qr/test-students/${studentId}/mark-used`, {
        method: 'PATCH'
      });

      if (response.success) {
        setStudents(prev => prev.map(student =>
          student.id === studentId
            ? { ...student, qr_usado: true }
            : student
        ));
        showSuccess('QR marcado como usado exitosamente', '✅ Marcado');
      } else {
        showError('Error al marcar QR como usado', 'Error');
      }
    } catch (error) {
      console.error('❌ Error marking QR as used:', error);

      if (error.message === 'BACKEND_NOT_RUNNING') {
        showError('Backend no responde. Verifica que esté ejecutándose', 'Error de conexión');
      } else if (error.message.includes('HTTP')) {
        showError('Error del servidor al marcar QR. Verifica logs del backend', 'Error del servidor');
      } else {
        showError(`Error al marcar QR: ${error.message}`, 'Error');
      }
    }
  };

  // Funciones para controlar la prueba
  const startTest = () => {
    const now = Date.now();
    setTestStarted(true);
    setTestStartTime(now);
    setCurrentTime(now);
    setScanHistory([]); // Limpiar historial de escaneos
    setScannerActive(true); // ✅ Activar primero para que el contenedor se renderice
    showSuccess('Prueba iniciada! El escáner QR se está activando...', '🚀 Iniciado');
    console.log('🚀 Prueba iniciada a las:', new Date(now).toLocaleTimeString());
    console.log('👥 Estudiantes disponibles:', students.length);
    console.log('🔍 Códigos QR válidos:', students.map(s => s.codigo_qr).slice(0, 5), '...');

    // Iniciar escáner QR después de que el DOM se haya renderizado
    setTimeout(() => {
      console.log('⏰ Iniciando escáner después de 500ms...');
      startScanner();
    }, 500);
  };

  const stopTest = () => {
    if (testStarted && testStartTime) {
      // Detener escáner
      stopScanner();

      const endTime = Date.now();
      const totalTime = Math.floor((endTime - testStartTime) / 1000);
      const scannedCount = scanHistory.length;
      const acceptedCount = scanHistory.filter(s => s.accepted).length;
      const rejectedCount = scanHistory.filter(s => !s.accepted).length;
      const totalStudents = students.length;
      const wasCompleted = scannedCount === totalStudents;

      // Agregar al historial
      const testRecord = {
        id: Date.now(),
        startTime: new Date(testStartTime),
        endTime: new Date(endTime),
        duration: totalTime,
        scannedCount,
        acceptedCount,
        rejectedCount,
        totalStudents,
        completed: wasCompleted,
        status: wasCompleted ? 'Completado' : 'Detenido manualmente',
        averageTimePerStudent: scannedCount > 0 ? totalTime / scannedCount : 0,
        completionPercentage: Math.round((scannedCount / totalStudents) * 100),
        studentsPerMinute: totalTime > 0 ? Math.round((scannedCount / (totalTime / 60)) * 10) / 10 : 0
      };

      setTestHistory(prev => [testRecord, ...prev]);

      setTestStarted(false);
      setTestStartTime(null);
      setCurrentTime(null);

      const message = wasCompleted
        ? `¡Prueba completada! ${acceptedCount} aceptados, ${rejectedCount} rechazados en ${formatTime(totalTime)}`
        : `Prueba detenida: ${acceptedCount} aceptados, ${rejectedCount} rechazados en ${formatTime(totalTime)}`;

      showSuccess(message, wasCompleted ? '🎉 Completada' : '⏹️ Detenida');
      console.log('⏹️ Prueba detenida:', testRecord);
    }
  };

  const resetTest = async () => {
    try {
      setLoading(true);

      // Detener escáner si está activo
      stopScanner();

      const response = await apiCall('/api/test-qr/test-students/reset-all', {
        method: 'PATCH'
      });

      if (response.success) {
        setTestStarted(false);
        setTestStartTime(null);
        setCurrentTime(null);
        setScanHistory([]); // Limpiar historial de escaneos
        setTestProgress({
          scannedCount: 0,
          acceptedCount: 0,
          rejectedCount: 0,
          totalTime: 0,
          averageTimePerStudent: 0,
          estimatedCompletion: null
        });
        await loadTestStudents();
        showSuccess('Prueba reseteada completamente', '🔄 Reseteado');
      } else {
        showError('Error al resetear la prueba', 'Error');
      }
    } catch (error) {
      console.error('❌ Error resetting test:', error);
      if (error.message === 'BACKEND_NOT_RUNNING') {
        showError('Backend no responde. Verifica que esté ejecutándose', 'Error de conexión');
      } else if (error.message.includes('HTTP')) {
        showError('Error del servidor al resetear. Verifica logs del backend', 'Error del servidor');
      } else {
        showError(`Error al resetear: ${error.message}`, 'Error');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteAllTest = async () => {
    try {
      setLoading(true);

      // Detener escáner si está activo
      stopScanner();

      const response = await apiCall('/api/test-qr/test-students/delete-all', {
        method: 'DELETE'
      });

      if (response.success) {
        setStudents([]);
        setTestStarted(false);
        setTestStartTime(null);
        setCurrentTime(null);
        setScanHistory([]);
        setTestProgress({
          scannedCount: 0,
          acceptedCount: 0,
          rejectedCount: 0,
          totalTime: 0,
          averageTimePerStudent: 0,
          estimatedCompletion: null
        });
        showSuccess('Todos los estudiantes de prueba eliminados', '🗑️ Eliminados');
      } else {
        showError('Error al eliminar estudiantes', 'Error');
      }
    } catch (error) {
      showError('Error de conexión al servidor', 'Error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear tiempo
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Función para eliminar registro individual del historial
  const deleteTestRecord = (recordId) => {
    setTestHistory(prev => prev.filter(record => record.id !== recordId));
    showSuccess('Registro eliminado del historial', '🗑️ Eliminado');
  };

  const handleConfirmAction = (action, student = null) => {
    // Para marcar QR como usado, ejecutar directamente
    if (action === 'mark') {
      markAsUsed(student.id);
      return;
    }

    // Para otras acciones (reset, delete), mostrar confirmación
    setConfirmDialog({ open: true, action, student });
  };

  const executeAction = async () => {
    const { action } = confirmDialog;
    setConfirmDialog({ open: false, action: '', student: null });

    switch (action) {
      case 'reset':
        await resetTest();
        break;
      case 'delete':
        await deleteAllTest();
        break;
    }
  };

  // Filtrar estudiantes según el toggle
  const filteredStudents = students.filter(student =>
    showUsed ? true : !student.qr_usado
  );

  // Calcular estadísticas
  const totalCount = students.length;
  const usedCount = students.filter(s => s.qr_usado).length;
  const progress = totalCount > 0 ? (usedCount / totalCount) * 100 : 0;

  if (loading && students.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Typography>Cargando estudiantes de prueba...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
          🧪 Panel de Pruebas QR
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestión temporal de códigos QR para estudiantes de prueba
        </Typography>
      </Box>

      {/* Warning Alert */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          ⚠️ <strong>MÓDULO TEMPORAL:</strong> Este panel es solo para pruebas piloto. Los estudiantes mostrados aquí son datos de prueba.
        </Typography>
      </Alert>

      {/* Stats Card with Timer */}
      <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                📊 Total Escaneados
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {testProgress.scannedCount} / {totalCount}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip
                  label={`✅ ${testProgress.acceptedCount} aceptados`}
                  size="small"
                  sx={{ bgcolor: 'success.main', color: 'white' }}
                />
                <Chip
                  label={`❌ ${testProgress.rejectedCount} rechazados`}
                  size="small"
                  sx={{ bgcolor: 'error.main', color: 'white' }}
                />
              </Stack>
            </Grid>

            <Grid item xs={12} md={3}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                ⏱️ Cronómetro
              </Typography>
              {testStarted && testStartTime ? (
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {formatTime(testProgress.totalTime)}
                  </Typography>
                  <Typography variant="body2">
                    Tiempo transcurrido
                  </Typography>
                  {testProgress.averageTimePerStudent > 0 && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                      ⚡ {formatTime(Math.floor(testProgress.averageTimePerStudent))}/estudiante
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', opacity: 0.6 }}>
                    --:--
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    No iniciado
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={3}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Progreso: {progress.toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'success.main'
                    }
                  }}
                />
              </Box>

              {testProgress.estimatedCompletion && testStarted && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  🎯 Tiempo estimado total: {formatTime(Math.floor(testProgress.estimatedCompletion))}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} md={3}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                📷 Escáner QR
              </Typography>
              <Chip
                label={scannerActive ? "🟢 ACTIVO" : "🔴 INACTIVO"}
                size="medium"
                sx={{
                  fontWeight: 'bold',
                  bgcolor: scannerActive ? 'success.main' : 'error.main',
                  color: 'white'
                }}
              />
              {scannerActive && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  👉 Escanea un QR para continuar
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Indicador de Escáner HID Activo */}
      {testStarted && scannerActive && (
        <Card sx={{ mb: 3, bgcolor: 'success.main' }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                � Escáner HID Activo
              </Typography>
              <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
                🎯 Usa el escáner de código de barras para leer los QR codes
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                El sistema está listo para recibir códigos
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Test Control Buttons */}
          <Grid item>
            {!testStarted ? (
              <Button
                variant="contained"
                color="success"
                size="large"
                onClick={startTest}
                startIcon={<PlayIcon />}
                sx={{
                  fontWeight: 'bold',
                  px: 3,
                  py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                🚀 COMENZAR PRUEBA
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                size="large"
                onClick={stopTest}
                startIcon={<StopIcon />}
                sx={{
                  fontWeight: 'bold',
                  px: 3,
                  py: 1.5,
                  fontSize: '1.1rem'
                }}
              >
                ⏹️ DETENER PRUEBA
              </Button>
            )}
          </Grid>

          <Grid item>
            <Button
              variant="outlined"
              color="warning"
              onClick={() => handleConfirmAction('reset')}
              disabled={loading}
              startIcon={<RefreshIcon />}
              size="medium"
            >
              🔄 RESETEAR PRUEBA
            </Button>
          </Grid>

          <Grid item>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          </Grid>

          <Grid item>
            <FormControlLabel
              control={
                <Switch
                  checked={showUsed}
                  onChange={(e) => setShowUsed(e.target.checked)}
                  color="primary"
                />
              }
              label="Mostrar QR ya usados"
            />
          </Grid>

          <Grid item>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadTestStudents}
              size="small"
            >
              Actualizar
            </Button>
          </Grid>

          <Grid item>
            <Button
              variant="outlined"
              onClick={() => {
                const token = localStorage.getItem('token');
                const backendUrl = 'http://localhost:5000'; // Note: ApiService uses dynamic detection
                alert(`🔍 DEBUG INFO:\n\n✅ Token: ${token ? 'Encontrado' : 'No encontrado'}\n✅ Backend: ${backendUrl}\n✅ Estudiantes: ${students.length}\n\n💡 Si no aparecen QR, revisa que el backend esté ejecutándose.`);
              }}
              size="small"
              color="info"
            >
              🔍 Debug
            </Button>
          </Grid>

          <Grid item>
            <Button
              variant="outlined"
              onClick={testServerConnection}
              disabled={loading}
              size="small"
              color="warning"
            >
              🔌 Test Server
            </Button>
          </Grid>

          <Grid item>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleConfirmAction('delete')}
              disabled={loading}
              startIcon={<DeleteIcon />}
              size="small"
            >
              🗑️ ELIMINAR TODOS
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Test History Panel */}
      {testHistory.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                📈 Historial de Pruebas ({testHistory.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  setTestHistory([]);
                  showSuccess('Historial limpiado completamente', '🗑️ Limpiado');
                }}
              >
                Limpiar Todo
              </Button>
            </Box>
            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {testHistory.slice(0, 10).map((test, index) => (
                <Paper key={test.id} sx={{ p: 2, mb: 1, bgcolor: index === 0 ? 'primary.light' : 'grey.50' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={2}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        #{testHistory.length - index}
                      </Typography>
                      <Chip
                        label={test.status}
                        size="small"
                        color={test.completed ? 'success' : 'warning'}
                        sx={{ mt: 0.5 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="caption" color="text.secondary">Inicio:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {test.startTime.toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {test.startTime.toLocaleTimeString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="caption" color="text.secondary">Fin:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {test.endTime.toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {test.endTime.toLocaleTimeString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="caption" color="text.secondary">Duración:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatTime(test.duration)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {test.studentsPerMinute}/min
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="caption" color="text.secondary">Progreso:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {test.scannedCount}/{test.totalStudents}
                      </Typography>
                      <Typography variant="caption" color={test.completed ? 'success.main' : 'warning.main'}>
                        {test.completionPercentage}%
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="caption" color="text.secondary">Promedio:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {test.averageTimePerStudent > 0 ? formatTime(Math.floor(test.averageTimePerStudent)) : '--'}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteTestRecord(test.id)}
                        sx={{ mt: 0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              {testHistory.length > 10 && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  ... y {testHistory.length - 10} registros más
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* QR Grid */}
      {students.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No hay QR disponibles para usar
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredStudents.map((student) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={student.id}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  border: student.qr_usado ? '2px solid #4caf50' : '1px solid #e0e0e0',
                  bgcolor: student.qr_usado ? 'rgba(76, 175, 80, 0.05)' : 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 2 }}>
                  {/* QR Status Badge */}
                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    {student.qr_usado ? (
                      <Chip
                        label="Usado"
                        size="small"
                        color="success"
                        icon={<CheckIcon />}
                      />
                    ) : (
                      <Chip
                        label={`Prioridad ${student.prioridad}`}
                        size="small"
                        color={
                          student.prioridad === 1 ? 'error' :
                            student.prioridad === 2 ? 'warning' : 'info'
                        }
                      />
                    )}
                  </Box>

                  {/* QR Code */}
                  <Box sx={{ mb: 2, mt: 3 }}>
                    <QRCode
                      value={student.codigo_qr}
                      size={120}
                      style={{
                        opacity: student.qr_usado ? 0.5 : 1,
                        filter: student.qr_usado ? 'grayscale(100%)' : 'none'
                      }}
                    />
                  </Box>

                  {/* Student Info */}
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {student.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {student.apellidos}
                  </Typography>
                  <Chip
                    label={student.grado}
                    size="small"
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />

                  {/* Action Button */}
                  <Box sx={{ mt: 2 }}>
                    {student.qr_usado ? (
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        disabled
                        startIcon={<CheckIcon />}
                      >
                        ✅ MARCADO COMO USADO
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => markAsUsed(student.id)}
                        disabled={loading}
                        sx={{
                          bgcolor: 'primary.main',
                          '&:hover': {
                            bgcolor: 'primary.dark'
                          }
                        }}
                      >
                        ✅ MARCAR COMO USADO
                      </Button>
                    )}
                  </Box>

                  {/* QR Code Text */}
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 1,
                      fontSize: '0.7rem',
                      color: 'text.secondary',
                      wordBreak: 'break-all'
                    }}
                  >
                    {student.codigo_qr}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Confirmation Scan Dialog - Mostrar datos del estudiante escaneado */}
      <Dialog
        open={confirmScanDialog.open}
        onClose={() => { }} // No permitir cerrar haciendo click fuera
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            📱 Estudiante Escaneado
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {confirmScanDialog.student && (
            <Box sx={{ textAlign: 'center' }}>
              {/* Foto del estudiante */}
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  margin: '0 auto 20px',
                  bgcolor: 'primary.light',
                  fontSize: '3rem'
                }}
              >
                {confirmScanDialog.student.nombre.charAt(0)}
              </Avatar>

              {/* Información del estudiante */}
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                {confirmScanDialog.student.nombre} {confirmScanDialog.student.apellidos}
              </Typography>

              <Stack spacing={2} sx={{ mt: 3 }}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" color="text.secondary">
                    Grado
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {confirmScanDialog.student.grado}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" color="text.secondary">
                    Prioridad
                  </Typography>
                  <Chip
                    label={`Prioridad ${confirmScanDialog.student.prioridad}`}
                    color={
                      confirmScanDialog.student.prioridad === 1 ? 'error' :
                        confirmScanDialog.student.prioridad === 2 ? 'warning' : 'info'
                    }
                    sx={{ mt: 1, fontWeight: 'bold' }}
                  />
                </Paper>

                <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
                  <Typography variant="body2" color="info.contrastText">
                    ⏱️ Esperando confirmación...
                  </Typography>
                </Paper>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button
            onClick={handleRejectScan}
            variant="outlined"
            color="error"
            size="large"
            fullWidth
            sx={{
              mr: 1,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
            startIcon={<CloseIcon />}
          >
            ❌ RECHAZAR (Esc)
          </Button>
          <Button
            onClick={handleAcceptScan}
            variant="contained"
            color="success"
            size="large"
            fullWidth
            sx={{
              ml: 1,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold'
            }}
            startIcon={<CheckIcon />}
            autoFocus
          >
            ✅ ACEPTAR (Enter)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog - Solo para reset y delete */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, action: '', student: null })}>
        <DialogTitle>
          {confirmDialog.action === 'reset' && '¿Resetear todas las pruebas?'}
          {confirmDialog.action === 'delete' && '¿Eliminar todos los estudiantes de prueba?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.action === 'reset' &&
              'Esto marcará todos los QR como no usados y reiniciará el cronómetro.'
            }
            {confirmDialog.action === 'delete' &&
              'Esto eliminará permanentemente todos los estudiantes de prueba de la base de datos.'
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, action: '', student: null })}>
            Cancelar
          </Button>
          <Button
            onClick={executeAction}
            color={confirmDialog.action === 'delete' ? 'error' : 'primary'}
            variant="contained"
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestQRManager;
