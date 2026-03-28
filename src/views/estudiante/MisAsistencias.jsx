import { useState, useEffect, useCallback, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Stack,
  Fab,
  TextField,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  EventAvailable as PresentIcon,
  EventBusy as AbsentIcon,
  Assignment as JustifiedIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as StatsIcon,
  Warning as WarningIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

import ApiService from 'services/ApiService';
// ✅ AGREGADO: Sistema unificado de componentes
import StatCard from 'components/common/StatCard';
import { useNotification } from 'contexts/NotificationContext';

const MONTH_OPTIONS = [
  { value: 0, label: 'Enero' },
  { value: 1, label: 'Febrero' },
  { value: 2, label: 'Marzo' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Mayo' },
  { value: 5, label: 'Junio' },
  { value: 6, label: 'Julio' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Septiembre' },
  { value: 9, label: 'Octubre' },
  { value: 10, label: 'Noviembre' },
  { value: 11, label: 'Diciembre' }
];

const MOTIVOS_COMUNES = [
  'Cita médica',
  'Enfermedad',
  'Calamidad doméstica',
  'Viaje familiar autorizado',
  'Trámites personales',
  'Emergencia familiar',
  'Otro'
];

const CONSECUTIVE_COLORS = {
  critical: { bg: '#FFEBEE', color: '#C62828', border: '#f44336' },
  warning: { bg: '#FFF3E0', color: '#F57C00', border: '#fb8c00' },
  notice: { bg: '#FFFDE7', color: '#F9A825', border: '#fbc02d' },
  ok: { bg: '#E8F5E9', color: '#2E7D32', border: '#66bb6a' }
};

const parseDateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const normalized = typeof value === 'string' && value.length <= 10
    ? `${value}T00:00:00`
    : value;
  const result = new Date(normalized);
  return Number.isNaN(result.getTime()) ? null : result;
};

// 🗑️ ELIMINADO: Definición local de StatCard (Ahora se usa en components/common/StatCard)

const CalendarView = ({
  attendanceMap,
  year,
  month,
  fechaIngreso,
  festivos = [],
  setDetailModal,
  setJustificationForm
}) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const ingresoDate = parseDateOnly(fechaIngreso);
  const festivosLocalSet = useMemo(() => new Set(festivos || []), [festivos]);

  const getDayStatus = (day) => {
    if (!day) return null;
    const currentDate = new Date(year, month, day);
    const dayOfWeek = currentDate.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) return null;
    const isoDate = currentDate.toISOString().split('T')[0];
    if (festivosLocalSet.has(isoDate)) return 'festivo';
    if (currentDate > today) return null;
    if (ingresoDate && currentDate <= ingresoDate) return 'fuera';

    const record = attendanceMap.get(isoDate);

    if (!record) return 'ausente';
    if (record.presente === true) return 'presente';
    if (record.justificada === true) return 'justificada';
    return 'ausente';
  };

  const handleSelection = (day, status) => {
    if (!day || !status || ['fuera', 'festivo'].includes(status)) return;

    const currentDate = new Date(year, month, day);
    const isoDate = currentDate.toISOString().split('T')[0];
    const record = attendanceMap.get(isoDate);

    if (record || status === 'ausente') {
      setJustificationForm({ motivo: '', descripcion: '', archivo: null });
      setDetailModal({
        open: true,
        record: record || { fecha: isoDate, presente: false, justificada: false }
      });
    }
  };

  const getDayColor = (status) => {
    if (status === 'presente') return '#4caf50';
    if (status === 'justificada') return '#2196f3';
    if (status === 'ausente') return '#f44336';
    if (status === 'festivo') return '#FF9800';
    if (status === 'fuera') return '#9e9e9e';
    return 'transparent';
  };

  const getDayBgColor = (status) => {
    if (status === 'presente') return 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)';
    if (status === 'justificada') return 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)';
    if (status === 'ausente') return 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)';
    if (status === 'festivo') return 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)';
    if (status === 'fuera') return '#f5f5f5';
    return '#fafafa';
  };

  const getStatusLabel = (status) => {
    if (status === 'presente') return 'Asistencia Registrada y Validada';
    if (status === 'justificada') return 'Inasistencia Justificada (Aprobada)';
    if (status === 'ausente') return 'Ausencia - Día laboral sin registro de asistencia ni justificación';
    if (status === 'festivo') return 'Día Festivo o No Laboral - No se programa servicio';
    if (status === 'fuera') return 'Previo a la Fecha de Ingreso Institucional';
    return 'Sin registro';
  };

  const weeks = [];
  let week = Array(firstDayOfMonth).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return (
    <Box>
      <Grid container spacing={1} mb={1}>
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dayLabel => (
          <Grid item xs key={dayLabel}>
            <Box
              textAlign="center"
              py={1}
              sx={{
                bgcolor: '#f8f9fa',
                borderRadius: 2
              }}
            >
              <Typography
                variant="body2"
                fontWeight="700"
                color="text.primary"
              >
                {dayLabel}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {weeks.map((weekDays, weekIdx) => (
        <Grid container spacing={1} key={`week-${weekIdx}`} sx={{ mb: 1 }}>
          {weekDays.map((day, dayIdx) => {
            const status = day ? getDayStatus(day) : null;
            const isToday = isCurrentMonth && day === today.getDate();

            return (
              <Grid item xs key={`day-${weekIdx}-${dayIdx}`}>
                <Tooltip
                  title={day ? getStatusLabel(status) : ''}
                  arrow
                  placement="top"
                >
                  <Box
                    onClick={() => handleSelection(day, status)}
                    sx={{
                      minHeight: 56,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: day ? getDayBgColor(status) : 'transparent',
                      color: status ? getDayColor(status) : 'text.secondary',
                      borderColor: isToday ? '#4A90E2' : status ? getDayColor(status) : '#e0e0e0',
                      cursor: day && status && !['fuera', 'festivo'].includes(status) ? 'pointer' : 'default',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      boxShadow: isToday ? '0 0 15px rgba(74, 144, 226, 0.4)' : status && status !== 'fuera' ? `0 2px 4px ${getDayColor(status)}20` : 'none',
                      background: getDayBgColor(status),
                      '&:hover': {
                        transform: day && status && !['fuera', 'festivo'].includes(status) ? 'translateY(-4px) scale(1.05)' : 'none',
                        boxShadow: day && status && !['fuera', 'festivo'].includes(status) ? '0 8px 16px rgba(0,0,0,0.15)' : 'none',
                        zIndex: 10
                      }
                    }}
                  >
                    {day && (
                      <Box textAlign="center">
                        <Typography
                          variant="h6"
                          fontWeight={isToday ? '700' : '600'}
                          color={status ? getDayColor(status) : 'text.primary'}
                        >
                          {day}
                        </Typography>
                        {isToday && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              color: '#4A90E2',
                              mt: -0.5
                            }}
                          >
                            Hoy
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
      ))}
    </Box>
  );
};

const MisAsistencias = () => {
  // ✅ Hook de notificaciones unificado
  const { showError, showSuccess } = useNotification();

  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaIngreso, setFechaIngreso] = useState(null);
  const [faltasConsecutivas, setFaltasConsecutivas] = useState(0);
  const [limiteFaltas, setLimiteFaltas] = useState(null);

  const consecutiveSeverity = useMemo(() => {
    if (limiteFaltas && faltasConsecutivas >= limiteFaltas) return 'critical';
    if (limiteFaltas && limiteFaltas > 0 && faltasConsecutivas === limiteFaltas - 1) return 'warning';
    if (faltasConsecutivas > 0) return 'notice';
    return 'ok';
  }, [faltasConsecutivas, limiteFaltas]);

  const consecutivePalette = CONSECUTIVE_COLORS[consecutiveSeverity] || CONSECUTIVE_COLORS.ok;
  const consecutiveLabel = limiteFaltas
    ? `Faltas consecutivas: ${faltasConsecutivas} / ${limiteFaltas}`
    : `Faltas consecutivas: ${faltasConsecutivas}`;
  // ❌ ELIMINADO: Estado local de error - Ahora se usa notificación de isla dinámica
  // const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    status: 'todos'
  });

  const [stats, setStats] = useState({
    totalDias: 0,
    presentes: 0,
    ausentes: 0,
    justificadas: 0,
    porcentajeAsistencia: 0
  });
  const [gestorFestivos, setGestorFestivos] = useState([]);
  const [detailModal, setDetailModal] = useState({ open: false, record: null });
  const [submitting, setSubmitting] = useState(false);
  const [justificationForm, setJustificationForm] = useState({
    motivo: '',
    descripcion: '',
    archivo: null
  });

  const festivosSet = useMemo(() => new Set(gestorFestivos || []), [gestorFestivos]);

  const availableYears = useMemo(() => {
    const baseYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, index) => baseYear - index);

    if (!years.includes(filters.year)) {
      years.push(filters.year);
      years.sort((a, b) => b - a);
    }

    return years;
  }, [filters.year]);

  const applyFilters = useCallback((data, status) => {
    let filtered = [...data];

    if (status !== 'todos') {
      filtered = filtered.filter(record => {
        if (status === 'presente') return record.presente === true;
        if (status === 'ausente') return record.presente === false && record.justificada === false;
        if (status === 'justificado') return record.justificada === true;
        return true;
      });
    }

    setFilteredData(filtered);
  }, []);

  const attendanceMap = useMemo(() => {
    const map = new Map();
    attendanceData.forEach(record => {
      if (!record.fecha) return;
      const dateKey = record.fecha.split('T')[0];
      map.set(dateKey, record);
    });
    return map;
  }, [attendanceData]);

  const calculateStats = useCallback((data, year, month, ingreso, nonWorkingDaySet) => {
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const ingresoDate = parseDateOnly(ingreso);

    let diasLaborales = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      const isoDate = date.toISOString().split('T')[0];
      if (nonWorkingDaySet?.has(isoDate)) {
        continue;
      }

      if (ingresoDate && date <= ingresoDate) {
        continue;
      }

      if (isCurrentMonth && date > now) {
        continue;
      }

      diasLaborales++;
    }

    const presentes = data.filter(record => record.presente === true).length;
    const justificadas = data.filter(record => record.justificada === true).length;
    const ausentesCalculados = Math.max(diasLaborales - presentes - justificadas, 0);
    const porcentajeAsistencia = diasLaborales > 0 ? ((presentes / diasLaborales) * 100).toFixed(1) : '0.0';

    setStats({
      totalDias: diasLaborales,
      presentes,
      ausentes: ausentesCalculados,
      justificadas,
      porcentajeAsistencia: parseFloat(porcentajeAsistencia)
    });
  }, []);

  const loadAttendanceData = useCallback(async (year, month) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (typeof year === 'number') {
        params.append('year', year);
      }
      if (typeof month === 'number') {
        params.append('month', month + 1);
      }

      const endpoint = params.toString()
        ? `/students/my-attendance?${params.toString()}`
        : '/students/my-attendance';

      const response = await ApiService.get(endpoint);
      console.log('[MisAsistencias] Attendance Response:', response);

      if (response.status === 'SUCCESS') {
        const resultData = response.data || {};
        const festivosResponse = resultData.metadata?.festivos || [];
        const festivosLookup = new Set(festivosResponse);
        let attendance = resultData.asistencias || [];

        attendance = attendance.filter(record => {
          const date = new Date(record.fecha);
          const dayOfWeek = date.getDay();
          const isoDate = typeof record.fecha === 'string' ? record.fecha.slice(0, 10) : date.toISOString().split('T')[0];
          if (festivosLookup.has(isoDate)) {
            return false;
          }
          return dayOfWeek !== 0 && dayOfWeek !== 6;
        });

        setAttendanceData(attendance);
        setFechaIngreso(resultData.metadata?.fecha_ingreso || null);
        setFaltasConsecutivas(resultData.metadata?.faltas_consecutivas ?? 0);
        const limite = resultData.metadata?.limite_faltas_consecutivas;
        setLimiteFaltas(typeof limite === 'number' ? limite : limite ? Number(limite) : null);
        setGestorFestivos(festivosResponse);
      } else {
        showError('No se pudieron cargar las asistencias');
        setAttendanceData([]);
        setFechaIngreso(null);
        setFaltasConsecutivas(0);
        setLimiteFaltas(null);
        setGestorFestivos([]);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
      showError('Error cargando el historial de asistencias');
      setAttendanceData([]);
      setFechaIngreso(null);
      setFaltasConsecutivas(0);
      setLimiteFaltas(null);
      setGestorFestivos([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const generateCertificate = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Configuración de fuentes y colores
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(74, 144, 226); // #4A90E2
      doc.text('RESTAURANTE ESCOLAR', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text('Certificado de Asistencia', pageWidth / 2, 30, { align: 'center' });

      doc.setDrawColor(74, 144, 226);
      doc.setLineWidth(0.5);
      doc.line(20, 35, pageWidth - 20, 35);

      // Información del Estudiante
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text('Información del Estudiante:', 20, 45);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 52);
      doc.text(`Período: ${selectedMonthLabel} ${filters.year}`, 20, 59);

      // Estadísticas
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen del Mes:', 120, 45);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Días Laborales: ${stats.totalDias}`, 120, 52);
      doc.text(`Días Presente: ${stats.presentes}`, 120, 59);
      doc.text(`Porcentaje: ${stats.porcentajeAsistencia}%`, 120, 66);

      // Tabla de Historial
      const tableData = filteredData.map(record => [
        formatDate(record.fecha),
        record.presente ? 'Presente' : (record.justificada ? 'Justificada' : 'Ausente'),
        record.hora_registro || '-',
        record.observaciones || '-'
      ]);

      autoTable(doc, {
        startY: 75,
        head: [['Fecha', 'Estado', 'Hora', 'Observaciones']],
        body: tableData,
        headStyles: { fillColor: [74, 144, 226], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { horizontal: 20 }
      });

      // Pie de página
      const finalY = doc.lastAutoTable.finalY || 150;
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text('Este documento es un reporte informativo generado automáticamente por el Sistema del Restaurante Escolar.', pageWidth / 2, finalY + 20, { align: 'center' });

      doc.save(`Certificado_Asistencia_${selectedMonthLabel}_${filters.year}.pdf`);
      showSuccess('Certificado generado correctamente');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showError('Error al generar el certificado en PDF');
    }
  };

  useEffect(() => {
    loadAttendanceData(filters.year, filters.month);
  }, [filters.year, filters.month, loadAttendanceData]);

  useEffect(() => {
    applyFilters(attendanceData, filters.status);
  }, [attendanceData, filters.status, applyFilters]);

  useEffect(() => {
    calculateStats(attendanceData, filters.year, filters.month, fechaIngreso, festivosSet);
  }, [attendanceData, filters.year, filters.month, calculateStats, fechaIngreso, festivosSet]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: filterType === 'month' || filterType === 'year' ? Number(value) : value
    }));
  };

  const handleFormChange = (field, value) => {
    setJustificationForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('El archivo no puede superar los 5MB');
        return;
      }
      handleFormChange('archivo', file);
    }
  };

  const isDateJustifiable = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today - date;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  const handleSubmitJustification = async () => {
    if (!justificationForm.motivo || !justificationForm.descripcion) {
      showError('Por favor complete los campos obligatorios');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('fecha_falta', detailModal.record.fecha);
      formData.append('motivo', justificationForm.motivo);
      formData.append('descripcion', justificationForm.descripcion);
      if (justificationForm.archivo) {
        formData.append('archivo_adjunto', justificationForm.archivo);
      }

      const response = await ApiService.postFormData('/students/justifications', formData);
      if (response.data?.status === 'SUCCESS') {
        showSuccess('Justificación enviada correctamente');
        setDetailModal({ open: false, record: null });
        loadAttendanceData(filters.year, filters.month);
      } else {
        showError(response.data?.message || 'Error al enviar la justificación');
      }
    } catch (err) {
      showError('Error de red al enviar la justificación');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getStatusChip = (record) => {
    if (record.presente) {
      return (
        <Chip
          icon={<PresentIcon />}
          label="Presente"
          size="small"
          sx={{
            bgcolor: '#E8F5E9',
            color: '#2E7D32',
            fontWeight: 600,
            border: '1px solid #4caf50'
          }}
        />
      );
    } else if (record.justificada) {
      return (
        <Chip
          icon={<JustifiedIcon />}
          label="Justificada"
          size="small"
          sx={{
            bgcolor: '#E3F2FD',
            color: '#1565c0',
            fontWeight: 600,
            border: '1px solid #2196f3'
          }}
        />
      );
    } else {
      return (
        <Chip
          icon={<AbsentIcon />}
          label="Ausente"
          size="small"
          sx={{
            bgcolor: '#FFEBEE',
            color: '#C62828',
            fontWeight: 600,
            border: '1px solid #f44336'
          }}
        />
      );
    }
  };


  const selectedMonthLabel = MONTH_OPTIONS[filters.month]?.label || '';

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando mis asistencias...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Modernizado */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              bgcolor: '#E3F2FD',
              color: '#4A90E2',
              p: 2,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CalendarIcon sx={{ fontSize: 40 }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="700" color="text.primary">
              Mis Asistencias
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Historial completo de asistencia al comedor escolar
            </Typography>
          </Box>
          <Box ms="auto">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={generateCertificate}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#4A90E2',
                color: '#4A90E2',
                '&:hover': {
                  bgcolor: '#E3F2FD',
                  borderColor: '#357ABD'
                }
              }}
            >
              Descargar Certificado
            </Button>
          </Box>
        </Box>
        {fechaIngreso && (
          <Box
            mt={2}
            display="flex"
            flexWrap="wrap"
            alignItems="center"
            gap={1.5}
          >
            <Typography variant="body2" color="text.secondary">
              Control de asistencia activo desde <strong>{formatDate(fechaIngreso)}</strong>.
            </Typography>
            <Chip
              label={consecutiveLabel}
              size="small"
              sx={{
                fontWeight: 600,
                bgcolor: consecutivePalette.bg,
                color: consecutivePalette.color,
                border: '1px solid',
                borderColor: consecutivePalette.border
              }}
            />
            {limiteFaltas > 0 && (
              <Box sx={{ width: '200px', display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((faltasConsecutivas / limiteFaltas) * 100, 100)}
                  sx={{
                    flexGrow: 1,
                    height: 8,
                    borderRadius: 5,
                    bgcolor: '#eee',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: consecutivePalette.color
                    }
                  }}
                />
                <Typography variant="caption" fontWeight="700" color={consecutivePalette.color}>
                  {Math.round((faltasConsecutivas / limiteFaltas) * 100)}%
                </Typography>
              </Box>
            )}
            {consecutiveSeverity === 'warning' && limiteFaltas && (
              <Typography
                variant="body2"
                color="#F57C00"
                sx={{ flexBasis: '100%' }}
              >
                Estás a una falta de alcanzar el límite automático de {limiteFaltas} ausencias consecutivas.
              </Typography>
            )}
            {consecutiveSeverity === 'critical' && (
              <Typography
                variant="body2"
                color="#C62828"
                sx={{ flexBasis: '100%' }}
              >
                Tu cuenta permanece suspendida hasta que una justificación sea aprobada o se realice la reactivación por secretaría.
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* ❌ ELIMINADO: Alert local - Ahora todas las notificaciones salen de la isla dinámica */}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Porcentaje de Asistencia"
            value={stats.porcentajeAsistencia + '%'}
            subtitle={stats.presentes + ' de ' + stats.totalDias + ' días laborales'}
            icon={<StatsIcon sx={{ fontSize: 35 }} />}
            color={stats.porcentajeAsistencia >= 80 ? '#2E7D32' : '#F57C00'}
            bgColor={stats.porcentajeAsistencia >= 80 ? '#E8F5E9' : '#FFF3E0'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Días Presentes"
            value={stats.presentes}
            subtitle="Asistencias registradas"
            icon={<PresentIcon sx={{ fontSize: 35 }} />}
            color="#2E7D32"
            bgColor="#E8F5E9"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Faltas Justificadas"
            value={stats.justificadas}
            subtitle="Aprobadas"
            icon={<JustifiedIcon sx={{ fontSize: 35 }} />}
            color="#1565c0"
            bgColor="#E3F2FD"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Faltas sin Justificar"
            value={stats.ausentes}
            subtitle="Sin justificación"
            icon={<AbsentIcon sx={{ fontSize: 35 }} />}
            color="#C62828"
            bgColor="#FFEBEE"
          />
        </Grid>
      </Grid>

      {/* Calendario Visual del Mes */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Typography
              variant="h5"
              fontWeight="600"
              color="text.primary"
              mb={3}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
            >
              <CalendarIcon sx={{ color: '#4A90E2', fontSize: 28 }} />
              {`Calendario de Asistencias - ${selectedMonthLabel} ${filters.year}`}
            </Typography>

            <CalendarView
              attendanceMap={attendanceMap}
              year={filters.year}
              month={filters.month}
              fechaIngreso={fechaIngreso}
              festivos={gestorFestivos}
              setDetailModal={setDetailModal}
              setJustificationForm={setJustificationForm}
            />

            <Box display="flex" gap={3} justifyContent="center" mt={3} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{
                  width: 24,
                  height: 24,
                  bgcolor: '#4caf50',
                  borderRadius: 1.5,
                  border: '1px solid #2E7D32'
                }} />
                <Typography variant="body2" fontWeight="500">Presente</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{
                  width: 24,
                  height: 24,
                  bgcolor: '#2196f3',
                  borderRadius: 1.5,
                  border: '1px solid #1976d2'
                }} />
                <Typography variant="body2" fontWeight="500">Justificada (Aprobada)</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{
                  width: 24,
                  height: 24,
                  bgcolor: '#f44336',
                  borderRadius: 1.5,
                  border: '1px solid #C62828'
                }} />
                <Typography variant="body2" fontWeight="500">Ausente</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{
                  width: 24,
                  height: 24,
                  bgcolor: '#FF9800',
                  borderRadius: 1.5,
                  border: '1px solid #F57C00'
                }} />
                <Typography variant="body2" fontWeight="500">Festivo</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{
                  width: 24,
                  height: 24,
                  bgcolor: '#f5f5f5',
                  borderRadius: 1.5,
                  border: '1px solid #bdbdbd'
                }} />
                <Typography variant="body2" fontWeight="500">Sin control (antes de ingreso)</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Typography
              variant="h5"
              fontWeight="600"
              color="text.primary"
              mb={3}
            >
              Filtrar Asistencias
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Año</InputLabel>
                  <Select
                    value={filters.year}
                    label="Año"
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: '#f8f9fa'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4A90E2',
                        borderWidth: 2
                      }
                    }}
                  >
                    {availableYears.map(yearOption => (
                      <MenuItem key={yearOption} value={yearOption}>
                        {yearOption}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Mes</InputLabel>
                  <Select
                    value={filters.month}
                    label="Mes"
                    onChange={(e) => handleFilterChange('month', e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: '#f8f9fa'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4A90E2',
                        borderWidth: 2
                      }
                    }}
                  >
                    {MONTH_OPTIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filters.status}
                    label="Estado"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    sx={{
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: '#f8f9fa'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4A90E2',
                        borderWidth: 2
                      }
                    }}
                  >
                    <MenuItem value="todos">Todos los estados</MenuItem>
                    <MenuItem value="presente">Solo Presentes</MenuItem>
                    <MenuItem value="ausente">Solo Ausentes</MenuItem>
                    <MenuItem value="justificado">Solo Justificadas</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Typography
              variant="h5"
              fontWeight="600"
              color="text.primary"
              mb={3}
            >
              {'Historial de Asistencias (' + filteredData.length + ' registros)'}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" fontWeight="700" color="text.primary">
                        Fecha
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="700" color="text.primary">
                        Estado
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="700" color="text.primary">
                        Hora
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="700" color="text.primary">
                        Observaciones
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((record, index) => (
                    <TableRow
                      key={index}
                      hover
                      sx={{
                        '&:hover': {
                          bgcolor: '#f8f9fa'
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          {formatDate(record.fecha)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getStatusChip(record)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {record.hora_registro || 'No registrada'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {record.observaciones || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No hay registros de asistencia disponibles
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Modal de Detalle de Asistencia */}
      <Dialog
        open={detailModal.open}
        onClose={() => setDetailModal({ open: false, record: null })}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <CalendarIcon color="primary" />
            <Typography variant="h5" fontWeight="700">Detalle de Asistencia</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {detailModal.record && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Fecha
              </Typography>
              <Typography variant="h6" fontWeight="600" mb={3}>
                {formatDate(detailModal.record.fecha)}
              </Typography>

              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Estado
                  </Typography>
                  {getStatusChip(detailModal.record)}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Hora de Registro
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {detailModal.record.hora_registro || 'No registrada'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Observaciones / Detalles
              </Typography>
              <Typography variant="body1" sx={{ fontStyle: detailModal.record.observaciones ? 'normal' : 'italic' }}>
                {detailModal.record.observaciones || 'Sin observaciones registradas para este día.'}
              </Typography>

              {detailModal.record.justificada && (
                <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                  Esta inasistencia fue justificada y aprobada por coordinación.
                </Alert>
              )}

              {!detailModal.record.presente && !detailModal.record.justificada && (
                <>
                  {isDateJustifiable(detailModal.record.fecha) ? (
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 3, border: '1px dashed #4A90E2' }}>
                      <Typography variant="subtitle1" fontWeight="700" color="primary" gutterBottom>
                        Justificar Inasistencia
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Puedes justificar esta falta directamente aquí.
                      </Typography>

                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Motivo</InputLabel>
                        <Select
                          value={justificationForm.motivo}
                          label="Motivo"
                          onChange={(e) => handleFormChange('motivo', e.target.value)}
                          size="small"
                        >
                          {MOTIVOS_COMUNES.map(m => (
                            <MenuItem key={m} value={m}>{m}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Descripción / Observaciones"
                        value={justificationForm.descripcion}
                        onChange={(e) => handleFormChange('descripcion', e.target.value)}
                        placeholder="Explica brevemente el motivo..."
                        sx={{ mb: 2 }}
                        size="small"
                      />

                      <Box display="flex" alignItems="center" gap={1}>
                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={<AttachFileIcon />}
                          size="small"
                          sx={{ borderRadius: 2 }}
                        >
                          Adjuntar Soporte
                          <input type="file" hidden onChange={handleFileChange} accept="image/*,.pdf" />
                        </Button>
                        {justificationForm.archivo && (
                          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                            {justificationForm.archivo.name}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Alert severity="warning" sx={{ mt: 3, borderRadius: 2 }}>
                      Inasistencia sin justificar. El plazo para justificar (3 días) ha vencido.
                    </Alert>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexDirection: 'column', gap: 1 }}>
          {!detailModal.record?.presente && !detailModal.record?.justificada && isDateJustifiable(detailModal.record?.fecha) && (
            <Button
              onClick={handleSubmitJustification}
              variant="contained"
              fullWidth
              disabled={submitting || !justificationForm.motivo || !justificationForm.descripcion}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              sx={{ borderRadius: 2, py: 1, fontWeight: 700, bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' } }}
            >
              {submitting ? 'Enviando...' : 'Enviar Justificación'}
            </Button>
          )}
          <Button
            onClick={() => setDetailModal({ open: false, record: null })}
            variant="outlined"
            fullWidth
            sx={{ borderRadius: 2, py: 1, fontWeight: 700 }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MisAsistencias;
