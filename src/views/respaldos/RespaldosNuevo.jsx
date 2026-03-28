import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Stack,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  CircularProgress,
  TextField,
  Paper
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Description as DescriptionIcon,
  TableChart as TableChartIcon,
  UploadFile as UploadFileIcon,
  CleaningServices as CleaningServicesIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import ApiService from '../../services/ApiService';

const RespaldosNuevo = () => {
  const [respaldos, setRespaldos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creandoRespaldo, setCreandoRespaldo] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipoRespaldo, setTipoRespaldo] = useState('');
  const [formatoRespaldo, setFormatoRespaldo] = useState('');
  const [restaurarDialogOpen, setRestaurarDialogOpen] = useState(false);
  const [archivoRestauracion, setArchivoRestauracion] = useState(null);
  const [restaurando, setRestaurando] = useState(false);
  const [vaciarDialogOpen, setVaciarDialogOpen] = useState(false);
  const [vaciando, setVaciando] = useState(false);
  const [vaciarDetalle, setVaciarDetalle] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    if (tipo) {
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async () => {
    await Promise.all([
      cargarRespaldos(),
      cargarEstadisticas()
    ]);
  };

  const cargarRespaldos = async () => {
    try {
      setLoading(true);
      await ApiService.initialize();
      const response = await ApiService.get('/respaldos');

      if (response.success) {
        setRespaldos(response.data);
      }
    } catch (error) {
      console.error('Error cargando respaldos:', error);
      mostrarMensaje('error', 'Error al cargar lista de respaldos');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      await ApiService.initialize();
      const response = await ApiService.get('/respaldos/estadisticas');

      if (response.success) {
        setEstadisticas(response.data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const crearRespaldo = async (formato, tipo = 'completo') => {
    setCreandoRespaldo(true);
    setTipoRespaldo(tipo);
    setFormatoRespaldo(formato);
    setDialogOpen(true);

    try {
      await ApiService.initialize();
      const endpoint = formato === 'sql' ? '/respaldos/crear/sql' : '/respaldos/crear/csv';
      const response = await ApiService.post(endpoint, { tipo });

      if (response.success) {
        mostrarMensaje('success', response.message);
        await cargarDatos();
      } else {
        mostrarMensaje('error', response.message || 'Error al crear respaldo');
      }
    } catch (error) {
      console.error('Error creando respaldo:', error);
      mostrarMensaje('error', error.response?.data?.message || 'Error al crear respaldo');
    } finally {
      setCreandoRespaldo(false);
      setTimeout(() => setDialogOpen(false), 1000);
    }
  };

  const descargarRespaldo = async (nombre) => {
    try {
      const api = await ApiService.ensureInitialized();
      const response = await api.get(`/respaldos/descargar/${encodeURIComponent(nombre)}`, {
        responseType: 'blob'
      });

      const blob = response.data;
      if (!(blob instanceof Blob)) {
        mostrarMensaje('error', 'Archivo de respaldo inválido');
        return;
      }

      let filename = nombre;
      const disposition = response.headers?.['content-disposition'];
      if (disposition) {
        const match = disposition.match(/filename="?([^";]+)"?/i);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();

      mostrarMensaje('success', 'Descarga iniciada');
    } catch (error) {
      console.error('Error descargando respaldo:', error);
      mostrarMensaje('error', 'Error al descargar respaldo');
    }
  };

  const eliminarRespaldo = async (nombre) => {
    if (!window.confirm(`¿Está seguro de eliminar el respaldo "${nombre}"?`)) {
      return;
    }

    try {
      await ApiService.initialize();
      const response = await ApiService.delete(`/respaldos/${encodeURIComponent(nombre)}`);

      if (response.success) {
        mostrarMensaje('success', 'Respaldo eliminado exitosamente');
        await cargarDatos();
      }
    } catch (error) {
      console.error('Error eliminando respaldo:', error);
      mostrarMensaje('error', 'Error al eliminar respaldo');
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoColor = (tipo) => {
    return tipo === 'Completo' ? 'primary' : 'secondary';
  };

  const getFormatoColor = (formato) => {
    return formato === 'SQL' ? 'success' : 'info';
  };

  const manejarArchivoRestauracion = (event) => {
    const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
    setArchivoRestauracion(file);
  };

  const ejecutarRestauracion = async () => {
    if (!archivoRestauracion) {
      mostrarMensaje('warning', 'Selecciona un archivo .sql para restaurar');
      return;
    }

    setRestaurando(true);
    try {
      const formData = new FormData();
      formData.append('archivo', archivoRestauracion);

      const response = await ApiService.postFormData('/respaldos/restaurar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const data = response?.data || response;
      if (data?.success) {
        mostrarMensaje('success', data.message || 'Base de datos restaurada');
        setRestaurarDialogOpen(false);
        setArchivoRestauracion(null);
        await cargarDatos();
      } else {
        mostrarMensaje('error', data?.message || 'No fue posible restaurar la base de datos');
      }
    } catch (error) {
      console.error('Error restaurando respaldo:', error);
      mostrarMensaje('error', error.response?.data?.message || 'Error al restaurar la base de datos');
    } finally {
      setRestaurando(false);
    }
  };

  const ejecutarVaciar = async () => {
    if (!adminPassword) {
      mostrarMensaje('warning', 'Debes ingresar tu contraseña para confirmar');
      return;
    }

    setVaciando(true);
    setVaciarDetalle(null);
    try {
      await ApiService.initialize();
      const response = await ApiService.post('/respaldos/vaciar', { password: adminPassword });

      if (response?.success) {
        setVaciarDetalle(response.data || null);
        mostrarMensaje('success', response.message || 'Base de datos vaciada');
        setVaciarDialogOpen(false);
        setAdminPassword('');
      } else {
        mostrarMensaje('error', response?.message || 'No fue posible vaciar la base de datos');
      }
    } catch (error) {
      console.error('Error vaciando base de datos:', error);
      mostrarMensaje('error', error.response?.data?.message || 'Error al vaciar la base de datos');
    } finally {
      setVaciando(false);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* HEADER INSTITUCIONAL */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
            Respaldos y Restauración
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            Administra copias de seguridad de la base de datos y mantén la integridad del sistema.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={cargarDatos}
          disabled={loading}
          sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
        >
          Actualizar
        </Button>
      </Box>

      {/* Mensajes */}
      {mensaje.texto && (
        <Alert severity={mensaje.tipo} sx={{ mb: 3 }} onClose={() => setMensaje({ tipo: '', texto: '' })}>
          {mensaje.texto}
        </Alert>
      )}

      {vaciarDetalle && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          onClose={() => setVaciarDetalle(null)}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Resultado del vaciado
          </Typography>
          <Typography variant="body2">
            Tablas afectadas: <strong>{vaciarDetalle.tablasAfectadas}</strong> • Registros eliminados: <strong>{vaciarDetalle.registrosEliminados}</strong>
          </Typography>
          {Array.isArray(vaciarDetalle.detalle) && vaciarDetalle.detalle.length > 0 && (
            <Box component="ul" sx={{ pl: 3, mt: 1, mb: 0 }}>
              {vaciarDetalle.detalle.slice(0, 5).map((item) => (
                <Box component="li" key={item.tabla} sx={{ fontSize: 13 }}>
                  {item.tabla}: <strong>{item.registrosEliminados}</strong> registros eliminados
                </Box>
              ))}
              {vaciarDetalle.detalle.length > 5 && (
                <Typography variant="caption" color="textSecondary">
                  Se omiten {vaciarDetalle.detalle.length - 5} tablas adicionales
                </Typography>
              )}
            </Box>
          )}
        </Alert>
      )}

      {/* INDICADORES DE RESUMEN */}
      {estadisticas && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 4,
                bgcolor: 'white',
                border: '1px solid',
                borderColor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(0,0,0,0.05)' }
              }}
            >
              <Box sx={{ bgcolor: 'primary.50', p: 1.5, borderRadius: 3, color: 'primary.main', display: 'flex' }}>
                <StorageIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                  Total de Respaldos
                </Typography>
                <Typography variant="h4" sx={{ color: '#1e293b', fontWeight: 800 }}>
                  {estadisticas.totalRespaldos}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 4,
                bgcolor: 'white',
                border: '1px solid',
                borderColor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 16px rgba(0,0,0,0.05)' }
              }}
            >
              <Box sx={{ bgcolor: 'warning.50', p: 1.5, borderRadius: 3, color: 'warning.main', display: 'flex' }}>
                <RefreshIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                  Último Respaldo
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#1e293b', fontWeight: 800 }}>
                  {estadisticas.ultimoRespaldo
                    ? formatearFecha(estadisticas.ultimoRespaldo)
                    : 'Sin registros'}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ACCIONES DE RESPALDO Y MANTENIMIENTO */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'grey.100',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
              <Box sx={{ bgcolor: 'primary.50', p: 1.5, borderRadius: 3, color: 'primary.main', display: 'flex' }}>
                <DescriptionIcon fontSize="large" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                Respaldo SQL
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3, flexGrow: 1, fontWeight: 500 }}>
              Genera un archivo SQL completo. Ideal para migración de servidores o restauración total del sistema ante desastres.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => crearRespaldo('sql', 'completo')}
              disabled={creandoRespaldo}
              startIcon={<StorageIcon />}
              sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)' }}
            >
              Generar Respaldo SQL
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'grey.100',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
              <Box sx={{ bgcolor: 'success.50', p: 1.5, borderRadius: 3, color: 'success.main', display: 'flex' }}>
                <TableChartIcon fontSize="large" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                Respaldo CSV
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3, flexGrow: 1, fontWeight: 500 }}>
              Exporta los datos en formato CSV para análisis en herramientas como Excel o Google Sheets.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              color="success"
              onClick={() => crearRespaldo('csv', 'completo')}
              disabled={creandoRespaldo}
              startIcon={<TableChartIcon />}
              sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)' }}
            >
              Generar Archivo CSV
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'grey.100',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
              <Box sx={{ bgcolor: 'warning.50', p: 1.5, borderRadius: 3, color: 'warning.main', display: 'flex' }}>
                <UploadFileIcon fontSize="large" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                Restaurar Datos
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3, flexGrow: 1, fontWeight: 500 }}>
              Carga un respaldo SQL previo para restaurar el sistema a un punto anterior. Los datos actuales se perderán.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              color="warning"
              onClick={() => setRestaurarDialogOpen(true)}
              sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 700, color: 'white' }}
            >
              Restaurar Sistema
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'grey.100',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
              <Box sx={{ bgcolor: 'error.50', p: 1.5, borderRadius: 3, color: 'error.main', display: 'flex' }}>
                <CleaningServicesIcon fontSize="large" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                Mantenimiento
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3, flexGrow: 1, fontWeight: 500 }}>
              Vacía los registros de asistencia para iniciar un nuevo ciclo escolar. Requiere confirmación de seguridad.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              color="error"
              onClick={() => setVaciarDialogOpen(true)}
              sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 700 }}
            >
              Vaciar Registros
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* LISTA DE RESPALDOS */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          bgcolor: 'white',
          border: '1px solid',
          borderColor: 'grey.100'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: '#1e293b',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <StorageIcon color="primary" />
          Respaldos Disponibles
        </Typography>

        {loading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2, fontWeight: 500 }}>
              Cargando historial de respaldos...
            </Typography>
          </Box>
        ) : respaldos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'grey.50', borderRadius: 4, border: '1px dashed', borderColor: 'grey.300' }}>
            <StorageIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 700 }}>
              No hay respaldos disponibles
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
              Crea tu primer respaldo usando las opciones superiores.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {respaldos.map((respaldo, index) => (
              <React.Fragment key={respaldo.nombre}>
                <ListItem
                  sx={{
                    px: 3,
                    py: 2.5,
                    border: '1px solid',
                    borderColor: 'grey.50',
                    borderRadius: 3,
                    mb: index < respaldos.length - 1 ? 2 : 0,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'grey.50',
                      borderColor: 'primary.light',
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                    {respaldo.formato === 'SQL' ? (
                      <Box sx={{ bgcolor: 'primary.50', p: 1.5, borderRadius: 3, color: 'primary.main' }}>
                        <DescriptionIcon fontSize="medium" />
                      </Box>
                    ) : (
                      <Box sx={{ bgcolor: 'success.50', p: 1.5, borderRadius: 3, color: 'success.main' }}>
                        <TableChartIcon fontSize="medium" />
                      </Box>
                    )}
                  </Box>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                          {respaldo.nombre}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={respaldo.tipo}
                            sx={{
                              bgcolor: respaldo.tipo === 'Completo' ? 'primary.50' : 'secondary.50',
                              color: respaldo.tipo === 'Completo' ? 'primary.main' : 'secondary.main',
                              fontWeight: 700,
                              borderRadius: 1.5,
                              fontSize: '0.7rem'
                            }}
                            size="small"
                          />
                          <Chip
                            label={respaldo.formato}
                            sx={{
                              bgcolor: respaldo.formato === 'SQL' ? 'success.50' : 'info.50',
                              color: respaldo.formato === 'SQL' ? 'success.main' : 'info.main',
                              fontWeight: 700,
                              borderRadius: 1.5,
                              fontSize: '0.7rem'
                            }}
                            size="small"
                          />
                        </Stack>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500, display: 'block', mb: 0.5 }}>
                          {respaldo.descripcion}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'grey.500', fontWeight: 600 }}>
                          📅 {formatearFecha(respaldo.fecha)} • 📦 {respaldo.tamano}
                        </Typography>
                      </Box>
                    }
                  />

                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Descargar Respaldo">
                      <IconButton
                        sx={{ bgcolor: 'primary.50', color: 'primary.main', '&:hover': { bgcolor: 'primary.100' } }}
                        onClick={() => descargarRespaldo(respaldo.nombre)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar definitivamente">
                      <IconButton
                        sx={{ bgcolor: 'error.50', color: 'error.main', '&:hover': { bgcolor: 'error.100' } }}
                        onClick={() => eliminarRespaldo(respaldo.nombre)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Dialog Restaurar */}
      <Dialog
        open={restaurarDialogOpen}
        onClose={() => {
          if (!restaurando) {
            setRestaurarDialogOpen(false);
            setArchivoRestauracion(null);
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 5, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white', py: 2.5, fontWeight: 800 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <UploadFileIcon />
            <Typography variant="h6" fontWeight="800">Restaurar base de datos</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Stack spacing={3}>
            <Alert severity="warning" sx={{ borderRadius: 3, fontWeight: 500 }}>
              Esta acción reemplazará todos los datos actuales. Asegúrate de tener una copia del estado actual si deseas conservarlo.
            </Alert>
            <input
              accept=".sql"
              style={{ display: 'none' }}
              id="archivo-restauracion"
              type="file"
              onChange={manejarArchivoRestauracion}
              disabled={restaurando}
            />
            <label htmlFor="archivo-restauracion">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                startIcon={<UploadFileIcon />}
                disabled={restaurando}
                sx={{ py: 2, borderRadius: 3, borderStyle: 'dashed', borderWidth: 2 }}
              >
                {archivoRestauracion ? 'Cambiar archivo seleccionado' : 'Seleccionar archivo .sql'}
              </Button>
            </label>
            {archivoRestauracion && (
              <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 3, border: '1px solid', borderColor: 'grey.200', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <DescriptionIcon color="warning" />
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {archivoRestauracion.name}
                </Typography>
              </Paper>
            )}
            {restaurando && (
              <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 1 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" fontWeight="600">Restaurando base de datos, por favor espere...</Typography>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button
            onClick={() => {
              setRestaurarDialogOpen(false);
              setArchivoRestauracion(null);
            }}
            disabled={restaurando}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={ejecutarRestauracion}
            disabled={!archivoRestauracion || restaurando}
            sx={{ borderRadius: 2.5, px: 4, fontWeight: 700, textTransform: 'none', color: 'white' }}
          >
            Confirmar Restauración
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Vaciar BD */}
      <Dialog
        open={vaciarDialogOpen}
        onClose={() => {
          if (!vaciando) {
            setVaciarDialogOpen(false);
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 5, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white', py: 2.5, fontWeight: 800 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <CleaningServicesIcon />
            <Typography variant="h6" fontWeight="800">Vaciar base de datos</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Stack spacing={3}>
            <Alert severity="error" sx={{ borderRadius: 3, fontWeight: 500 }}>
              Advertencia: Esta operación eliminará todas las asistencias y registros operativos. Asegúrate de tener un respaldo actualizado.
            </Alert>
            <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
              Para proceder con el borrado masivo de datos, es necesaria una validación de seguridad con tu contraseña.
            </Typography>
            <Box>
              <TextField
                fullWidth
                type="password"
                label="Confirmar con Contraseña"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoFocus
                disabled={vaciando}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
              />
            </Box>
            {vaciando && (
              <Stack direction="row" alignItems="center" spacing={2}>
                <CircularProgress size={24} color="error" />
                <Typography variant="body2" color="error" fontWeight="600">Vaciando base de datos...</Typography>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button onClick={() => setVaciarDialogOpen(false)} disabled={vaciando} sx={{ textTransform: 'none', fontWeight: 600 }}>
            No, Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={ejecutarVaciar}
            disabled={vaciando || !adminPassword}
            sx={{ borderRadius: 2.5, px: 4, fontWeight: 700, textTransform: 'none' }}
          >
            Sí, Vaciar Ahora
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Progreso */}
      <Dialog
        open={dialogOpen}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{ sx: { borderRadius: 5, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ bgcolor: '#1e293b', color: 'white', py: 2.5 }}>
          <Typography variant="h6" fontWeight="800">
            {creandoRespaldo ? 'Procesando Respaldo...' : 'Operación Completada'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 5, pb: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            {creandoRespaldo ? (
              <>
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                  <CircularProgress size={80} thickness={2} sx={{ color: 'primary.light' }} />
                  <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
                  Generando archivo {formatoRespaldo.toUpperCase()}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500, mb: 3 }}>
                  Estamos empaquetando la información de {tipoRespaldo}. Por favor, no cierre esta ventana.
                </Typography>
                <LinearProgress sx={{ height: 6, borderRadius: 3, mx: 4 }} />
              </>
            ) : (
              <>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    bgcolor: 'success.50',
                    color: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
                  ¡Todo listo!
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 500 }}>
                  El respaldo se ha generado correctamente y ya está disponible en la lista.
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        {!creandoRespaldo && (
          <DialogActions sx={{ p: 3, bgcolor: 'grey.50', justifyContent: 'center' }}>
            <Button
              onClick={() => setDialogOpen(false)}
              variant="contained"
              sx={{ borderRadius: 2.5, px: 6, py: 1, fontWeight: 700, textTransform: 'none' }}
            >
              Entendido
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default RespaldosNuevo;
