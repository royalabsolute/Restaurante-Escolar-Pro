import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
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
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Fab
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ApiService from 'services/ApiService';
import StatCard from 'components/common/StatCard';
import { useNavigate } from 'react-router-dom';
import { useNotification } from 'contexts/NotificationContext';
import { useAuth } from 'hooks/useAuth';

// 🗑️ ELIMINADO: Componenete local redundantete StatCard (Ahora se usa en components/common/StatCard)


const MisJustificaciones = () => {
  // ✅ Hook de notificaciones unificado
  const { showError } = useNotification();
  const navigate = useNavigate();

  const [justificaciones, setJustificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJustificacion, setSelectedJustificacion] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    aprobadas: 0,
    rechazadas: 0
  });

  useEffect(() => {
    fetchMisJustificaciones();
  }, []);

  const fetchMisJustificaciones = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await ApiService.get('/justificaciones/mis-justificaciones');

      if (response.success) {
        setJustificaciones(response.data || []);

        // Calcular estadísticas
        const data = response.data || [];
        setStats({
          total: data.length,
          pendientes: data.filter(j => j.estado === 'pendiente').length,
          aprobadas: data.filter(j => j.estado === 'aprobada').length,
          rechazadas: data.filter(j => j.estado === 'rechazada').length
        });
      } else {
        showError('Error al cargar las justificaciones');
        setJustificaciones([]);
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error de conexión al cargar las justificaciones');
      setJustificaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredJustificaciones = justificaciones.filter(justificacion => {
    const searchLower = searchTerm.toLowerCase();
    return (
      justificacion.motivo?.toLowerCase().includes(searchLower) ||
      justificacion.descripcion?.toLowerCase().includes(searchLower) ||
      justificacion.estado?.toLowerCase().includes(searchLower)
    );
  });

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente':
        return 'warning';
      case 'aprobada':
        return 'success';
      case 'rechazada':
        return 'error';
      default:
        return 'default';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'pendiente':
        return <ScheduleIcon />;
      case 'aprobada':
        return <CheckCircleIcon />;
      case 'rechazada':
        return <CancelIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const handleViewDetails = (justificacion) => {
    setSelectedJustificacion(justificacion);
    setDetailDialogOpen(true);
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatFechaCompleta = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      return format(new Date(fecha), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header Institucional */}
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
            MIS JUSTIFICACIONES
          </Typography>
          <Typography variant="body1" color="textSecondary" fontWeight="500">
            Historial de inasistencias y trámites realizados
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate('/justificaciones/crear')}
          sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}
        >
          Nueva Justificación
        </Button>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total" value={stats.total} icon={AssignmentIcon} color="primary" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pendientes" value={stats.pendientes} icon={ScheduleIcon} color="warning" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Aprobadas" value={stats.aprobadas} icon={CheckCircleIcon} color="success" loading={loading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Rechazadas" value={stats.rechazadas} icon={CancelIcon} color="error" loading={loading} />
        </Grid>
      </Grid>

      {/* Buscador - Estilo Pro */}
      <Paper elevation={0} sx={{
        p: 2,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'grey.100',
        mb: 3,
        bgcolor: 'white'
      }}>
        <TextField
          fullWidth
          placeholder="Buscar por motivo, descripción o estado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* ❌ ELIMINADO: Alert local - Ahora todas las notificaciones salen de la isla dinámica */}

      {/* Tabla de justificaciones - Estilo Pro */}
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
                <TableCell>Fecha de Ausencia</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Solicitado el</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredJustificaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight="500">
                      {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'Aún no tienes justificaciones registradas'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredJustificaciones.map((justificacion) => (
                  <TableRow key={justificacion.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {formatFecha(justificacion.fecha_ausencia)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {justificacion.motivo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getEstadoIcon(justificacion.estado)}
                        label={justificacion.estado?.toUpperCase()}
                        color={getEstadoColor(justificacion.estado)}
                        size="small"
                        sx={{ fontWeight: 800, borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatFecha(justificacion.fecha_solicitud)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(justificacion)}
                        sx={{ color: 'primary.main', bgcolor: 'primary.50', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Botón flotante para nueva justificación */}
      <Fab
        color="primary"
        aria-label="nueva justificación"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate('/justificaciones/crear')}
      >
        <AddIcon />
      </Fab>

      {/* Dialog de detalles - Estilo Pro */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ bgcolor: 'grey.50', fontWeight: 800, pb: 2, pt: 3 }}>
          Detalles de la Justificación
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          {selectedJustificacion && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" fontWeight="700">FECHA DE AUSENCIA</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
                  {formatFecha(selectedJustificacion.fecha_ausencia)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" fontWeight="700">ESTADO ACTUAL</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    icon={getEstadoIcon(selectedJustificacion.estado)}
                    label={selectedJustificacion.estado?.toUpperCase()}
                    color={getEstadoColor(selectedJustificacion.estado)}
                    size="small"
                    sx={{ fontWeight: 800, borderRadius: 1.5 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" fontWeight="700">MOTIVO</Typography>
                <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, color: 'primary.main' }}>
                  {selectedJustificacion.motivo}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" fontWeight="700">DESCRIPCIÓN</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', mt: 1, borderRadius: 2, borderStyle: 'dashed' }}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedJustificacion.descripcion}
                  </Typography>
                </Paper>
              </Grid>

              {selectedJustificacion.comentario_secretaria && (
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="700">RESPUESTA DE ADMINISTRACIÓN</Typography>
                  <Alert
                    severity={selectedJustificacion.estado === 'aprobada' ? 'success' : 'error'}
                    sx={{ mt: 1, borderRadius: 2, fontWeight: 500 }}
                    icon={selectedJustificacion.estado === 'aprobada' ? <CheckCircleIcon /> : <CancelIcon />}
                  >
                    {selectedJustificacion.comentario_secretaria}
                  </Alert>
                </Grid>
              )}

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight="500">
                  Solicitud tramitada el {formatFechaCompleta(selectedJustificacion.fecha_solicitud)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Button
            onClick={() => setDetailDialogOpen(false)}
            variant="contained"
            sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MisJustificaciones;
