import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  InputAdornment,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
// import MainCard from '../../components/Card/MainCard';
import StatsWidget from '../../components/DashboardWidgets/StatsWidget';
import ApiService from 'services/ApiService';
import { getProfilePhotoUrl } from '../../utils/imageUtils';
// ✅ AGREGADO: Sistema unificado de notificaciones
import { useNotification } from 'contexts/NotificationContext';
import { useAuth } from 'hooks/useAuth';

const HistorialAsistencia = () => {
  // ✅ Hook de notificaciones unificado
  const { showError } = useNotification();
  const [estudiantes, setEstudiantes] = useState([]);
  const [filteredEstudiantes, setFilteredEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrado, setSelectedGrado] = useState('');
  const [stats, setStats] = useState({
    totalEstudiantes: 0,
    conAsistencias: 0,
    conFaltas: 0,
    conJustificaciones: 0
  });

  const { pathname } = window.location;
  const isTodayView = pathname.includes('/asistencia/hoy');

  useEffect(() => {
    fetchHistorialCompleto();
  }, []);

  useEffect(() => {
    // Filtrar estudiantes
    let filtered = estudiantes;

    if (isTodayView) {
      // Si es la vista de hoy, solo mostrar los que tengan asistencia hoy
      filtered = filtered.filter(est => est.asistencia_hoy === 'PRESENTE' || est.asistencia_hoy === 'JUSTIFICADA');
    }

    if (searchTerm) {
      filtered = filtered.filter(est =>
        est.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        est.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        est.matricula.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedGrado) {
      filtered = filtered.filter(est => est.grado === selectedGrado);
    }

    setFilteredEstudiantes(filtered);
  }, [searchTerm, selectedGrado, estudiantes, isTodayView]);

  const fetchHistorialCompleto = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await ApiService.getHistorialCompleto();

      if (response && response.status === 'SUCCESS') {
        const data = response.data || [];
        setEstudiantes(data);
        setFilteredEstudiantes(data);

        // Calcular estadísticas
        const stats = {
          totalEstudiantes: data.length,
          conAsistencias: data.filter(est => est.total_asistencias > 0).length,
          conFaltas: data.filter(est => est.total_faltas > 0).length,
          conJustificaciones: data.filter(est => est.total_justificaciones > 0).length
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      showError('Error al cargar la información de asistencia');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (value, type) => {
    if (type === 'asistencias') {
      return (
        <Chip
          label={value}
          color="success"
          size="small"
          icon={<CheckCircleIcon />}
          variant="outlined"
        />
      );
    } else if (type === 'faltas') {
      return (
        <Chip
          label={value}
          color="error"
          size="small"
          icon={<CancelIcon />}
          variant="outlined"
        />
      );
    } else if (type === 'justificaciones') {
      return (
        <Chip
          label={value}
          color="warning"
          size="small"
          icon={<ScheduleIcon />}
          variant="outlined"
        />
      );
    }
    return <Chip label={value} size="small" />;
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="800" sx={{ color: '#1e293b', letterSpacing: -1 }}>
          {isTodayView ? 'Asistencia de Hoy' : 'Historial Completo de Asistencias'}
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          {isTodayView
            ? `Registros de asistencia correspondientes al ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
            : 'Estadísticas acumuladas y registros históricos de todos los estudiantes'}
        </Typography>

        {/* ❌ ELIMINADO: Alert local - Ahora todas las notificaciones salen de la isla dinámica */}

        {/* Filtros */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <StatsWidget
              title="Total Estudiantes"
              value={stats.totalEstudiantes}
              icon={<PersonIcon sx={{ fontSize: 40 }} />}
              color="primary"
              description="Estudiantes registrados"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <StatsWidget
              title="Con Asistencias"
              value={stats.conAsistencias}
              icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
              color="success"
              description="Tienen asistencias registradas"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <StatsWidget
              title="Con Faltas"
              value={stats.conFaltas}
              icon={<CancelIcon sx={{ fontSize: 40 }} />}
              color="error"
              description="Tienen faltas registradas"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <StatsWidget
              title="Con Justificaciones"
              value={stats.conJustificaciones}
              icon={<ScheduleIcon sx={{ fontSize: 40 }} />}
              color="warning"
              description="Tienen justificaciones"
            />
          </Grid>
        </Grid>

        {/* Filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filtros de Búsqueda
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Buscar por nombre, apellidos o matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Filtrar por Grado</InputLabel>
                  <Select
                    value={selectedGrado}
                    label="Filtrar por Grado"
                    onChange={(e) => setSelectedGrado(e.target.value)}
                  >
                    <MenuItem value="">Todos los grados</MenuItem>
                    {[...new Set(estudiantes.map(e => e.grado))].sort().map((grado) => (
                      <MenuItem key={grado} value={grado}>
                        {grado}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabla de estudiantes */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {`Historial de Estudiantes (${filteredEstudiantes.length})`}
            </Typography>
            {filteredEstudiantes.length === 0 ? (
              <Box textAlign="center" py={4}>
                <PersonIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="textSecondary">
                  No se encontraron estudiantes
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Ajuste los filtros de búsqueda para ver resultados
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Estudiante</TableCell>
                        <TableCell>Grado</TableCell>
                        <TableCell>Jornada</TableCell>
                        <TableCell align="center">Total Asistencias</TableCell>
                        <TableCell align="center">Total Faltas</TableCell>
                        <TableCell align="center">Justificaciones</TableCell>
                        <TableCell align="center">% Asistencia</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredEstudiantes
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((estudiante) => {
                          const totalDias = (estudiante.total_asistencias || 0) + (estudiante.total_faltas || 0);
                          const porcentajeAsistencia = totalDias > 0 ?
                            Math.round(((estudiante.total_asistencias || 0) / totalDias) * 100) : 0;

                          return (
                            <TableRow key={estudiante.id}>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Avatar src={getProfilePhotoUrl(estudiante.foto_perfil) || estudiante.foto_url}>
                                    <PersonIcon />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                      {estudiante.nombre} {estudiante.apellidos}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {estudiante.matricula}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip label={estudiante.grado} size="small" />
                              </TableCell>
                              <TableCell>
                                <Chip label={estudiante.jornada} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell align="center">
                                {getStatusChip(estudiante.total_asistencias || 0, 'asistencias')}
                              </TableCell>
                              <TableCell align="center">
                                {getStatusChip(estudiante.total_faltas || 0, 'faltas')}
                              </TableCell>
                              <TableCell align="center">
                                {getStatusChip(estudiante.total_justificaciones || 0, 'justificaciones')}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={`${porcentajeAsistencia}%`}
                                  color={getPercentageColor(porcentajeAsistencia)}
                                  size="small"
                                  variant="filled"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={filteredEstudiantes.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(event, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(0);
                  }}
                  labelRowsPerPage="Filas por página:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
                  }
                />
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default HistorialAsistencia;
