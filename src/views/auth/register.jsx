import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Button, FormHelperText, InputLabel, OutlinedInput, Stack, Typography, Alert, Paper, MenuItem, Select, IconButton, InputAdornment, Link, Grid, FormControl, Stepper, Step, StepLabel, CircularProgress } from '@mui/material';
import { Visibility, VisibilityOff, Home as HomeIcon, ArrowForward, ArrowBack } from '@mui/icons-material';
import { useAuth } from 'hooks/useAuth';
import * as Yup from 'yup';
import { Formik } from 'formik';
import ApiService from 'services/ApiService';
import BrandLogo from 'components/BrandLogo';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [registerError, setRegisterError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [grupos, setGrupos] = useState([]);
  const [loadingGrupos, setLoadingGrupos] = useState(true);

  useEffect(() => {
    ApiService.get('/groups') // Cambio a /groups que es el endpoint estándar que vimos
      .then(res => {
        const data = res?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          setGrupos(data);
        } else {
          // Fallback mínimo
          setGrupos([{ id: 1, nombre: 'Transición 1', jornada: 'Mañana' }]);
        }
      })
      .catch(() => {
        setGrupos([{ id: 1, nombre: 'Transición 1', jornada: 'Mañana' }]);
      })
      .finally(() => setLoadingGrupos(false));
  }, []);

  const steps = ['Datos Personales', 'Datos del Acudiente', 'Datos de Acceso'];

  // Esquemas de validación por paso
  const validationSchemas = [
    // Paso 0: Datos Personales
    Yup.object().shape({
      nombre: Yup.string().max(255).required('El nombre es requerido'),
      apellidos: Yup.string().max(255).required('Los apellidos son requeridos'),
      fecha_nacimiento: Yup.date().required('La fecha de nacimiento es requerida'),
      telefono: Yup.string().matches(/^[0-9]+$/, 'Solo números').min(10, 'Mínimo 10 dígitos').required('El teléfono es requerido'),
      grupo_academico_id: Yup.number().required('El grupo académico es requerido'),
      estrato: Yup.string().required('El estrato es requerido'),
      grupo_etnico: Yup.string().required('El grupo étnico es requerido'),
      es_desplazado: Yup.string().required('Debe indicar si es desplazado')
    }),
    // Paso 1: Datos del Acudiente
    Yup.object().shape({
      acudiente_nombre: Yup.string().max(255).required('El nombre del acudiente es requerido'),
      acudiente_apellidos: Yup.string().max(255).required('Los apellidos del acudiente son requeridos'),
      acudiente_cedula: Yup.string().matches(/^[0-9]+$/, 'Solo números').min(6, 'Mínimo 6 dígitos').required('La cédula del acudiente es requerida'),
      acudiente_telefono: Yup.string().matches(/^[0-9]+$/, 'Solo números').min(10, 'Mínimo 10 dígitos').required('El teléfono del acudiente es requerido'),
      acudiente_email: Yup.string().email('Email inválido')
    }),
    // Paso 2: Datos de Acceso (validación completa)
    Yup.object().shape({
      email: Yup.string().email('Email inválido').max(255).required('El email es requerido'),
      matricula: Yup.string().max(20).required('La matrícula es requerida'),
      password: Yup.string().max(255).required('La contraseña es requerida').min(8, 'Mínimo 8 caracteres'),
      confirmPassword: Yup.string().oneOf([Yup.ref('password'), null], 'Las contraseñas no coinciden').required('Confirmar contraseña es requerido')
    })
  ];

  const inputStyles = {
    borderRadius: 1.5,
    transition: 'all 0.3s ease',
    bgcolor: '#fff',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(74,144,226,0.2)',
      transition: 'all 0.3s ease'
    },
    '&:hover': {
      boxShadow: '0 0 0 3px rgba(74,144,226,0.1)',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#4A90E2'
      }
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(74,144,226,0.15)',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#4A90E2',
        borderWidth: 2
      }
    }
  };

  const selectStyles = {
    borderRadius: 1.5,
    transition: 'all 0.3s ease',
    bgcolor: '#fff',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(74,144,226,0.2)',
      transition: 'all 0.3s ease'
    },
    '&:hover': {
      boxShadow: '0 0 0 3px rgba(74,144,226,0.1)',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#4A90E2'
      }
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#4A90E2',
      borderWidth: 2
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', p: 2, py: 4 }}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: 900,
          width: '100%',
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          border: '1px solid rgba(74,144,226,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          position: 'relative'
        }}
      >
        {/* Botón Home */}
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            bgcolor: '#4A90E2',
            color: 'white',
            width: 36,
            height: 36,
            '&:hover': { bgcolor: '#357ABD' }
          }}
        >
          <HomeIcon sx={{ fontSize: 20 }} />
        </IconButton>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3, mt: 1 }}>
          <BrandLogo width={150} sx={{ mx: 'auto', mb: 1 }} />
          <Typography variant='h5' sx={{ color: '#1a1a1a', fontWeight: 600, mb: 0.5 }}>Crear Cuenta</Typography>
          <Typography sx={{ color: '#666', fontSize: '0.875rem' }}>Registro para estudiantes del restaurante escolar</Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {registerError && <Alert severity='error' sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.875rem' }}>{registerError}</Alert>}
        {success && <Alert severity='success' sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.875rem' }}>{success}</Alert>}

        <Formik
          initialValues={{ email: '', matricula: '', password: '', confirmPassword: '', nombre: '', apellidos: '', fecha_nacimiento: '', telefono: '', grupo_academico_id: '', estrato: '', grupo_etnico: 'Ninguno', es_desplazado: '', acudiente_nombre: '', acudiente_apellidos: '', acudiente_cedula: '', acudiente_telefono: '', acudiente_email: '' }}
          validationSchema={validationSchemas[activeStep]}
          validateOnChange={true}
          validateOnBlur={true}
          onSubmit={async (values, { setSubmitting }) => {
            if (activeStep < 2) {
              setActiveStep(activeStep + 1);
              setSubmitting(false);
              return;
            }
            try {
              setRegisterError('');
              setSuccess('');
              const result = await register(values);
              if (result.success) {
                setSuccess('Registro exitoso. Por favor, inicia sesión.');
                setTimeout(() => navigate('/login'), 2000);
              } else {
                setRegisterError(result.message || 'Error en el registro');
              }
            } catch {
              setRegisterError('Error de conexión. Verifique que el servidor esté ejecutándose.');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
            <form noValidate onSubmit={handleSubmit}>
              {/* PASO 1: Datos Personales */}
              {activeStep === 0 && (
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: '#fff', border: '1px solid rgba(74,144,226,0.1)' }}>
                  <Typography variant="h6" sx={{ mb: 2.5, color: '#4A90E2', fontWeight: 600, fontSize: '1.1rem' }}>
                    Datos Personales
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Nombre *</InputLabel>
                        <OutlinedInput size='small' fullWidth name='nombre' value={values.nombre} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.nombre && errors.nombre)} placeholder='Tu nombre' sx={inputStyles} />
                        {touched.nombre && errors.nombre && <FormHelperText error sx={{ fontSize: '0.75rem', m: 0 }}>{errors.nombre}</FormHelperText>}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Apellidos *</InputLabel>
                        <OutlinedInput size='small' fullWidth name='apellidos' value={values.apellidos} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.apellidos && errors.apellidos)} placeholder='Tus apellidos' sx={inputStyles} />
                        {touched.apellidos && errors.apellidos && <FormHelperText error sx={{ fontSize: '0.75rem', m: 0 }}>{errors.apellidos}</FormHelperText>}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Fecha Nacimiento *</InputLabel>
                        <OutlinedInput size='small' fullWidth name='fecha_nacimiento' type='date' value={values.fecha_nacimiento} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.fecha_nacimiento && errors.fecha_nacimiento)} sx={inputStyles} />
                        {touched.fecha_nacimiento && errors.fecha_nacimiento && <FormHelperText error sx={{ fontSize: '0.75rem', m: 0 }}>{errors.fecha_nacimiento}</FormHelperText>}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Teléfono *</InputLabel>
                        <OutlinedInput size='small' fullWidth name='telefono' value={values.telefono} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.telefono && errors.telefono)} placeholder='3001234567' sx={inputStyles} />
                        {touched.telefono && errors.telefono && <FormHelperText error sx={{ fontSize: '0.75rem', m: 0 }}>{errors.telefono}</FormHelperText>}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Grupo Académico (Grado y Jornada) *</InputLabel>
                        <FormControl fullWidth error={Boolean(touched.grupo_academico_id && errors.grupo_academico_id)}>
                          <Select size='small' name='grupo_academico_id' value={values.grupo_academico_id} onChange={handleChange} onBlur={handleBlur} displayEmpty sx={selectStyles}>
                            <MenuItem value='' disabled>{loadingGrupos ? 'Cargando...' : 'Selecciona tu grado y jornada'}</MenuItem>
                            {loadingGrupos ? (
                              <MenuItem disabled><CircularProgress size={16} sx={{ mr: 1 }} /> Cargando...</MenuItem>
                            ) : grupos.map(g => <MenuItem key={g.id} value={g.id}>{g.nombre} - {g.jornada}</MenuItem>)}
                          </Select>
                          {touched.grupo_academico_id && errors.grupo_academico_id && <FormHelperText sx={{ fontSize: '0.75rem', m: 0 }}>{errors.grupo_academico_id}</FormHelperText>}
                        </FormControl>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Estrato *</InputLabel>
                        <FormControl fullWidth error={Boolean(touched.estrato && errors.estrato)}>
                          <Select size='small' name='estrato' value={values.estrato} onChange={handleChange} onBlur={handleBlur} displayEmpty sx={selectStyles}>
                            <MenuItem value='' disabled>Selecciona</MenuItem>
                            {[1, 2, 3, 4, 5, 6].map(e => <MenuItem key={e} value={String(e)}>{e}</MenuItem>)}
                          </Select>
                          {touched.estrato && errors.estrato && <FormHelperText sx={{ fontSize: '0.75rem', m: 0 }}>{errors.estrato}</FormHelperText>}
                        </FormControl>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Grupo Étnico *</InputLabel>
                        <FormControl fullWidth error={Boolean(touched.grupo_etnico && errors.grupo_etnico)}>
                          <Select size='small' name='grupo_etnico' value={values.grupo_etnico} onChange={handleChange} onBlur={handleBlur} sx={selectStyles}>
                            <MenuItem value='Ninguno'>Ninguno</MenuItem>
                            <MenuItem value='Indígena'>Indígena</MenuItem>
                            <MenuItem value='Afrodescendiente'>Afrodescendiente</MenuItem>
                            <MenuItem value='Mestizo'>Mestizo</MenuItem>
                            <MenuItem value='Otro'>Otro</MenuItem>
                          </Select>
                          {touched.grupo_etnico && errors.grupo_etnico && <FormHelperText sx={{ fontSize: '0.75rem', m: 0 }}>{errors.grupo_etnico}</FormHelperText>}
                        </FormControl>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Desplazado *</InputLabel>
                        <FormControl fullWidth error={Boolean(touched.es_desplazado && errors.es_desplazado)}>
                          <Select size='small' name='es_desplazado' value={values.es_desplazado} onChange={handleChange} onBlur={handleBlur} displayEmpty sx={selectStyles}>
                            <MenuItem value='' disabled>Selecciona</MenuItem>
                            <MenuItem value='Sí'>Sí</MenuItem>
                            <MenuItem value='No'>No</MenuItem>
                          </Select>
                          {touched.es_desplazado && errors.es_desplazado && <FormHelperText sx={{ fontSize: '0.75rem', m: 0 }}>{errors.es_desplazado}</FormHelperText>}
                        </FormControl>
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* PASO 2: Datos del Acudiente */}
              {activeStep === 1 && (
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: '#fff', border: '1px solid rgba(74,144,226,0.1)' }}>
                  <Typography variant="h6" sx={{ mb: 2.5, color: '#4A90E2', fontWeight: 600, fontSize: '1.1rem' }}>
                    Datos del Acudiente
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Nombre Acudiente *</InputLabel>
                        <OutlinedInput size='small' fullWidth name='acudiente_nombre' value={values.acudiente_nombre} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.acudiente_nombre && errors.acudiente_nombre)} placeholder='Nombre del acudiente' sx={inputStyles} />
                        {touched.acudiente_nombre && errors.acudiente_nombre && <FormHelperText error sx={{ fontSize: '0.75rem', m: 0 }}>{errors.acudiente_nombre}</FormHelperText>}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Apellidos Acudiente *</InputLabel>
                        <OutlinedInput size='small' fullWidth name='acudiente_apellidos' value={values.acudiente_apellidos} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.acudiente_apellidos && errors.acudiente_apellidos)} placeholder='Apellidos del acudiente' sx={inputStyles} />
                        {touched.acudiente_apellidos && errors.acudiente_apellidos && <FormHelperText error sx={{ fontSize: '0.75rem', m: 0 }}>{errors.acudiente_apellidos}</FormHelperText>}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Cédula Acudiente *</InputLabel>
                        <OutlinedInput size='small' fullWidth name='acudiente_cedula' value={values.acudiente_cedula} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.acudiente_cedula && errors.acudiente_cedula)} placeholder='1234567890' sx={inputStyles} />
                        {touched.acudiente_cedula && errors.acudiente_cedula && <FormHelperText error sx={{ fontSize: '0.75rem', m: 0 }}>{errors.acudiente_cedula}</FormHelperText>}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Teléfono Acudiente *</InputLabel>
                        <OutlinedInput size='small' fullWidth name='acudiente_telefono' value={values.acudiente_telefono} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.acudiente_telefono && errors.acudiente_telefono)} placeholder='3001234567' sx={inputStyles} />
                        {touched.acudiente_telefono && errors.acudiente_telefono && <FormHelperText error sx={{ fontSize: '0.75rem', m: 0 }}>{errors.acudiente_telefono}</FormHelperText>}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Email Acudiente</InputLabel>
                        <OutlinedInput size='small' fullWidth name='acudiente_email' type='email' value={values.acudiente_email} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.acudiente_email && errors.acudiente_email)} placeholder='email@ejemplo.com' sx={inputStyles} />
                        {touched.acudiente_email && errors.acudiente_email && <FormHelperText error sx={{ fontSize: '0.75rem', m: 0 }}>{errors.acudiente_email}</FormHelperText>}
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* PASO 3: Datos de Acceso */}
              {activeStep === 2 && (
                <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: '#fff', border: '1px solid rgba(74,144,226,0.1)' }}>
                  <Typography variant="h6" sx={{ mb: 2.5, color: '#4A90E2', fontWeight: 600, fontSize: '1.1rem' }}>
                    Datos de Acceso
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Email *</InputLabel>
                        <OutlinedInput size='small' fullWidth name='email' value={values.email} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.email && errors.email)} placeholder='ejemplo@correo.com' sx={inputStyles} />
                        {touched.email && errors.email && <FormHelperText error sx={{ fontSize: '0.75rem', m: 0 }}>{errors.email}</FormHelperText>}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Matrícula *</InputLabel>
                        <OutlinedInput size='small' fullWidth name='matricula' value={values.matricula} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.matricula && errors.matricula)} placeholder='Número de matrícula' sx={inputStyles} />
                        {touched.matricula && errors.matricula && <FormHelperText error sx={{ fontSize: '0.75rem', m: 0 }}>{errors.matricula}</FormHelperText>}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Contraseña *</InputLabel>
                        <OutlinedInput size='small' fullWidth name='password' type={showPassword ? 'text' : 'password'} value={values.password} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.password && errors.password)} placeholder='Mínimo 8 caracteres' sx={inputStyles} endAdornment={<InputAdornment position='end'><IconButton onClick={() => setShowPassword(!showPassword)} onMouseDown={(e) => e.preventDefault()} edge='end' size='small'>{showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment>} />
                        {touched.password && errors.password && <FormHelperText error sx={{ fontSize: '0.75rem', m: 0 }}>{errors.password}</FormHelperText>}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={0.5}>
                        <InputLabel sx={{ fontSize: '0.813rem', fontWeight: 500, color: '#4a4a4a' }}>Confirmar Contraseña *</InputLabel>
                        <OutlinedInput size='small' fullWidth name='confirmPassword' type={showConfirmPassword ? 'text' : 'password'} value={values.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={Boolean(touched.confirmPassword && errors.confirmPassword)} placeholder='Confirma tu contraseña' sx={inputStyles} endAdornment={<InputAdornment position='end'><IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} onMouseDown={(e) => e.preventDefault()} edge='end' size='small'>{showConfirmPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment>} />
                        {touched.confirmPassword && errors.confirmPassword && <FormHelperText error sx={{ fontSize: '0.75rem', m: 0 }}>{errors.confirmPassword}</FormHelperText>}
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Botones de Navegación */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                {activeStep > 0 && (
                  <Button variant='outlined' onClick={() => setActiveStep(activeStep - 1)} startIcon={<ArrowBack />} sx={{ borderColor: '#4A90E2', color: '#4A90E2', '&:hover': { borderColor: '#357ABD', bgcolor: 'rgba(74,144,226,0.05)' } }}>
                    Anterior
                  </Button>
                )}
                <Button
                  variant='contained'
                  type='submit'
                  disabled={isSubmitting}
                  endIcon={activeStep < 2 ? <ArrowForward /> : null}
                  sx={{
                    ml: 'auto',
                    background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                    color: '#fff',
                    px: 4,
                    '&:hover': { background: 'linear-gradient(135deg, #357ABD 0%, #2868a8 100%)' }
                  }}
                >
                  {isSubmitting ? 'Procesando...' : activeStep === 2 ? 'Crear Cuenta' : 'Siguiente'}
                </Button>
              </Box>

              {/* Link de Inicio de Sesión */}
              {activeStep === 2 && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant='body2' sx={{ color: '#666', fontSize: '0.875rem' }}>
                    ¿Ya tienes cuenta?{' '}
                    <Link component={RouterLink} to='/login' sx={{ color: '#4A90E2', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      Inicia sesión aquí
                    </Link>
                  </Typography>
                </Box>
              )}
            </form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
};

export default Register;
