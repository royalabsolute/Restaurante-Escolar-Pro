import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Home as HomeIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from 'hooks/useAuth';
import * as Yup from 'yup';
import { Formik } from 'formik';
import BrandLogo from 'components/BrandLogo';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
          <BrandLogo width={130} sx={{ mx: 'auto', mb: 1 }} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 0.5,
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Recuperar Contraseña
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#666',
              fontSize: '0.875rem',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Ingresa tu email para recibir un código de seguridad
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
          initialValues={{ email: '' }}
          validationSchema={Yup.object().shape({
            email: Yup.string().email('Email inválido').max(255).required('El email es requerido')
          })}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              setError('');
              setMessage('');
              
              const result = await forgotPassword(values.email);
              
              if (result.success) {
                setMessage(result.message || 'Si el email existe, enviaremos un código de seguridad.');
                setTimeout(() => {
                  navigate('/reset-password', { state: { email: values.email } });
                }, 1500);
              } else {
                setError(result.message || 'Error al procesar la solicitud');
              }
            } catch (err) {
              console.error('Error en forgot password:', err);
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
                    <InputLabel htmlFor="email-forgot" sx={{ 
                      color: '#1a1a1a', 
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      fontFamily: "'Inter', 'Poppins', sans-serif"
                    }}>Email</InputLabel>
                    <OutlinedInput
                      id="email-forgot"
                      type="email"
                      value={values.email}
                      name="email"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      placeholder="ejemplo@correo.com"
                      fullWidth
                      startAdornment={
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                          <EmailIcon sx={{ fontSize: 20, color: '#4A90E2' }} />
                        </Box>
                      }
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
                      <FormHelperText error id="standard-weight-helper-text-email-forgot">
                        {errors.email}
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
                    {isSubmitting ? 'Enviando...' : 'Enviar Código'}
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <Stack direction="row" justifyContent="center" alignItems="center" sx={{ mt: 1 }}>
                    <Link 
                      component={RouterLink} 
                      to="/login" 
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
                      Volver al login
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

export default ForgotPassword;
