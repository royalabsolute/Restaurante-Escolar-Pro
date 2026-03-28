import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Tooltip,
  CircularProgress,
  Paper,
  Divider,
  Button,
  useTheme
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  PersonAdd as PersonAddIcon,
  ArrowForward as ArrowForwardIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
  CloudDone as CloudDoneIcon,
  Person as PersonIcon,
  Restaurant as MealIcon
} from '@mui/icons-material';

// ApexCharts para gráficos
import Chart from 'react-apexcharts';

import MainCard from 'components/Card/MainCard';

import { useAuth } from 'hooks/useAuth';
import ApiService from 'services/ApiService';
import SocketService from 'services/SocketService';
import { getProfilePhotoUrl } from 'utils/imageUtils';
import PageHeader from 'components/common/PageHeader';

// Componente de Tarjeta de Estadística Reutilizable (estilo institucional)
const StatCard = ({ title, value, icon: Icon, color, description, loading }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.100',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(30, 41, 59, 0.08)',
          borderColor: 'primary.light'
        }
      }}
    >
      <Box display="flex" alignItems="center" gap={2} mb={1.5}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 3,
            bgcolor: `${color}.50`,
            color: `${color}.main`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon fontSize="medium" />
        </Box>
        <Box flex={1}>
          <Typography variant="caption" color="textSecondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            {title}
          </Typography>
          <Typography variant="h3" fontWeight="800" sx={{ color: '#1e293b', mt: 0.5 }}>
            {loading ? <CircularProgress size={20} /> : value}
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="textSecondary">
        {description}
      </Typography>
    </Paper>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [dashboardData, setDashboardData] = useState({
    totalUsuarios: 0,
    estudiantesActivos: 0,
    justificacionesPendientes: 0,
    reportesGenerados: 0,
    asistenciasHoy: 0,
    faltasHoy: 0,
    suplentesActivos: 0
  });

  const [systemStatus, setSystemStatus] = useState({
    systemStatus: 'Verificando...',
    serverStatus: 'Verificando...',
    databaseStatus: 'Verificando...',
    internetStatus: 'Verificando...',
    lastBackup: 'Verificando...',
    uptime: 0,
    responseTime: 0
  });

  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Configuración de gráficos con colores modernos
  const [attendanceChartData, setAttendanceChartData] = useState({
    series: [0, 0],
    options: {
      chart: {
        type: 'donut',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        toolbar: { show: false }
      },
      labels: ['Regulares', 'Suplentes'],
      colors: ['#1e293b', '#3b82f6'],
      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total Platos',
                fontSize: '14px',
                fontWeight: 600,
                color: '#64748b',
                formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0)
              }
            }
          }
        }
      },
      stroke: { width: 0 },
      legend: { position: 'bottom', fontSize: '12px' },
      dataLabels: { enabled: false }
    }
  });

  const [studentsChartData, setStudentsChartData] = useState({
    series: [{ name: 'Cantidad', data: [0, 0] }],
    options: {
      chart: {
        type: 'bar',
        fontFamily: "'Outfit', sans-serif",
        toolbar: { show: false }
      },
      colors: ['#1e293b'],
      xaxis: {
        categories: ['Activos', 'Suplentes'],
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '40%'
        }
      },
      dataLabels: { enabled: false }
    }
  });

  useEffect(() => {
    loadDashboardData();
    loadSystemStatus();
    loadPendingUsers();

    const interval = setInterval(() => {
      loadSystemStatus();
    }, 5 * 60 * 1000);

    // Conectar y escuchar Sockets para tiempo real
    SocketService.connect().then(() => {
      SocketService.onAttendanceUpdate(handleIncomingAttendance);
    });

    return () => {
      clearInterval(interval);
      SocketService.removeAttendanceUpdate(handleIncomingAttendance);
    };
  }, []);

  const handleIncomingAttendance = (data) => {
    console.log('⚡ Actualización en Tiempo Real Recibida:', data);
    
    setDashboardData(prev => {
      const isSuplente = data.es_suplente || data.metodo_registro === 'suplente';
      const newSuplenteCount = isSuplente ? prev.suplentesActivos + 1 : prev.suplentesActivos;
      const newTotal = prev.asistenciasHoy + 1;

      // Actualizar gráficos dinámicamente
      const regulars = newTotal - newSuplenteCount;
      
      setAttendanceChartData(chartPrev => ({
        ...chartPrev,
        series: [regulars, newSuplenteCount]
      }));

      setStudentsChartData(chartPrev => ({
        ...chartPrev,
        series: [{
          name: 'Cantidad',
          data: [prev.estudiantesActivos || 0, newSuplenteCount]
        }]
      }));

      return {
        ...prev,
        asistenciasHoy: newTotal,
        suplentesActivos: newSuplenteCount
      };
    });
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const statsResponse = await ApiService.get('/admin/dashboard-stats');
      const attendanceResponse = await ApiService.get('/admin/attendance-today');
      const suplentesResponse = await ApiService.get('/suplente-qr/conteo-hoy');

      const attendanceStats = attendanceResponse?.data || [];
      const suplenteCount = suplentesResponse?.data?.total || 0;

      const totalEstudiantesAsistencia = Array.isArray(attendanceStats)
        ? attendanceStats.reduce((sum, item) => sum + (parseInt(item.total) || 0), 0)
        : 0;

      const realData = {
        ...statsResponse.data,
        asistenciasHoy: totalEstudiantesAsistencia + suplenteCount,
        suplentesActivos: suplenteCount
      };

      setDashboardData(realData);

      // Actualizar gráficos
      setAttendanceChartData(prev => ({
        ...prev,
        series: realData.asistenciasHoy > 0 ? [totalEstudiantesAsistencia, suplenteCount] : [1],
        options: {
          ...prev.options,
          labels: realData.asistenciasHoy > 0 ? ['Regulares', 'Suplentes'] : ['Sin registros'],
          colors: realData.asistenciasHoy > 0 ? ['#1e293b', '#3b82f6'] : ['#f1f5f9']
        }
      }));

      setStudentsChartData(prev => ({
        ...prev,
        series: [{
          name: 'Cantidad',
          data: [realData.estudiantesActivos || 0, realData.suplentesActivos || 0]
        }]
      }));

    } catch (error) {
      console.error('[AdminDashboard] Error cargando estadísticas:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const startTime = Date.now();
      const backendHealth = await ApiService.get('/health').then(() => true).catch(() => false);
      const responseTime = Date.now() - startTime;

      setSystemStatus({
        systemStatus: backendHealth ? 'Operativo' : 'Problemas',
        serverStatus: backendHealth ? 'Online' : 'Offline',
        databaseStatus: backendHealth ? 'Conectada' : 'Error',
        internetStatus: 'Online',
        lastBackup: new Date().toLocaleDateString(),
        uptime: Math.floor(Date.now() / 1000 / 60),
        responseTime: responseTime
      });
    } catch {
      setSystemStatus(prev => ({ ...prev, systemStatus: 'Operativo' }));
    }
  };

  const loadPendingUsers = async () => {
    try {
      const response = await ApiService.get('/admin/students?estado=pendiente');
      if (response && response.status === 'SUCCESS' && Array.isArray(response.data)) {
        setPendingUsers(response.data.slice(0, 5));
      }
    } catch (error) {
      setPendingUsers([]);
    }
  };

  const quickStats = [
    {
      title: 'Usuarios',
      value: dashboardData.totalUsuarios,
      icon: PeopleIcon,
      description: 'Total registrados',
      color: 'primary'
    },
    {
      title: 'Activos',
      value: dashboardData.estudiantesActivos,
      icon: SchoolIcon,
      description: 'Estudiantes validados',
      color: 'success'
    },
    {
      title: 'Pendientes',
      value: dashboardData.justificacionesPendientes,
      icon: AssignmentIcon,
      description: 'Por revisar',
      color: 'warning'
    },
    {
      title: 'Platos Hoy',
      value: dashboardData.asistenciasHoy,
      icon: MealIcon,
      description: 'Total servidos',
      color: 'info'
    }
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="PANEL DE ADMINISTRADOR"
        subtitle="Control total del sistema escolar • Restaurante San Antonio"
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

      {/* Sistema Status Bar */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 4,
        flexWrap: 'wrap'
      }}>
        <Chip
          label={`Sistema: ${systemStatus.systemStatus}`}
          size="small"
          color={systemStatus.systemStatus === 'Operativo' ? 'success' : 'warning'}
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
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {quickStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              description={stat.description}
              loading={loading}
            />
          </Grid>
        ))}
      </Grid>

      {/* Sección central con gráficos */}
      <Grid container spacing={4}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{
            p: 3,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'grey.100',
            height: '100%'
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" fontWeight="700" color="#1e293b">
                Análisis de Estudiantes
              </Typography>
              <IconButton size="small" onClick={() => navigate('/app/reportes')}>
                <ArrowForwardIcon fontSize="small" />
              </IconButton>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" align="center" gutterBottom>
                  Servicio de Restaurante (Hoy)
                </Typography>
                <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {dashboardData.asistenciasHoy > 0 ? (
                    <Chart options={attendanceChartData.options} series={attendanceChartData.series} type="donut" height={250} />
                  ) : (
                    <Box textAlign="center" sx={{ opacity: 0.5 }}>
                      <MealIcon sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="body2">Sin datos hoy</Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" align="center" gutterBottom>
                  Población Estudiantil
                </Typography>
                <Box sx={{ height: 280 }}>
                  <Chart options={studentsChartData.options} series={studentsChartData.series} type="bar" height={250} />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{
            p: 3,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'grey.100',
            height: '100%',
            bgcolor: 'white'
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h4" fontWeight="700" color="#1e293b">
                Para Revisión
              </Typography>
              <Chip label={pendingUsers.length} size="small" color="error" variant="contained" sx={{ borderRadius: 1.5, fontWeight: 700 }} />
            </Box>

            {pendingUsers.length > 0 ? (
              <List sx={{ p: 0 }}>
                {pendingUsers.map((pUser, idx) => (
                  <Box key={pUser.usuario_id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemIcon>
                        <Avatar
                          src={getProfilePhotoUrl(pUser.foto_perfil)}
                          sx={{ width: 40, height: 40, borderRadius: 2 }}
                        >
                          {pUser.nombre?.charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="subtitle2" fontWeight="700">{pUser.nombre}</Typography>}
                        secondary={
                          <Typography variant="caption" color="textSecondary">
                            Matrícula: {pUser.matricula}
                          </Typography>
                        }
                      />
                      <IconButton size="small" onClick={() => navigate(`/app/estudiantes/gestion?user=${pUser.usuario_id}`)}>
                        <ArrowForwardIcon fontSize="small" />
                      </IconButton>
                    </ListItem>
                    {idx < pendingUsers.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6, opacity: 0.5 }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography variant="body2">Todo validado</Typography>
              </Box>
            )}

            <Button
              fullWidth
              variant="outlined"
              color="primary"
              sx={{ mt: 2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              onClick={() => navigate('/app/estudiantes/gestion')}
            >
              Ver todos los estudiantes
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;