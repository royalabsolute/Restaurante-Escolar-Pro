import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Tooltip,
  Button,
  Divider,
  Paper
} from '@mui/material';
import {
  Person as PersonIcon,
  QrCode as QrCodeIcon,
  Assignment as AssignmentIcon,
  CalendarMonth as CalendarMonthIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowForward as ArrowForwardIcon,
  RocketLaunch as RocketLaunchIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

import { useAuth } from 'hooks/useAuth';
import ApiService from 'services/ApiService';
import { getProfilePhotoUrl } from 'utils/imageUtils';
import { useNotification } from 'contexts/NotificationContext';
// ✅ Importamos el StatCard unificado
import StatCard from 'components/common/StatCard';

const EstudianteDashboard = () => {
  // ✅ Hook de notificaciones unificado
  const { showError } = useNotification();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState({
    nombre: 'Estudiante',
    apellidos: '',
    grado: 'N/A',
    jornada: 'N/A',
    matricula: 'N/A',
    telefono: '',
    email: '',
    foto_perfil: ''
  });

  const [dashboardStats, setDashboardStats] = useState({
    asistenciasEstesMes: 0,
    totalAsistencias: 0,
    porcentajeAsistencia: 0,
    faltasEstesMes: 0,
    justificacionesPendientes: 0,
    justificacionesAprobadas: 0
  });

  const [trendData, setTrendData] = useState([]);

  // Datos del gráfico simplificados (no usado por ahora)
  // const attendanceChart = {
  //   present: dashboardStats.totalAsistencias,
  //   absent: dashboardStats.faltasEstesMes,
  //   justified: dashboardStats.justificacionesAprobadas
  // };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Cargar perfil del estudiante (ahora incluye estadísticas reales)
      const profileResponse = await ApiService.get('/students/my-profile');
      if (profileResponse.status === 'SUCCESS') {
        const profile = profileResponse.data;
        setStudentData({
          nombre: profile.nombre || 'Estudiante',
          apellidos: profile.apellidos || '',
          grado: profile.grado || 'N/A',
          jornada: profile.jornada || 'N/A',
          matricula: profile.matricula || 'N/A',
          telefono: profile.telefono || '',
          email: profile.email || user?.email || '',
          foto_perfil: profile.foto_perfil || ''
        });

        // Si el backend retornó estadísticas, usarlas prioritariamente
        if (profile.stats) {
          const s = profile.stats;
          setDashboardStats({
            asistenciasEstesMes: s.asistencias_mes_actual || 0, // Nota: StudentStatsService podría no tener mes_actual directamente, pero calculamos fallbacks
            totalAsistencias: s.total_asistencias || 0,
            porcentajeAsistencia: s.porcentaje_asistencia ||
              (s.oportunidades_registradas > 0 ? ((s.total_asistencias / s.oportunidades_registradas) * 100).toFixed(1) : 0),
            faltasEstesMes: s.faltas_este_mes || 0,
            justificacionesPendientes: s.justificaciones_pendientes || 0,
            justificacionesAprobadas: s.total_justificaciones || 0
          });
        }
      }

      // Cargar estadísticas detalladas de asistencia (historial)
      const attendanceResponse = await ApiService.get('/students/my-attendance');
      if (attendanceResponse.status === 'SUCCESS') {
        const attendanceData = attendanceResponse.data || {};
        const attendance = attendanceData.asistencias || [];

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const thisMonthAttendance = attendance.filter(record => {
          const recordDate = new Date(record.fecha);
          return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
        });

        const presentThisMonth = thisMonthAttendance.filter(record => record.presente).length;
        const absentThisMonth = thisMonthAttendance.filter(record => !record.presente && !record.justificada).length;

        const totalPresent = attendance.filter(record => record.presente).length;
        const totalJustified = attendance.filter(record => record.justificada).length;
        const totalRecords = attendance.length;
        const percentage = totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : 0;

        // Calcular tendencia por mes (últimos 4 meses)
        const monthlyTrend = {};
        const monthsNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        attendance.forEach(record => {
          const date = new Date(record.fecha);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          if (!monthlyTrend[monthKey]) {
            monthlyTrend[monthKey] = { name: monthsNames[date.getMonth()], total: 0, presentes: 0 };
          }
          monthlyTrend[monthKey].total++;
          if (record.presente) monthlyTrend[monthKey].presentes++;
        });

        const sortedTrend = Object.keys(monthlyTrend)
          .sort()
          .slice(-4)
          .map(key => ({
            ...monthlyTrend[key],
            porcentaje: monthlyTrend[key].total > 0 ? Math.round((monthlyTrend[key].presentes / monthlyTrend[key].total) * 100) : 0
          }));

        setTrendData(sortedTrend);

        // Mezclar con los datos del backend (que tiene las justificaciones pendientes reales)
        setDashboardStats(prev => ({
          ...prev,
          asistenciasEstesMes: presentThisMonth,
          totalAsistencias: totalPresent,
          porcentajeAsistencia: parseFloat(percentage),
          faltasEstesMes: absentThisMonth,
          justificacionesAprobadas: totalJustified
          // justificacionesPendientes se mantiene del profileResponse si ya se cargó
        }));
      }

    } catch {
      showError('Error cargando información del estudiante');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Estadísticas rápidas - Tematizadas como AdminDashboard
  const quickStats = [
    {
      title: 'Asistencias Mes',
      value: dashboardStats.asistenciasEstesMes,
      icon: CheckCircleIcon,
      description: 'Días que has asistido este mes',
      color: 'success'
    },
    {
      title: 'Porcentaje',
      value: `${dashboardStats.porcentajeAsistencia}%`,
      icon: TrendingUpIcon,
      description: 'Tu porcentaje total de asistencia',
      color: 'info'
    },
    {
      title: 'Faltas Mes',
      value: dashboardStats.faltasEstesMes,
      icon: CancelIcon,
      description: 'Faltas sin justificar este mes',
      color: 'error'
    },
    {
      title: 'Justificadas',
      value: dashboardStats.justificacionesAprobadas,
      icon: AssignmentIcon,
      description: 'Justificaciones aprobadas',
      color: 'primary'
    }
  ];

  // Accesos rápidos - Colores unificados y modernos
  const quickActions = [
    {
      title: 'Mi Perfil',
      description: 'Ver y editar información personal',
      icon: <PersonIcon sx={{ fontSize: 28 }} />,
      path: '/app/mi-perfil',
      color: '#4A90E2',
      bgColor: '#E3F2FD'
    },
    {
      title: 'Mis Asistencias',
      description: 'Consultar historial completo',
      icon: <CalendarMonthIcon sx={{ fontSize: 28 }} />,
      path: '/app/mis-asistencias',
      color: '#4CAF50',
      bgColor: '#E8F5E9'
    },
    {
      title: 'Generar QR',
      description: 'Código para marcar asistencia',
      icon: <QrCodeIcon sx={{ fontSize: 28 }} />,
      path: '/app/generar-qr',
      color: '#9C27B0',
      bgColor: '#F3E5F5'
    },
    {
      title: 'Mis Justificaciones',
      description: 'Enviar y consultar justificaciones',
      icon: <AssignmentIcon sx={{ fontSize: 28 }} />,
      path: '/app/mis-justificaciones',
      color: '#FF9800',
      bgColor: '#FFF3E0'
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando tu información...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Notificación de Justificaciones Pendientes */}
      {dashboardStats.justificacionesPendientes > 0 && (
        <Alert
          severity="warning"
          variant="outlined"
          sx={{
            mb: 3,
            borderRadius: 3,
            borderWidth: 2,
            bgcolor: '#FFF3E0',
            '& .MuiAlert-icon': { fontSize: 30 }
          }}
          action={
            <Button
              color="warning"
              size="small"
              variant="contained"
              onClick={() => navigate('/app/mis-justificaciones')}
              sx={{ borderRadius: 2, fontWeight: '700' }}
            >
              Gestionar
            </Button>
          }
        >
          <Typography variant="subtitle1" fontWeight="700">
            Tienes {dashboardStats.justificacionesPendientes} {dashboardStats.justificacionesPendientes === 1 ? 'justificación pendiente' : 'justificaciones pendientes'}
          </Typography>
          <Typography variant="body2">
            Recuerda que debes justificar tus inasistencias para evitar la suspensión del servicio.
          </Typography>
        </Alert>
      )}

      {/* Header Minimalista - Institucional */}
      <Paper elevation={0} sx={{
        mb: 4,
        p: 3,
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.100',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'primary.light',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }
      }}>
        <Box display="flex" alignItems="center" gap={3} flexWrap={{ xs: 'wrap', md: 'nowrap' }}>
          <Avatar
            src={getProfilePhotoUrl(studentData.foto_perfil)}
            sx={{
              width: { xs: 70, md: 80 },
              height: { xs: 70, md: 80 },
              fontSize: '2rem',
              border: '2px solid',
              borderColor: 'divider',
              bgcolor: '#E3F2FD',
              color: '#4A90E2',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                transform: 'scale(1.05)',
                borderColor: '#4A90E2',
                boxShadow: '0 4px 12px rgba(74, 144, 226, 0.2)'
              }
            }}
            onClick={() => navigate('/app/mi-perfil')}
          >
            {!studentData.foto_perfil && `${studentData.nombre?.charAt(0) || ''}${studentData.apellidos?.charAt(0) || ''}`}
          </Avatar>

          <Box flex={1}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: '600', mb: 0.5, color: 'text.primary' }}>
              ¡Bienvenido, {studentData.nombre}!
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Panel de Estudiante - Restaurante Escolar
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              Matrícula: {studentData.matricula} • {studentData.grado} - {studentData.jornada}
            </Typography>
          </Box>

          {/* Botones de Acción Minimalistas */}
          <Box display="flex" gap={1}>
            <Tooltip title="Descargar mi carnet">
              <IconButton
                sx={{
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#E3F2FD',
                    borderColor: '#4A90E2',
                    color: '#4A90E2',
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => navigate('/app/generar-qr?action=carnet')}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Imprimir código QR">
              <IconButton
                sx={{
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#E3F2FD',
                    borderColor: '#4A90E2',
                    color: '#4A90E2',
                    transform: 'translateY(-2px)'
                  }
                }}
                onClick={() => navigate('/app/generar-qr?action=qr')}
              >
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Estadísticas Rápidas - Unificadas con StatCard */}
        {quickStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              description={stat.description}
            />
          </Grid>
        ))}

        {/* Resumen de Asistencias Modernizado */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{
            p: 3,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'grey.100',
            height: '100%',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: 'primary.light',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }
          }}>
            <Box mb={3}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: '600', color: '#4A90E2', mb: 3 }}>
                Resumen de Asistencias
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={4}>
                  <Box sx={{
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 2,
                    background: '#E8F5E9',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)'
                    }
                  }}>
                    <CheckCircleIcon sx={{ fontSize: 36, color: '#4CAF50', mb: 1 }} />
                    <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      {dashboardStats.totalAsistencias}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500' }}>
                      Asistencias
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 2,
                    background: '#FCE4EC',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 12px rgba(233, 30, 99, 0.2)'
                    }
                  }}>
                    <CancelIcon sx={{ fontSize: 36, color: '#E91E63', mb: 1 }} />
                    <Typography variant="h4" sx={{ color: '#E91E63', fontWeight: 'bold' }}>
                      {dashboardStats.faltasEstesMes}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500' }}>
                      Faltas
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 2,
                    background: '#E3F2FD',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 12px rgba(74, 144, 226, 0.2)'
                    }
                  }}>
                    <AssignmentIcon sx={{ fontSize: 36, color: '#4A90E2', mb: 1 }} />
                    <Typography variant="h4" sx={{ color: '#4A90E2', fontWeight: 'bold' }}>
                      {dashboardStats.justificacionesAprobadas}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500' }}>
                      Justificadas
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Información Personal Minimalista */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{
            p: 3,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'grey.100',
            height: '100%',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: 'primary.light',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }
          }}>
            <Box mb={3}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: '600', color: '#4A90E2', mb: 3 }}>
                Mi Información
              </Typography>

              <Box display="flex" alignItems="center" gap={2} sx={{
                mb: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: '#F5F5F5',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#E3F2FD',
                  transform: 'translateX(4px)'
                }
              }}>
                <SchoolIcon sx={{ color: '#4A90E2', fontSize: 28 }} />
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500' }}>
                    Nombre Completo
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {studentData.nombre} {studentData.apellidos}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" alignItems="center" gap={2} sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#F5F5F5',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#E8F5E9',
                  transform: 'translateX(4px)'
                }
              }}>
                <ScheduleIcon sx={{ color: '#4CAF50', fontSize: 28 }} />
                <Box flex={1}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500' }}>
                    Información Académica
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    <strong>Grado:</strong> {studentData.grado} • <strong>Jornada:</strong> {studentData.jornada}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                fullWidth
                startIcon={<PersonIcon />}
                onClick={() => navigate('/app/mi-perfil')}
                sx={{
                  mt: 3,
                  bgcolor: '#4A90E2',
                  borderRadius: 2,
                  py: 1.5,
                  fontWeight: '600',
                  textTransform: 'none',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: '#357ABD',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(74, 144, 226, 0.4)'
                  }
                }}
              >
                Ver Perfil Completo
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Accesos Rápidos Modernizados */}
        <Grid item xs={12}>
          <Box mb={2} display="flex" alignItems="center" gap={1.5}>
            <RocketLaunchIcon sx={{ fontSize: 24, color: 'text.secondary' }} />
            <Typography variant="h5" sx={{ fontWeight: '700', color: '#1e293b' }}>
              Accesos Rápidos
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    cursor: 'pointer',
                    borderRadius: 4,
                    transition: 'all 0.3s ease',
                    border: '1px solid',
                    borderColor: 'grey.100',
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(30, 41, 59, 0.08)',
                      borderColor: 'primary.light',
                      '& .access-icon': {
                        transform: 'rotate(10deg) scale(1.1)'
                      }
                    }
                  }}
                  onClick={() => navigate(action.path)}
                >
                  <Box display="flex" alignItems="flex-start" gap={2}>
                      <Box
                        className="access-icon"
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: action.bgColor,
                          color: action.color,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {action.icon}
                      </Box>
                      <Box flex={1}>
                        <Typography variant="h6" sx={{ fontWeight: '600', color: 'text.primary', mb: 0.5 }}>
                          {action.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                          {action.description}
                        </Typography>
                      </Box>
                      <ArrowForwardIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                    </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Gráfica de Tendencia */}
      <Grid item xs={12} sx={{ mt: 3, mb: 3 }}>
        <Paper elevation={0} sx={{
          p: 3,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'grey.100',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.light',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }
        }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={3}>
            <TimelineIcon sx={{ color: '#4A90E2', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: '600' }}>
              Tendencia de Asistencia (%)
            </Typography>
          </Box>
          <Box sx={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A90E2" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4A90E2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="porcentaje"
                  stroke="#4A90E2"
                  fillOpacity={1}
                  fill="url(#colorPercentage)"
                  strokeWidth={3}
                  name="Asistencia"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    </Box>
  );
};

export default EstudianteDashboard;