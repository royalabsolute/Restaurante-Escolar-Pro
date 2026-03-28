import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Avatar,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Assignment as JustificationIcon,
  Schedule as PendingIcon,
  Work as WorkIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useAuth } from 'hooks/useAuth';
import { useNotification } from 'contexts/NotificationContext';



import ApiService from '../../services/ApiService';
import StatCard from 'components/common/StatCard';
import PageHeader from 'components/common/PageHeader';

const GestionUnificadaJustificaciones = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();

  // Estados principales
  const [justificaciones, setJustificaciones] = useState([]);
  const [justificacionesFiltradas, setJustificacionesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Estados para modales
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedJustificacion, setSelectedJustificacion] = useState(null);
  const [comentario, setComentario] = useState('');
  const [accionReview, setAccionReview] = useState('');

  // Estados para estadísticas
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    aprobadas: 0,
    rechazadas: 0
  });

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/justificaciones');

      let data = [];
      if (Array.isArray(response)) data = response;
      else if (response?.data && Array.isArray(response.data)) data = response.data;
      else if (response?.justificaciones && Array.isArray(response.justificaciones)) data = response.justificaciones;

      setJustificaciones(data);

      const newStats = data.reduce((acc, j) => {
        acc.total++;
        if (j.estado === 'pendiente') acc.pendientes++;
        else if (j.estado === 'aprobada') acc.aprobadas++;
        else if (j.estado === 'rechazada') acc.rechazadas++;
        return acc;
      }, { total: 0, pendientes: 0, aprobadas: 0, rechazadas: 0 });

      setStats(newStats);
    } catch (error) {
      console.error('Error cargando justificaciones:', error);
      showError('No se pudieron cargar las justificaciones');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    let filtradas = justificaciones;

    if (filtroEstado !== 'todos') {
      filtradas = filtradas.filter(j => j.estado === filtroEstado);
    }

    if (busqueda.trim()) {
      const query = busqueda.toLowerCase();
      filtradas = filtradas.filter(j =>
        j.estudiante_nombre?.toLowerCase().includes(query) ||
        j.estudiante_apellidos?.toLowerCase().includes(query) ||
        j.estudiante_matricula?.toLowerCase().includes(query) ||
        j.motivo?.toLowerCase().includes(query)
      );
    }

    setJustificacionesFiltradas(filtradas);
  }, [justificaciones, busqueda, filtroEstado]);

  const handleReview = (justificacion, accion) => {
    setSelectedJustificacion(justificacion);
    setAccionReview(accion);
    setComentario('');
    setReviewModalOpen(true);
  };

  const procesarRevision = async () => {
    try {
      const endpoint = `/justificaciones/${selectedJustificacion.id}/${accionReview}`;
      await ApiService.put(endpoint, {
        comentario_secretaria: comentario.trim() || getDefaultComment(accionReview)
      });

      showSuccess(`Justificación ${accionReview === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente`);
      setReviewModalOpen(false);
      cargarDatos();
    } catch (error) {
      showError('Error al procesar la revisión');
    }
  };

  const getDefaultComment = (accion) => {
    return accion === 'aprobar'
      ? 'Justificación aprobada satisfactoriamente.'
      : 'Justificación rechazada por falta de soportes o información insuficiente.';
  };

  const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';
  const formatFechaHora = (f) => f ? new Date(f).toLocaleString('es-ES') : 'N/A';


  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, mx: 'auto' }}>
      <PageHeader
        title="Panel de Justificaciones"
        subtitle="Revisión y dictamen de inasistencias escolares registradas"
      />

      <Grid container spacing={2} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Recibidas"
            value={stats.total}
            icon={JustificationIcon}
            color="primary"
            description="Justificaciones totales"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pendientes"
            value={stats.pendientes}
            icon={PendingIcon}
            color="warning"
            description="Por revisar / aprobar"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Aprobadas"
            value={stats.aprobadas}
            icon={ApproveIcon}
            color="success"
            description="Faltas justificadas"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Rechazadas"
            value={stats.rechazadas}
            icon={RejectIcon}
            color="error"
            description="Sin justificación válida"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Filters & Table - Estilo Pro */}
      <Paper elevation={0} sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'grey.100',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
      }}>
        <Box sx={{ p: 3, bgcolor: 'white', display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
          <TextField
            placeholder="Buscar por estudiante, matrícula o motivo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[
              { id: 'todos', label: 'Todos', color: 'primary' },
              { id: 'pendiente', label: 'Pendientes', color: 'warning' },
              { id: 'aprobada', label: 'Aprobadas', color: 'success' },
              { id: 'rechazada', label: 'Rechazadas', color: 'error' }
            ].map((f) => (
              <Button
                key={f.id}
                variant={filtroEstado === f.id ? 'contained' : 'outlined'}
                color={f.color}
                onClick={() => setFiltroEstado(f.id)}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 3,
                  boxShadow: filtroEstado === f.id ? 2 : 0
                }}
              >
                {f.label}
              </Button>
            ))}
          </Box>
        </Box>

        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: '700', color: 'text.secondary' } }}>
                <TableCell> Estudiante</TableCell>
                <TableCell> Fecha Falta</TableCell>
                <TableCell> Motivo</TableCell>
                <TableCell> Estado</TableCell>
                <TableCell align="center"> Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}><CircularProgress /></TableCell></TableRow>
              ) : justificacionesFiltradas.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 10 }}><Typography color="text.secondary">No se encontraron registros</Typography></TableCell></TableRow>
              ) : (
                justificacionesFiltradas.map((j) => (
                  <TableRow key={j.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', fontWeight: 700 }}>{j.estudiante_nombre?.[0]}</Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{`${j.estudiante_nombre} ${j.estudiante_apellidos}`}</Typography>
                          <Typography variant="caption" color="text.secondary">{j.estudiante_matricula}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{formatFecha(j.fecha_falta)}</TableCell>
                    <TableCell sx={{ maxWidth: 250 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>{j.motivo}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={j.estado.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: j.estado === 'aprobada' ? 'success.50' : j.estado === 'pendiente' ? 'warning.50' : 'error.50',
                          color: j.estado === 'aprobada' ? 'success.main' : j.estado === 'pendiente' ? 'warning.main' : 'error.main',
                          fontWeight: 800,
                          borderRadius: 1.5,
                          border: 'none'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="Ver Detalle Completo">
                          <IconButton onClick={() => { setSelectedJustificacion(j); setViewModalOpen(true); }} sx={{ color: 'primary.main', bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {j.estado === 'pendiente' && (
                          <>
                            <Tooltip title="Aprobar">
                              <IconButton onClick={() => handleReview(j, 'aprobar')} sx={{ color: 'success.main', bgcolor: 'success.light', '&:hover': { bgcolor: 'success.main', color: 'white' } }}>
                                <ApproveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Rechazar">
                              <IconButton onClick={() => handleReview(j, 'rechazar')} sx={{ color: 'error.main', bgcolor: 'error.light', '&:hover': { bgcolor: 'error.main', color: 'white' } }}>
                                <RejectIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Modal Detalle Rediseñado */}
      <Dialog
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 3,
          bgcolor: 'primary.main',
          color: 'white'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Dossier de Justificación</Typography>
          <Chip
            label={selectedJustificacion?.estado.toUpperCase()}
            color={selectedJustificacion?.estado === 'aprobada' ? 'success' : 'warning'}
            sx={{ bgcolor: 'white', color: selectedJustificacion?.estado === 'aprobada' ? 'success.main' : 'warning.main', fontWeight: 800 }}
          />
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {selectedJustificacion && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={5}>
                <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 4, height: '100%' }}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Estudiante</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, mb: 3 }}>
                    <Avatar sx={{ width: 64, height: 64, fontSize: 24, bgcolor: 'primary.main' }}>{selectedJustificacion.estudiante_nombre?.[0]}</Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{`${selectedJustificacion.estudiante_nombre} ${selectedJustificacion.estudiante_apellidos}`}</Typography>
                      <Typography variant="body2" color="text.secondary">Grado: {selectedJustificacion.grado || 'No especificado'}</Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2"><strong>Matrícula:</strong> {selectedJustificacion.estudiante_matricula}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}><strong>Email:</strong> {selectedJustificacion.email || 'N/A'}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={7}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Detalles del Incidente</Typography>
                  <Typography variant="h6" sx={{ mt: 1, fontWeight: 700, color: 'primary.main' }}>{selectedJustificacion.motivo}</Typography>
                  <Typography variant="body2" color="text.secondary">Fecha de inasistencia: {formatFecha(selectedJustificacion.fecha_falta)}</Typography>
                </Box>

                <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Descripción del Estudiante:</Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    {selectedJustificacion.descripcion || 'El estudiante no proporcionó una descripción adicional.'}
                  </Typography>
                </Box>

                {selectedJustificacion.archivo_adjunto && (
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<JustificationIcon />}
                    href={`${ApiService.getBaseUrl().replace('/api', '')}/${selectedJustificacion.archivo_adjunto}`}
                    target="_blank"
                    sx={{ borderRadius: 2, py: 1.5, fontWeight: 700 }}
                  >
                    Ver Soporte / Documento Adjunto
                  </Button>
                )}

                <Box sx={{ mt: 4 }}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>Trazabilidad</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}><strong>Solicitado el:</strong> {formatFechaHora(selectedJustificacion.fecha_solicitud)}</Typography>
                  {selectedJustificacion.fecha_revision && (
                    <Box sx={{ mt: 2, p: 2, borderLeft: '4px solid', borderColor: 'primary.main', bgcolor: 'primary.light', borderRadius: 1 }}>
                      <Typography variant="body2"><strong>Revisado por:</strong> {selectedJustificacion.revisado_por_email || 'Administración'}</Typography>
                      <Typography variant="body2"><strong>El día:</strong> {formatFechaHora(selectedJustificacion.fecha_revision)}</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}><strong>Comentario:</strong> {selectedJustificacion.comentario_secretaria}</Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setViewModalOpen(false)} sx={{ fontWeight: 700 }}>Cerrar Expediente</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Revisar Rediseñado */}
      <Dialog open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Dictamen de Justificación</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Usted está a punto de <strong>{accionReview}</strong> la solicitud de <strong>{selectedJustificacion?.estudiante_nombre}</strong>.
          </Typography>
          <TextField
            fullWidth multiline rows={4}
            label="Comentarios de la Administración"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Ingrese el motivo formal de la decisión..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReviewModalOpen(false)} color="inherit">Cancelar</Button>
          <Button
            onClick={procesarRevision}
            variant="contained"
            color={accionReview === 'aprobar' ? 'success' : 'error'}
            sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
          >
            Confirmar {accionReview === 'aprobar' ? 'Aprobación' : 'Rechazo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GestionUnificadaJustificaciones;