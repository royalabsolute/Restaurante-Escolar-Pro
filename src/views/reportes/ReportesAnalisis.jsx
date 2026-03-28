import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  ButtonGroup,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  TextField
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarMonthIcon,
  School as SchoolIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

// 🔥 COMPONENTE DE TARJETA DE ESTADÍSTICA REUTILIZABLE
const StatCard = ({ title, value, icon: Icon, color, loading, subtitle }) => {
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
          <AnalyticsIcon fontSize="medium" />
        )}
      </Box>
      <Box flex={1}>
        <Typography variant="caption" color="textSecondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight="800" sx={{ lineHeight: 1, mt: 0.5, color: '#1e293b' }}>
          {loading ? <CircularProgress size={20} /> : value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import ApiService from 'services/ApiService';
// ❌ ELIMINADO: react-toastify
// import { toast } from 'react-toastify';
// ✅ AGREGADO: Sistema unificado de notificaciones
import { useAuth } from 'hooks/useAuth';
import { useNotification } from 'contexts/NotificationContext';

const ReportesAnalisis = () => {
  // ✅ Hook de notificaciones unificado
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [tipoReporte, setTipoReporte] = useState('diario'); // 'diario' o 'mensual'
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);

  const [reporteDiario, setReporteDiario] = useState({});
  const [reporteMensual, setReporteMensual] = useState({});
  const [tendencias, setTendencias] = useState([]);
  // TODO: reincorporate estadísticas globales cuando el backend exponga el nuevo esquema

  useEffect(() => {
    loadData();
  }, [tipoReporte, fechaSeleccionada, mesSeleccionado, añoSeleccionado]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (tipoReporte === 'diario') {
        await loadReporteDiario();
      } else {
        await loadReporteMensual();
      }

      await loadTendencias();

    } catch (error) {
      console.error('Error al cargar datos:', error);
      showError('Error al cargar los datos de reportes');
    } finally {
      setLoading(false);
    }
  };

  const loadReporteDiario = async () => {
    try {
      const response = await ApiService.request('GET', `/reportes/diario?fecha=${fechaSeleccionada}`);
      if (response.status === 'SUCCESS') {
        setReporteDiario(response.data);
      }
    } catch (error) {
      console.error('Error al cargar reporte diario:', error);
    }
  };

  const loadReporteMensual = async () => {
    try {
      const response = await ApiService.request('GET', `/reportes/mensual?mes=${mesSeleccionado}&año=${añoSeleccionado}`);
      if (response.status === 'SUCCESS') {
        setReporteMensual(response.data);
      }
    } catch (error) {
      console.error('Error al cargar reporte mensual:', error);
    }
  };

  const loadTendencias = async () => {
    try {
      const response = await ApiService.request('GET', '/reportes/tendencias');
      if (response.status === 'SUCCESS') {
        const series = Array.isArray(response.data) ? response.data : [];
        const normalizadas = series.map((item) => ({
          fecha: item.fecha,
          asistencias: (item.estudiantes_asistencias || 0) + (item.suplentes_asistencias || 0),
          faltas: (item.estudiantes_faltas || 0) + (item.suplentes_faltas || 0),
          porcentaje: item.porcentaje_asistencia_global || 0
        }));
        setTendencias(normalizadas);
      }
    } catch (error) {
      console.error('Error al cargar tendencias:', error);
    }
  };

  const exportarReporte = async () => {
    try {
      const endpoint = tipoReporte === 'diario'
        ? `/reportes/exportar-diario?fecha=${fechaSeleccionada}`
        : `/reportes/exportar-mensual?mes=${mesSeleccionado}&año=${añoSeleccionado}`;

      const response = await ApiService.request('GET', endpoint);
      if (response.status === 'SUCCESS') {
        // Crear descarga del archivo
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `reporte-${tipoReporte}-${tipoReporte === 'diario' ? fechaSeleccionada : `${mesSeleccionado}-${añoSeleccionado}`}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        showSuccess('Reporte exportado exitosamente');
      }
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      showError('Error al exportar el reporte');
    }
  };

  const resumenFuente = tipoReporte === 'diario'
    ? {
      estudiantes: reporteDiario?.estudiantes || {},
      suplentes: reporteDiario?.suplentes || {},
      global: reporteDiario?.global || {},
      justificaciones: reporteDiario?.justificaciones_detalle || {},
      distribucionGrado: reporteDiario?.distribucion_por_grado || []
    }
    : {
      estudiantes: reporteMensual?.resumen?.estudiantes || {},
      suplentes: reporteMensual?.resumen?.suplentes || {},
      global: reporteMensual?.resumen?.global || {},
      justificaciones: reporteMensual?.resumen?.justificaciones || {},
      distribucionGrado: []
    };

  const dataActual = {
    asistencias_estudiantes: resumenFuente.estudiantes.asistencias || 0,
    faltas_estudiantes: resumenFuente.estudiantes.faltas_confirmadas || 0,
    asistencias_suplentes: resumenFuente.suplentes.asistencias || 0,
    faltas_suplentes: resumenFuente.suplentes.faltas_confirmadas || 0,
    justificaciones: resumenFuente.justificaciones.aprobadas || 0,
    porcentaje_asistencia_estudiantes: resumenFuente.estudiantes.porcentaje_asistencia || 0,
    porcentaje_asistencia_global: resumenFuente.global.porcentaje_asistencia || 0,
    por_grados: resumenFuente.distribucionGrado.map((item) => ({
      grado: item.label,
      asistencias: item.asistencias || 0,
      faltas: item.faltas_confirmadas || 0,
      porcentaje_asistencia: item.porcentaje_asistencia || 0
    }))
  };

  // Datos para gráficos
  const totalJustificaciones = (resumenFuente.justificaciones.total ?? dataActual.justificaciones) || 0;

  const datosGraficoBarras = [
    {
      categoria: 'Estudiantes',
      Asistencias: dataActual.asistencias_estudiantes || 0,
      Faltas: dataActual.faltas_estudiantes || 0,
      Justificaciones: totalJustificaciones || 0
    },
    {
      categoria: 'Suplentes',
      Asistencias: dataActual.asistencias_suplentes || 0,
      Faltas: dataActual.faltas_suplentes || 0,
      Justificaciones: 0
    }
  ];

  const datosPieChart = [
    { name: 'Asistencias', value: (dataActual.asistencias_estudiantes || 0) + (dataActual.asistencias_suplentes || 0), color: '#4caf50' },
    { name: 'Faltas', value: (dataActual.faltas_estudiantes || 0) + (dataActual.faltas_suplentes || 0), color: '#f44336' },
    { name: 'Justificaciones', value: totalJustificaciones || 0, color: '#ff9800' }
  ];

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

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
            ANÁLISIS Y REPORTES
          </Typography>
          <Typography variant="body1" color="textSecondary" fontWeight="500">
            Inteligencia de datos y seguimiento de métricas de asistencia
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<DownloadIcon />}
          onClick={exportarReporte}
          disabled={loading}
          sx={{ borderRadius: 3, fontWeight: 700, px: 4 }}
        >
          Exportar Excel
        </Button>
      </Box>

      {/* Controles de Filtro - Estilo Pro */}
      <Paper elevation={0} sx={{
        p: 2,
        mb: 4,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'grey.100',
        bgcolor: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 0.5, bgcolor: 'grey.50', borderRadius: 3, display: 'flex' }}>
              <Button
                fullWidth
                onClick={() => setTipoReporte('diario')}
                sx={{
                  borderRadius: 2.5,
                  py: 1,
                  fontWeight: 700,
                  bgcolor: tipoReporte === 'diario' ? 'white' : 'transparent',
                  color: tipoReporte === 'diario' ? 'primary.main' : 'text.secondary',
                  boxShadow: tipoReporte === 'diario' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  '&:hover': { bgcolor: tipoReporte === 'diario' ? 'white' : 'grey.100' }
                }}
              >
                Vista Diaria
              </Button>
              <Button
                fullWidth
                onClick={() => setTipoReporte('mensual')}
                sx={{
                  borderRadius: 2.5,
                  py: 1,
                  fontWeight: 700,
                  bgcolor: tipoReporte === 'mensual' ? 'white' : 'transparent',
                  color: tipoReporte === 'mensual' ? 'primary.main' : 'text.secondary',
                  boxShadow: tipoReporte === 'mensual' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                  '&:hover': { bgcolor: tipoReporte === 'mensual' ? 'white' : 'grey.100' }
                }}
              >
                Vista Mensual
              </Button>
            </Box>
          </Grid>

          {tipoReporte === 'diario' ? (
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Seleccionar Fecha"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
              />
            </Grid>
          ) : (
            <>
              <Grid item xs={12} md={2.5}>
                <FormControl fullWidth>
                  <InputLabel>Mes de Análisis</InputLabel>
                  <Select
                    value={mesSeleccionado}
                    label="Mes de Análisis"
                    onChange={(e) => setMesSeleccionado(e.target.value)}
                    sx={{ borderRadius: 3, bgcolor: 'grey.50' }}
                  >
                    {meses.map((mes) => (
                      <MenuItem key={mes.value} value={mes.value}>
                        {mes.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={1.5}>
                <FormControl fullWidth>
                  <InputLabel>Año</InputLabel>
                  <Select
                    value={añoSeleccionado}
                    label="Año"
                    onChange={(e) => setAñoSeleccionado(e.target.value)}
                    sx={{ borderRadius: 3, bgcolor: 'grey.50' }}
                  >
                    {[2023, 2024, 2025, 2026].map((año) => (
                      <MenuItem key={año} value={año}>
                        {año}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          <Grid item xs={12} md={tipoReporte === 'diario' ? 4 : 4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2 }}>
              <FilterListIcon color="action" />
              <Typography variant="body2" color="text.secondary" fontWeight="500">
                Filtrando por: <strong>{tipoReporte === 'diario' ? fechaSeleccionada : `${meses.find(m => m.value === mesSeleccionado).label} ${añoSeleccionado}`}</strong>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tarjetas de Resumen - Estilo Unificado */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Asistencias"
            value={(dataActual.asistencias_estudiantes || 0) + (dataActual.asistencias_suplentes || 0)}
            icon={CheckIcon}
            color="success"
            loading={loading}
            subtitle="Registros válidos hoy"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Faltas"
            value={(dataActual.faltas_estudiantes || 0) + (dataActual.faltas_suplentes || 0)}
            icon={CloseIcon}
            color="error"
            loading={loading}
            subtitle="Sin registro de entrada"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Justificaciones"
            value={totalJustificaciones || 0}
            icon={AssignmentIcon}
            color="warning"
            loading={loading}
            subtitle="Pendientes de revisión"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="% Asistencia"
            value={`${(dataActual.porcentaje_asistencia_estudiantes || 0).toFixed(1)}%`}
            icon={SchoolIcon}
            color="primary"
            loading={loading}
            subtitle="Tasa de participación"
          />
        </Grid>
      </Grid>

      {/* Gráficos */}
      {/* Gráficos - Estilo Moderno */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'grey.100' }}>
            <Typography variant="h6" fontWeight="800" gutterBottom color="#1e293b">
              Comparativo: Estudiantes vs Suplentes
            </Typography>
            <Box sx={{ mt: 3, height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGraficoBarras} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="categoria" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Asistencias" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                  <Bar dataKey="Faltas" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} />
                  <Bar dataKey="Justificaciones" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid', borderColor: 'grey.100', height: '100%' }}>
            <Typography variant="h6" fontWeight="800" gutterBottom color="#1e293b">
              Distribución Total
            </Typography>
            <Box sx={{ mt: 3, height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosPieChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {datosPieChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tendencias - Estilo Moderno */}
      {tipoReporte === 'mensual' && tendencias.length > 0 && (
        <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 4, border: '1px solid', borderColor: 'grey.100' }}>
          <Typography variant="h6" fontWeight="800" gutterBottom color="#1e293b">
            <TrendingUpIcon sx={{ verticalAlign: 'middle', mr: 1, color: 'primary.main' }} />
            Evolución Mensual de Asistencia
          </Typography>
          <Box sx={{ mt: 3, height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tendencias}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="asistencias" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="faltas" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}

      {/* Detalle por Grados - Estilo Pro */}
      {dataActual.por_grados && dataActual.por_grados.length > 0 && (
        <Paper elevation={0} sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'grey.100',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'grey.100', bgcolor: 'white' }}>
            <Typography variant="h6" fontWeight="800" color="#1e293b">
              📚 Desglose Detallado por Grados
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'grey.50', fontWeight: '700', color: 'text.secondary' } }}>
                  <TableCell>Grado Escolar</TableCell>
                  <TableCell align="center">Asistencias Confirmadas</TableCell>
                  <TableCell align="center">Inasistencias</TableCell>
                  <TableCell align="center">Tasa de Asistencia</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataActual.por_grados.map((grado) => {
                  const porcentaje = Number(grado.porcentaje_asistencia || 0);
                  const color = porcentaje >= 90 ? 'success.main'
                    : porcentaje >= 80 ? 'warning.main'
                      : 'error.main';

                  return (
                    <TableRow key={grado.grado} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="700">{grado.grado}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={grado.asistencias} sx={{ bgcolor: 'success.50', color: 'success.main', fontWeight: 700, borderRadius: 1.5 }} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={grado.faltas} sx={{ bgcolor: 'error.50', color: 'error.main', fontWeight: 700, borderRadius: 1.5 }} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <Box sx={{ width: 100, height: 8, bgcolor: 'grey.100', borderRadius: 4, overflow: 'hidden' }}>
                            <Box sx={{ width: `${porcentaje}%`, height: '100%', bgcolor: color, borderRadius: 4 }} />
                          </Box>
                          <Typography variant="body2" fontWeight="800" color={color} sx={{ minWidth: 45 }}>
                            {porcentaje.toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default ReportesAnalisis;
