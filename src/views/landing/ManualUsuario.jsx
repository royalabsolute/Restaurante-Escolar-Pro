import { Box, Container, Typography, Grid, Card, CardContent, Stepper, Step, StepLabel, Paper } from '@mui/material';
import { School, SupervisorAccount, Business, QrCode2, Assessment, Notifications } from '@mui/icons-material';
import DynamicNavbar from './components/DynamicNavbar';
import Footer from './components/Footer';

const ManualUsuario = () => {
  const userRoles = [
    {
      title: 'Estudiante',
      icon: <School sx={{ fontSize: 60 }} />,
      color: '#4A90E2',
      gradient: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
      features: [
        'Tu código QR personal para marcar asistencia',
        'Descarga tu carnet digital cuando quieras',
        'Mira cuándo has venido al comedor',
        'Revisa tus estadísticas de asistencia',
        'Justifica tus faltas fácilmente',
        'Actualiza tu foto de perfil'
      ],
      steps: [
        'Entra con tu número de matrícula',
        'Mira tu resumen del mes en el inicio',
        'Ve a "Mi Código QR" para verlo o imprimirlo',
        'Muestra tu QR en el comedor para marcar',
        'Consulta cuándo has asistido en "Mis Asistencias"',
        'Si faltaste, crea una justificación con tu documento'
      ]
    },
    {
      title: 'Alfabetizador',
      icon: <SupervisorAccount sx={{ fontSize: 60 }} />,
      color: '#5EC48E',
      gradient: 'linear-gradient(135deg, #5EC48E 0%, #3DAE6F 100%)',
      features: [
        'Ve quiénes de tu grupo vinieron hoy',
        'Escanea códigos QR con la cámara',
        'Registra manualmente si no hay código',
        'Añade estudiantes suplentes temporales',
        'Consulta la lista de tus estudiantes',
        'Genera reportes de tu grupo',
        'Revisa todo tu historial de registros'
      ],
      steps: [
        'Abre el sistema y mira el resumen de tu grupo',
        'Ve a "Control de Asistencia"',
        'Activa la cámara o el escáner',
        'Escanea el código de cada estudiante',
        'Si es suplente, regístralo en "Suplentes"',
        'Si no tiene código, búscalo y regístralo manualmente',
        'Verifica en "Historial" que todo esté bien',
        'Descarga el reporte del día si lo necesitas'
      ]
    },
    {
      title: 'Secretaría',
      icon: <Business sx={{ fontSize: 60 }} />,
      color: '#E94560',
      gradient: 'linear-gradient(135deg, #E94560 0%, #D32F4A 100%)',
      features: [
        'Ve todos los estudiantes y estadísticas generales',
        'Aprueba o rechaza nuevos estudiantes',
        'Genera códigos QR para todos',
        'Revisa y aprueba las justificaciones',
        'Administra los alfabetizadores',
        'Descarga reportes con filtros',
        'Ve gráficos de asistencia',
        'Configura el límite de cupos',
        'Haz respaldos de la información'
      ],
      steps: [
        'Abre el sistema y mira el resumen general',
        'Revisa estudiantes nuevos para aprobarlos',
        'Genera los códigos QR para todos de una vez',
        'Revisa las justificaciones pendientes',
        'Asigna alfabetizadores a los grupos',
        'Descarga reportes filtrando por fechas',
        'Mira las gráficas de asistencia',
        'Ajusta el límite de cupos en Configuración',
        'Haz un respaldo de seguridad cuando quieras'
      ]
    }
  ];

  const systemFeatures = [
    {
      icon: <QrCode2 sx={{ fontSize: 40 }} />,
      title: 'Sistema de Códigos QR',
      description: 'Marca tu asistencia con códigos QR únicos. Usa la cámara del celular o escáner. Descarga e imprime tu carnet cuando quieras.'
    },
    {
      icon: <Assessment sx={{ fontSize: 40 }} />,
      title: 'Reportes Claros',
      description: 'Ve todo tu historial de asistencias. Filtra por fechas, grados o grupos. Mira gráficas fáciles de entender con tus estadísticas.'
    },
    {
      icon: <Notifications sx={{ fontSize: 40 }} />,
      title: 'Justificaciones Simples',
      description: 'Crea y envía tus justificaciones de faltas. Adjunta documentos o imágenes. Sigue el estado: pendiente, aprobada o rechazada.'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#ffffff'
      }}
    >
      <DynamicNavbar activeSection="manual" />
      
      <Container maxWidth="lg" sx={{ pt: { xs: 12, md: 16 }, pb: { xs: 8, md: 12 } }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="overline"
            sx={{
              color: '#4A90E2',
              fontSize: '0.95rem',
              fontWeight: 600,
              letterSpacing: 2,
              mb: 2,
              display: 'block'
            }}
          >
            GUÍA DE USUARIO
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              background: 'linear-gradient(135deg, #1a1a1a 0%, #4A90E2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3
            }}
          >
            Manual de Usuario
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666',
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.8,
              fontSize: { xs: '1rem', md: '1.1rem' }
            }}
          >
            Aprende a usar el sistema fácilmente según tu rol.
            Guías simples para estudiantes, alfabetizadores y secretaría.
          </Typography>
        </Box>

        {/* User Roles */}
        <Grid container spacing={4} sx={{ mb: 10 }}>
          {userRoles.map((role, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'all 0.4s',
                  overflow: 'visible',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 12px 40px ${role.color}30`
                  }
                }}
              >
                {/* Icon Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -30,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: role.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 24px ${role.color}50`,
                    '& svg': {
                      color: '#ffffff'
                    }
                  }}
                >
                  {role.icon}
                </Box>

                <CardContent sx={{ pt: 7, px: 3, pb: 3 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      textAlign: 'center',
                      mb: 3,
                      color: role.color
                    }}
                  >
                    {role.title}
                  </Typography>

                  {/* Features */}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: '#1a1a1a',
                      mb: 2
                    }}
                  >
                    ¿Qué puedes hacer?
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    {role.features.map((feature, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          mb: 1.5
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: role.color,
                            mt: 1,
                            mr: 1.5,
                            flexShrink: 0
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#666',
                            lineHeight: 1.6
                          }}
                        >
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Steps */}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: '#1a1a1a',
                      mb: 2
                    }}
                  >
                    Cómo empezar:
                  </Typography>
                  <Stepper
                    orientation="vertical"
                    activeStep={-1}
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontSize: '0.85rem',
                        color: '#666'
                      },
                      '& .MuiStepIcon-root': {
                        color: role.color,
                        '&.Mui-completed': {
                          color: role.color
                        }
                      }
                    }}
                  >
                    {role.steps.map((step, idx) => (
                      <Step key={idx} active>
                        <StepLabel>{step}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* System Features */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              mb: 5,
              background: 'linear-gradient(135deg, #1a1a1a 0%, #4A90E2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Características Principales
          </Typography>
          <Grid container spacing={4}>
            {systemFeatures.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4A90E2 0%, #5EC48E 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      '& svg': {
                        color: '#ffffff'
                      }
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: '#1a1a1a'
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      lineHeight: 1.7
                    }}
                  >
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Help Box */}
        <Box
          sx={{
            p: { xs: 4, md: 5 },
            background: '#f8fafc',
            border: '1px solid rgba(74, 144, 226, 0.1)',
            borderRadius: 5,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: '#1a1a1a',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            ¿Necesitas Ayuda?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.9,
              fontWeight: 400,
              fontSize: { xs: '1rem', md: '1.05rem' },
              color: '#4a4a4a',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.3px',
              mb: 3
            }}
          >
            Si tienes dudas sobre cómo utilizar el sistema, contacta al personal
            administrativo o consulta la documentación completa.
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#4A90E2'
            }}
          >
            📧 soporte@restauranteescolar.edu.co
          </Typography>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default ManualUsuario;
