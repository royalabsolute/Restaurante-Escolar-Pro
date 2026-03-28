import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  CardContent,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Phone as PhoneIcon,
  AccessTime as AccessTimeIcon,
  Event as EventIcon,
  Home as HomeIcon,
  Group as GroupIcon
} from '@mui/icons-material';
// ❌ ELIMINADO: react-toastify
// import { toast } from 'react-toastify';
// import ApiService from 'services/ApiService';
import { useAuth } from 'hooks/useAuth';
// ✅ AGREGADO: Sistema unificado de notificaciones
import { useNotification } from 'contexts/NotificationContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import MainCard from 'components/Card/MainCard';
import ApiService from 'services/ApiService';
// ✅ Utilidades para imágenes de perfil
import { getProfilePhotoUrl } from 'utils/imageUtils';

const EstudiantesForm = () => {
  // ✅ Hook de notificaciones unificado
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [grupos, setGrupos] = useState([]);

  useEffect(() => {
    const loadGrupos = async () => {
      try {
        const response = await ApiService.get('/groups');
        if (response?.status === 'SUCCESS') {
          setGrupos(response.data || []);
        }
      } catch (error) {
        console.error('Error cargando grupos:', error);
      }
    };
    loadGrupos();
  }, []);

  const validationSchema = Yup.object({
    nombre: Yup.string()
      .required('El nombre es requerido')
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede tener más de 50 caracteres'),
    apellidos: Yup.string()
      .required('Los apellidos son requeridos')
      .min(2, 'Los apellidos deben tener al menos 2 caracteres')
      .max(50, 'Los apellidos no pueden tener más de 50 caracteres'),
    grupo_academico_id: Yup.string()
      .required('El grupo académico es requerido'),
    codigo_qr: Yup.string()
      .required('El código QR es requerido')
      .min(5, 'El código debe tener al menos 5 caracteres'),

    edad: Yup.number()
      .required('La edad es requerida')
      .min(10, 'La edad mínima es 10 años')
      .max(20, 'La edad máxima es 20 años'),
    estrato: Yup.number()
      .required('El estrato es requerido')
      .min(1, 'El estrato mínimo es 1')
      .max(6, 'El estrato máximo es 6'),
    grupo_etnico: Yup.string()
      .required('El grupo étnico es requerido'),
    es_desplazado: Yup.boolean()
      .required('Debe especificar si es desplazado'),
    // Datos del acudiente
    acudiente_nombre: Yup.string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede tener más de 50 caracteres'),
    acudiente_apellidos: Yup.string()
      .min(2, 'Los apellidos deben tener al menos 2 caracteres')
      .max(50, 'Los apellidos no pueden tener más de 50 caracteres'),
    acudiente_telefono: Yup.string()
      .matches(/^[0-9+\-\s()]*$/, 'Formato de teléfono inválido')
      .min(7, 'El teléfono debe tener al menos 7 dígitos'),
    acudiente_email: Yup.string()
      .email('Formato de email inválido')
  });

  const formik = useFormik({
    initialValues: {
      nombre: '',
      apellidos: '',
      grupo_academico_id: '',
      edad: '',
      estrato: '',
      grupo_etnico: 'Ninguno',
      es_desplazado: false,
      acudiente_nombre: '',
      acudiente_apellidos: '',
      acudiente_telefono: '',
      acudiente_email: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError('');

        if (isEdit) {
          // Solo enviar los campos editables
          const editableValues = {
            nombre: values.nombre,
            apellidos: values.apellidos,
            grupo_academico_id: values.grupo_academico_id,
            edad: parseInt(values.edad),
            estrato: parseInt(values.estrato),
            grupo_etnico: values.grupo_etnico,
            es_desplazado: values.es_desplazado,
            acudiente_nombre: values.acudiente_nombre,
            acudiente_apellidos: values.acudiente_apellidos,
            acudiente_telefono: values.acudiente_telefono,
            acudiente_email: values.acudiente_email
          };
          await ApiService.updateEstudiante(id, editableValues);
          showSuccess('Estudiante actualizado correctamente');
        } else {
          await ApiService.createEstudiante(values);
          showSuccess('Estudiante creado correctamente');
        }

        navigate('/estudiantes');
      } catch (error) {
        console.error('Error guardando estudiante:', error);
        const errorMsg = error.response?.data?.message ||
          `Error al ${isEdit ? 'actualizar' : 'crear'} el estudiante`;
        setError(errorMsg);
        showError(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  });

  const loadEstudiante = useCallback(async () => {
    try {
      setInitialLoading(true);
      const data = await ApiService.getEstudiante(id);
      const estudiante = data.data;

      formik.setValues({
        nombre: estudiante.nombre || '',
        apellidos: estudiante.apellidos || '',
        grupo_academico_id: estudiante.grupo_academico_id || '',
        edad: estudiante.edad || '',
        estrato: estudiante.estrato || '',
        grupo_etnico: estudiante.grupo_etnico || 'Ninguno',
        es_desplazado: estudiante.es_desplazado || false,
        acudiente_nombre: estudiante.acudiente_nombre || '',
        acudiente_apellidos: estudiante.acudiente_apellidos || '',
        acudiente_telefono: estudiante.acudiente_telefono || '',
        acudiente_email: estudiante.acudiente_email || ''
      });
    } catch (error) {
      console.error('Error cargando estudiante:', error);
      if (error.response?.status === 404) {
        setError('Estudiante no encontrado');
        showError('Estudiante no encontrado');
      } else {
        setError('Error al cargar los datos del estudiante');
        showError('Error al cargar los datos del estudiante');
      }
    } finally {
      setInitialLoading(false);
    }
  }, [id, formik]);

  useEffect(() => {
    if (isEdit) {
      loadEstudiante();
    }
  }, [isEdit, loadEstudiante]);

  const generateCodigoQR = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const codigo = `QR_EST_${timestamp}_${random}`;
    formik.setFieldValue('codigo_qr', codigo);
  };

  const gruposEtnicos = [
    'Ninguno',
    'Indígena',
    'Afrodescendiente',
    'Raizal',
    'Palenquero',
    'Rrom'
  ];

  const estratos = [1, 2, 3, 4, 5, 6];

  if (initialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography variant="h6">Cargando datos del estudiante...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          {isEdit ? 'Editar Estudiante' : 'Nuevo Estudiante'}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {isEdit ? 'Modifique los datos del estudiante' : 'Complete los datos del nuevo estudiante'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Datos del estudiante */}
          <Grid item xs={12} md={8}>
            <MainCard title="Datos del Estudiante" content={false}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nombre"
                      name="nombre"
                      value={formik.values.nombre}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.nombre && Boolean(formik.errors.nombre)}
                      helperText={formik.touched.nombre && formik.errors.nombre}
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Apellidos"
                      name="apellidos"
                      value={formik.values.apellidos}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.apellidos && Boolean(formik.errors.apellidos)}
                      helperText={formik.touched.apellidos && formik.errors.apellidos}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={formik.touched.grupo_academico_id && Boolean(formik.errors.grupo_academico_id)}>
                      <InputLabel>Grupo Académico</InputLabel>
                      <Select
                        name="grupo_academico_id"
                        value={formik.values.grupo_academico_id}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label="Grupo Académico"
                        startAdornment={<SchoolIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                      >
                        {grupos.map((grupo) => (
                          <MenuItem key={grupo.id} value={grupo.id}>
                            {grupo.nombre} - {grupo.jornada}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.grupo_academico_id && formik.errors.grupo_academico_id && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                          {formik.errors.grupo_academico_id}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" gap={1}>
                      <TextField
                        fullWidth
                        label="Código QR"
                        name="codigo_qr"
                        value={formik.values.codigo_qr}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.codigo_qr && Boolean(formik.errors.codigo_qr)}
                        helperText={formik.touched.codigo_qr && formik.errors.codigo_qr}
                      />
                      <Button
                        variant="outlined"
                        onClick={generateCodigoQR}
                        sx={{ minWidth: 'auto', px: 2 }}
                      >
                        Generar
                      </Button>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Edad"
                      name="edad"
                      type="number"
                      value={formik.values.edad}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.edad && Boolean(formik.errors.edad)}
                      helperText={formik.touched.edad && formik.errors.edad}
                      InputProps={{
                        startAdornment: <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={formik.touched.estrato && Boolean(formik.errors.estrato)}>
                      <InputLabel>Estrato</InputLabel>
                      <Select
                        name="estrato"
                        value={formik.values.estrato}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label="Estrato"
                        startAdornment={<HomeIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                      >
                        {estratos.map((estrato) => (
                          <MenuItem key={estrato} value={estrato}>
                            Estrato {estrato}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.estrato && formik.errors.estrato && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                          {formik.errors.estrato}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth error={formik.touched.grupo_etnico && Boolean(formik.errors.grupo_etnico)}>
                      <InputLabel>Grupo Étnico</InputLabel>
                      <Select
                        name="grupo_etnico"
                        value={formik.values.grupo_etnico}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label="Grupo Étnico"
                        startAdornment={<GroupIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                      >
                        {gruposEtnicos.map((grupo) => (
                          <MenuItem key={grupo} value={grupo}>
                            {grupo}
                          </MenuItem>
                        ))}
                      </Select>
                      {formik.touched.grupo_etnico && formik.errors.grupo_etnico && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                          {formik.errors.grupo_etnico}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="es_desplazado"
                          checked={formik.values.es_desplazado}
                          onChange={formik.handleChange}
                          color="primary"
                        />
                      }
                      label="¿Es desplazado por la violencia?"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </MainCard>
          </Grid>

          {/* Panel de acciones */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, sticky: 'top', top: 24 }}>
              <Typography variant="h6" gutterBottom>
                Acciones
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={<SaveIcon />}
                  fullWidth
                >
                  {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear Estudiante')}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/estudiantes')}
                  startIcon={<CancelIcon />}
                  fullWidth
                >
                  Cancelar
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="textSecondary">
                <strong>Nota:</strong> El código QR debe ser único para cada estudiante.
                Puede generar uno automáticamente o ingresar uno personalizado.
              </Typography>
            </Paper>
          </Grid>

          {/* Datos del acudiente */}
          <Grid item xs={12}>
            <MainCard title="Datos del Acudiente" content={false}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nombre del Acudiente"
                      name="acudiente_nombre"
                      value={formik.values.acudiente_nombre}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.acudiente_nombre && Boolean(formik.errors.acudiente_nombre)}
                      helperText={formik.touched.acudiente_nombre && formik.errors.acudiente_nombre}
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Apellidos del Acudiente"
                      name="acudiente_apellidos"
                      value={formik.values.acudiente_apellidos}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.acudiente_apellidos && Boolean(formik.errors.acudiente_apellidos)}
                      helperText={formik.touched.acudiente_apellidos && formik.errors.acudiente_apellidos}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Teléfono"
                      name="acudiente_telefono"
                      value={formik.values.acudiente_telefono}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.acudiente_telefono && Boolean(formik.errors.acudiente_telefono)}
                      helperText={formik.touched.acudiente_telefono && formik.errors.acudiente_telefono}
                      InputProps={{
                        startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="acudiente_email"
                      type="email"
                      value={formik.values.acudiente_email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.acudiente_email && Boolean(formik.errors.acudiente_email)}
                      helperText={formik.touched.acudiente_email && formik.errors.acudiente_email}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </MainCard>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default EstudiantesForm;
