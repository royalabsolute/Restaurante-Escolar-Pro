import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Print,
  Refresh,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ContactPage as ContactPageIcon,
  QrCode2 as QrCode2Icon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNotification } from '../../contexts/NotificationContext';
import MainCard from '../../components/Card/MainCard';
import ApiService from '../../services/ApiService';
import { useAuth } from 'hooks/useAuth';

// 🔥 COMPONENTE DE TARJETA DE ESTADÍSTICA REUTILIZABLE
const StatCard = ({ title, value, icon: Icon, color, loading }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.100',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
          borderColor: 'primary.light'
        }
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderRadius: 3,
          bgcolor: `${color}.50`,
          color: `${color}.main`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon fontSize="medium" />
      </Box>
      <Box flex={1}>
        <Typography variant="caption" color="textSecondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight="800" sx={{ lineHeight: 1, mt: 0.5, color: '#1e293b' }}>
          {loading ? <CircularProgress size={20} /> : value}
        </Typography>
      </Box>
    </Paper>
  );
};

const CodigosQR = () => {
  // ✅ Hook de notificaciones unificado
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  // ❌ ELIMINADO: Estado local de error (ahora usa showError)
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [generatingQR, setGeneratingQR] = useState(false);

  useEffect(() => {
    fetchEstudiantes();
  }, []);

  const fetchEstudiantes = async () => {
    try {
      setLoading(true);

      console.log('🔍 Fetching students QR status...');
      const response = await ApiService.getStudentsQRStatus();
      console.log('✅ Students QR status response:', response);

      setEstudiantes(response.data || []);

    } catch (error) {
      console.error('❌ Error cargando estudiantes:', error);
      showError('Error al cargar estudiantes: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (estudiante) => {
    try {
      setGeneratingQR(true);

      console.log('🔍 Generating QR for student:', estudiante.id);
      const response = await ApiService.generateQR(estudiante.id);
      console.log('✅ QR generation response:', response);

      if (response.status === 'SUCCESS') {
        setQrDataUrl(response.data.qr_code);
        setSelectedStudent(response.data.estudiante);
        setQrDialogOpen(true);

        showSuccess(`Código QR generado para ${estudiante.nombre} ${estudiante.apellidos}`);

        // Actualizar la lista
        fetchEstudiantes();
      }
    } catch (error) {
      console.error('❌ Error al generar código QR:', error);
      const errorMsg = error.response?.data?.message || error.message;
      showError('Error al generar código QR: ' + errorMsg);
    } finally {
      setGeneratingQR(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl || !selectedStudent) return;

    const link = document.createElement('a');
    link.download = `QR_${selectedStudent.nombre}_${selectedStudent.apellidos}_${selectedStudent.matricula}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const printQRCode = () => {
    if (!qrDataUrl || !selectedStudent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Código QR - ${selectedStudent.nombre} ${selectedStudent.apellidos}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px; 
            }
            .qr-container { 
              border: 2px solid #333; 
              padding: 20px; 
              margin: 20px auto; 
              width: fit-content; 
            }
            .student-info { 
              margin: 10px 0; 
            }
            .student-name { 
              font-size: 18px; 
              font-weight: bold; 
            }
            .student-details { 
              font-size: 14px; 
              color: #666; 
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>Código QR Estudiantil</h2>
            <img src="${qrDataUrl}" alt="Código QR" />
            <div class="student-info">
              <div class="student-name">${selectedStudent.nombre} ${selectedStudent.apellidos}</div>
              <div class="student-details">Matrícula: ${selectedStudent.matricula}</div>
              <div class="student-details">Grado: ${selectedStudent.grado} - Jornada: ${selectedStudent.jornada}</div>
              <div class="student-details">Código QR: ${selectedStudent.codigo_qr}</div>
            </div>
            <p style="font-size: 12px; color: #888;">
              Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}
            </p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const generateNewQRCode = async (estudianteId) => {
    try {
      let endpoint;

      if (user?.rol === 'admin') {
        // Para admin usar la ruta directa de estudiantes para QR
        endpoint = `/estudiantes/qr/generate/${estudianteId}`;
      } else {
        // Para secretary usar la ruta específica de secretary
        endpoint = `/secretary/qr/generate/${estudianteId}`;
      }

      const response = await ApiService.post(endpoint);

      if (response.data) {
        fetchEstudiantes(); // Recargar la lista
        showSuccess('Código QR generado exitosamente');
      } else {
        showError('Error al generar nuevo código QR');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al generar nuevo código QR');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1600px', mx: 'auto' }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
        mb: 5
      }}>
        <Box>
          <Typography variant="h2" sx={{
            fontWeight: 800,
            color: '#1e293b',
            letterSpacing: -1,
            mb: 0.5
          }}>
            PANEL DE CÓDIGOS QR
          </Typography>
          <Typography variant="body1" color="textSecondary" fontWeight="500">
            Administración y generación de credenciales digitales para estudiantes
          </Typography>
        </Box>
        <Paper elevation={0} sx={{
          px: 2, py: 1,
          borderRadius: 3,
          bgcolor: 'white',
          border: '1px solid',
          borderColor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Typography variant="subtitle2" fontWeight="700" color="primary.main">
            {estudiantes.length} Estudiantes en total
          </Typography>
        </Paper>
      </Box>

      {/* Información sobre códigos QR - Estilo Moderno */}
      <Paper elevation={0} sx={{
        mb: 5,
        p: 3,
        borderRadius: 4,
        bgcolor: 'primary.50',
        border: '1px solid',
        borderColor: 'primary.100',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2
      }}>
        <Box sx={{ p: 1, bgcolor: 'white', borderRadius: 2, color: 'primary.main', display: 'flex' }}>
          <QrCode2Icon fontSize="large" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight="700" color="primary.dark" gutterBottom>
            ¿Qué son los códigos QR estudiantiles?
          </Typography>
          <Typography variant="body2" color="primary.dark" sx={{ opacity: 0.8, maxWidth: '800px' }}>
            Los códigos QR permiten identificar rápidamente a los estudiantes mediante el escaneo
            con dispositivos móviles. Cada código contiene información del estudiante como nombre,
            matrícula y un identificador único que agiliza el registro de asistencia en el restaurante escolar.
          </Typography>
        </Box>
      </Paper>

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Estudiantes"
            value={estudiantes.length}
            icon={ContactPageIcon}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Con Código QR"
            value={estudiantes.filter(e => e.codigo_qr).length}
            icon={CheckCircleIcon}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Sin Código QR"
            value={estudiantes.filter(e => !e.codigo_qr).length}
            icon={ErrorIcon}
            color="warning"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Tabla de estudiantes - Estilo Moderno */}
      <Paper elevation={0} sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'grey.100',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: '700', color: 'text.secondary' } }}>
                <TableCell> Estudiante</TableCell>
                <TableCell> Matrícula</TableCell>
                <TableCell> Grado</TableCell>
                <TableCell> Jornada</TableCell>
                <TableCell> Código QR</TableCell>
                <TableCell> Estado QR</TableCell>
                <TableCell align="center"> Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {estudiantes.map((estudiante) => (
                <TableRow key={estudiante.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {estudiante.nombre} {estudiante.apellidos}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{estudiante.matricula}</TableCell>
                  <TableCell>{estudiante.grado}</TableCell>
                  <TableCell>{estudiante.jornada}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {estudiante.codigo_qr || 'Sin código QR'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={estudiante.codigo_qr ? 'Disponible' : 'Pendiente'}
                      color={estudiante.codigo_qr ? 'success' : 'warning'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Generar código QR">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => generateQRCode(estudiante)}
                          disabled={!estudiante.codigo_qr || generatingQR}
                        >
                          <QrCode />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Generar nuevo código QR">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => generateNewQRCode(estudiante.id)}
                        >
                          <Refresh />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog para mostrar código QR */}
      <Dialog
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{
          bgcolor: 'primary.main',
          color: 'white',
          fontWeight: 800,
          textAlign: 'center',
          py: 3
        }}>
          CREDENCIAL DIGITAL QR
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Box sx={{ textAlign: 'center', p: 1 }}>
            {qrDataUrl && (
              <Paper elevation={0} sx={{
                p: 2,
                display: 'inline-block',
                border: '2px solid',
                borderColor: 'grey.200',
                borderRadius: 4,
                mb: 3
              }}>
                <img
                  src={qrDataUrl}
                  alt="Código QR"
                  style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
                />
              </Paper>
            )}
            <Box sx={{
              bgcolor: 'grey.50',
              p: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'grey.100',
              textAlign: 'left'
            }}>
              <Typography variant="h6" fontWeight="800" gutterBottom align="center">
                {selectedStudent?.nombre} {selectedStudent?.apellidos}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Matrícula</Typography>
                  <Typography variant="body2" fontWeight="700">{selectedStudent?.matricula}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Grado</Typography>
                  <Typography variant="body2" fontWeight="700">{selectedStudent?.grado}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Jornada</Typography>
                  <Typography variant="body2" fontWeight="700">{selectedStudent?.jornada}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">Código ID</Typography>
                  <Typography variant="body2" fontWeight="700" sx={{ wordBreak: 'break-all' }}>{selectedStudent?.codigo_qr}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'center', gap: 1 }}>
          <Button onClick={() => setQrDialogOpen(false)} variant="text" sx={{ color: 'text.secondary' }}>
            Cerrar
          </Button>
          <Button
            onClick={downloadQRCode}
            startIcon={<Download />}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Descargar
          </Button>
          <Button
            onClick={printQRCode}
            startIcon={<Print />}
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Imprimir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CodigosQR;
