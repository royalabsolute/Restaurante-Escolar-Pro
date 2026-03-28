import { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  Refresh as RefreshIcon,
  RestartAlt as RestartAltIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ContactPage as ContactPageIcon,
  AssignmentTurnedIn as ValidatedIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { QRCodeSVG } from 'qrcode.react';
import ApiService from 'services/ApiService';
import useRoleBasedApi from 'hooks/useRoleBasedApi';
import AdminPasswordDialog from 'components/AdminPasswordDialog';
import { verifyMasterPassword } from '../../config/security';
// ✅ Sistema unificado de notificaciones
import { useNotification } from 'contexts/NotificationContext';
import StatCard from 'components/common/StatCard';


const GestionQR = () => {
  const { endpoints, permissions } = useRoleBasedApi();
  // ✅ Hook de notificaciones unificado
  const { showSuccess, showError } = useNotification();
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSecurityDialog, setOpenSecurityDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newQrCode, setNewQrCode] = useState('');
  // ❌ ELIMINADO: Snackbar local (ahora usa showSuccess/showError)

  const cargarEstudiantes = useCallback(async () => {
    try {
      setLoading(true);
      // Usar endpoint basado en el rol del usuario
      const endpoint = endpoints.qr?.students || '/estudiantes';
      // Cargando estudiantes desde endpoint
      const response = await ApiService.get(endpoint);
      // Respuesta recibida de la API

      // Los estudiantes están en response.data.estudiantes para secretaría
      // o en response.data para admin
      let estudiantesData = [];
      if (response.data?.estudiantes) {
        // Respuesta de secretaría: { data: { estudiantes: [...], total: x, conQR: y, sinQR: z } }
        estudiantesData = response.data.estudiantes;
        console.log('📈 Estadísticas QR - Total:', response.data.total, 'Con QR:', response.data.conQR, 'Sin QR:', response.data.sinQR);
      } else if (Array.isArray(response.data)) {
        // Respuesta de admin: { data: [...] }
        estudiantesData = response.data;
      } else {
        estudiantesData = [];
      }

      console.log('✅ Estudiantes procesados:', estudiantesData.length);
      setEstudiantes(estudiantesData);
    } catch (error) {
      console.error('❌ Error al cargar estudiantes:', error);
      showError('Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  }, [endpoints]);

  // useEffect después de definir cargarEstudiantes
  useEffect(() => {
    cargarEstudiantes();
  }, [cargarEstudiantes]);

  const generarQR = (estudiante) => {
    // Generar vista previa del código QR que se asignará
    const qrCode = `QR_EST_${estudiante.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setNewQrCode(qrCode);
    setSelectedStudent(estudiante);
    setOpenDialog(true);
  };

  const guardarQR = async () => {
    try {
      // Usar el endpoint específico para generar QR basado en el rol
      const endpoint = endpoints.qr?.generate ?
        endpoints.qr.generate(selectedStudent.id) :
        `/estudiantes/qr/generate/${selectedStudent.id}`;

      await ApiService.post(endpoint);
      showSuccess('Código QR actualizado exitosamente');
      setOpenDialog(false);
      cargarEstudiantes();
    } catch (error) {
      console.error('Error al actualizar QR:', error);
      showError('Error al actualizar código QR');
    }
  };

  const generarQRsAutomaticos = async () => {
    try {
      const estudiantesSinQR = estudiantes.filter(est => !est.codigo_qr && est.estado === 'validado');

      for (const estudiante of estudiantesSinQR) {
        const endpoint = endpoints.qr?.generate ?
          endpoints.qr.generate(estudiante.id) :
          `/estudiantes/qr/generate/${estudiante.id}`;
        await ApiService.post(endpoint);
      }

      showSuccess(`Se generaron ${estudiantesSinQR.length} códigos QR automáticamente`);
      cargarEstudiantes();
    } catch (error) {
      console.error('Error al generar QRs automáticos:', error);
      showError('Error al generar códigos QR automáticos');
    }
  };

  // Abrir el diálogo de seguridad para regenerar todos los QR
  const abrirDialogoRegenerarQR = () => {
    setOpenSecurityDialog(true);
  };

  // Función que se ejecuta cuando se confirma la contraseña
  const handleConfirmRegenerateQR = async (password) => {
    // Verificar la contraseña maestra
    if (!verifyMasterPassword(password)) {
      return {
        success: false,
        message: '❌ Contraseña incorrecta. Acceso denegado.'
      };
    }

    // Contraseña correcta - proceder con la regeneración
    try {
      setLoading(true);
      setOpenSecurityDialog(false);

      const response = await ApiService.post('/admin/regenerate-all-barcodes');

      if (response.data.status === 'SUCCESS') {
        showSuccess('✅ ' + response.data.message);
        cargarEstudiantes(); // Recargar la lista
        return { success: true };
      } else {
        showError('❌ Error al regenerar los códigos QR');
        return { success: false, message: 'Error al regenerar los códigos QR' };
      }
    } catch (error) {
      console.error('Error al regenerar todos los QRs:', error);
      showError('❌ Error al regenerar todos los códigos QR. Verifica que tengas permisos de administrador.');
      return { success: false, message: 'Error en la operación' };
    } finally {
      setLoading(false);
    }
  };

  // ❌ ELIMINADO: handleCloseSnackbar (ya no se usa)

  const getEstadoQR = (estudiante) => {
    if (!estudiante.codigo_qr) {
      return <Chip label="Sin QR" color="error" size="small" />;
    }
    return <Chip label="Con QR" color="success" size="small" />;
  };

  const getEstadoEstudiante = (estado) => {
    const config = {
      'pendiente': { color: 'warning', label: 'Pendiente' },
      'validado': { color: 'success', label: 'Validado' },
      'rechazado': { color: 'error', label: 'Rechazado' }
    };
    const { color, label } = config[estado] || { color: 'default', label: estado };
    return <Chip label={label} color={color} size="small" />;
  };

  const estudiantesValidadosSinQR = estudiantes.filter(est => est.estado === 'validado' && !est.codigo_qr);
  const estudiantesConQR = estudiantes.filter(est => est.codigo_qr);
  const estudiantesSinQR = estudiantes.filter(est => !est.codigo_qr);

  return (
    <>
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
              ASIGNACIÓN DE CÓDIGOS QR
            </Typography>
            <Typography variant="body1" color="textSecondary" fontWeight="500">
              Mantenimiento y regeneración masiva de credenciales de acceso
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<QrCodeIcon />}
              onClick={generarQRsAutomaticos}
              disabled={estudiantesValidadosSinQR.length === 0}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              Generar Faltantes ({estudiantesValidadosSinQR.length})
            </Button>
            {permissions.canDelete && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<RestartAltIcon />}
                onClick={abrirDialogoRegenerarQR}
                disabled={loading}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Regenerar Todos
              </Button>
            )}
          </Box>
        </Box>

        <Grid container spacing={2} mb={5}>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Con Código QR"
              value={estudiantesConQR.length}
              icon={CheckCircleIcon}
              color="success"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Pendientes QR"
              value={estudiantesValidadosSinQR.length}
              icon={ValidatedIcon}
              color="warning"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Total Estudiantes"
              value={estudiantes.length}
              icon={ContactPageIcon}
              color="info"
              loading={loading}
            />
          </Grid>
        </Grid>

        {/* Tabla de estudiantes - Estilo Pro */}
        <Paper elevation={0} sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'grey.100',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: '700', color: 'text.secondary' } }}>
                  <TableCell> ID</TableCell>
                  <TableCell> Nombre Completo</TableCell>
                  <TableCell> Grado</TableCell>
                  <TableCell> Estado</TableCell>
                  <TableCell> Estado QR</TableCell>
                  <TableCell> Código QR</TableCell>
                  <TableCell align="center"> Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {estudiantes.map((estudiante) => (
                  <TableRow key={estudiante.id} hover>
                    <TableCell>{estudiante.id}</TableCell>
                    <TableCell>{`${estudiante.nombre} ${estudiante.apellidos}`}</TableCell>
                    <TableCell>{estudiante.grado}</TableCell>
                    <TableCell>{getEstadoEstudiante(estudiante.estado)}</TableCell>
                    <TableCell>{getEstadoQR(estudiante)}</TableCell>
                    <TableCell>
                      {estudiante.codigo_qr ? (
                        <Box display="flex" alignItems="center">
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', mr: 1 }}>
                            {estudiante.codigo_qr}
                          </Typography>
                          <QRCodeSVG value={estudiante.codigo_qr} size={30} />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No asignado
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => generarQR(estudiante)}
                        color="primary"
                        sx={{ bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.100' } }}
                        title="Generar/Regenerar QR"
                      >
                        <RefreshIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Diálogo para generar/regenerar QR */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
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
          {selectedStudent?.codigo_qr ? 'ACTUALIZAR' : 'GENERAR'} CÓDIGO QR
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {selectedStudent && (
            <Box sx={{ p: 1 }}>
              <Typography variant="h6" fontWeight="800" align="center" gutterBottom>
                {selectedStudent.nombre} {selectedStudent.apellidos}
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center" gutterBottom>
                Grado: {selectedStudent.grado} | Estado: {selectedStudent.estado}
              </Typography>

              <TextField
                fullWidth
                label="Identificador de Código QR"
                value={newQrCode}
                onChange={(e) => setNewQrCode(e.target.value)}
                margin="normal"
                variant="filled"
                helperText="Este código será persistente para el estudiante."
                InputProps={{ sx: { borderRadius: 2, bgcolor: 'grey.50' } }}
              />

              {newQrCode && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Paper elevation={0} sx={{
                    p: 2,
                    border: '2px solid',
                    borderColor: 'grey.100',
                    borderRadius: 4,
                    textAlign: 'center',
                    bgcolor: 'white'
                  }}>
                    <QRCodeSVG value={newQrCode} size={150} />
                    <Typography variant="caption" display="block" mt={1} fontWeight="700" color="textSecondary">
                      VISTA PREVIA DE ESCANEO
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'center', gap: 1 }}>
          <Button onClick={() => setOpenDialog(false)} variant="text" color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={guardarQR}
            variant="contained"
            disabled={!newQrCode.trim()}
            sx={{ px: 4, borderRadius: 2 }}
          >
            {selectedStudent?.codigo_qr ? 'Actualizar' : 'Generar'} QR
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Seguridad para Regenerar Todos los QR */}
      <AdminPasswordDialog
        open={openSecurityDialog}
        onClose={() => setOpenSecurityDialog(false)}
        onConfirm={handleConfirmRegenerateQR}
        title="🔒 Autorización Requerida"
        message="Estás a punto de regenerar TODOS los códigos QR del sistema. Esta operación requiere la contraseña maestra del administrador."
        warningText="⚠️ Esta acción es IRREVERSIBLE e invalidará todos los códigos QR existentes. Solo el administrador principal debe realizar esta operación."
      />
    </>
  );
};

export default GestionQR;
