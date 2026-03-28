import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Avatar,
  Alert,
  Chip,
  Skeleton
} from '@mui/material';
import {
  QrCodeScanner as QrCodeScannerIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorOutlineIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Group as GroupIcon,
  ArrowForward as ArrowForwardIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ApiService from 'services/ApiService';
import { useNotification } from 'contexts/NotificationContext';
import StatCard from 'components/common/StatCard';
import PageHeader from 'components/common/PageHeader';

const DocenteDashboard = () => {
  const { showError } = useNotification();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [grupo, setGrupo] = useState(null);
  const [stats, setStats] = useState({
    totalEstudiantes: 0,
    presentesHoy: 0,
    ausentes: 0
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await ApiService.get('/docente/mi-grupo');
      const data = res?.data || res;

      setGrupo(data.grupo || null);
      const estudiantes = data.estudiantes || [];
      const presentes = estudiantes.filter(e => e.presente_hoy).length;
      setStats({
        totalEstudiantes: estudiantes.length,
        presentesHoy: presentes,
        ausentes: estudiantes.length - presentes
      });
    } catch (error) {
      console.error('Error loading docente dashboard:', error);
      showError('Error cargando el panel');
    } finally {
      setLoading(false);
    }
  };

  const actionCards = [
    {
      icon: <QrCodeScannerIcon sx={{ fontSize: 32, color: 'primary.main' }} />,
      title: 'Escáner QR',
      description: 'Registra la asistencia escaneando códigos QR',
      action: () => navigate('/app/asistencia/scanner'),
      color: 'primary.main',
      bgColor: 'rgba(74, 144, 226, 0.08)'
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 32, color: 'success.main' }} />,
      title: 'Mi Grupo',
      description: grupo ? `${grupo.nombre} — ver todos mis estudiantes` : 'Ver lista de mis estudiantes',
      action: () => navigate('/app/docente/mi-grupo'),
      color: 'success.main',
      bgColor: 'rgba(76, 175, 80, 0.08)',
      disabled: !grupo
    },
    {
      icon: <AssessmentIcon sx={{ fontSize: 32, color: 'warning.main' }} />,
      title: 'Historial',
      description: 'Consulta el historial completo de asistencia',
      action: () => navigate('/app/asistencia/historial'),
      color: 'warning.main',
      bgColor: 'rgba(255, 152, 0, 0.08)'
    }
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      <PageHeader
        title="Panel de Docente"
        subtitle="Gestiona la asistencia y el seguimiento de tu grupo"
      />

      {/* Alerta si no tiene grupo */}
      {!loading && !grupo && (
        <Alert
          severity="warning"
          sx={{ mb: 3, borderRadius: 2 }}
          icon={<GroupIcon />}
        >
          <Typography fontWeight={700}>Sin grupo asignado</Typography>
          <Typography variant="body2">
            Contacta al administrador para que te asigne como director de grupo. Mientras tanto, puedes usar el escáner.
          </Typography>
        </Alert>
      )}

      {/* Grupo actual */}
      {(loading || grupo) && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'rgba(74, 144, 226, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <SchoolIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            {loading ? (
              <>
                <Skeleton variant="text" width={180} height={28} />
                <Skeleton variant="text" width={120} height={20} />
              </>
            ) : (
              <>
                <Typography variant="h6" fontWeight={700}>
                  {grupo.nombre}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<ScheduleIcon />}
                    label={`Jornada ${grupo.jornada}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<PeopleIcon />}
                    label={`${stats.totalEstudiantes} estudiantes`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </>
            )}
          </Box>
          {!loading && grupo && (
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/app/docente/mi-grupo')}
              size="small"
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              Ver mi grupo
            </Button>
          )}
        </Paper>
      )}

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Mis Estudiantes"
            value={stats.totalEstudiantes}
            icon={SchoolIcon}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Presentes Hoy"
            value={stats.presentesHoy}
            icon={CheckCircleIcon}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Ausentes Hoy"
            value={stats.ausentes}
            icon={ErrorOutlineIcon}
            color="error"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Acciones rápidas */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Acciones Rápidas
      </Typography>
      <Grid container spacing={3}>
        {actionCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.title}>
            <Paper
              elevation={0}
              onClick={card.disabled ? undefined : card.action}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: card.disabled ? 'grey.50' : card.bgColor,
                cursor: card.disabled ? 'not-allowed' : 'pointer',
                opacity: card.disabled ? 0.6 : 1,
                transition: 'all 0.2s ease',
                '&:hover': card.disabled ? {} : {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transform: 'translateY(-2px)',
                  borderColor: card.color
                },
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {card.icon}
                <Typography variant="h6" fontWeight={700} fontSize="1rem">
                  {card.title}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {card.description}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ArrowForwardIcon sx={{ color: card.disabled ? 'text.disabled' : card.color, fontSize: 18 }} />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DocenteDashboard;
