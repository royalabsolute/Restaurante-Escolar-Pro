import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  Tooltip as MuiTooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  Assessment as AssessmentIcon,
  PendingActions as PendingActionsIcon,
  Warning as WarningIcon,
  ThumbUp as ThumbUpIcon,
  Info as InfoIcon,
  Restaurant as RestaurantIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Star as StarIcon,
  Psychology as PsychologyIcon,
  Send as SendIcon,
  AutoAwesome as AutoAwesomeIcon,
  Restaurant as MealIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  FileDownload as FileDownloadIcon,
  EmojiEvents as EmojiEventsIcon
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import ApiService from '../../services/ApiService';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import { Rnd } from 'react-rnd';

// Eliminadas JORNADAS estáticas

const BASE_COLUMNS = [
  { id: 'nombre', label: 'Nombre', type: 'string' },
  { id: 'apellidos', label: 'Apellidos', type: 'string' },
  { id: 'grado', label: 'Grado', type: 'string' },
  { id: 'jornada', label: 'Jornada', type: 'string' },
  { id: 'matricula', label: 'Matrícula', type: 'string' },
  { id: 'total_asistencias', label: 'Total Asistencias', type: 'number' },
  { id: 'total_faltas', label: 'Total Faltas', type: 'number' },
  { id: 'faltas_sin_justificar', label: 'Sin Justificar', type: 'number' },
  { id: 'faltas_justificadas', label: 'Justificadas', type: 'number' },
  { id: 'faltas_pendientes_revision', label: 'Pendientes', type: 'number' },
  { id: 'porcentaje_asistencia', label: '% Asistencia', type: 'number' }
];

const BASE_COLUMN_IDS = BASE_COLUMNS.map((column) => column.id);

const defaultStart = new Date();
defaultStart.setDate(1);

const defaultFilters = {
  startDate: defaultStart.toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  grades: [],
  jornadas: []
};

const defaultExportState = {
  open: false,
  format: 'xlsx',
  selectedColumns: [...BASE_COLUMN_IDS],
  filename: ''
};

const defaultSendState = {
  open: false,
  format: 'xlsx',
  selectedColumns: [...BASE_COLUMN_IDS],
  recipients: '',
  subject: '',
  message: ''
};

function formatPercent(value) {
  const numeric = Number.parseFloat(value);
  if (Number.isNaN(numeric)) {
    return '0%';
  }
  return `${Math.round(numeric * 100) / 100}%`;
}

// 🔥 COMPONENTE DE TARJETA DE ESTADÍSTICA REUTILIZABLE
const StatCard = ({ title, value, icon: Icon, color, loading, tooltip }) => {
  // ✅ Robustez: Verificar si el color es una clave de tema o un código HEX
  const isThemeColor = ['primary', 'secondary', 'error', 'info', 'success', 'warning'].includes(color);

  // ✅ Resolver colores de forma segura
  const mainColor = isThemeColor ? `${color}.main` : color;
  const bgColor = isThemeColor ? `${color}.50` : `${color}15`; // 15 es ~8% de opacidad para HEX

  return (
    <MuiTooltip title={tooltip} arrow placement="top">
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          gap: 2.5,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)',
            borderColor: isThemeColor ? `${color}.light` : color
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            bgcolor: mainColor
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
            justifyContent: 'center',
            boxShadow: isThemeColor ? `0 4px 12px ${color}20` : 'none'
          }}
        >
          {/* ✅ Seguridad: Solo renderiza si Icon es un componente válido */}
          {Icon && (typeof Icon === 'function' || typeof Icon === 'object') ? (
            <Icon fontSize="medium" />
          ) : (
            <InfoIcon fontSize="medium" />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {title}
            </Typography>
            <InfoIcon sx={{ fontSize: 14, color: 'text.disabled', alignSelf: 'flex-start', opacity: 0.5 }} />
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px' }}>
            {loading ? <CircularProgress size={20} /> : value}
          </Typography>
        </Box>
      </Paper>
    </MuiTooltip>
  );
};

const EstadisticasInformes = () => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const { showError, showSuccess } = useNotification();
  const [filters, setFilters] = useState(() => ({ ...defaultFilters }));
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [exportState, setExportState] = useState(() => ({ ...defaultExportState }));
  const [sendState, setSendState] = useState(() => ({ ...defaultSendState }));
  const [exporting, setExporting] = useState(false);
  const [sending, setSending] = useState(false);
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
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

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

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ApiService.post('/reportes/dashboard/overview', {
        startDate: filters.startDate,
        endDate: filters.endDate,
        filters: {
          grades: filters.grades,
          jornadas: filters.jornadas
        }
      });

      if (response?.status === 'SUCCESS') {
        setOverview(response.data);
      } else if (response?.data) {
        setOverview(response.data);
      } else {
        showError(response?.message || 'No se pudo obtener el resumen');
      }
    } catch (error) {
      console.error('Error cargando resumen del dashboard:', error);
      showError('Ocurrió un problema cargando las estadísticas');
    } finally {
      setLoading(false);
    }
  }, [filters.endDate, filters.grades, filters.jornadas, filters.startDate, showError]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const resumen = overview?.resumen || null;
  const datasetSummary = overview?.dataset?.summary || null;
  const trendSeries = overview?.attendance?.series || [];
  const cuentasSeries = overview?.cuentas?.series || [];
  const distribucionGrado = datasetSummary?.distribucionGrado || [];
  const distribucionJornada = datasetSummary?.distribucionJornada || [];

  const estudiantesAlerta = useMemo(() => {
    if (!overview?.dataset?.rows) {
      return [];
    }
    const sorted = [...overview.dataset.rows].sort((a, b) => (
      a.porcentaje_asistencia - b.porcentaje_asistencia
    ));
    return sorted.slice(0, 10);
  }, [overview]);

  const mejoresEstudiantes = useMemo(() => {
    if (!datasetSummary?.mejoresAsistencias) {
      return [];
    }
    return datasetSummary.mejoresAsistencias;
  }, [datasetSummary]);

  const selectedColumnsMap = useMemo(() => (
    new Map(BASE_COLUMNS.map((column) => [column.id, column]))
  ), []);

  const sortSelectedColumns = useCallback((ids) => (
    BASE_COLUMN_IDS.filter((columnId) => ids.includes(columnId))
  ), []);

  const resolveSelectedColumns = (ids) => (
    sortSelectedColumns(ids).map((id) => selectedColumnsMap.get(id)).filter(Boolean)
  );

  const buildBasePayload = useCallback(() => ({
    startDate: filters.startDate,
    endDate: filters.endDate,
    filters: {
      grades: filters.grades,
      jornadas: filters.jornadas
    }
  }), [filters.endDate, filters.grades, filters.jornadas, filters.startDate]);

  const handleExport = async () => {
    const columns = resolveSelectedColumns(exportState.selectedColumns);

    if (columns.length === 0) {
      showError('Selecciona al menos una columna para exportar');
      return;
    }

    setExporting(true);
    try {
      const api = await ApiService.ensureInitialized();
      const payload = {
        ...buildBasePayload(),
        format: exportState.format,
        columns,
        filename: exportState.filename?.trim() || undefined
      };

      const response = await api.post('/reportes/dashboard/exportar', payload, {
        responseType: 'blob'
      });

      const blob = response.data;
      if (!(blob instanceof Blob)) {
        showError('El archivo exportado es inválido');
        return;
      }

      let filename = exportState.filename?.trim();
      if (!filename) {
        const contentDisposition = response.headers?.['content-disposition'];
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^";]+)"?/i);
          if (match && match[1]) {
            filename = match[1];
          }
        }
      }

      if (!filename) {
        const extension = exportState.format === 'csv' ? 'csv' : 'xlsx';
        filename = `informe-estadisticas-${filters.startDate}-a-${filters.endDate}.${extension}`;
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(downloadUrl);
      anchor.remove();

      showSuccess('Informe exportado correctamente');
      setExportState((prev) => ({ ...prev, open: false }));
    } catch (error) {
      console.error('Error exportando informe:', error);
      showError('No fue posible exportar el informe solicitado');
    } finally {
      setExporting(false);
    }
  };

  const parseRecipients = (raw) => (
    raw
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.includes('@'))
  );

  const handleSend = async () => {
    const columns = resolveSelectedColumns(sendState.selectedColumns);

    if (columns.length === 0) {
      showError('Selecciona al menos una columna para adjuntar en el informe');
      return;
    }

    setSending(true);
    try {
      const payload = {
        ...buildBasePayload(),
        format: sendState.format,
        columns,
        destinatarios: parseRecipients(sendState.recipients),
        asunto: sendState.subject?.trim() || undefined,
        mensaje: sendState.message?.trim() || undefined
      };

      const response = await ApiService.post('/reportes/dashboard/enviar', payload);
      if (response?.status === 'SUCCESS') {
        showSuccess('Informe enviado correctamente');
        setSendState((prev) => ({ ...prev, open: false }));
      } else {
        showError(response?.message || 'No se pudo enviar el informe');
      }
    } catch (error) {
      console.error('Error enviando informe por correo:', error);
      showError('No fue posible enviar el informe por correo');
    } finally {
      setSending(false);
    }
  };

  const resetFilters = () => {
    setFilters({ ...defaultFilters });
    setOverview(null);
  };

  const handleAIAnalysis = async () => {
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    setAiResponse('');
    try {
      const response = await ApiService.post('/reportes/dashboard/analizar-ia', {
        data: {
          ...overview,
          groupBreakdown: overview.dataset?.summary?.distribucionGrado || []
        },
        question: aiQuestion
      });

      if (response?.status === 'SUCCESS') {
        setAiResponse(response.data.analysis);
      } else {
        showError(response?.message || 'Error en el análisis de IA');
      }
    } catch (error) {
      console.error('AI Error:', error);
      const msg = error.response?.data?.message || 'Ocurrió un problema consultando al asistente de IA';
      showError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* HEADER INSTITUCIONAL */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
            Estadísticas e Informes
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 0.5, fontWeight: 500 }}>
            Visualiza indicadores clave, tendencias y exporta informes personalizados.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={resetFilters}
            startIcon={<RefreshIcon />}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, px: 3 }}
          >
            Reiniciar
          </Button>
          <Button
            variant="contained"
            onClick={() => setExportState(prev => ({ ...prev, open: true }))}
            startIcon={<FileDownloadIcon />}
            sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, px: 3, boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)' }}
          >
            Exportar
          </Button>
        </Stack>
      </Box>

      {/* FILTROS MODERNOS */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
          bgcolor: 'white',
          border: '1px solid',
          borderColor: 'grey.100'
        }}
      >
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              label="Fecha inicio"
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
              label="Fecha fin"
              type="date"
              value={filters.endDate}
              onChange={(event) => handleFilterChange('endDate', event.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}>
              <InputLabel id="select-grados">Grados</InputLabel>
              <Select
                labelId="select-grados"
                multiple
                value={filters.grades}
                label="Grados"
                onChange={handleGradesChange}
                renderValue={(selected) => (
                  selected.length === 0 ? 'Todos' : selected.join(', ')
                )}
              >
                {gruposOptions.map((grado) => (
                  <MenuItem key={grado} value={grado}>
                    <Chip label={grado} size="small" color="primary" variant="outlined" />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="select-jornadas">Jornadas</InputLabel>
              <Select
                labelId="select-jornadas"
                multiple
                value={filters.jornadas}
                label="Jornadas"
                onChange={handleJornadasChange}
                renderValue={(selected) => (
                  selected.length === 0 ? 'Todas' : selected.join(', ')
                )}
              >
                {jornadasOptions.map((jornada) => (
                  <MenuItem key={jornada} value={jornada}>
                    <Chip label={jornada} size="small" color="secondary" variant="outlined" />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={loadOverview}
                disabled={loading}
                startIcon={<RefreshIcon />}
              >
                Aplicar filtros
              </Button>
              <Button
                variant="outlined"
                onClick={resetFilters}
                disabled={loading}
              >
                Restablecer
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<DownloadIcon />}
              onClick={() => setExportState((prev) => ({ ...prev, open: true }))}
            >
              Exportar informe
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<EmailIcon />}
              onClick={() => setSendState((prev) => ({ ...prev, open: true }))}
            >
              Enviar por correo
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={360}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !overview && (
        <Alert severity="info">Configura los filtros y aplica para visualizar el resumen.</Alert>
      )}

      {!loading && overview && resumen && (
        <>
          {/* INDICADORES CLAVE */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Asistencias"
                value={resumen?.total_asistencias || 0}
                icon={MealIcon}
                color="primary"
                loading={loading}
                tooltip="Número total de raciones servidas en el periodo seleccionado"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="% Asistencia"
                value={`${resumen?.porcentaje_promedio || 0}%`}
                icon={TrendingUpIcon}
                color="success"
                loading={loading}
                tooltip="Porcentaje promedio de asistencia sobre el total de estudiantes habilitados"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Estudiantes Atendidos"
                value={resumen?.estudiantes_unicos || 0}
                icon={PeopleIcon}
                color="info"
                loading={loading}
                tooltip="Número de estudiantes diferentes que han hecho uso del servicio"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Días de Servicio"
                value={resumen?.dias_periodo || 0}
                icon={CalendarIcon}
                color="warning"
                loading={loading}
                tooltip="Cantidades de días con registros en el rango seleccionado"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Fila 2: Análisis de Calidad y Faltas */}
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={TrendingUpIcon}
                title="Promedio Asistencia"
                value={formatPercent(resumen.promedioAsistencia)}
                color="primary"
                tooltip="Porcentaje promedio de asistencia de los estudiantes matriculados vs convocados."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={AssignmentTurnedInIcon}
                title="Tasa de Justificación"
                value={formatPercent(resumen.tasaJustificacion)}
                color="secondary"
                tooltip="Porcentaje de faltas totales que han sido respaldadas con una justificación válida."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={WarningIcon}
                title="Faltas Sin Justificar"
                value={resumen.totalFaltasSinJustificar}
                color="error"
                tooltip="Inasistencias que no tienen registro de excusa o justificación en el sistema."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={PendingActionsIcon}
                title="Faltas Pendientes"
                value={resumen.totalFaltasPendientes}
                color="warning"
                tooltip="Justificaciones cargadas en el sistema que aún no han sido revisadas por un coordinador."
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Fila 3: Insights Extra */}
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={StarIcon}
                title="Día de Mayor Demanda"
                value={resumen.diaMaxDemanda?.fecha !== 'N/D' ? new Date(resumen.diaMaxDemanda.fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long' }) : 'N/D'}
                color="warning"
                tooltip={`Día con mayor afluencia: ${resumen.diaMaxDemanda?.fecha} con ${resumen.diaMaxDemanda?.asistencias} asistencias.`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={PersonIcon}
                title="% Uso Suplentes"
                value={formatPercent(resumen.proporcionSuplentes)}
                color="info"
                tooltip="Participación de los estudiantes suplentes en el servicio a mesa."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={ThumbUpIcon}
                title="Cuentas Aprobadas"
                value={resumen.cuentasAprobadas}
                color="success"
                tooltip="Nuevos usuarios estudiantes cuya cuenta ha sido validada administrativamente."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={WarningIcon}
                title="Cuentas Pendientes"
                value={resumen.cuentasPendientes}
                color="warning"
                tooltip="Registros de nuevos estudiantes que están a la espera de ser vinculados a un grupo."
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Tendencia de asistencias vs faltas
                </Typography>
                {trendSeries.length === 0 ? (
                  <Alert severity="info">No hay datos de tendencia para el período seleccionado.</Alert>
                ) : (
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer>
                      <LineChart data={trendSeries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide />
                        <Tooltip />
                        <Line yAxisId="left" type="monotone" dataKey="asistencias_estudiantes" name="Asistencias estudiantes" stroke="#2e7d32" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line yAxisId="left" type="monotone" dataKey="faltas_estudiantes" name="Faltas estudiantes" stroke="#d32f2f" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line yAxisId="right" type="monotone" dataKey="porcentaje_asistencia" name="% Asistencia" stroke="#1976d2" strokeWidth={4} dot={false} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Estado de cuentas
                </Typography>
                {cuentasSeries.length === 0 ? (
                  <Alert severity="info">No se registran movimientos de cuentas en el período.</Alert>
                ) : (
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer>
                      <BarChart data={cuentasSeries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fecha" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="aprobadas" stackId="cuentas" fill="#2e7d32" name="Aprobadas" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="pendientes" stackId="cuentas" fill="#ed6c02" name="Pendientes" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="rechazadas" stackId="cuentas" fill="#d32f2f" name="Rechazadas" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Distribución por grado
                </Typography>
                {distribucionGrado.length === 0 ? (
                  <Alert severity="info">No hay distribución de grado para mostrar.</Alert>
                ) : (
                  <Box sx={{ height: 280 }}>
                    <ResponsiveContainer>
                      <BarChart data={distribucionGrado}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="grado" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="estudiantes" fill="#1976d2" name="Estudiantes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Distribución por jornada
                </Typography>
                {distribucionJornada.length === 0 ? (
                  <Alert severity="info">No hay distribución de jornada para mostrar.</Alert>
                ) : (
                  <Box sx={{ height: 280 }}>
                    <ResponsiveContainer>
                      <BarChart data={distribucionJornada}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="jornada" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="estudiantes" fill="#ff9800" name="Estudiantes" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* ALERTAS DE INASISTENCIA */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: '#fee2e2',
                  height: '100%'
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'error.50', color: 'error.main', display: 'flex' }}>
                    <WarningIcon />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    Alertas de Inasistencia
                  </Typography>
                </Stack>

                {estudiantesAlerta.length === 0 ? (
                  <Alert severity="success" sx={{ borderRadius: 3 }}>No hay estudiantes con alertas críticas de inasistencia.</Alert>
                ) : (
                  <Stack spacing={1.5}>
                    {estudiantesAlerta.map((student) => (
                      <Paper
                        key={student.id}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          bgcolor: 'grey.50',
                          border: '1px solid',
                          borderColor: 'grey.100',
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'translateX(8px)', borderColor: 'error.light' }
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {student.nombre} {student.apellidos}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {student.grado} • {student.jornada}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${student.porcentaje_asistencia}%`}
                            color="error"
                            size="small"
                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                          />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>

            {/* RECONOCIMIENTOS */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: '#dcfce7',
                  height: '100%'
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'success.50', color: 'success.main', display: 'flex' }}>
                    <EmojiEventsIcon />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    Reconocimientos (Top 10)
                  </Typography>
                </Stack>

                {mejoresEstudiantes.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 3 }}>Sin registros suficientes para destacar asistencias.</Alert>
                ) : (
                  <Stack spacing={1.5}>
                    {mejoresEstudiantes.map((student) => (
                      <Paper
                        key={student.id}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          bgcolor: 'grey.50',
                          border: '1px solid',
                          borderColor: 'grey.100',
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'translateX(8px)', borderColor: 'success.light' }
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {student.nombre} {student.apellidos}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {student.grado} • {student.jornada}
                            </Typography>
                          </Box>
                          <Chip
                            label={`${student.porcentaje_asistencia}%`}
                            color="success"
                            size="small"
                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                          />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      <Dialog
        fullWidth
        maxWidth="sm"
        open={exportState.open}
        onClose={() => setExportState((prev) => ({ ...prev, open: false }))}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Exportar informe</span>
          <IconButton onClick={() => setExportState((prev) => ({ ...prev, open: false }))}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Nombre de archivo (opcional)"
              value={exportState.filename}
              onChange={(event) => setExportState((prev) => ({ ...prev, filename: event.target.value }))}
              placeholder="informe-estadisticas.xlsx"
            />
            <FormControl fullWidth>
              <InputLabel id="export-format-label">Formato</InputLabel>
              <Select
                labelId="export-format-label"
                value={exportState.format}
                label="Formato"
                onChange={(event) => setExportState((prev) => ({ ...prev, format: event.target.value }))}
              >
                <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
                <MenuItem value="csv">Valores separados por coma (.csv)</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Columnas a incluir
              </Typography>
              <FormGroup>
                {BASE_COLUMNS.map((column) => (
                  <FormControlLabel
                    key={column.id}
                    control={(
                      <Switch
                        checked={exportState.selectedColumns.includes(column.id)}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setExportState((prev) => {
                            const updated = checked
                              ? Array.from(new Set([...prev.selectedColumns, column.id]))
                              : prev.selectedColumns.filter((item) => item !== column.id);
                            return {
                              ...prev,
                              selectedColumns: sortSelectedColumns(updated)
                            };
                          });
                        }}
                      />
                    )}
                    label={column.label}
                  />
                ))}
              </FormGroup>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportState((prev) => ({ ...prev, open: false }))}>Cancelar</Button>
          <Button onClick={handleExport} variant="contained" disabled={exporting}>
            {exporting ? 'Exportando…' : 'Exportar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="sm"
        open={sendState.open}
        onClose={() => setSendState((prev) => ({ ...prev, open: false }))}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Enviar informe por correo</span>
          <IconButton onClick={() => setSendState((prev) => ({ ...prev, open: false }))}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info">
              El informe se envía siempre al correo institucional <strong>restaurante@iesanantoniodeprado.edu.co</strong>.
              Agrega correos adicionales separados por coma si lo necesitas.
            </Alert>
            <TextField
              label="Correos adicionales"
              helperText="Separa múltiples correos con coma"
              value={sendState.recipients}
              onChange={(event) => setSendState((prev) => ({ ...prev, recipients: event.target.value }))}
            />
            <TextField
              label="Asunto"
              value={sendState.subject}
              onChange={(event) => setSendState((prev) => ({ ...prev, subject: event.target.value }))}
            />
            <TextField
              label="Mensaje"
              value={sendState.message}
              onChange={(event) => setSendState((prev) => ({ ...prev, message: event.target.value }))}
              multiline
              minRows={3}
            />
            <FormControl fullWidth>
              <InputLabel id="send-format-label">Formato</InputLabel>
              <Select
                labelId="send-format-label"
                value={sendState.format}
                label="Formato"
                onChange={(event) => setSendState((prev) => ({ ...prev, format: event.target.value }))}
              >
                <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
                <MenuItem value="csv">Valores separados por coma (.csv)</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Columnas a adjuntar
              </Typography>
              <FormGroup>
                {BASE_COLUMNS.map((column) => (
                  <FormControlLabel
                    key={column.id}
                    control={(
                      <Switch
                        checked={sendState.selectedColumns.includes(column.id)}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          setSendState((prev) => {
                            const updated = checked
                              ? Array.from(new Set([...prev.selectedColumns, column.id]))
                              : prev.selectedColumns.filter((item) => item !== column.id);
                            return {
                              ...prev,
                              selectedColumns: sortSelectedColumns(updated)
                            };
                          });
                        }}
                      />
                    )}
                    label={column.label}
                  />
                ))}
              </FormGroup>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendState((prev) => ({ ...prev, open: false }))}>Cancelar</Button>
          <Button onClick={handleSend} variant="contained" disabled={sending}>
            {sending ? 'Enviando…' : 'Enviar informe'}
          </Button>
        </DialogActions>
      </Dialog>

      {
        aiOpen && (
          <Rnd
            default={{
              x: isMobile ? 0 : window.innerWidth - 420,
              y: isMobile ? window.innerHeight - 500 : window.innerHeight - 600,
              width: isMobile ? '100vw' : 380,
              height: isMobile ? 500 : 500,
            }}
            disableDragging={isMobile}
            enableResizing={!isMobile}
            minWidth={isMobile ? '100vw' : 320}
            minHeight={400}
            bounds="window"
            dragHandleClassName="chat-header"
            style={{ zIndex: 1300, display: 'flex', position: 'fixed' }}
          >
            <Paper
              elevation={10}
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: isMobile ? 0 : 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'primary.main',
                boxShadow: '0 12px 40px rgba(0,0,0,0.2)'
              }}
            >
              {/* Header Draggable */}
              <Box
                className="chat-header"
                sx={{
                  p: 2,
                  bgcolor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: isMobile ? 'default' : 'move',
                  flexShrink: 0
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <AutoAwesomeIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                      Analista de IA
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      En línea • San Antonio de Prado
                    </Typography>
                  </Box>
                </Stack>
                <IconButton size="small" onClick={() => setAiOpen(false)} sx={{ color: 'white' }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Chat Content */}
              <Box
                sx={{
                  flexGrow: 1,
                  p: 2,
                  overflowY: 'auto',
                  bgcolor: '#f8f9fa',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                <Box
                  sx={{
                    alignSelf: 'flex-start',
                    maxWidth: '85%',
                    p: 1.5,
                    borderRadius: '16px 16px 16px 4px',
                    bgcolor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    border: '1px solid #eee'
                  }}
                >
                  <Typography variant="body2" color="text.primary">
                    Hola, soy tu Analista de IA. Analicé los datos actuales de la institución. ¿En qué puedo ayudarte hoy?
                  </Typography>
                </Box>

                {aiResponse && (
                  <Box
                    sx={{
                      alignSelf: 'flex-start',
                      maxWidth: '90%',
                      p: 2,
                      borderRadius: '16px 16px 16px 4px',
                      bgcolor: 'white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      borderLeft: '4px solid #1976d2'
                    }}
                  >
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                      INFORME ANALÍTICO:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {aiResponse}
                    </Typography>
                  </Box>
                )}

                {aiLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      Procesando datos...
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Input Area */}
              <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #eee', flexShrink: 0 }}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Escribe tu consulta..."
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAIAnalysis()}
                    disabled={aiLoading}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 4,
                        bgcolor: '#f1f3f4'
                      }
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleAIAnalysis}
                    disabled={aiLoading || !aiQuestion.trim()}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '&.Mui-disabled': { bgcolor: '#eee' }
                    }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            </Paper>
          </Rnd>
        )
      }

      {/* FAB - Solo se muestra si el chat está cerrado */}
      {
        !aiOpen && (
          <Box sx={{ position: 'fixed', bottom: isMobile ? 16 : 32, right: isMobile ? 16 : 32, zIndex: 1200 }}>
            <MuiTooltip title="Abrir Analista de IA" arrow placement="left">
              <Button
                variant="contained"
                color="primary"
                onClick={() => setAiOpen(true)}
                sx={{
                  width: isMobile ? 56 : 64,
                  height: isMobile ? 56 : 64,
                  borderRadius: '50%',
                  boxShadow: '0 8px 32px rgba(25, 118, 210, 0.4)',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: '0 12px 40px rgba(25, 118, 210, 0.5)'
                  }
                }}
              >
                <PsychologyIcon sx={{ fontSize: isMobile ? 28 : 32 }} />
              </Button>
            </MuiTooltip>
          </Box>
        )
      }
    </Box >
  );
};

export default EstadisticasInformes;
