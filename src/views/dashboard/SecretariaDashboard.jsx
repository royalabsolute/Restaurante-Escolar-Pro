import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Work,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Today as TodayIcon,
  PersonAdd as PersonAddIcon,
  Assessment as AssessmentIcon,
  Pending as PendingIcon,
  QrCode2 as QrCodeIcon,
  RocketLaunch as RocketLaunchIcon,
  ArrowForward as ArrowForwardIcon,
  Wifi as WifiIcon,
  Speed as SpeedIcon,
  CloudDone as CloudDoneIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme, Chip, Paper } from '@mui/material';
import Chart from 'react-apexcharts'; // Para futuros gráficos si se requiere
import ApiService from 'services/ApiService';
import useRoleBasedApi from 'hooks/useRoleBasedApi';
import { useAuth } from 'hooks/useAuth';
import { useNotification } from 'contexts/NotificationContext';
import StatCard from 'components/common/StatCard';
import PageHeader from 'components/common/PageHeader';

const SecretariaDashboard = () => {
  // ✅ Hook de notificaciones unificado
  const { showError } = useNotification();
  const navigate = useNavigate();
  const { endpoints, permissions } = useRoleBasedApi();
  const { user } = useAuth();

  // Detectar el rol para mostrar el título correcto
  const isCoordinador = user?.rol === 'coordinador_convivencia';
  const panelTitle = isCoordinador ? 'Panel Coordinador de Convivencia' : 'Panel de Secretaría';
  const panelSubtitle = isCoordinador
    ? 'Coordina la convivencia escolar, gestiona estudiantes y supervisa asistencia'
    : 'Gestiona estudiantes, supervisa asistencia y genera reportes del restaurante escolar';

  console.log('[SecretariaDashboard] Componente cargado');
  console.log('[SecretariaDashboard] Rol:', user?.rol);
  console.log('[SecretariaDashboard] Es Coordinador:', isCoordinador);
  console.log('[SecretariaDashboard] Endpoints:', endpoints);
  console.log('[SecretariaDashboard] Permissions:', permissions);

  const [stats, setStats] = useState({
    totalEstudiantes: 0,
    estudiantesPendientes: 0,
    asistenciaHoy: 0,
    justificacionesPendientes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [systemStatus, setSystemStatus] = useState({
    responseTime: 0,
    health: 'Verificando...'
  });

  useEffect(() => {
    loadDashboardData();
    checkSystemHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkSystemHealth = async () => {
    try {
      const startTime = Date.now();
      await ApiService.get('/health');
      setSystemStatus({
        responseTime: Date.now() - startTime,
        health: 'Operativo'
      });
    } catch {
      setSystemStatus({ responseTime: 0, health: 'Error' });
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('[SecretariaDashboard] Cargando datos del dashboard...');
      console.log('[SecretariaDashboard] Endpoints disponibles:', endpoints);

      // Verificar que los endpoints existen
      if (!endpoints?.students || !endpoints?.justifications) {
        console.warn('[SecretariaDashboard] Endpoints no disponibles, usando datos por defecto');
        setStats({
          totalEstudiantes: 0,
          estudiantesPendientes: 0,
          asistenciaHoy: 0,
          justificacionesPendientes: 0
        });
        setLoading(false);
        return;
      }

      // Usar endpoints basados en el rol del usuario
      const [pendingStudentsRes, validatedStudentsRes, justificationsRes, attendanceTodayRes] = await Promise.allSettled([
        ApiService.get(endpoints.students.pending),
        ApiService.get(endpoints.students.validated),
        ApiService.get(endpoints.justifications.pending),
        ApiService.get('/students/attendance/today') // Usar el endpoint que ya arreglamos para permitir acceso a secretaria
      ]);

      let pendingStudents = 0;
      let totalStudents = 0;
      let pendingJustifications = 0;
      let attendanceToday = 0;

      // Procesar respuesta de estudiantes pendientes
      if (pendingStudentsRes.status === 'fulfilled' && pendingStudentsRes.value?.data) {
        if (pendingStudentsRes.value.data.data && Array.isArray(pendingStudentsRes.value.data.data)) {
          pendingStudents = pendingStudentsRes.value.data.data.length;
        } else if (Array.isArray(pendingStudentsRes.value.data)) {
          pendingStudents = pendingStudentsRes.value.data.length;
        }
      }

      // Procesar respuesta de estudiantes validados para total
      if (validatedStudentsRes.status === 'fulfilled' && validatedStudentsRes.value?.data) {
        if (validatedStudentsRes.value.data.data && Array.isArray(validatedStudentsRes.value.data.data)) {
          totalStudents = validatedStudentsRes.value.data.data.length + pendingStudents;
        } else if (Array.isArray(validatedStudentsRes.value.data)) {
          totalStudents = validatedStudentsRes.value.data.length + pendingStudents;
        }
      }

      // Procesar respuesta de justificaciones
      if (justificationsRes.status === 'fulfilled' && justificationsRes.value?.data) {
        if (justificationsRes.value.data.data && Array.isArray(justificationsRes.value.data.data)) {
          pendingJustifications = justificationsRes.value.data.data.length;
        } else if (Array.isArray(justificationsRes.value.data)) {
          pendingJustifications = justificationsRes.value.data.length;
        }
      }

      // Asistencia hoy
      if (attendanceTodayRes.status === 'fulfilled' && attendanceTodayRes.value?.data) {
        const attendanceData = attendanceTodayRes.value.data;
        // El endpoint /students/attendance/today devuelve la lista completa de asistentes hoy
        if (Array.isArray(attendanceData)) {
          attendanceToday = attendanceData.length;
        } else if (attendanceData.data && Array.isArray(attendanceData.data)) {
          attendanceToday = attendanceData.data.length;
        }
      }

      setStats({
        totalEstudiantes: totalStudents,
        estudiantesPendientes: pendingStudents,
        asistenciaHoy: attendanceToday,
        justificacionesPendientes: pendingJustifications
      });

      console.log('[SecretariaDashboard] Datos del dashboard cargados:', {
        totalEstudiantes: totalStudents,
        estudiantesPendientes: pendingStudents,
        justificacionesPendientes: pendingJustifications
      });

    } catch (error) {
      console.error('[SecretariaDashboard] Error loading dashboard data:', error);
      showError('Error cargando datos. Algunos datos pueden no estar disponibles.');
      setStats({
        totalEstudiantes: 0,
        estudiantesPendientes: 0,
        asistenciaHoy: 0,
        justificacionesPendientes: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Gestión de Estudiantes',
      description: 'Validar, gestionar y revisar estudiantes',
      icon: <PersonAddIcon sx={{ fontSize: 28 }} />,
      path: '/app/estudiantes/gestion',
      color: '#4A90E2',
      bgColor: '#E3F2FD'
    },
    {
      title: 'Ver Asistencia Hoy',
      description: 'Revisar asistencia del día actual',
      icon: <TodayIcon sx={{ fontSize: 28 }} />,
      path: '/app/asistencia/hoy',
      color: '#4CAF50',
      bgColor: '#E8F5E9'
    },
    {
      title: 'Historial Completo',
      description: 'Ver reportes y análisis completos',
      icon: <AssessmentIcon sx={{ fontSize: 28 }} />,
      path: '/app/asistencia/historial',
      color: '#9C27B0',
      bgColor: '#F3E5F5'
    },
    {
      title: 'Justificaciones',
      description: 'Revisar justificaciones pendientes',
      icon: <AssignmentIcon sx={{ fontSize: 28 }} />,
      path: '/app/justificaciones',
      color: '#FF9800',
      bgColor: '#FFF3E0'
    },
    {
      title: 'Códigos QR',
      description: 'Gestionar códigos QR de estudiantes',
      icon: <QrCodeIcon sx={{ fontSize: 28 }} />,
      path: '/app/qr-codes',
      color: '#00BCD4',
      bgColor: '#E0F7FA'
    }
  ];


  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, mx: 'auto' }}>
      <PageHeader
        title={panelTitle}
        subtitle={panelSubtitle}
        actions={
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
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Typography>
          </Paper>
        }
      />

      {/* Barra de Estado del Sistema */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4, flexWrap: 'wrap' }}>
        <Chip
          label={`Sistema: ${systemStatus.health}`}
          size="small"
          color={systemStatus.health === 'Operativo' ? 'success' : 'warning'}
          variant="soft"
          sx={{ borderRadius: 1.5, fontWeight: 600 }}
        />
        <Chip
          icon={<WifiIcon style={{ fontSize: 16 }} />}
          label="Internet Online"
          size="small"
          color="success"
          variant="soft"
          sx={{ borderRadius: 1.5, fontWeight: 600 }}
        />
        <Chip
          icon={<SpeedIcon style={{ fontSize: 16 }} />}
          label={`${systemStatus.responseTime}ms`}
          size="small"
          variant="soft"
          sx={{ borderRadius: 1.5, fontWeight: 600 }}
        />
        <Chip
          icon={<CloudDoneIcon style={{ fontSize: 16 }} />}
          label="BD Conectada"
          size="small"
          color="success"
          variant="soft"
          sx={{ borderRadius: 1.5, fontWeight: 600 }}
        />
      </Box>

      {/* Estadísticas Principales */}
      <Grid container spacing={2} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Estudiantes"
            value={stats.totalEstudiantes}
            icon={SchoolIcon}
            color="primary"
            description="Registrados en el sistema"
            loading={loading}
            onClick={() => navigate('/app/estudiantes/gestion')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pendientes"
            value={stats.estudiantesPendientes}
            icon={PendingIcon}
            color="warning"
            description="Esperando validación"
            loading={loading}
            onClick={() => navigate('/app/estudiantes/gestion')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Asistencia Hoy"
            value={stats.asistenciaHoy}
            icon={TodayIcon}
            color="success"
            description="Registros del día actual"
            loading={loading}
            onClick={() => navigate('/app/asistencia/hoy')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Justificaciones"
            value={stats.justificacionesPendientes}
            icon={AssignmentIcon}
            color="info"
            description="Justificaciones por revisar"
            loading={loading}
            onClick={() => navigate('/app/justificaciones')}
          />
        </Grid>
      </Grid>

      {/* Accesos Rápidos - Diseño Moderno Unificado */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
          <RocketLaunchIcon sx={{ fontSize: 28, color: '#4A90E2' }} />
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Accesos Rápidos
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {quickActions.map((access, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.shadows[8],
                    borderColor: access.color,
                    '& .access-icon': {
                      backgroundColor: access.color,
                      color: 'white'
                    }
                  }
                }}
                onClick={() => navigate(access.path)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="flex-start" mb={2}>
                    <Box
                      className="access-icon"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: access.bgColor,
                        color: access.color,
                        mr: 2,
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      {access.icon}
                    </Box>
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                        {access.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                        {access.description}
                      </Typography>
                    </Box>
                    <ArrowForwardIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default SecretariaDashboard;
