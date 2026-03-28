import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  ButtonGroup,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  School as SchoolIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ApiService from 'services/ApiService';
// ❌ ELIMINADO: react-toastify
// import { toast } from 'react-toastify';
// ✅ AGREGADO: Sistema unificado de notificaciones
import { useAuth } from 'hooks/useAuth';
import { useNotification } from 'contexts/NotificationContext';
import { getProfilePhotoUrl } from 'utils/imageUtils';

const HistorialCompleto = () => {
  // ✅ Hook de notificaciones unificado
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [tipoVista, setTipoVista] = useState('estudiantes'); // 'estudiantes' o 'suplentes'
  const [estudiantes, setEstudiantes] = useState([]);
  const [suplentes, setSuplentes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [estadisticas, setEstadisticas] = useState({
    totalEstudiantes: 0,
    totalSuplentes: 0,
    totalAsistenciasEstudiantes: 0,
    totalAsistenciasSuplentes: 0,
    totalJustificaciones: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar estudiantes con estadísticas
      const estudiantesResponse = await ApiService.request('GET', '/estudiantes/con-estadisticas');
      if (estudiantesResponse.status === 'SUCCESS') {
        setEstudiantes(estudiantesResponse.data);
      }

      // Cargar suplentes con estadísticas
      const suplentesResponse = await ApiService.request('GET', '/students/suplentes-con-estadisticas');
      if (suplentesResponse.status === 'SUCCESS') {
        setSuplentes(suplentesResponse.data);
      }

      // Cargar estadísticas generales
      const statsResponse = await ApiService.request('GET', '/reportes/estadisticas-generales');
      if (statsResponse.status === 'SUCCESS') {
        setEstadisticas(statsResponse.data);
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
      showError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = () => {
    const data = tipoVista === 'estudiantes' ? estudiantes : suplentes;
    return data.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const nombre = item.nombre || item.nombres || '';
      return (
        nombre.toLowerCase().includes(searchLower) ||
        item.apellidos.toLowerCase().includes(searchLower) ||
        (item.grado && item.grado.toLowerCase().includes(searchLower)) ||
        (item.jornada && item.jornada.toLowerCase().includes(searchLower)) ||
        (item.matricula && item.matricula.toLowerCase().includes(searchLower))
      );
    });
  };

  const paginatedData = () => {
    const filtered = filteredData();
    return filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Datos para el gráfico de torta
  const pieChartData = [
    { name: 'Estudiantes', value: estadisticas.totalEstudiantes, color: '#1976d2' },
    { name: 'Suplentes', value: estadisticas.totalSuplentes, color: '#ff9800' }
  ];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Historial Completo
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Resumen general de estudiantes y suplentes con estadísticas detalladas
      </Typography>

      {/* Estadísticas Generales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card sx={{ backgroundColor: '#e3f2fd' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Avatar sx={{ bgcolor: '#1976d2', mx: 'auto', mb: 1 }}>
                    <SchoolIcon />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {estadisticas.totalEstudiantes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Estudiantes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card sx={{ backgroundColor: '#fff3e0' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Avatar sx={{ bgcolor: '#ff9800', mx: 'auto', mb: 1 }}>
                    <PersonAddIcon />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {estadisticas.totalSuplentes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Suplentes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                Distribución: Estudiantes vs Suplentes
              </Typography>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controles */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <ButtonGroup variant="contained" fullWidth>
              <Button
                onClick={() => {
                  setTipoVista('estudiantes');
                  setPage(0);
                }}
                variant={tipoVista === 'estudiantes' ? 'contained' : 'outlined'}
                startIcon={<SchoolIcon />}
                sx={{ flex: 1 }}
              >
                Estudiantes ({estadisticas.totalEstudiantes})
              </Button>
              <Button
                onClick={() => {
                  setTipoVista('suplentes');
                  setPage(0);
                }}
                variant={tipoVista === 'suplentes' ? 'contained' : 'outlined'}
                startIcon={<PersonAddIcon />}
                sx={{ flex: 1 }}
              >
                Suplentes ({estadisticas.totalSuplentes})
              </Button>
            </ButtonGroup>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder={`Buscar ${tipoVista}...`}
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
        </Grid>
      </Paper>

      {/* Tabla de Datos */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre Completo</TableCell>
                <TableCell>Información</TableCell>
                <TableCell align="center">Asistencias</TableCell>
                <TableCell align="center">Faltas</TableCell>
                <TableCell align="center">Justificaciones</TableCell>
                <TableCell align="center">Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData().map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar
                        src={getProfilePhotoUrl(item.foto_perfil)}
                        sx={{ mr: 2, bgcolor: tipoVista === 'estudiantes' ? '#1976d2' : '#ff9800' }}
                      >
                        {!item.foto_perfil && (tipoVista === 'estudiantes' ? <SchoolIcon /> : <PersonAddIcon />)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {item.nombre || item.nombres} {item.apellidos}
                        </Typography>
                        {item.matricula && (
                          <Typography variant="caption" color="text.secondary">
                            Matrícula: {item.matricula}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {item.grado && (
                        <Chip label={`Grado: ${item.grado}`} size="small" sx={{ mr: 1, mb: 0.5 }} />
                      )}
                      {item.jornada && (
                        <Chip label={item.jornada} size="small" color="primary" variant="outlined" />
                      )}
                      {tipoVista === 'suplentes' && (
                        <Chip label="Suplente" size="small" color="warning" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={item.total_asistencias || 0}
                      color="success"
                      icon={<CheckIcon />}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={item.total_faltas || 0}
                      color="error"
                      icon={<CloseIcon />}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={item.total_justificaciones || 0}
                      color="info"
                      icon={<AssignmentIcon />}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={item.activo ? 'Activo' : 'Inactivo'}
                      color={item.activo ? 'success' : 'default'}
                      variant={item.activo ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredData().length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>

      {filteredData().length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No se encontraron {tipoVista} que coincidan con la búsqueda.
        </Alert>
      )}
    </Box>
  );
};

export default HistorialCompleto;
