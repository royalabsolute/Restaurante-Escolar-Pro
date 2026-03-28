import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  FormHelperText,
  Link,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography,
  Alert,
  Paper,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useAuth } from 'hooks/useAuth';
import * as Yup from 'yup';
import { Formik } from 'formik';
import BrandLogo from 'components/BrandLogo';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  // Estilos con hover animado
  const inputStyles = {
    borderRadius: 2,
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        p: 2
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 440,
          width: '100%',
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          background: '#ffffff',
          border: '1px solid rgba(74, 144, 226, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
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
          <BrandLogo width={140} sx={{ mx: 'auto', mb: 1 }} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 0.5,
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Iniciar Sesión
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              fontSize: '0.875rem',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Restaurante Escolar
          </Typography>
        </Box>

        {loginError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.875rem' }}>
            {loginError}
          </Alert>
        )}

        <Formik
          initialValues={{ username: '', password: '', submit: null }}
          validationSchema={Yup.object().shape({
            username: Yup.string().max(255).required('Usuario requerido'),
            password: Yup.string().max(255).required('Contraseña requerida')
          })}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              setLoginError('');
              const result = await login({
                email_or_matricula: values.username,
                password: values.password
              });

              if (result.success) {
                navigate(result.redirectUrl || '/dashboard');
              } else {
                setLoginError(result.message || 'Error en el inicio de sesión');
              }
            } catch (err) {
              if (err.code === 'ERR_NETWORK') {
                setLoginError('No se pudo conectar con el servidor');
              } else if (err.response?.status === 401) {
                setLoginError('Usuario o contraseña incorrectos');
              } else {
                setLoginError('Error de conexión');
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
            <form noValidate onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                {/* Usuario */}
                <Stack spacing={0.5}>
                  <InputLabel
                    htmlFor="username-login"
                    sx={{ color: '#1a1a1a', fontWeight: 600, fontSize: '0.875rem' }}
                  >
                    Correo o Matrícula
                  </InputLabel>
                  <OutlinedInput
                    id="username-login"
                    type="text"
                    value={values.username}
                    name="username"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="ejemplo@correo.com"
                    fullWidth
                    startAdornment={
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#4A90E2', fontSize: 20 }} />
                      </InputAdornment>
                    }
                    error={Boolean(touched.username && errors.username)}
                    sx={inputStyles}
                  />
                  {touched.username && errors.username && (
                    <FormHelperText error sx={{ fontSize: '0.75rem' }}>
                      {errors.username}
                    </FormHelperText>
                  )}
                </Stack>

                {/* Contraseña */}
                <Stack spacing={0.5}>
                  <InputLabel
                    htmlFor="password-login"
                    sx={{ color: '#1a1a1a', fontWeight: 600, fontSize: '0.875rem' }}
                  >
                    Contraseña
                  </InputLabel>
                  <OutlinedInput
                    id="password-login"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    name="password"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="••••••••"
                    fullWidth
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? (
                            <VisibilityOff sx={{ fontSize: 20 }} />
                          ) : (
                            <Visibility sx={{ fontSize: 20 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    }
                    error={Boolean(touched.password && errors.password)}
                    sx={inputStyles}
                  />
                  {touched.password && errors.password && (
                    <FormHelperText error sx={{ fontSize: '0.75rem' }}>
                      {errors.password}
                    </FormHelperText>
                  )}
                </Stack>

                {/* Link Olvidé contraseña */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    sx={{
                      color: '#4A90E2',
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </Box>

                {/* Botón Iniciar Sesión */}
                <Button
                  disableElevation
                  disabled={isSubmitting}
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                    color: '#ffffff',
                    borderRadius: 2,
                    py: 1.5,
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #357ABD 0%, #2868a8 100%)',
                      boxShadow: '0 6px 16px rgba(74, 144, 226, 0.4)'
                    },
                    '&:disabled': {
                      background: '#ccc'
                    }
                  }}
                >
                  {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
                </Button>

                {/* Link Registro */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="body2"
                    sx={{ color: '#666', fontSize: '0.875rem' }}
                  >
                    ¿No tienes cuenta?{' '}
                    <Link
                      component={RouterLink}
                      to="/register"
                      sx={{
                        color: '#4A90E2',
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      Regístrate aquí
                    </Link>
                  </Typography>
                </Box>
              </Stack>
            </form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
};

export default Login;
