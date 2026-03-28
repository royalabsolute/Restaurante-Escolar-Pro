import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Group as GroupIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  HighlightOff as HighlightOffIcon,
  PendingActions as PendingActionsIcon,
  BarChart as BarChartIcon,
  Close as CloseIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import ApiService from '../../services/ApiService';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';


const defaultStart = new Date();
defaultStart.setDate(1);

const defaultFilters = {
  startDate: defaultStart.toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  grades: [],
  jornadas: []
};

// 🔥 COMPONENTE DE TARJETA DE ESTADÍSTICA REUTILIZABLE
const StatCard = ({ title, value, icon: Icon, color, loading }) => {
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
          borderColor: 'primary.light'
        }
      }}
    >
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

const EstudiantesGrupos = () => {
  const { showError } = useNotification();
  const [filters, setFilters] = useState(() => ({ ...defaultFilters }));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);

  // Catálogos dinámicos
  const [availableGrades, setAvailableGrades] = useState([]);
  const [availableJornadas, setAvailableJornadas] = useState([]);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const response = await ApiService.get('/groups');
        if (response?.status === 'SUCCESS') {
          const groups = response.data;
          // Extraer grados únicos (nombres de grupo) y jornadas únicas
          const grades = [...new Set(groups.map(g => g.nombre))].sort();
          const jornadas = [...new Set(groups.map(g => g.jornada))].sort();
          setAvailableGrades(grades);
          setAvailableJornadas(jornadas);
        }
      } catch (error) {
        console.error('Error cargando catálogos:', error);
      }
    };
    loadCatalogs();
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

  const loadData = useCallback(async (overrideFilters) => {
    const activeFilters = overrideFilters || filters;
    try {
      setLoading(true);
      const response = await ApiService.post('/reportes/dashboard/grupos', {
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate,
        filters: {
          grades: activeFilters.grades,
          jornadas: activeFilters.jornadas
        }
      });

      if (response?.status === 'SUCCESS') {
        setData(response.data);
      } else {
        showError(response?.message || 'No fue posible obtener los grupos');
      }
    } catch (error) {
      console.error('Error cargando grupos:', error);
      showError('Ocurrió un error obteniendo los grupos');
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (student) => {
    setSelectedStudent(student);
    setDetailOpen(true);
    setDetailLoading(true);
    setStudentDetail(null);

    try {
      const params = new URLSearchParams();
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      const response = await ApiService.get(`/students/${student.id}/reportes-detalle?${params.toString()}`);
      if (response?.status === 'SUCCESS') {
        setStudentDetail(response.data);
      } else {
        showError(response?.message || 'No fue posible cargar el detalle');
      }
    } catch (error) {
      console.error('Error obteniendo detalle del estudiante:', error);
      showError('Error al cargar el detalle del estudiante');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setStudentDetail(null);
    setSelectedStudent(null);
  };

  const resumen = useMemo(() => {
    if (!data?.resumen) {
      return {
        totalEstudiantes: 0,
        totalAsistencias: 0,
        totalFaltas: 0,
        totalFaltasSinJustificar: 0,
        totalFaltasPendientes: 0,
        promedioAsistencia: 0
      };
    }
    const promedio = Number.parseFloat(data.resumen.promedioAsistencia || data.resumen.promedio_asistencia || 0);
    return {
      ...data.resumen,
      promedioAsistencia: Math.round(promedio * 100) / 100
    };
  }, [data]);

  return (
    <Box sx={{ pb: 4 }}>
      {/* HEADER INSTITUCIONAL */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
          Estudiantes por Grupos
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mt: 0.5, fontWeight: 500 }}>
          Consulta el desempeño por grado y jornada con filtros granulares.
        </Typography>
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
                {availableGrades.map((grado) => (
                  <MenuItem key={grado} value={grado}>
                    <Checkbox checked={filters.grades.indexOf(grado) > -1} />
                    <ListItemText primary={grado} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}>
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
                {availableJornadas.map((jornada) => (
                  <MenuItem key={jornada} value={jornada}>
                    <Checkbox checked={filters.jornadas.indexOf(jornada) > -1} />
                    <ListItemText primary={jornada} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                onClick={() => {
                  const defaults = { ...defaultFilters };
                  setFilters(defaults);
                  loadData(defaults);
                }}
                disabled={loading}
                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600, px: 3 }}
              >
                Limpiar
              </Button>
              <Button
                variant="contained"
                onClick={() => loadData()}
                disabled={loading}
                startIcon={<SearchIcon />}
                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 700, px: 4, boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)' }}
              >
                Filtrar Resultados
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={320}>
          <CircularProgress />
        </Box>
      )}

      {
        !loading && !data && (
          <Alert severity="info">Configura filtros y ejecuta la consulta para ver resultados.</Alert>
        )
      }

      {
        !loading && data && (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <Paper sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <GroupIcon color="primary" />
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {resumen.totalEstudiantes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Estudiantes analizados
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <Paper sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <AssignmentTurnedInIcon color="success" />
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {resumen.totalAsistencias}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total asistencias
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <Paper sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <HighlightOffIcon color="error" />
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {resumen.totalFaltas}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total faltas
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <Paper sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <PendingActionsIcon color="warning" />
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {resumen.totalFaltasPendientes}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Faltas pendientes
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={2}>
                <Paper sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <BarChartIcon color="info" />
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {resumen.promedioAsistencia}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Promedio asistencia
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            {data.grupos.length === 0 && (
              <Alert severity="info">No hay estudiantes para los filtros seleccionados.</Alert>
            )}

            {data.grupos.map((group) => (
              <Paper
                key={`${group.grado}-${group.jornada}`}
                elevation={0}
                sx={{
                  p: 3,
                  mb: 4,
                  borderRadius: 4,
                  bgcolor: 'white',
                  border: '1px solid',
                  borderColor: 'grey.100',
                  overflow: 'hidden'
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                      {group.grado} • Jornada {group.jornada}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                      {group.estudiantes.length} estudiantes registrados en este grupo
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={`Asistencias: ${group.totales.asistencias}`}
                      sx={{ bgcolor: 'success.50', color: 'success.main', fontWeight: 700, borderRadius: 2 }}
                    />
                    <Chip
                      label={`Faltas: ${group.totales.faltas}`}
                      sx={{ bgcolor: 'error.50', color: 'error.main', fontWeight: 700, borderRadius: 2 }}
                    />
                    <Chip
                      label={`Promedio: ${group.totales.promedio}%`}
                      sx={{ bgcolor: 'info.50', color: 'info.main', fontWeight: 700, borderRadius: 2 }}
                    />
                  </Stack>
                </Stack>

                <TableContainer sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.50' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Estudiante</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Asistencias</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Faltas</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Justificadas</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>% Promedio</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.estudiantes.map((student) => (
                        <TableRow key={student.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                              {student.nombre} {student.apellidos}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Matrícula: {student.matricula || 'N/D'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{student.total_asistencias}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 600, color: student.total_faltas > 0 ? 'error.main' : 'textSecondary' }}>
                              {student.total_faltas}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={student.faltas_justificadas || 0}
                              size="small"
                              sx={{
                                bgcolor: (student.faltas_justificadas || 0) > 0 ? 'info.50' : 'grey.100',
                                color: (student.faltas_justificadas || 0) > 0 ? 'info.main' : 'textSecondary',
                                fontWeight: 700
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                              <Box sx={{ width: 40, mr: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={student.porcentaje_asistencia}
                                  color={student.porcentaje_asistencia >= 90 ? 'success' : student.porcentaje_asistencia >= 75 ? 'warning' : 'error'}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                {student.porcentaje_asistencia}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              onClick={() => openDetail(student)}
                              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
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
            ))}
          </>
        )
      }

      <Dialog fullWidth maxWidth="md" open={detailOpen} onClose={closeDetail}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Detalle del estudiante</span>
          <IconButton onClick={closeDetail}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading && (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={240}>
              <CircularProgress />
            </Box>
          )}
          {!detailLoading && selectedStudent && studentDetail && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                {selectedStudent.nombre} {selectedStudent.apellidos}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Grado {selectedStudent.grado} · Jornada {selectedStudent.jornada}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {studentDetail.resumen?.total_asistencias ?? 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Asistencias
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {studentDetail.resumen?.total_faltas ?? 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Faltas totales
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {studentDetail.resumen?.faltas_sin_justificar ?? 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sin justificar
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {studentDetail.resumen?.porcentaje_asistencia ?? 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      % Asistencia
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Eventos
              </Typography>

              {(studentDetail.eventos || []).length === 0 && (
                <Alert severity="info">No se registran eventos en el período seleccionado.</Alert>
              )}

              {(studentDetail.eventos || []).map((evento, index) => (
                <Paper key={`${evento.fecha}-${evento.tipo}-${index}`} sx={{ p: 2, mb: 1 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip
                      label={evento.tipo === 'asistencia' ? 'Asistencia' : `Justificación ${evento.estado || ''}`.trim()}
                      color={evento.tipo === 'asistencia' ? 'success' : evento.estado === 'aprobada' ? 'info' : evento.estado === 'pendiente' ? 'warning' : 'error'}
                      size="small"
                    />
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {evento.fecha}
                    </Typography>
                    {evento.hora && (
                      <Typography variant="body2" color="text.secondary">
                        {evento.hora}
                      </Typography>
                    )}
                  </Stack>
                  {evento.motivo && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Motivo: {evento.motivo}
                    </Typography>
                  )}
                  {evento.observaciones && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Observaciones: {evento.observaciones}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetail}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};

export default EstudiantesGrupos;
