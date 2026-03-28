import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Avatar,
  Skeleton,
  useTheme,
  Divider
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Search as SearchIcon,
  CheckCircle as ValidateIcon,
  Cancel as RejectIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  LockReset as ResetIcon,
  Block as SuspendIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  People as PeopleIcon,
  Pending as PendingIcon,
  Add as AddIcon
} from '@mui/icons-material';
// ❌ ELIMINADO: react-toastify
// import { toast } from 'react-toastify';
// ✅ AGREGADO: Sistema unificado de notificaciones
import { useNotification } from 'contexts/NotificationContext';
import { useAuth } from 'hooks/useAuth';
import useRoleBasedApi from 'hooks/useRoleBasedApi';
import ApiService from '../../services/ApiService';
import { getProfilePhotoUrl } from '../../utils/imageUtils';

import StatCard from 'components/common/StatCard';
import PageHeader from 'components/common/PageHeader';

// 🔥 SKELETON LOADER - Optimizado con memo
const TableRowSkeleton = memo(() => (
  <TableRow>
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={16} />
        </Box>
      </Box>
    </TableCell>
    <TableCell>
      <Skeleton variant="text" width="80%" height={20} />
      <Skeleton variant="text" width="60%" height={16} />
    </TableCell>
    <TableCell>
      <Skeleton variant="text" width="50%" height={20} />
    </TableCell>
    <TableCell>
      <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '12px' }} />
    </TableCell>
    <TableCell>
      <Skeleton variant="text" width="70%" height={20} />
    </TableCell>
    <TableCell>
      <Skeleton variant="text" width="30%" height={20} />
    </TableCell>
    <TableCell>
      <Skeleton variant="rounded" width={90} height={28} sx={{ borderRadius: '16px' }} />
    </TableCell>
    <TableCell align="center">
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
        <Skeleton variant="circular" width={36} height={36} />
        <Skeleton variant="circular" width={36} height={36} />
        <Skeleton variant="circular" width={36} height={36} />
        <Skeleton variant="circular" width={36} height={36} />
      </Box>
    </TableCell>
  </TableRow>
));

TableRowSkeleton.displayName = 'TableRowSkeleton';

// 🔥 SKELETON PARA TARJETAS DE ESTADÍSTICAS
const StatCardSkeleton = memo(() => (
  <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
    <CardContent sx={{ textAlign: 'center', py: 2 }}>
      <Skeleton variant="text" width="60%" height={40} sx={{ mx: 'auto', mb: 1 }} />
      <Skeleton variant="text" width="80%" height={20} sx={{ mx: 'auto' }} />
    </CardContent>
  </Card>
));

StatCardSkeleton.displayName = 'StatCardSkeleton';



const GestionUnificada = () => {
  // ✅ Hook de notificaciones unificado
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();
  const { endpoints, permissions } = useRoleBasedApi();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [selectedUser, setSelectedUser] = useState(null);
  const [usingTestData, setUsingTestData] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editData, setEditData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    grupo_academico_id: '',
    estrato: ''
  });
  const [stats, setStats] = useState({
    pendientes: 0,
    validados: 0,
    rechazados: 0,
    suspendidos: 0,
    total: 0
  });
  const [grupos, setGrupos] = useState([]);

  // Esquema de validación para nuevos estudiantes
  const validationSchema = Yup.object().shape({
    nombre: Yup.string().required('Obligatorio'),
    apellidos: Yup.string().required('Obligatorio'),
    email: Yup.string().email('Email inválido').required('Obligatorio'),
    password: Yup.string().min(6, 'Mínimo 6 caracteres').required('Obligatorio'),
    matricula: Yup.string(),
    fecha_nacimiento: Yup.date().required('Obligatorio'),
    telefono: Yup.string().required('Obligatorio'),
    grupo_academico_id: Yup.string().required('Obligatorio'),
    estrato: Yup.string().required('Obligatorio'),
    grupo_etnico: Yup.string().required('Obligatorio'),
    es_desplazado: Yup.string().required('Obligatorio'),
    acudiente_nombre: Yup.string().required('Obligatorio'),
    acudiente_apellidos: Yup.string().required('Obligatorio'),
    acudiente_cedula: Yup.string().required('Obligatorio'),
    acudiente_telefono: Yup.string().required('Obligatorio'),
    acudiente_email: Yup.string().email('Email inválido')
  });

  const formik = useFormik({
    initialValues: {
      nombre: '',
      apellidos: '',
      email: '',
      password: '',
      rol: 'estudiante',
      estado: 'validado',
      matricula: '',
      fecha_nacimiento: '',
      telefono: '',
      grupo_academico_id: '',
      estrato: '',
      grupo_etnico: 'NINGUNO',
      es_desplazado: 'NO',
      acudiente_nombre: '',
      acudiente_apellidos: '',
      acudiente_cedula: '',
      acudiente_telefono: '',
      acudiente_email: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const response = await ApiService.post(endpoints.students.create, values);
        if (response.status === 'SUCCESS') {
          showSuccess('Estudiante registrado exitosamente');
          setCreateModalOpen(false);
          formik.resetForm();
          cargarDatosOptimizados();
        }
      } catch (error) {
        showError(error.message || 'Error al registrar estudiante');
      } finally {
        setLoading(false);
      }
    }
  });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(50);

  // Timer para búsqueda con debounce
  const [searchTimer, setSearchTimer] = useState(null);

  const rolePermissions = useMemo(() => {
    const isAdminRole = user?.rol === 'admin';
    const isSecretaryRole = user?.rol === 'secretaria';
    const isCoordinatorRole = user?.rol === 'coordinador_convivencia';
    const isGuestRole = user?.rol === 'invitado';

    return {
      isAdmin: isAdminRole,
      isSecretary: isSecretaryRole,
      isCoordinator: isCoordinatorRole,
      isGuest: isGuestRole,
      canEdit: isAdminRole || isSecretaryRole || isGuestRole,
      canValidate: isAdminRole || isSecretaryRole || isGuestRole,
      canSuspend: isAdminRole || isSecretaryRole || isGuestRole,
      canReset: isAdminRole || isSecretaryRole || isGuestRole,
      canDelete: isAdminRole
    };
  }, [user]);

  useEffect(() => {
    cargarDatosOptimizados();
    cargarGrupos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filtroEstado]);

  const cargarGrupos = async () => {
    try {
      const response = await ApiService.get('/groups');
      if (response && response.status === 'SUCCESS') {
        setGrupos(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando grupos:', error);
    }
  };

  // Debounce para búsqueda en tiempo real
  useEffect(() => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    const timer = setTimeout(() => {
      if (currentPage === 1) {
        cargarDatosOptimizados();
      } else {
        setCurrentPage(1); // Resetear a página 1 cuando busque
      }
    }, 500); // 500ms de delay

    setSearchTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Nueva función optimizada con búsqueda en backend
  const cargarDatosOptimizados = async () => {
    try {
      setLoading(true);

      await ApiService.initialize();

      // Determinar endpoint según rol
      let endpoint = '';
      if (user?.rol === 'admin') {
        endpoint = '/admin/users/search';
      } else if (user?.rol === 'secretaria' || user?.rol === 'coordinador_convivencia' || user?.rol === 'invitado') {
        // Invitados usan el mismo endpoint de búsqueda que secretaría
        endpoint = '/secretary/users/search';
      } else {
        // Rol no autorizado (estudiante, docente, etc.), usar datos de prueba
        setUsingTestData(true);
        setUsuarios([]);
        setLoading(false);
        return;
      }

      // Construir query params
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        estado: filtroEstado !== 'todos' ? filtroEstado : ''
      });

      const response = await ApiService.get(`${endpoint}?${params.toString()}`);

      if (response && response.status === 'SUCCESS') {
        const { data, pagination } = response;

        setUsuarios(data);
        setTotalPages(pagination.totalPages);
        setTotalItems(pagination.totalItems);
        setCurrentPage(pagination.currentPage);
        setUsingTestData(false);

        // Calcular estadísticas desde el total de items
        await cargarEstadisticasGenerales();
      } else {
        showError('No se pudieron cargar los datos');
        setUsingTestData(true);
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
      showError('Error al cargar los datos');
      setUsingTestData(true);
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas generales (sin paginación)
  const cargarEstadisticasGenerales = async () => {
    try {
      let endpoint = '';
      if (user?.rol === 'admin') {
        endpoint = '/admin/users/search';
      } else if (user?.rol === 'secretaria' || user?.rol === 'coordinador_convivencia' || user?.rol === 'invitado') {
        endpoint = '/secretary/users/search';
      } else {
        return;
      }

      // Hacer una búsqueda con limit=1 solo para obtener totales por estado
      const estados = ['pendiente', 'validado', 'rechazado', 'suspendido'];
      const estadisticas = { total: 0, pendientes: 0, validados: 0, rechazados: 0, suspendidos: 0 };

      for (const estado of estados) {
        const params = new URLSearchParams({
          page: 1,
          limit: 1,
          estado: estado
        });

        const response = await ApiService.get(`${endpoint}?${params.toString()}`);

        if (response && response.status === 'SUCCESS') {
          const count = response.pagination.totalItems;
          estadisticas.total += count;

          switch (estado) {
            case 'pendiente':
              estadisticas.pendientes = count;
              break;
            case 'validado':
              estadisticas.validados = count;
              break;
            case 'rechazado':
              estadisticas.rechazados = count;
              break;
            case 'suspendido':
              estadisticas.suspendidos = count;
              break;
            default:
              break;
          }
        }
      }

      setStats(estadisticas);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Funciones aplicarFiltros y calcularEstadisticas eliminadas
  // Ahora se hace todo en el backend con búsqueda optimizada

  // 🚀 OPTIMIZACIÓN: useCallback para evitar re-creación de funciones
  const handleViewDetails = useCallback((usuario) => {
    setSelectedUser(usuario);
    setViewModalOpen(true);
  }, []);

  const handleEdit = useCallback((usuario) => {
    setSelectedUser(usuario);
    // Para docentes: buscar qué grupo dirige actualmente
    let docenteGrupoId = '';
    if (usuario.rol === 'docente') {
      const grupoActual = grupos.find(g => g.director_grupo_id === (usuario.usuario_id || usuario.id));
      docenteGrupoId = grupoActual ? grupoActual.id : '';
    }
    setEditData({
      nombre: usuario.nombre || '',
      apellidos: usuario.apellidos || '',
      email: usuario.email || '',
      telefono: usuario.telefono || '',
      grupo_academico_id: usuario.rol === 'docente' ? docenteGrupoId : (usuario.grupo_academico_id || ''),
      estrato: usuario.estrato || ''
    });
    setEditModalOpen(true);
  }, [grupos]);

  // 🚀 OPTIMIZACIÓN: useCallback para handleAction
  const handleAction = useCallback(async (usuario, action) => {
    try {
      const studentId = usuario.usuario_id || usuario.id || usuario.userId;

      if (!studentId) {
        throw new Error('No se pudo determinar el ID del usuario');
      }

      const baseUrl = user?.rol === 'admin' ? '/admin' : '/secretary';
      let endpoint = '';
      let method = 'POST';
      let body = {};

      switch (action) {
        case 'validate':
          if (usuario.rol === 'estudiante') {
            endpoint = `/secretary/students/${studentId}/validate`;
          } else {
            endpoint = `${baseUrl}/users/${studentId}`;
            method = 'PUT';
            body = { estado: 'validado', comentario: `Validado por ${user?.email}` };
            break;
          }
          method = 'PUT';
          body = { accion: 'validar', comentario: `Validado automáticamente por ${user?.email}` };
          break;
        case 'reject':
          if (usuario.rol === 'estudiante') {
            endpoint = `/secretary/students/${studentId}/validate`;
          } else {
            endpoint = `${baseUrl}/users/${studentId}`;
            method = 'PUT';
            body = { estado: 'rechazado', comentario: `Rechazado por ${user?.email}` };
            break;
          }
          method = 'PUT';
          body = { accion: 'rechazar', comentario: `Rechazado por ${user?.email}` };
          break;
        case 'suspend':
          if (usuario.rol === 'estudiante') {
            endpoint = `/secretary/students/${studentId}/suspend`;
          } else {
            endpoint = `${baseUrl}/users/${studentId}`;
            method = 'PUT';
            body = { estado: 'suspendido', comentario: `Suspendido por ${user?.email}` };
            break;
          }
          method = 'PUT';
          body = { comentario: `Suspendido por ${user?.email}` };
          break;
        case 'delete':
          // 🔒 Mostrar diálogo de confirmación antes de eliminar
          setUserToDelete(usuario);
          setDeleteConfirmOpen(true);
          return; // Salir sin ejecutar la eliminación todavía
        case 'reset':
          if (usuario.rol === 'estudiante') {
            endpoint = `/secretary/students/${studentId}/reset-password`;
            method = 'POST';
            body = {};
          } else {
            // Para otros usuarios, usar endpoint de admin si existe o mostrar mensaje
            showError('Reinicio de contraseña solo disponible para estudiantes');
            return;
          }
          break;
        default:
          return;
      }

      let response;
      if (method === 'GET') {
        response = await ApiService.get(endpoint);
      } else if (method === 'POST') {
        response = await ApiService.post(endpoint, body);
      } else if (method === 'PUT') {
        response = await ApiService.put(endpoint, body);
      } else if (method === 'DELETE') {
        response = await ApiService.delete(endpoint);
      }

      const actionMessages = {
        validate: `${usuario.nombre} ${usuario.apellidos} ha sido validado exitosamente`,
        reject: `${usuario.nombre} ${usuario.apellidos} ha sido rechazado`,
        suspend: `${usuario.nombre} ${usuario.apellidos} ha sido suspendido`,
        delete: `${usuario.nombre} ${usuario.apellidos} ha sido eliminado`,
        reset: `Contraseña de ${usuario.nombre} ${usuario.apellidos} reiniciada a su matrícula: ${usuario.matricula || 'N/A'}`
      };

      if (response && response.success !== false) {
        showSuccess(actionMessages[action] || 'Acción ejecutada exitosamente');
        cargarDatosOptimizados();
      } else {
        throw new Error(response?.message || 'Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error en handleAction:', error);
      let errorMessage = 'Error desconocido';

      if (error.response) {
        // Error de respuesta del servidor
        errorMessage = error.response.data?.message ||
          error.response.data?.error ||
          `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError(`Error al ejecutar la acción: ${errorMessage}`);
    }
  }, [user, showSuccess, showError, cargarDatosOptimizados]); // 🚀 Dependencias de useCallback

  // 🚀 OPTIMIZACIÓN: useCallback para guardarEdicion
  const guardarEdicion = useCallback(async () => {
    try {
      let endpoint;

      if (user?.rol === 'admin') {
        // Para admin usar la ruta de usuarios
        endpoint = `/admin/users/${selectedUser.usuario_id || selectedUser.id}`;
      } else {
        // Para secretary usar la ruta de estudiantes
        endpoint = `/secretary/students/${selectedUser.usuario_id || selectedUser.id}`;
      }

      // Incluir campos requeridos por el backend que no están en editData
      const payload = {
        ...editData,
        rol: selectedUser.rol,
        estado: selectedUser.estado,
        matricula: selectedUser.matricula || null
      };

      await ApiService.put(endpoint, payload);
      showSuccess('Datos actualizados exitosamente');
      setEditModalOpen(false);
      cargarDatosOptimizados();
    } catch (error) {
      console.error('Error al actualizar datos:', error);
      showError('Error al actualizar los datos: ' + (error.message || 'Error desconocido'));
    }
  }, [user, selectedUser, editData, showSuccess, showError, cargarDatosOptimizados]); // 🚀 Dependencias

  // � NUEVA FUNCIÓN: Confirmar y ejecutar eliminación
  const confirmarEliminacion = useCallback(async () => {
    if (!userToDelete) return;

    try {
      const studentId = userToDelete.usuario_id || userToDelete.id || userToDelete.userId;
      const baseUrl = user?.rol === 'admin' ? '/admin' : '/secretary';
      const endpoint = `${baseUrl}/users/${studentId}`;

      const response = await ApiService.delete(endpoint);

      if (response && response.success !== false) {
        showSuccess(`${userToDelete.nombre} ${userToDelete.apellidos} ha sido eliminado`);
        setDeleteConfirmOpen(false);
        setUserToDelete(null);
        cargarDatosOptimizados();
      } else {
        throw new Error(response?.message || 'Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      let errorMessage = 'Error desconocido';

      if (error.response) {
        errorMessage = error.response.data?.message ||
          error.response.data?.error ||
          `Error ${error.response.status}: ${error.response.statusText}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError(`Error al eliminar: ${errorMessage}`);
    }
  }, [userToDelete, user, showSuccess, showError, cargarDatosOptimizados]);

  // �🚀 OPTIMIZACIÓN: useMemo para getEstadoChip
  const getEstadoChip = useCallback((estado) => {
    const colores = {
      pendiente: 'warning',
      validado: 'success',
      rechazado: 'error',
      suspendido: 'secondary'
    };
    const color = colores[estado] || 'default';
    return (
      <Chip
        label={estado}
        size="small"
        sx={{
          bgcolor: color === 'default' ? 'grey.50' : `${color}.50`,
          color: color === 'default' ? 'grey.500' : `${color}.main`,
          fontWeight: 700,
          border: 'none',
          borderRadius: 1.5,
          textTransform: 'capitalize'
        }}
      />
    );
  }, []); // Sin dependencias porque es función pura

  // � OPTIMIZACIÓN: useMemo para estilos de botones (evitar recreación)
  const buttonStyles = useMemo(() => ({
    view: {
      borderRadius: 1.5,
      minWidth: 32,
      width: 32,
      height: 32,
      p: 0.5,
      transition: 'all 0.2s ease-in-out',
      bgcolor: '#2196f3',
      color: 'white',
      '&:hover': {
        bgcolor: '#1976d2',
        transform: 'scale(1.1)'
      }
    },
    edit: {
      borderRadius: 1.5,
      minWidth: 32,
      width: 32,
      height: 32,
      p: 0.5,
      transition: 'all 0.2s ease-in-out',
      bgcolor: '#ff9800',
      color: 'white',
      '&:hover': {
        bgcolor: '#f57c00',
        transform: 'scale(1.1)'
      }
    },
    validate: {
      borderRadius: 1.5,
      minWidth: 32,
      width: 32,
      height: 32,
      p: 0.5,
      transition: 'all 0.2s ease-in-out',
      bgcolor: '#4caf50',
      color: 'white',
      '&:hover': {
        bgcolor: '#388e3c',
        transform: 'scale(1.1)'
      }
    },
    reject: {
      borderRadius: 1.5,
      minWidth: 32,
      width: 32,
      height: 32,
      p: 0.5,
      transition: 'all 0.2s ease-in-out',
      bgcolor: '#f44336',
      color: 'white',
      '&:hover': {
        bgcolor: '#d32f2f',
        transform: 'scale(1.1)'
      }
    },
    reset: {
      borderRadius: 1.5,
      minWidth: 32,
      width: 32,
      height: 32,
      p: 0.5,
      transition: 'all 0.2s ease-in-out',
      bgcolor: '#9c27b0',
      color: 'white',
      '&:hover': {
        bgcolor: '#7b1fa2',
        transform: 'scale(1.1)'
      }
    },
    suspend: {
      borderRadius: 1.5,
      minWidth: 32,
      width: 32,
      height: 32,
      p: 0.5,
      transition: 'all 0.2s ease-in-out',
      bgcolor: '#607d8b',
      color: 'white',
      '&:hover': {
        bgcolor: '#455a64',
        transform: 'scale(1.1)'
      }
    },
    delete: {
      borderRadius: 1.5,
      minWidth: 32,
      width: 32,
      height: 32,
      p: 0.5,
      transition: 'all 0.2s ease-in-out',
      bgcolor: '#e91e63',
      color: 'white',
      '&:hover': {
        bgcolor: '#c2185b',
        transform: 'scale(1.1)'
      }
    }
  }), []); // 🚀 useMemo sin dependencias - estilos estáticos

  // 🚀 OPTIMIZACIÓN: useCallback para getActionButtons
  const getActionButtons = useCallback((usuario) => {
    const buttons = [];
    const {
      isAdmin,
      canEdit,
      canValidate,
      canSuspend,
      canReset,
      canDelete
    } = rolePermissions;

    // 🔒 PROTECCIÓN: No mostrar acciones si es cuenta admin
    const isAdminAccount = usuario.rol === 'admin';
    // 🔒 PROTECCIÓN: No permitir acciones sobre la propia cuenta
    const isSelfAccount = usuario.usuario_id === user?.id || usuario.id === user?.id;

    buttons.push(
      <Tooltip key="view" title="👁️ Ver detalles" arrow>
        <IconButton
          size="small"
          onClick={() => handleViewDetails(usuario)}
          sx={buttonStyles.view}
        >
          <ViewIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    );

    // 🔒 PROTECCIÓN: No permitir editar cuentas admin (excepto la propia)
    if (canEdit && (!isAdminAccount || isSelfAccount)) {
      buttons.push(
        <Tooltip key="edit" title="✏️ Editar datos" arrow>
          <IconButton
            size="small"
            onClick={() => handleEdit(usuario)}
            sx={buttonStyles.edit}
          >
            <EditIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      );
    }

    // 🔒 PROTECCIÓN: No permitir validar/rechazar/suspender cuentas admin
    if (usuario.estado === 'pendiente' && canValidate && !isAdminAccount) {
      buttons.push(
        <Tooltip key="validate" title="✅ Validar usuario" arrow>
          <IconButton
            size="small"
            onClick={() => handleAction(usuario, 'validate')}
            sx={buttonStyles.validate}
          >
            <ValidateIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      );
      buttons.push(
        <Tooltip key="reject" title="❌ Rechazar usuario" arrow>
          <IconButton
            size="small"
            onClick={() => handleAction(usuario, 'reject')}
            sx={buttonStyles.reject}
          >
            <RejectIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      );
    }

    if (usuario.estado === 'validado' && canSuspend && !isAdminAccount) {
      // Solo mostrar botón de reset para estudiantes con matrícula
      if (canReset && usuario.rol === 'estudiante' && usuario.matricula) {
        buttons.push(
          <Tooltip key="reset" title={`🔑 Reiniciar contraseña a: ${usuario.matricula}`} arrow>
            <IconButton
              size="small"
              onClick={() => handleAction(usuario, 'reset')}
              sx={buttonStyles.reset}
            >
              <ResetIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        );
      }
      buttons.push(
        <Tooltip key="suspend" title="⏸ Suspender usuario" arrow>
          <IconButton
            size="small"
            onClick={() => handleAction(usuario, 'suspend')}
            sx={buttonStyles.suspend}
          >
            <SuspendIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      );
    }

    if (usuario.estado === 'rechazado' && canValidate && !isAdminAccount) {
      buttons.push(
        <Tooltip key="validate" title="🔄 Reactivar usuario" arrow>
          <IconButton
            size="small"
            onClick={() => handleAction(usuario, 'validate')}
            sx={buttonStyles.validate}
          >
            <ValidateIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      );
    }

    if (usuario.estado === 'suspendido' && canValidate && !isAdminAccount) {
      buttons.push(
        <Tooltip key="validate" title="🔄 Reactivar usuario" arrow>
          <IconButton
            size="small"
            onClick={() => handleAction(usuario, 'validate')}
            sx={buttonStyles.validate}
          >
            <ValidateIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      );
    }

    if (canDelete) {
      // 🔒 PROTECCIÓN: No permitir eliminar cuentas admin ni la propia cuenta
      const canDeleteUser = !isAdminAccount && !isSelfAccount;

      buttons.push(
        <Tooltip
          key="delete"
          title={
            isAdminAccount
              ? "🔒 No se puede eliminar cuenta de administrador"
              : isSelfAccount
                ? "🔒 No puedes eliminar tu propia cuenta"
                : "🗑️ Eliminar usuario"
          }
          arrow
        >
          <span> {/* Envolver en span para que Tooltip funcione con botón deshabilitado */}
            <IconButton
              size="small"
              onClick={() => canDeleteUser && handleAction(usuario, 'delete')}
              sx={{
                ...buttonStyles.delete,
                opacity: canDeleteUser ? 1 : 0.4,
                cursor: canDeleteUser ? 'pointer' : 'not-allowed',
                '&:hover': canDeleteUser ? buttonStyles.delete['&:hover'] : {}
              }}
              disabled={!canDeleteUser}
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
      );
    }

    return buttons;
  }, [rolePermissions, user?.id, buttonStyles, handleViewDetails, handleEdit, handleAction]); // 🚀 Dependencias de useCallback

  // 🚀 OPTIMIZACIÓN: useMemo para filtrar usuarios (evitar filtrado en cada render)
  const usuariosFiltrados = useMemo(() => {
    return usuarios; // La filtración ya se hace en backend con la búsqueda optimizada
  }, [usuarios]);

  if (loading) {
    return (
      <Box sx={{ p: 3, maxWidth: '1400px', mx: 'auto' }}>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="500px"
        >
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" color="text.secondary">
            Cargando datos de usuarios...
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Esto puede tardar unos momentos
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1600, mx: 'auto' }}>
      <PageHeader
        title="Gestión Unificada de Estudiantes"
        subtitle="Administra, valida y supervisa las cuentas de todos los estudiantes"
        actions={
          permissions.canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateModalOpen(true)}
              sx={{ borderRadius: 3, fontWeight: 700 }}
            >
              Registrar Estudiante
            </Button>
          )
        }
      />

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total"
            value={stats.total}
            icon={PeopleIcon}
            color="primary"
            description="Usuarios totales"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Pendientes"
            value={stats.pendientes}
            icon={PendingIcon}
            color="warning"
            description="Por validar"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Validados"
            value={stats.validados}
            icon={ValidateIcon}
            color="success"
            description="Cuentas activas"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Rechazados"
            value={stats.rechazados}
            icon={RejectIcon}
            color="error"
            description="Cuentas bloqueadas"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Suspendidos"
            value={stats.suspendidos}
            icon={SuspendIcon}
            color="secondary"
            description="Cuentas temporales"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'grey.100',
          bgcolor: 'white'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, email, matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="medium"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                sx: { borderRadius: 3, bgcolor: 'grey.50' }
              }}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {['todos', 'pendiente', 'validado', 'rechazado', 'suspendido'].map((estado) => (
                <Button
                  key={estado}
                  variant={filtroEstado === estado ? 'contained' : 'outlined'}
                  onClick={() => setFiltroEstado(estado)}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'capitalize',
                    fontWeight: 600,
                    px: 2,
                    ...(filtroEstado !== estado && {
                      borderColor: 'grey.200',
                      color: 'text.secondary',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.50'
                      }
                    })
                  }}
                >
                  {estado.toUpperCase()} ({
                    estado === 'todos' ? stats.total :
                      estado === 'pendiente' ? stats.pendientes :
                        estado === 'validado' ? stats.validados :
                          estado === 'rechazado' ? stats.rechazados :
                            stats.suspendidos
                  })
                </Button>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'grey.100',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell> Usuario</TableCell>
                <TableCell> Contacto</TableCell>
                <TableCell> Matrícula</TableCell>
                <TableCell> Rol</TableCell>
                <TableCell> Grado/Jornada</TableCell>
                <TableCell> Estrato</TableCell>
                <TableCell> Estado</TableCell>
                <TableCell align="center" sx={{ minWidth: 280 }}> Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                // 🔥 SKELETON LOADERS mientras carga
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRowSkeleton key={`skeleton-${index}`} />
                ))
              ) : usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      No se encontraron usuarios
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((usuario) => (
                  <TableRow key={usuario.usuario_id || usuario.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={usuario.foto_perfil ? getProfilePhotoUrl(usuario.foto_perfil) : undefined}
                          alt={`${usuario.nombre} ${usuario.apellidos}`}
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: 'primary.main',
                            fontWeight: 600
                          }}
                          imgProps={{
                            onError: (e) => {
                              // Si la imagen falla al cargar, ocultar el src para mostrar fallback
                              e.target.style.display = 'none';
                            }
                          }}
                        >
                          {(usuario.nombre?.[0] || 'U').toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {usuario.nombre} {usuario.apellidos}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {usuario.usuario_id || usuario.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {usuario.email}
                      </Typography>
                      {usuario.telefono && (
                        <Typography variant="body2" color="text.secondary">
                          {usuario.telefono}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {usuario.matricula || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={(usuario.rol || 'Sin rol').toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: usuario.rol ? 'primary.50' : 'grey.50',
                          color: usuario.rol ? 'primary.main' : 'grey.500',
                          fontWeight: 700,
                          border: 'none',
                          borderRadius: 1.5,
                          fontSize: '0.65rem'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {usuario.grado ? `${usuario.grado} - ${usuario.jornada || 'N/A'}` : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {usuario.estrato || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{getEstadoChip(usuario.estado)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        {getActionButtons(usuario)}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Controles de Paginación */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 2,
        px: 2,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="body2" color="text.secondary">
          Mostrando {usuarios.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} usuarios
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            disabled={currentPage === 1}
            onClick={() => {
              const newPage = currentPage - 1;
              setCurrentPage(newPage);
              cargarDatosOptimizados();
            }}
            startIcon={<ChevronLeftIcon />}
          >
            Anterior
          </Button>

          <Typography variant="body2" sx={{ mx: 2 }}>
            Página {currentPage} de {totalPages}
          </Typography>

          <Button
            variant="outlined"
            size="small"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => {
              const newPage = currentPage + 1;
              setCurrentPage(newPage);
              cargarDatosOptimizados();
            }}
            endIcon={<ChevronRightIcon />}
          >
            Siguiente
          </Button>
        </Box>
      </Box>


      {/* 👁️ MODAL DE VISUALIZACIÓN COMPACTO */}
      <Dialog
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '85vh'
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 1.5
        }}>
          <ViewIcon fontSize="small" />
          <Typography variant="h6">Información Completa</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, pb: 1 }}>
          {selectedUser && (
            <Box>
              {/* SECCIÓN SUPERIOR COMPACTA: FOTO, INFO BÁSICA Y QR */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {/* COLUMNA IZQUIERDA: FOTO + INFO BÁSICA */}
                <Grid item xs={12} sm={8}>
                  <Box sx={{
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    bgcolor: 'background.default',
                    p: 2,
                    borderRadius: 2
                  }}>
                    {/* FOTO DE PERFIL */}
                    <Avatar
                      src={getProfilePhotoUrl(selectedUser.foto_perfil)}
                      sx={{
                        width: 80,
                        height: 80,
                        border: '3px solid',
                        borderColor: 'primary.main'
                      }}
                    >
                      {!selectedUser.foto_perfil && (
                        <Typography variant="h3" sx={{ fontSize: 35 }}>
                          {(selectedUser.nombre?.[0] || 'U').toUpperCase()}
                        </Typography>
                      )}
                    </Avatar>

                    {/* INFO NOMBRE Y ROL */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                        {selectedUser.nombre} {selectedUser.apellidos}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Chip
                          label={selectedUser.rol || 'Sin rol'}
                          color="primary"
                          size="small"
                        />
                        {getEstadoChip(selectedUser.estado)}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        ID: {selectedUser.usuario_id || selectedUser.id}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* COLUMNA DERECHA: CÓDIGO QR - SIEMPRE VISIBLE */}
                <Grid item xs={12} sm={4}>
                  <Box sx={{
                    textAlign: 'center',
                    bgcolor: 'white',
                    p: 1.5,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'divider',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Código QR
                    </Typography>
                    {selectedUser.qr_code ? (
                      <Box
                        component="img"
                        src={`data:image/png;base64,${selectedUser.qr_code}`}
                        alt="QR Code"
                        sx={{
                          width: '100%',
                          maxWidth: 120,
                          height: 'auto',
                          mx: 'auto',
                          mt: 0.5
                        }}
                      />
                    ) : (
                      <Box sx={{
                        width: 120,
                        height: 120,
                        mx: 'auto',
                        mt: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        border: '2px dashed',
                        borderColor: 'divider'
                      }}>
                        <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ px: 1 }}>
                          QR no disponible
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* INFORMACIÓN PERSONAL - COMPACTA */}              {/* INFORMACIÓN PERSONAL - COMPACTA */}
              <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 1 }}>
                📋 Información Personal
              </Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Email</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>
                      {selectedUser.email || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Teléfono</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                      {selectedUser.telefono || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* INFORMACIÓN ACADÉMICA (solo para estudiantes) - COMPACTA */}
              {selectedUser.rol === 'estudiante' && (
                <>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 1 }}>
                    🎓 Información Académica
                  </Typography>
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Matrícula</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                          {selectedUser.matricula || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Grado</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                          {selectedUser.grado || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Jornada</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                          {selectedUser.jornada || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Estrato</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                          {selectedUser.estrato || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* FECHA DE REGISTRO - COMPACTA */}
              <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 1 }}>
                ℹ️ Información Adicional
              </Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                  <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Fecha de Registro</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                      {selectedUser.fecha_registro ? new Date(selectedUser.fecha_registro).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* INFORMACIÓN DEL ACUDIENTE (si existe) - COMPACTA */}
              {selectedUser.acudiente_nombre && (
                <>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: 'primary.main', mb: 1 }}>
                    👨‍👩‍👧‍👦 Información del Acudiente
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Nombre Completo</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                          {selectedUser.acudiente_nombre || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Teléfono</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                          {selectedUser.acudiente_telefono || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5, pt: 0 }}>
          <Button
            onClick={() => setViewModalOpen(false)}
            variant="contained"
            size="small"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{
          bgcolor: 'primary.main',
          color: 'white',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 2
        }}>
          <EditIcon />
          Editar Información de Usuario
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={editData.nombre}
                onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellidos"
                value={editData.apellidos}
                onChange={(e) => setEditData({ ...editData, apellidos: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={editData.telefono}
                onChange={(e) => setEditData({ ...editData, telefono: e.target.value })}
              />
            </Grid>
            {selectedUser?.rol === 'estudiante' && (
              <>
                <Grid item xs={12} sm={8}>
                  <FormControl fullWidth>
                    <InputLabel>Grupo Académico (Grado y Jornada)</InputLabel>
                    <Select
                      value={editData.grupo_academico_id}
                      label="Grupo Académico (Grado y Jornada)"
                      onChange={(e) => setEditData({ ...editData, grupo_academico_id: e.target.value })}
                    >
                      {grupos.map((grupo) => (
                        <MenuItem key={grupo.id} value={grupo.id}>
                          {grupo.nombre} - {grupo.jornada}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Estrato</InputLabel>
                    <Select
                      value={editData.estrato}
                      label="Estrato"
                      onChange={(e) => setEditData({ ...editData, estrato: e.target.value })}
                    >
                      <MenuItem value="1">1</MenuItem>
                      <MenuItem value="2">2</MenuItem>
                      <MenuItem value="3">3</MenuItem>
                      <MenuItem value="4">4</MenuItem>
                      <MenuItem value="5">5</MenuItem>
                      <MenuItem value="6">6</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            {selectedUser?.rol === 'docente' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Grupo que Dirige</InputLabel>
                  <Select
                    value={editData.grupo_academico_id || ''}
                    label="Grupo que Dirige"
                    onChange={(e) => setEditData({ ...editData, grupo_academico_id: e.target.value })}
                  >
                    <MenuItem value=""><em>Sin grupo asignado</em></MenuItem>
                    {grupos.map((grupo) => (
                      <MenuItem key={grupo.id} value={grupo.id}>
                        {grupo.nombre} - Jornada {grupo.jornada}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancelar</Button>
          <Button onClick={guardarEdicion} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* 🆕 MODAL DE CREACIÓN DE ESTUDIANTE */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{
          bgcolor: 'primary.main',
          color: 'white',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 2
        }}>
          <AddIcon />
          Registrar Nuevo Estudiante (Todos los campos obligatorios)
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                  1. Datos de Cuenta y Personales
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombres"
                  name="nombre"
                  value={formik.values.nombre}
                  onChange={formik.handleChange}
                  error={formik.touched.nombre && Boolean(formik.errors.nombre)}
                  helperText={formik.touched.nombre && formik.errors.nombre}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Apellidos"
                  name="apellidos"
                  value={formik.values.apellidos}
                  onChange={formik.handleChange}
                  error={formik.touched.apellidos && Boolean(formik.errors.apellidos)}
                  helperText={formik.touched.apellidos && formik.errors.apellidos}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email / Usuario"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Fecha de Nacimiento"
                  name="fecha_nacimiento"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formik.values.fecha_nacimiento}
                  onChange={formik.handleChange}
                  error={formik.touched.fecha_nacimiento && Boolean(formik.errors.fecha_nacimiento)}
                  helperText={formik.touched.fecha_nacimiento && formik.errors.fecha_nacimiento}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="telefono"
                  value={formik.values.telefono}
                  onChange={formik.handleChange}
                  error={formik.touched.telefono && Boolean(formik.errors.telefono)}
                  helperText={formik.touched.telefono && formik.errors.telefono}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Matrícula (Opcional)"
                  name="matricula"
                  value={formik.values.matricula}
                  onChange={formik.handleChange}
                  error={formik.touched.matricula && Boolean(formik.errors.matricula)}
                  helperText={formik.touched.matricula && formik.errors.matricula}
                />
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                  2. Información Académica y Socioeconómica
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} sm={8}>
                <FormControl fullWidth error={formik.touched.grupo_academico_id && Boolean(formik.errors.grupo_academico_id)}>
                  <InputLabel>Grupo Académico (Grado y Jornada)</InputLabel>
                  <Select
                    name="grupo_academico_id"
                    value={formik.values.grupo_academico_id}
                    label="Grupo Académico (Grado y Jornada)"
                    onChange={formik.handleChange}
                    required
                  >
                    {grupos.map((grupo) => (
                      <MenuItem key={grupo.id} value={grupo.id}>
                        {grupo.nombre} - {grupo.jornada}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth error={formik.touched.estrato && Boolean(formik.errors.estrato)}>
                  <InputLabel>Estrato</InputLabel>
                  <Select
                    name="estrato"
                    value={formik.values.estrato}
                    label="Estrato"
                    onChange={formik.handleChange}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6].map(e => (
                      <MenuItem key={e} value={String(e)}>{e}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Grupo Étnico</InputLabel>
                  <Select
                    name="grupo_etnico"
                    value={formik.values.grupo_etnico}
                    label="Grupo Étnico"
                    onChange={formik.handleChange}
                    required
                  >
                    <MenuItem value="NINGUNO">Ninguno / Mestizo</MenuItem>
                    <MenuItem value="AFROCOLOMBIANO">Afrocolombiano</MenuItem>
                    <MenuItem value="INDIGENA">Indígena</MenuItem>
                    <MenuItem value="ROM">ROM / Gitano</MenuItem>
                    <MenuItem value="OTRO">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>¿Es Desplazado?</InputLabel>
                  <Select
                    name="es_desplazado"
                    value={formik.values.es_desplazado}
                    label="¿Es Desplazado?"
                    onChange={formik.handleChange}
                    required
                  >
                    <MenuItem value="NO">No</MenuItem>
                    <MenuItem value="SI">Sí</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1 }}>
                  3. Información del Acudiente
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombres Acudiente"
                  name="acudiente_nombre"
                  value={formik.values.acudiente_nombre}
                  onChange={formik.handleChange}
                  error={formik.touched.acudiente_nombre && Boolean(formik.errors.acudiente_nombre)}
                  helperText={formik.touched.acudiente_nombre && formik.errors.acudiente_nombre}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Apellidos Acudiente"
                  name="acudiente_apellidos"
                  value={formik.values.acudiente_apellidos}
                  onChange={formik.handleChange}
                  error={formik.touched.acudiente_apellidos && Boolean(formik.errors.acudiente_apellidos)}
                  helperText={formik.touched.acudiente_apellidos && formik.errors.acudiente_apellidos}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Cédula Acudiente"
                  name="acudiente_cedula"
                  value={formik.values.acudiente_cedula}
                  onChange={formik.handleChange}
                  error={formik.touched.acudiente_cedula && Boolean(formik.errors.acudiente_cedula)}
                  helperText={formik.touched.acudiente_cedula && formik.errors.acudiente_cedula}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Teléfono Acudiente"
                  name="acudiente_telefono"
                  value={formik.values.acudiente_telefono}
                  onChange={formik.handleChange}
                  error={formik.touched.acudiente_telefono && Boolean(formik.errors.acudiente_telefono)}
                  helperText={formik.touched.acudiente_telefono && formik.errors.acudiente_telefono}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Email Acudiente"
                  name="acudiente_email"
                  value={formik.values.acudiente_email}
                  onChange={formik.handleChange}
                  error={formik.touched.acudiente_email && Boolean(formik.errors.acudiente_email)}
                  helperText={formik.touched.acudiente_email && formik.errors.acudiente_email}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setCreateModalOpen(false)} variant="outlined">Cancelar</Button>
          <Button
            onClick={formik.handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <ValidateIcon />}
          >
            Registrar Estudiante
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🔒 DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'error.light'
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          color: 'error.main',
          fontWeight: 800,
          fontSize: '1.25rem',
          pb: 1
        }}>
          <DeleteIcon sx={{ fontSize: 28 }} />
          ¿Confirmar eliminación permanente?
        </DialogTitle>
        <DialogContent>
          {userToDelete && (
            <Box sx={{ py: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>¡Atención!</strong> Esta acción no se puede deshacer.
              </Alert>

              <Typography variant="body1" gutterBottom>
                Estás a punto de eliminar al siguiente usuario:
              </Typography>

              <Box sx={{
                mt: 2,
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={getProfilePhotoUrl(userToDelete.foto_perfil)}
                        sx={{ width: 56, height: 56 }}
                      >
                        {!userToDelete.foto_perfil && (userToDelete.nombre?.[0] || 'U').toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {userToDelete.nombre} {userToDelete.apellidos}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {userToDelete.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Rol:</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {userToDelete.rol || 'N/A'}
                    </Typography>
                  </Grid>
                  {userToDelete.matricula && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Matrícula:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {userToDelete.matricula}
                      </Typography>
                    </Grid>
                  )}
                  {userToDelete.grado && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Grado/Jornada:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {userToDelete.grado} - {userToDelete.jornada || 'N/A'}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Se eliminarán todos los datos asociados a este usuario.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false);
              setUserToDelete(null);
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmarEliminacion}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            sx={{ fontWeight: 600 }}
          >
            Sí, eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};

export default GestionUnificada;
