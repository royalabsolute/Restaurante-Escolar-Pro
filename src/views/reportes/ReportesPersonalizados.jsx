import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
  Chip,
  Stack,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  FilterAlt as FilterAltIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Send as SendIcon,
  Close as CloseIcon,
  BarChart as BarChartIcon,
  Assessment as AssessmentIcon,
  PeopleAlt as PeopleAltIcon,
  Percent as PercentIcon,
  School as SchoolIcon,
  InfoOutlined as InfoOutlinedIcon
} from '@mui/icons-material';
import { useAuth } from 'hooks/useAuth';
import ApiService from 'services/ApiService';
import { useNotification } from 'contexts/NotificationContext';

// 🔥 COMPONENTE DE TARJETA DE ESTADÍSTICA REUTILIZABLE
const StatCard = ({ title, value, icon: Icon, color, loading }) => {
  const isThemeColor = ['primary', 'secondary', 'error', 'info', 'success', 'warning'].includes(color);
  const mainColor = isThemeColor ? `${color}.main` : color;
  const bgColor = isThemeColor ? `${color}.50` : `${color}15`;

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
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
          borderColor: isThemeColor ? 'primary.light' : color
        }
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderRadius: 3,
          bgcolor: bgColor,
          color: mainColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* ✅ Seguridad: Validar tipo de Icon */}
        {Icon && (typeof Icon === 'function' || typeof Icon === 'object') ? (
          <Icon fontSize="medium" />
        ) : (
          <AssessmentIcon fontSize="medium" />
        )}
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


// Eliminadas JORNADAS estáticas

const defaultStart = new Date();
defaultStart.setDate(1);

const defaultFilters = {
  startDate: defaultStart.toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  grades: [],
  jornadas: [],
  studentIds: []
};

function uniqueEmails(list) {
  const set = new Set();
  list.forEach((item) => {
    if (item && item.includes('@')) {
      set.add(item.trim());
    }
  });
  return Array.from(set);
}

const ReportesPersonalizados = () => {
  const { showError, showSuccess } = useNotification();
  const [filters, setFilters] = useState(() => ({ ...defaultFilters }));
  const [loading, setLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [recipientOptions, setRecipientOptions] = useState([]);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    selected: [],
    extras: '',
    subject: 'Reporte personalizado de asistencia',
    message: '',
    format: 'xlsx'
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [gruposOptions, setGruposOptions] = useState([]);
  const [jornadasOptions, setJornadasOptions] = useState([]);

  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const response = await ApiService.get('/groups');
        if (response?.status === 'SUCCESS') {
          const uniqueGrades = [...new Set(response.data.map(g => g.nombre))].sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
          });
          const uniqueJornadas = [...new Set(response.data.map(g => g.jornada))].sort();

          setGruposOptions(uniqueGrades);
          setJornadasOptions(uniqueJornadas);
        }
      } catch (error) {
        console.error('Error cargando datos de filtros:', error);
      }
    };

    loadFiltersData();
  }, []);

  useEffect(() => {
    const loadDestinatarios = async () => {
      try {
        const response = await ApiService.request('GET', '/reportes/destinatarios');
        if (response?.status === 'SUCCESS') {
          setRecipientOptions(response.data || []);
        }
      } catch (error) {
        console.error('Error cargando destinatarios por defecto:', error);
      }
    };

    loadDestinatarios();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGradesChange = (event) => {
    handleFilterChange('grades', event.target.value);
  };

  const handleJornadasChange = (event) => {
    handleFilterChange('jornadas', event.target.value);
  };

  const loadPreview = async () => {
    try {
      setLoading(true);
      const response = await ApiService.post('/reportes/custom/preview', filters);
      if (response?.status === 'SUCCESS') {
        setPreviewRows(response.data?.rows || []);
        setSummary(response.data?.summary || null);
        setMetadata(response.data?.metadata || null);
        setLastRefresh(new Date());
        showSuccess('Reporte generado correctamente');
      } else {
        showError(response?.message || 'No fue posible generar el reporte');
      }
    } catch (error) {
      console.error('Error generando vista previa:', error);
      showError('Error al generar la vista previa');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    try {
      const api = await ApiService.ensureInitialized();
      const response = await api.post(
        '/reportes/custom/export',
        { ...filters, format },
        { responseType: 'blob' }
      );

      const blob = response.data;
      const disposition = response.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const filename = match ? match[1] : `reporte-personalizado.${format}`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess('Exportación iniciada');
    } catch (error) {
      console.error('Error exportando reporte:', error);
      showError('No fue posible exportar el reporte');
    }
  };

  const openDetail = async (row) => {
    setSelectedRow(row);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);

    try {
      const params = new URLSearchParams();
      if (metadata?.periodo?.inicio) {
        params.append('startDate', metadata.periodo.inicio);
      } else if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (metadata?.periodo?.fin) {
        params.append('endDate', metadata.periodo.fin);
      } else if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }

      const response = await ApiService.get(`/students/${row.id}/reportes-detalle?${params.toString()}`);
      if (response?.status === 'SUCCESS') {
        setDetailData(response.data);
      } else {
        showError(response?.message || 'No fue posible obtener el detalle');
      }
    } catch (error) {
      console.error('Error cargando detalle de estudiante:', error);
      showError('Error al cargar el detalle del estudiante');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailData(null);
    setSelectedRow(null);
  };

  const selectedRecipientEmails = useMemo(() => {
    const preset = emailForm.selected
      .map((id) => recipientOptions.find((recipient) => recipient.id === id)?.email)
      .filter(Boolean);

    const extras = emailForm.extras
      .split(/[,;\s]+/)
      .map((item) => item.trim())
      .filter((item) => item.includes('@'));

    return uniqueEmails([...preset, ...extras]);
  }, [emailForm.selected, emailForm.extras, recipientOptions]);

  const openEmailDialog = () => {
    if (previewRows.length === 0) {
      showError('Genera la vista previa antes de enviar el reporte');
      return;
    }
    setEmailDialogOpen(true);
  };

  const closeEmailDialog = () => {
    setEmailDialogOpen(false);
  };

  const handleEmailRecipientToggle = (id) => {
    setEmailForm((prev) => {
      const alreadySelected = prev.selected.includes(id);
      return {
        ...prev,
        selected: alreadySelected
          ? prev.selected.filter((value) => value !== id)
          : [...prev.selected, id]
      };
    });
  };

  const handleEmailFieldChange = (field, value) => {
    setEmailForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const sendEmail = async () => {
    if (selectedRecipientEmails.length === 0) {
      showError('Selecciona al menos un destinatario o agrega correos adicionales');
      return;
    }

    setSendingEmail(true);
    try {
      const payload = {
        destinatarios: selectedRecipientEmails,
        asunto: emailForm.subject,
        mensaje: emailForm.message,
        format: emailForm.format,
        filtros: filters
      };

      const response = await ApiService.post('/reportes/custom/enviar', payload);
      if (response?.status === 'SUCCESS') {
        showSuccess('Reporte enviado por correo');
        setEmailDialogOpen(false);
      } else {
        showError(response?.message || 'No fue posible enviar el reporte');
      }
    } catch (error) {
      console.error('Error enviando correo:', error);
      showError('Error al enviar el correo con el reporte');
    } finally {
      setSendingEmail(false);
    }
  };

  const headerSubtitle = useMemo(() => {
    if (!metadata?.periodo) {
      return 'Configura los filtros y genera la vista previa deseada';
    }
    return `Período del ${metadata.periodo.inicio} al ${metadata.periodo.fin}`;
  }, [metadata]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, mx: 'auto' }}>
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
            REPORTES PERSONALIZADOS
          </Typography>
          <Typography variant="body1" color="textSecondary" fontWeight="500">
            {headerSubtitle}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<RefreshIcon />}
            onClick={() => {
              setFilters({ ...defaultFilters });
              setPreviewRows([]);
              setSummary(null);
              setMetadata(null);
            }}
            sx={{ borderRadius: 3, fontWeight: 700 }}
          >
            Reiniciar
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<FilterAltIcon />}
            onClick={loadPreview}
            disabled={loading}
            sx={{ borderRadius: 3, fontWeight: 700, px: 3 }}
          >
            Generar Reporte
          </Button>
        </Stack>
      </Box>

      {/* Filtros Avanzados - Estilo Pro */}
      <Paper elevation={0} sx={{
        p: 3,
        mb: 4,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'grey.100',
        bgcolor: 'white'
      }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              label="Fecha Inicio"
              type="date"
              value={filters.startDate}
              onChange={(event) => handleFilterChange('startDate', event.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Fecha Fin"
              type="date"
              value={filters.endDate}
              onChange={(event) => handleFilterChange('endDate', event.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Grados Escolares</InputLabel>
              <Select
                multiple
                value={filters.grades}
                label="Grados Escolares"
                onChange={handleGradesChange}
                sx={{ borderRadius: 3, bgcolor: 'grey.50' }}
                renderValue={(selected) => selected.length === 0 ? 'Todos los grados' : `${selected.length} seleccionados`}
              >
                {gruposOptions.map((grado) => (
                  <MenuItem key={grado} value={grado}>
                    <Checkbox checked={filters.grades.indexOf(grado) > -1} />
                    <ListItemText primary={grado} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Jornadas</InputLabel>
              <Select
                multiple
                value={filters.jornadas}
                label="Jornadas"
                onChange={handleJornadasChange}
                sx={{ borderRadius: 3, bgcolor: 'grey.50' }}
                renderValue={(selected) => selected.length === 0 ? 'Todas las jornadas' : selected.join(', ')}
              >
                {jornadasOptions.map((jornada) => (
                  <MenuItem key={jornada} value={jornada}>
                    <Checkbox checked={filters.jornadas.indexOf(jornada) > -1} />
                    <ListItemText primary={jornada} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Acciones de Exportación Rápidas */}
      {previewRows.length > 0 && (
        <Box sx={{ mb: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => exportReport('xlsx')}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            Excel .xlsx
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => exportReport('csv')}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            CSV .csv
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<SendIcon />}
            onClick={openEmailDialog}
            sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
          >
            Enviar por Correo
          </Button>
        </Box>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={240}>
          <CircularProgress />
        </Box>
      )}

      {!loading && previewRows.length === 0 && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
          Configura los filtros y genera un reporte para visualizar resultados.
        </Alert>
      )}

      {!loading && previewRows.length > 0 && summary && (
        <>
          {/* Tarjetas de Resumen Estilo Unificado */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Estudiantes" value={summary.totalEstudiantes} icon={PeopleAltIcon} color="primary" loading={loading} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Asistencias" value={summary.totalAsistencias} icon={BarChartIcon} color="success" loading={loading} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Faltas Totales" value={summary.totalFaltas} icon={AssessmentIcon} color="error" loading={loading} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="% Promedio" value={`${summary.promedioAsistencia}%`} icon={PercentIcon} color="info" loading={loading} />
            </Grid>
          </Grid>

          {/* Tabla de Detalle - Estilo Pro */}
          <Paper elevation={0} sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'grey.100',
            overflow: 'hidden',
            mb: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'grey.100', bgcolor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="800" color="#1e293b">
                Listado Detallado por Estudiante
              </Typography>
              {lastRefresh && (
                <Chip
                  label={`Actualizado: ${lastRefresh.toLocaleTimeString()}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600, color: 'text.secondary' }}
                />
              )}
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: '700', color: 'text.secondary' } }}>
                    <TableCell>Estudiante</TableCell>
                    <TableCell>Grado</TableCell>
                    <TableCell>Jornada</TableCell>
                    <TableCell align="center">Días Hábitos</TableCell>
                    <TableCell align="center">Asistencias</TableCell>
                    <TableCell align="center">Faltas</TableCell>
                    <TableCell align="center">Sin Justificar</TableCell>
                    <TableCell align="center">% Asistencia</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewRows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {row.nombre} {row.apellidos}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Mat: {row.matricula || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.grado}</TableCell>
                      <TableCell>{row.jornada}</TableCell>
                      <TableCell align="center">{row.oportunidades}</TableCell>
                      <TableCell align="center" sx={{ color: 'success.main', fontWeight: 700 }}>{row.total_asistencias}</TableCell>
                      <TableCell align="center" sx={{ color: 'error.light', fontWeight: 700 }}>{row.total_faltas}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.faltas_sin_justificar}
                          sx={{
                            bgcolor: row.faltas_sin_justificar > 0 ? 'error.50' : 'success.50',
                            color: row.faltas_sin_justificar > 0 ? 'error.main' : 'success.main',
                            fontWeight: 800,
                            borderRadius: 1.5,
                            minWidth: 32
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 800,
                            color: row.porcentaje_asistencia >= 90
                              ? 'success.main'
                              : row.porcentaje_asistencia >= 80
                                ? 'warning.main'
                                : 'error.main'
                          }}
                        >
                          {row.porcentaje_asistencia}%
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          onClick={() => openDetail(row)}
                          sx={{ fontWeight: 700, borderRadius: 2 }}
                        >
                          Ver Historial
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* TOPs y Alertas - Estilo Pro */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'grey.100', height: '100%', bgcolor: 'white' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'success.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BarChartIcon /> Mejores Asistencias
                </Typography>
                <Stack spacing={2}>
                  {summary.mejoresAsistencias.map((item) => (
                    <Box key={item.id} sx={{ p: 2, bgcolor: 'success.50', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" fontWeight="700">{item.nombre} {item.apellidos}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.grado} • {item.jornada}</Typography>
                      </Box>
                      <Chip label={`${item.porcentaje_asistencia}%`} sx={{ bgcolor: 'white', color: 'success.main', fontWeight: 800 }} size="small" />
                    </Box>
                  ))}
                  {summary.mejoresAsistencias.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 4 }}>
                      No hay datos suficientes para este período.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'grey.100', height: '100%', bgcolor: 'white' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'error.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon /> Alertas de Deserción
                </Typography>
                <Stack spacing={2}>
                  {summary.alertasAusentismo.map((item) => (
                    <Box key={item.id} sx={{ p: 2, bgcolor: 'error.50', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" fontWeight="700">{item.nombre} {item.apellidos}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.grado} • {item.jornada}</Typography>
                      </Box>
                      <Chip label={`${item.faltas_sin_justificar} Faltas`} sx={{ bgcolor: 'white', color: 'error.main', fontWeight: 800 }} size="small" />
                    </Box>
                  ))}
                  {summary.alertasAusentismo.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 4 }}>
                      ¡Excelente! No hay alertas registradas.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* Dialogo Detalles Estudiante */}
      <Dialog fullWidth maxWidth="md" open={detailOpen} onClose={closeDetail} PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.50', color: 'primary.main', display: 'flex' }}>
              <InfoOutlinedIcon />
            </Box>
            <Typography variant="h5" fontWeight="800">Detalle Académico</Typography>
          </Stack>
          <IconButton onClick={closeDetail} sx={{ bgcolor: 'grey.100' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {detailLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
              <CircularProgress />
            </Box>
          ) : detailData && selectedRow ? (
            <Box sx={{ p: 3 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="800" color="#1e293b">
                  {selectedRow.nombre} {selectedRow.apellidos}
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight="500">
                  Grado {selectedRow.grado} • Jornada {selectedRow.jornada}
                </Typography>
              </Box>

              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="800" color="success.main">{detailData.resumen?.total_asistencias ?? 0}</Typography>
                    <Typography variant="caption" fontWeight="600" color="text.secondary">ASISTENCIAS</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="800" color="error.light">{detailData.resumen?.total_faltas ?? 0}</Typography>
                    <Typography variant="caption" fontWeight="600" color="text.secondary">FALTAS TOTALES</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="800" color="error.main">{detailData.resumen?.faltas_sin_justificar ?? 0}</Typography>
                    <Typography variant="caption" fontWeight="600" color="text.secondary">SIN JUSTIFICAR</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="800" color="info.main">{detailData.resumen?.porcentaje_asistencia ?? 0}%</Typography>
                    <Typography variant="caption" fontWeight="600" color="text.secondary">% ASISTENCIA</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="h6" fontWeight="800" sx={{ mb: 2 }}>Cronología de Eventos</Typography>
              <Stack spacing={1.5}>
                {detailData.eventos.length === 0 && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>No hay eventos registrados en este período.</Alert>
                )}
                {detailData.eventos.map((evento, index) => (
                  <Paper key={index} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'grey.100', transition: 'all 0.2s', '&:hover': { bgcolor: 'grey.50' } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                          label={evento.tipo === 'asistencia' ? 'Asistencia' : `Justificación ${evento.estado || ''}`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: evento.tipo === 'asistencia' ? 'success.50' : evento.estado === 'aprobada' ? 'info.50' : 'warning.50',
                            color: evento.tipo === 'asistencia' ? 'success.dark' : evento.estado === 'aprobada' ? 'info.dark' : 'warning.dark'
                          }}
                        />
                        <Typography variant="body2" fontWeight="700">{evento.fecha}</Typography>
                        <Typography variant="caption" color="text.secondary">{evento.hora}</Typography>
                      </Stack>
                    </Stack>
                    {(evento.motivo || evento.observaciones) && (
                      <Box sx={{ mt: 1, pl: 1, borderLeft: '2px solid', borderColor: 'grey.200' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {evento.motivo || evento.observaciones}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button onClick={closeDetail} variant="outlined" sx={{ borderRadius: 2, fontWeight: 700 }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialogo Enviar Correo */}
      <Dialog fullWidth maxWidth="sm" open={emailDialogOpen} onClose={closeEmailDialog} PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ p: 3, fontWeight: 800 }}>Enviar Informe por Correo</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Selecciona los destinatarios o añade correos externos para enviar el informe actual.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 1.5 }}>Destinatarios Institucionales</Typography>
            <Stack spacing={1}>
              {recipientOptions.map((recipient) => (
                <Box key={recipient.id} onClick={() => handleEmailRecipientToggle(recipient.id)} sx={{
                  p: 1.5, borderRadius: 2, cursor: 'pointer', border: '1px solid',
                  borderColor: emailForm.selected.includes(recipient.id) ? 'primary.main' : 'grey.100',
                  bgcolor: emailForm.selected.includes(recipient.id) ? 'primary.50' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 2, transition: 'all 0.2s'
                }}>
                  <Checkbox
                    checked={emailForm.selected.includes(recipient.id)}
                    size="small"
                    sx={{ p: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => handleEmailRecipientToggle(recipient.id)}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight="700">{recipient.nombre} {recipient.apellidos}</Typography>
                    <Typography variant="caption" color="text.secondary">{recipient.email}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>

          <Stack spacing={2}>
            <TextField
              label="Correos Adicionales"
              placeholder="institucion@ejemplo.com; admin@correo.com"
              value={emailForm.extras}
              onChange={(event) => handleEmailFieldChange('extras', event.target.value)}
              fullWidth
              variant="filled"
              sx={{ '& .MuiFilledInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Asunto del Mensaje"
              value={emailForm.subject}
              onChange={(event) => handleEmailFieldChange('subject', event.target.value)}
              fullWidth
              variant="filled"
              sx={{ '& .MuiFilledInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Mensaje Adicional"
              value={emailForm.message}
              onChange={(event) => handleEmailFieldChange('message', event.target.value)}
              fullWidth
              multiline
              rows={3}
              variant="filled"
              sx={{ '& .MuiFilledInput-root': { borderRadius: 2 } }}
            />
            <FormControl fullWidth variant="filled">
              <InputLabel>Formato de Archivo</InputLabel>
              <Select
                value={emailForm.format}
                onChange={(event) => handleEmailFieldChange('format', event.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="xlsx">Microsoft Excel (.xlsx)</MenuItem>
                <MenuItem value="csv">Valores Separados por Coma (.csv)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={closeEmailDialog} sx={{ fontWeight: 700 }}>Cancelar</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={sendEmail}
            disabled={sendingEmail}
            sx={{ borderRadius: 2.5, px: 4, fontWeight: 700 }}
          >
            {sendingEmail ? 'Enviando...' : 'Enviar Informe'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportesPersonalizados;
