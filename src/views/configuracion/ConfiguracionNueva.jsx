import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  LinearProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Paper,
  Avatar,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel
} from '@mui/material';
import {
  RestaurantMenu as RestaurantIcon,
  PersonAdd as PersonAddIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  QrCode2 as QrCodeIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
// ❌ ELIMINADO: react-toastify
// import { toast } from 'react-toastify';
// ✅ AGREGADO: Sistema unificado de notificaciones
import { useNotification } from '../../contexts/NotificationContext';
import ApiService from '../../services/ApiService';
import { getProfilePhotoUrl } from '../../utils/imageUtils';

const ROLES_DISPONIBLES = [
  { value: 'admin', label: 'Administradores' },
  { value: 'secretaria', label: 'Secretaría' },
  { value: 'coordinador', label: 'Coordinadores' },
  { value: 'coordinador_convivencia', label: 'Coordinador de Convivencia' },
  { value: 'docente', label: 'Docentes' },
  { value: 'alfabetizador', label: 'Personal de Apoyo (Alfabetizadores)' },
  { value: 'escaner', label: 'ESCANER (Cuenta Universal)' },
  { value: 'estudiante', label: 'Estudiantes' },
  { value: 'invitado', label: 'Invitado Temporal' }
];

// Eliminadas JORNADAS estáticas

const ESTADOS_USUARIO = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'validado', label: 'Validado' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'suspendido', label: 'Suspendido' }
];

const GRUPOS_ETNICOS = [
  { value: 'ninguno', label: 'Ninguno' },
  { value: 'indigena', label: 'Indígena' },
  { value: 'afrodescendiente', label: 'Afrodescendiente' },
  { value: 'rom', label: 'Pueblo Rom' },
  { value: 'raizal', label: 'Raizal' },
  { value: 'palenquero', label: 'Palenquero' }
];

const DESPLAZADO_OPTIONS = [
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' }
];

const normalizarJornada = (valor) => {
  if (!valor) return '';
  const lower = valor.toString().toLowerCase();
  if (lower.includes('mañ')) return 'mañana';
  if (lower.includes('tar')) return 'tarde';
  if (lower.includes('com')) return 'completa';
  return valor;
};

const ConfiguracionNueva = () => {
  // ✅ Hook de notificaciones unificado
  const { showSuccess, showError } = useNotification();
  // Estado: Cupos del Restaurante
  const [cupos, setCupos] = useState({
    limiteMaximo: 270,
    conteoActual: 0,
    cuposDisponibles: 270,
    porcentajeOcupacion: 0,
    cuposCompletos: false,
    horarioValidoInicio: '11:00',
    horarioValidoFin: '15:00'
  });
  const [nuevoLimite, setNuevoLimite] = useState(270);
  const [horarioInicio, setHorarioInicio] = useState('11:00');
  const [horarioFin, setHorarioFin] = useState('15:00');
  const [cargandoCupos, setCargandoCupos] = useState(false);
  const [guardandoLimite, setGuardandoLimite] = useState(false);

  // Estado: Crear Usuario
  const [nuevoUsuario, setNuevoUsuario] = useState({
    email: '',
    matricula: '',
    password: '',
    rol: 'estudiante',
    estado: 'validado',
    nombre: '',
    apellidos: '',
    fecha_nacimiento: '',
    telefono: '',
    grupo_academico_id: '',
    estrato: 1,
    grupo_etnico: 'ninguno',
    es_desplazado: 'no',
    acudiente_nombre: '',
    acudiente_apellidos: '',
    acudiente_cedula: '',
    acudiente_telefono: '',
    acudiente_email: '',
    fotoFile: null,
    fotoPreview: null,
    access_config: []
  });
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [gruposOptions, setGruposOptions] = useState([]);

  useEffect(() => {
    const loadGrupos = async () => {
      try {
        const response = await ApiService.get('/groups');
        if (response?.status === 'SUCCESS') {
          setGruposOptions(response.data || []);
        }
      } catch (error) {
        console.error('Error cargando grupos:', error);
      }
    };
    loadGrupos();
  }, []);

  // Estado: Paginación y Búsqueda - ELIMINADO




  // Cargar estadísticas de cupos
  const cargarEstadisticasCupos = async () => {
    try {
      setCargandoCupos(true);
      await ApiService.initialize();
      const response = await ApiService.get('/configuracion/cupos/estadisticas');

      if (response && response.success && response.data) {
        setCupos(response.data);
        setNuevoLimite(response.data.limiteMaximo);
        setHorarioInicio(response.data.horarioValidoInicio || '11:00');
        setHorarioFin(response.data.horarioValidoFin || '15:00');
      }
    } catch (error) {
      console.error('Error cargando estadísticas de cupos:', error);
      // Mantener valores por defecto
    } finally {
      setCargandoCupos(false);
    }
  };

  useEffect(() => {
    cargarEstadisticasCupos();
  }, []);

  // Actualizar límite de cupos
  const actualizarLimiteCupos = async () => {
    try {
      if (!horarioInicio || !horarioFin) {
        showError('Debes indicar el horario de inicio y fin');
        return;
      }

      if (horarioInicio === horarioFin) {
        showError('La hora de inicio y fin no pueden ser iguales');
        return;
      }

      setGuardandoLimite(true);
      await ApiService.initialize();
      const response = await ApiService.put('/configuracion/cupos/limite', {
        limite_cupos_restaurante: parseInt(nuevoLimite, 10),
        horario_valido_inicio: horarioInicio.length === 5 ? `${horarioInicio}:00` : horarioInicio,
        horario_valido_fin: horarioFin.length === 5 ? `${horarioFin}:00` : horarioFin
      });

      if (response && response.success) {
        showSuccess('Límite de cupos actualizado exitosamente');
        setCupos((prev) => ({
          ...prev,
          horarioValidoInicio: response.data?.horarioValidoInicio || horarioInicio,
          horarioValidoFin: response.data?.horarioValidoFin || horarioFin
        }));
        await cargarEstadisticasCupos();
      }
    } catch (error) {
      console.error('Error actualizando límite:', error);
      showError(error.response?.data?.message || 'Error al actualizar límite de cupos');
    } finally {
      setGuardandoLimite(false);
    }
  };

  // Crear usuario completo
  const crearUsuario = async () => {
    try {
      setCreandoUsuario(true);

      if (!nuevoUsuario.email || !nuevoUsuario.password || !nuevoUsuario.rol) {
        showError('Email, contraseña y rol son obligatorios');
        setCreandoUsuario(false);
        return;
      }

      if (nuevoUsuario.rol === 'estudiante' && (!nuevoUsuario.nombre || !nuevoUsuario.apellidos)) {
        showError('Para estudiantes, nombre y apellidos son obligatorios');
        setCreandoUsuario(false);
        return;
      }

      const datosUsuario = {
        email: nuevoUsuario.email,
        matricula: nuevoUsuario.matricula || null,
        password: nuevoUsuario.password,
        rol: nuevoUsuario.rol,
        estado: 'validado' // Siempre validado por defecto
      };

      if (nuevoUsuario.rol === 'estudiante') {
        Object.assign(datosUsuario, {
          nombre: nuevoUsuario.nombre,
          apellidos: nuevoUsuario.apellidos,
          fecha_nacimiento: nuevoUsuario.fecha_nacimiento || null,
          telefono: nuevoUsuario.telefono || null,
          grupo_academico_id: nuevoUsuario.grupo_academico_id || null,
          estrato: parseInt(nuevoUsuario.estrato),
          grupo_etnico: nuevoUsuario.grupo_etnico,
          es_desplazado: nuevoUsuario.es_desplazado
        });

        if (nuevoUsuario.acudiente_nombre && nuevoUsuario.acudiente_apellidos && nuevoUsuario.acudiente_cedula) {
          Object.assign(datosUsuario, {
            acudiente_nombre: nuevoUsuario.acudiente_nombre,
            acudiente_apellidos: nuevoUsuario.acudiente_apellidos,
            acudiente_cedula: nuevoUsuario.acudiente_cedula,
            acudiente_telefono: nuevoUsuario.acudiente_telefono || null,
            acudiente_email: nuevoUsuario.acudiente_email || null
          });
        }
      } else if (nuevoUsuario.rol === 'invitado') {
        datosUsuario.access_config = nuevoUsuario.access_config;
      }

      await ApiService.initialize();
      const response = await ApiService.post('/admin/usuarios/crear-completo', datosUsuario);

      if (response.status === 'SUCCESS') {
        let mensajeExito = 'Usuario creado exitosamente';

        // Si hay foto y es estudiante, subirla
        if (nuevoUsuario.rol === 'estudiante' && nuevoUsuario.fotoFile && response.data?.usuario_id) {
          try {
            const formData = new FormData();
            formData.append('foto_perfil', nuevoUsuario.fotoFile);

            const photoResponse = await ApiService.post(
              `/admin/users/${response.data.usuario_id}/photo`,
              formData,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            if (photoResponse?.status === 'SUCCESS') {
              mensajeExito += ' con foto de perfil';
            }
          } catch (photoError) {
            console.error('Error subiendo foto al crear:', photoError);
            showError('Usuario creado, pero hubo un error al subir la foto');
          }
        }

        showSuccess(mensajeExito);

        // Limpiar formulario completo
        setNuevoUsuario({
          email: '',
          matricula: '',
          password: '',
          rol: 'estudiante',
          estado: 'validado',
          nombre: '',
          apellidos: '',
          fecha_nacimiento: '',
          telefono: '',
          grupo_academico_id: '',
          estrato: 1,
          grupo_etnico: 'ninguno',
          es_desplazado: 'no',
          acudiente_nombre: '',
          acudiente_apellidos: '',
          acudiente_cedula: '',
          acudiente_telefono: '',
          acudiente_email: '',
          fotoFile: null,
          fotoPreview: null,
          access_config: []
        });

        if (nuevoUsuario.rol === 'estudiante') {
          await cargarEstadisticasCupos();
        }
      }
    } catch (error) {
      console.error('Error creando usuario:', error);
      showError(error.response?.data?.message || 'Error al crear usuario');
    } finally {
      setCreandoUsuario(false);
    }
  };

  const handleUsuarioChange = (campo, valor) => {
    setNuevoUsuario(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handlePermissionChange = (permiso) => {
    setNuevoUsuario(prev => {
      const current = prev.access_config || [];
      const newConfig = current.includes(permiso)
        ? current.filter(p => p !== permiso)
        : [...current, permiso];
      return { ...prev, access_config: newConfig };
    });
  };

  const getProgressColor = () => {
    if (cupos.porcentajeOcupacion >= 90) return '#f44336';
    if (cupos.porcentajeOcupacion >= 70) return '#ff9800';
    return '#4caf50';
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* HEADER INSTITUCIONAL */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
          Configuración del Sistema
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mt: 0.5, fontWeight: 500 }}>
          Gestiona el límite de cupos del restaurante y administra los usuarios del sistema.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* SECCIÓN 1: Límite de Cupos */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'grey.100'
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    bgcolor: 'primary.50',
                    p: 1.5,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    color: 'primary.main'
                  }}
                >
                  <RestaurantIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                    Límite de Cupos del Restaurante
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                    Control de capacidad máxima de estudiantes atendidos diariamente.
                  </Typography>
                </Box>
              </Box>
              <Tooltip title="Recargar estadísticas">
                <IconButton
                  onClick={cargarEstadisticasCupos}
                  disabled={cargandoCupos}
                  sx={{
                    bgcolor: '#f5f5f5',
                    '&:hover': { bgcolor: '#e0e0e0' }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Estado Actual - Diseño Moderno */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'grey.100',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%'
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 800, color: getProgressColor() }}>
                    {cupos.conteoActual}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase', mt: 1 }}>
                    Registrados Hoy
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: 'primary.50',
                    border: '1px solid',
                    borderColor: 'primary.100',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%'
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    {cupos.limiteMaximo}
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ fontWeight: 700, textTransform: 'uppercase', mt: 1 }}>
                    Capacidad Máxima
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: cupos.cuposCompletos ? 'error.50' : 'success.50',
                    border: '1px solid',
                    borderColor: cupos.cuposCompletos ? 'error.100' : 'success.100',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%'
                  }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 800, color: cupos.cuposCompletos ? 'error.main' : 'success.main' }}>
                    {cupos.cuposDisponibles}
                  </Typography>
                  <Typography variant="caption" color={cupos.cuposCompletos ? 'error' : 'success'} sx={{ fontWeight: 700, textTransform: 'uppercase', mt: 1 }}>
                    Cupos Libres
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* BARRA DE PROGRESO */}
            <Box mb={4}>
              <Box display="flex" justifyContent="space-between" mb={1.5} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  Nivel de Ocupación actual
                </Typography>
                <Chip
                  label={`${cupos.porcentajeOcupacion}%`}
                  size="small"
                  sx={{ bgcolor: getProgressColor(), color: 'white', fontWeight: 800 }}
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={cupos.porcentajeOcupacion}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  bgcolor: 'grey.100',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getProgressColor(),
                    borderRadius: 6
                  }
                }}
              />
            </Box>
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary">
                Horario válido para ESCANER
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {cupos.horarioValidoInicio || '11:00'} a {cupos.horarioValidoFin || '15:00'}
              </Typography>
            </Box>

            {cupos.cuposCompletos && (
              <Alert severity="error" sx={{ mb: 3 }} icon={<ErrorIcon />}>
                <Typography variant="body2">
                  Los cupos del restaurante están completos. No se pueden registrar más estudiantes hasta que se aumente el límite.
                </Typography>
              </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Actualizar Límite */}
            <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2.5, color: '#1e293b' }}>
                Modificar Configuración de Servicio
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Nuevo Límite de Cupos"
                    type="number"
                    value={nuevoLimite}
                    onChange={(e) => setNuevoLimite(e.target.value)}
                    InputProps={{
                      inputProps: { min: 1 },
                      sx: { borderRadius: 3, bgcolor: 'white' }
                    }}
                    helperText="Número máximo de cupos por día"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Hora de inicio"
                    type="time"
                    value={horarioInicio}
                    onChange={(e) => setHorarioInicio(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'white' } }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Hora de fin"
                    type="time"
                    value={horarioFin}
                    onChange={(e) => setHorarioFin(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'white' } }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    onClick={actualizarLimiteCupos}
                    disabled={
                      guardandoLimite ||
                      !nuevoLimite ||
                      nuevoLimite < 1 ||
                      !horarioInicio ||
                      !horarioFin
                    }
                    sx={{
                      height: 54,
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 3,
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                    }}
                  >
                    {guardandoLimite ? '...' : 'Guardar'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* SECCIÓN 2: Crear Usuario */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'grey.100'
            }}
          >
            <Box display="flex" alignItems="center" gap={2} mb={4}>
              <Box
                sx={{
                  bgcolor: 'success.50',
                  p: 1.5,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  color: 'success.main'
                }}
              >
                <PersonAddIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                  Crear Nuevo Usuario
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                  Registra un nuevo usuario con cualquier rol en el sistema.
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {/* Datos Básicos - ROL PRIMERO */}
              <Grid item xs={12}>
                <Divider textAlign="left">
                  <Chip label="Información de Cuenta" color="primary" variant="outlined" />
                </Divider>
              </Grid>

              {/* 1. SELECCIÓN DE ROL (Prioritario) */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}>
                  <InputLabel>Rol de Usuario</InputLabel>
                  <Select
                    value={nuevoUsuario.rol}
                    label="Rol de Usuario"
                    onChange={(e) => handleUsuarioChange('rol', e.target.value)}
                  >
                    <MenuItem value="estudiante">Estudiante</MenuItem>
                    <MenuItem value="docente">Docente</MenuItem>
                    <MenuItem value="alfabetizador">Personal de Apoyo (Alfabetizador)</MenuItem>
                    <MenuItem value="escaner">ESCANER (Cuenta Universal)</MenuItem>
                    <MenuItem value="secretaria">Secretaria</MenuItem>
                    <MenuItem value="coordinador_convivencia">Coordinador de Convivencia</MenuItem>
                    <MenuItem value="admin">Administrador</MenuItem>
                    <MenuItem value="invitado">Invitado Temporal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* 2. CAMPOS COMUNES (Email, Password, Matricula) */}
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Correo Electrónico"
                  type="email"
                  value={nuevoUsuario.email}
                  onChange={(e) => handleUsuarioChange('email', e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Contraseña"
                  type="password"
                  value={nuevoUsuario.password}
                  onChange={(e) => handleUsuarioChange('password', e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={nuevoUsuario.rol === 'estudiante' ? "Matrícula" : "Documento de Identidad / Matrícula"}
                  value={nuevoUsuario.matricula}
                  onChange={(e) => handleUsuarioChange('matricula', e.target.value)}
                  helperText={nuevoUsuario.rol === 'estudiante' ? "Opcional" : "Puede usarse como identificación"}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
                />
              </Grid>

              {/* 4. PERMISOS PARA INVITADO */}
              {nuevoUsuario.rol === 'invitado' && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      bgcolor: '#fffdeb',
                      p: 2.5,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: '#ffe58f'
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <WarningIcon color="warning" />
                      <Typography variant="subtitle1" fontWeight="bold">
                        Configuración de Invitado
                      </Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Esta cuenta expirará automáticamente <strong>24 horas</strong> después de su creación.
                      Seleccione los módulos a los que tendrá acceso:
                    </Typography>

                    <FormControl component="fieldset">
                      <FormLabel component="legend">Módulos Permitidos</FormLabel>
                      <FormGroup row>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={nuevoUsuario.access_config?.includes('dashboard')}
                              onChange={() => handlePermissionChange('dashboard')}
                            />
                          }
                          label="Dashboard"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={nuevoUsuario.access_config?.includes('estudiantes_gestion')}
                              onChange={() => handlePermissionChange('estudiantes_gestion')}
                            />
                          }
                          label="Gestión de Estudiantes"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={nuevoUsuario.access_config?.includes('justificaciones')}
                              onChange={() => handlePermissionChange('justificaciones')}
                            />
                          }
                          label="Justificaciones"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={nuevoUsuario.access_config?.includes('asistencia')}
                              onChange={() => handlePermissionChange('asistencia')}
                            />
                          }
                          label="Asistencia"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={nuevoUsuario.access_config?.includes('reportes')}
                              onChange={() => handlePermissionChange('reportes')}
                            />
                          }
                          label="Reportes"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={nuevoUsuario.access_config?.includes('alfabetizadores')}
                              onChange={() => handlePermissionChange('alfabetizadores')}
                            />
                          }
                          label="ESCANER"
                        />
                      </FormGroup>
                    </FormControl>
                  </Box>
                </Grid>
              )}

              {/* 3. CAMPOS ESPECÍFICOS DE ESTUDIANTE */}
              {nuevoUsuario.rol === 'estudiante' && (
                <>
                  <Grid item xs={12}>
                    <Divider textAlign="left">
                      <Chip label="Datos del Estudiante" color="secondary" variant="outlined" />
                    </Divider>
                  </Grid>

                  {/* FOTO DE PERFIL (Solo Estudiantes) */}
                  <Grid item xs={12} display="flex" justifyContent="center">
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                      <Avatar
                        sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: 40 }}
                        src={nuevoUsuario.fotoPreview}
                      >
                        {!nuevoUsuario.fotoPreview && <PhotoCameraIcon fontSize="inherit" />}
                      </Avatar>
                      <Button
                        variant="outlined"
                        component="label"
                        size="small"
                        startIcon={<PhotoCameraIcon />}
                      >
                        Subir Foto
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setNuevoUsuario(prev => ({
                                ...prev,
                                fotoFile: file,
                                fotoPreview: URL.createObjectURL(file)
                              }));
                            }
                          }}
                        />
                      </Button>
                      <Typography variant="caption" color="textSecondary">
                        Se subirá al crear el usuario
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      required
                      fullWidth
                      label="Nombre"
                      value={nuevoUsuario.nombre}
                      onChange={(e) => handleUsuarioChange('nombre', e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      required
                      fullWidth
                      label="Apellidos"
                      value={nuevoUsuario.apellidos}
                      onChange={(e) => handleUsuarioChange('apellidos', e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Fecha de Nacimiento"
                      type="date"
                      value={nuevoUsuario.fecha_nacimiento}
                      onChange={(e) => handleUsuarioChange('fecha_nacimiento', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Teléfono"
                      value={nuevoUsuario.telefono}
                      onChange={(e) => handleUsuarioChange('telefono', e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
                    />
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}>
                      <InputLabel>Grupo Académico</InputLabel>
                      <Select
                        value={nuevoUsuario.grupo_academico_id}
                        label="Grupo Académico"
                        onChange={(e) => handleUsuarioChange('grupo_academico_id', e.target.value)}
                      >
                        {gruposOptions.map((grupo) => (
                          <MenuItem key={grupo.id} value={grupo.id}>
                            {grupo.nombre} - {grupo.jornada}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}>
                      <InputLabel>Estrato</InputLabel>
                      <Select
                        value={nuevoUsuario.estrato}
                        label="Estrato"
                        onChange={(e) => handleUsuarioChange('estrato', e.target.value)}
                      >
                        {[1, 2, 3, 4, 5, 6].map(e => (
                          <MenuItem key={e} value={e}>{e}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}>
                      <InputLabel>Grupo Étnico</InputLabel>
                      <Select
                        value={nuevoUsuario.grupo_etnico}
                        label="Grupo Étnico"
                        onChange={(e) => handleUsuarioChange('grupo_etnico', e.target.value)}
                      >
                        <MenuItem value="ninguno">Ninguno</MenuItem>
                        <MenuItem value="indigena">Indígena</MenuItem>
                        <MenuItem value="afrodescendiente">Afrodescendiente</MenuItem>
                        <MenuItem value="rom">ROM (Gitano)</MenuItem>
                        <MenuItem value="raizal">Raizal</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}>
                      <InputLabel>¿Es Desplazado?</InputLabel>
                      <Select
                        value={nuevoUsuario.es_desplazado}
                        label="¿Es Desplazado?"
                        onChange={(e) => handleUsuarioChange('es_desplazado', e.target.value)}
                      >
                        <MenuItem value="no">No</MenuItem>
                        <MenuItem value="si">Sí</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Datos del Acudiente */}
                  <Grid item xs={12}>
                    <Divider textAlign="left">
                      <Chip label="Datos del Acudiente (Opcional)" variant="outlined" />
                    </Divider>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nombre del Acudiente"
                      value={nuevoUsuario.acudiente_nombre}
                      onChange={(e) => handleUsuarioChange('acudiente_nombre', e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Apellidos del Acudiente"
                      value={nuevoUsuario.acudiente_apellidos}
                      onChange={(e) => handleUsuarioChange('acudiente_apellidos', e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Cédula del Acudiente"
                      value={nuevoUsuario.acudiente_cedula}
                      onChange={(e) => handleUsuarioChange('acudiente_cedula', e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Teléfono del Acudiente"
                      value={nuevoUsuario.acudiente_telefono}
                      onChange={(e) => handleUsuarioChange('acudiente_telefono', e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Email del Acudiente"
                      type="email"
                      value={nuevoUsuario.acudiente_email}
                      onChange={(e) => handleUsuarioChange('acudiente_email', e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'grey.50' } }}
                    />
                  </Grid>
                </>
              )}

              {/* Botones de Acción */}
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setNuevoUsuario({
                        email: '',
                        matricula: '',
                        password: '',
                        rol: 'estudiante',
                        estado: 'validado',
                        nombre: '',
                        apellidos: '',
                        fecha_nacimiento: '',
                        telefono: '',
                        grupo_academico_id: '',
                        estrato: 1,
                        grupo_etnico: 'ninguno',
                        es_desplazado: 'no',
                        acudiente_nombre: '',
                        acudiente_apellidos: '',
                        acudiente_cedula: '',
                        acudiente_telefono: '',
                        acudiente_email: '',
                        fotoFile: null,
                        fotoPreview: null,
                        access_config: []
                      });
                    }}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 3, px: 3 }}
                  >
                    Limpiar Formulario
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PersonAddIcon />}
                    onClick={crearUsuario}
                    disabled={creandoUsuario}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 3,
                      px: 4,
                      boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)'
                    }}
                  >
                    {creandoUsuario ? 'Procesando...' : 'Crear Usuario'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>


      </Grid >


    </Box >
  );
};

export default ConfiguracionNueva;
