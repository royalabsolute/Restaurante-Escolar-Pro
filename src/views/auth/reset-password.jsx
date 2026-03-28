import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  FormHelperText,
  Grid,
  Link,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography,
  Alert,
  Paper,
  IconButton
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { useAuth } from 'hooks/useAuth';
import * as Yup from 'yup';
import { Formik } from 'formik';
import BrandLogo from 'components/BrandLogo';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const initialEmail = useMemo(() => {
    if (location.state?.email) {
      return location.state.email;
    }

    const params = new URLSearchParams(location.search);
    return params.get('email') || '';
  }, [location]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          maxWidth: 460,
          width: '100%',
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          background: '#ffffff',
          border: '1px solid rgba(74, 144, 226, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          position: 'relative'
        }}
      >
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

        <Box sx={{ textAlign: 'center', mb: 3, mt: 1 }}>
          <BrandLogo width={135} sx={{ mx: 'auto', mb: 1 }} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 0.5,
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Restablecer Contraseña
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              fontSize: '0.875rem',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Ingresa el código de seguridad que recibiste por correo
          </Typography>
        </Box>

        {message && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontSize: '0.875rem' }}>
            {message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.875rem' }}>
            {error}
          </Alert>
        )}

        <Formik
          enableReinitialize
          initialValues={{
            email: initialEmail,
            code: '',
            newPassword: '',
            confirmPassword: ''
          }}
          validationSchema={Yup.object().shape({
            email: Yup.string().email('Email inválido').required('El email es requerido'),
            code: Yup.string()
              .required('El código es requerido')
              .length(6, 'El código debe tener 6 dígitos')
              .matches(/^[0-9]+$/, 'El código solo debe contener números'),
            newPassword: Yup.string()
              .min(6, 'La contraseña debe tener al menos 6 caracteres')
              .required('La contraseña es requerida'),
            confirmPassword: Yup.string()
              .oneOf([Yup.ref('newPassword'), null], 'Las contraseñas no coinciden')
              .required('Confirma tu nueva contraseña')
          })}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              setError('');
              setMessage('');

              const result = await resetPassword({
                email: values.email,
                code: values.code,
                newPassword: values.newPassword
              });

              if (result.success) {
                setMessage(result.message || 'Contraseña actualizada correctamente.');
                setTimeout(() => {
                  navigate('/login');
                }, 1800);
              } else {
                setError(result.message || 'No fue posible actualizar la contraseña.');
              }
            } catch (err) {
              console.error('Error en reset password:', err);
              setError('Error de conexión. Verifique que el servidor esté ejecutándose.');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
            <form noValidate onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Stack spacing={1}>
                    <InputLabel htmlFor="email-reset" sx={{
                      color: '#1a1a1a',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      fontFamily: "'Inter', 'Poppins', sans-serif"
                    }}>
                      Email
                    </InputLabel>
                    <OutlinedInput
                      id="email-reset"
                      type="email"
                      value={values.email}
                      name="email"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="ejemplo@correo.com"
                      fullWidth
                      error={Boolean(touched.email && errors.email)}
                      sx={{
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
                      }}
                    />
                    {touched.email && errors.email && (
                      <FormHelperText error id="standard-weight-helper-text-email-reset">
                        {errors.email}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Stack spacing={1}>
                    <InputLabel htmlFor="code-reset" sx={{
                      color: '#1a1a1a',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      fontFamily: "'Inter', 'Poppins', sans-serif"
                    }}>
                      Código de Seguridad
                    </InputLabel>
                    <OutlinedInput
                      id="code-reset"
                      type="text"
                      inputMode="numeric"
                      value={values.code}
                      name="code"
                      onBlur={handleBlur}
                      onChange={(event) => {
                        const sanitized = event.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                        handleChange({ target: { name: 'code', value: sanitized } });
                      }}
                      placeholder="000000"
                      fullWidth
                      error={Boolean(touched.code && errors.code)}
                      sx={{
                        borderRadius: 2,
                        letterSpacing: '6px',
                        fontWeight: 700,
                        fontSize: '1.2rem'
                      }}
                    />
                    {touched.code && errors.code && (
                      <FormHelperText error id="standard-weight-helper-text-code-reset">
                        {errors.code}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Stack spacing={1}>
                    <InputLabel htmlFor="password-reset" sx={{
                      color: '#1a1a1a',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      fontFamily: "'Inter', 'Poppins', sans-serif"
                    }}>
                      Nueva Contraseña
                    </InputLabel>
                    <OutlinedInput
                      id="password-reset"
                      type="password"
                      value={values.newPassword}
                      name="newPassword"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="••••••••"
                      fullWidth
                      error={Boolean(touched.newPassword && errors.newPassword)}
                      sx={{ borderRadius: 2 }}
                    />
                    {touched.newPassword && errors.newPassword && (
                      <FormHelperText error id="standard-weight-helper-text-password-reset">
                        {errors.newPassword}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Stack spacing={1}>
                    <InputLabel htmlFor="confirm-password-reset" sx={{
                      color: '#1a1a1a',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      fontFamily: "'Inter', 'Poppins', sans-serif"
                    }}>
                      Confirmar Contraseña
                    </InputLabel>
                    <OutlinedInput
                      id="confirm-password-reset"
                      type="password"
                      value={values.confirmPassword}
                      name="confirmPassword"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="••••••••"
                      fullWidth
                      error={Boolean(touched.confirmPassword && errors.confirmPassword)}
                      sx={{ borderRadius: 2 }}
                    />
                    {touched.confirmPassword && errors.confirmPassword && (
                      <FormHelperText error id="standard-weight-helper-text-confirm-password-reset">
                        {errors.confirmPassword}
                      </FormHelperText>
                    )}
                  </Stack>
                </Grid>

                <Grid item xs={12}>
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
                      fontFamily: "'Inter', 'Poppins', sans-serif",
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #357ABD 0%, #2868A8 100%)',
                        boxShadow: '0 4px 12px rgba(74, 144, 226, 0.4)',
                        transform: 'translateY(-2px)'
                      },
                      '&:active': {
                        transform: 'translateY(0)'
                      },
                      '&.Mui-disabled': {
                        background: 'rgba(0, 0, 0, 0.12)',
                        color: 'rgba(0, 0, 0, 0.26)'
                      }
                    }}
                  >
                    {isSubmitting ? 'Guardando...' : 'Actualizar Contraseña'}
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <Stack direction="row" justifyContent="center" alignItems="center" sx={{ mt: 1 }}>
                    <Link
                      component={RouterLink}
                      to="/forgot-password"
                      variant="body2"
                      sx={{
                        color: '#4A90E2',
                        fontSize: '0.875rem',
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontFamily: "'Inter', 'Poppins', sans-serif",
                        '&:hover': {
                          textDecoration: 'underline'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      ¿Necesitas reenviar el código?
                    </Link>
                  </Stack>
                </Grid>
              </Grid>
            </form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
};

export default ResetPassword;
