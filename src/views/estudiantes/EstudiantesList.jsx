import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  QrCode as QrCodeIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
// ❌ ELIMINADO: react-toastify
// import { toast } from 'react-toastify';
// ✅ AGREGADO: Sistema unificado de notificaciones
import { useNotification } from 'contexts/NotificationContext';

import MainCard from 'components/Card/MainCard';
import ApiService from 'services/ApiService';
import { useAuth } from 'hooks/useAuth';
import { getProfilePhotoUrl } from 'utils/imageUtils';

const EstudiantesList = () => {
  // ✅ Hook de notificaciones unificado
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const location = useLocation();
  const { user: _user, isAdmin, isSecretaria } = useAuth();
  const [estudiantes, setEstudiantes] = useState([]);
  const [filteredEstudiantes, setFilteredEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrado, setSelectedGrado] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, estudiante: null });
  const [currentFilter, setCurrentFilter] = useState('todos');

  // Determinar el filtro inicial basado en la URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/pendientes')) {
      setCurrentFilter('pendientes');
    } else if (path.includes('/validados')) {
      setCurrentFilter('validados');
    } else if (path.includes('/rechazados')) {
      setCurrentFilter('rechazados');
    } else {
      setCurrentFilter('todos');
    }
  }, [location.pathname]);

  useEffect(() => {
    loadEstudiantes();
  }, []);

  const loadEstudiantes = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Loading students from API...');
      const data = await ApiService.getEstudiantes();
      console.log('✅ Students data received:', data);
      
      setEstudiantes(data.data || []);
    } catch (error) {
      console.error('❌ Error cargando estudiantes:', error);
      setError('Error al cargar la lista de estudiantes: ' + (error.response?.data?.message || error.message));
      showError('Error al cargar la lista de estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const filterEstudiantes = useCallback(() => {
    let filtered = [...estudiantes];

    // Filtrar por estado según currentFilter
    switch (currentFilter) {
      case 'pendientes':
        filtered = filtered.filter(est => est.estado === 'pendiente');
        break;
      case 'validados':
        filtered = filtered.filter(est => est.estado === 'validado');
        break;
      case 'rechazados':
        filtered = filtered.filter(est => est.estado === 'rechazado');
        break;
      case 'todos':
      default:
        // No filtrar por estado
        break;
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(est => 
        est.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        est.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        est.codigo_qr.includes(searchTerm) ||
        est.grado.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por grado
    if (selectedGrado) {
      filtered = filtered.filter(est => est.grado === selectedGrado);
    }

    setFilteredEstudiantes(filtered);
  }, [estudiantes, searchTerm, selectedGrado, currentFilter]);

  useEffect(() => {
    filterEstudiantes();
  }, [filterEstudiantes]);

  const getEstadoChip = (estado) => {
    const estados = {
      'validado': { label: 'Validado', color: 'success', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
      'pendiente': { label: 'Pendiente', color: 'warning', icon: <PendingIcon sx={{ fontSize: 16 }} /> },
      'rechazado': { label: 'Rechazado', color: 'error', icon: <CancelIcon sx={{ fontSize: 16 }} /> }
    };
    
    const estadoInfo = estados[estado] || { label: estado, color: 'default', icon: null };
    
    return (
      <Chip
        label={estadoInfo.label}
        color={estadoInfo.color}
        size="small"
        icon={estadoInfo.icon}
        variant="filled"
      />
    );
  };

  const getFilterTitle = () => {
    const titles = {
      'todos': 'Todos los Estudiantes',
      'pendientes': 'Estudiantes Pendientes de Validación',
      'validados': 'Estudiantes Validados',
      'rechazados': 'Estudiantes Rechazados'
    };
    return titles[currentFilter] || 'Lista de Estudiantes';
  };

  const getFilterDescription = () => {
    const descriptions = {
      'todos': 'Listado completo de todos los estudiantes registrados en el sistema',
      'pendientes': 'Estudiantes que están pendientes de validación por parte de secretaría',
      'validados': 'Estudiantes que han sido validados y pueden acceder al sistema',
      'rechazados': 'Estudiantes cuya inscripción ha sido rechazada'
    };
    return descriptions[currentFilter] || '';
  };

  const handleDelete = async () => {
    try {
      await ApiService.deleteEstudiante(deleteDialog.estudiante.id);
      showSuccess('Estudiante eliminado correctamente');
      setDeleteDialog({ open: false, estudiante: null });
      loadEstudiantes();
    } catch (error) {
      console.error('Error eliminando estudiante:', error);
      showError('Error al eliminar el estudiante');
    }
  };

  const handleGenerateQR = async (estudiante) => {
    try {
      await ApiService.generateQR(estudiante.id);
      showSuccess(`Código QR generado para ${estudiante.nombre} ${estudiante.apellidos}`);
    } catch (error) {
      console.error('Error generando QR:', error);
      showError('Error al generar el código QR');
    }
  };

  const getUniqueGrados = () => {
    const grados = [...new Set(estudiantes.map(est => est.grado))];
    return grados.sort();
  };

  const getInitials = (nombre, apellidos) => {
    return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
  };

  const canEdit = () => {
    return isAdmin() || isSecretaria();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography variant="h6">Cargando estudiantes...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {getFilterTitle()}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {getFilterDescription()}
          </Typography>
        </Box>
        {canEdit() && (
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<QrCodeIcon />}
              onClick={() => navigate('/estudiantes/codigos')}
            >
              Códigos QR
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/estudiantes/nuevo')}
            >
              Nuevo Estudiante
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Buscar estudiante"
                placeholder="Nombre, apellidos, código o grado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por Grado</InputLabel>
                <Select
                  value={selectedGrado}
                  label="Filtrar por Grado"
                  onChange={(e) => setSelectedGrado(e.target.value)}
                >
                  <MenuItem value="">Todos los grados</MenuItem>
                  {getUniqueGrados().map((grado) => (
                    <MenuItem key={grado} value={grado}>
                      {grado}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <SchoolIcon color="primary" />
                <Typography variant="h6" color="primary">
                  {filteredEstudiantes.length} estudiantes
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de estudiantes */}
      <MainCard>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Estudiante</TableCell>
                <TableCell>Grado</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Acudiente</TableCell>
                <TableCell>Estado</TableCell>
                {canEdit() && <TableCell>Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEstudiantes.map((estudiante) => (
                <TableRow key={estudiante.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar 
                        src={getProfilePhotoUrl(estudiante.foto_perfil)}
                        sx={{ bgcolor: 'primary.main' }}
                      >
                        {!estudiante.foto_perfil && getInitials(estudiante.nombre, estudiante.apellidos)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {estudiante.nombre} {estudiante.apellidos}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          ID: {estudiante.id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={estudiante.grado} 
                      color="primary" 
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {estudiante.codigo_qr}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {estudiante.acudiente_nombre ? (
                      <Box>
                        <Typography variant="body2">
                          {estudiante.acudiente_nombre} {estudiante.acudiente_apellidos}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {estudiante.acudiente_telefono}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Sin acudiente
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {getEstadoChip(estudiante.estado)}
                  </TableCell>
                  {canEdit() && (
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Generar QR">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={() => handleGenerateQR(estudiante)}
                          >
                            <QrCodeIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => navigate(`/estudiantes/editar/${estudiante.id}`)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        {isAdmin() && (
                          <Tooltip title="Eliminar">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => setDeleteDialog({ open: true, estudiante })}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredEstudiantes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canEdit() ? 6 : 5} align="center" sx={{ py: 4 }}>
                    <Box textAlign="center">
                      <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="h6" color="textSecondary">
                        No se encontraron estudiantes
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {searchTerm || selectedGrado ? 
                          'Intenta modificar los filtros de búsqueda' : 
                          'No hay estudiantes registrados'
                        }
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </MainCard>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, estudiante: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar al estudiante{' '}
            <strong>
              {deleteDialog.estudiante?.nombre} {deleteDialog.estudiante?.apellidos}
            </strong>?
          </Typography>
          <Typography color="error" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, estudiante: null })}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EstudiantesList;
