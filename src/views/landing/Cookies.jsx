import { Box, Container, Typography, Paper } from '@mui/material';
import { Cookie, Security, CheckCircle, Block, Settings } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Cookies = () => {
  const navigate = useNavigate();

  const cookieTypes = [
    {
      icon: <Security />,
      title: 'Cookies Esenciales',
      type: 'essential',
      required: true,
      description: 'Necesarias para el funcionamiento básico del sistema. No se pueden desactivar.',
      examples: [
        '<strong>Token de sesión (JWT):</strong> Mantiene tu sesión activa mientras navegas',
        '<strong>Autenticación:</strong> Verifica tu identidad y permisos de usuario',
        '<strong>Seguridad:</strong> Protege contra ataques CSRF y XSS',
        '<strong>Preferencias de idioma:</strong> Recuerda tu idioma preferido'
      ]
    },
    {
      icon: <Settings />,
      title: 'Cookies de Preferencias',
      type: 'preferences',
      required: false,
      description: 'Permiten recordar tus configuraciones personalizadas para mejorar tu experiencia.',
      examples: [
        '<strong>Tema visual:</strong> Modo claro u oscuro (si aplica)',
        '<strong>Tamaño de fuente:</strong> Ajustes de accesibilidad',
        '<strong>Vista de dashboard:</strong> Widgets que prefieres ver',
        '<strong>Filtros guardados:</strong> Tus búsquedas frecuentes en reportes'
      ]
    },
    {
      icon: <Block />,
      title: 'Cookies de Análisis',
      type: 'analytics',
      required: false,
      description: 'Nos ayudan a entender cómo se usa el sistema para mejorarlo. Actualmente NO las utilizamos.',
      examples: [
        '<strong>Estadísticas de uso:</strong> Qué funciones se usan más',
        '<strong>Rendimiento:</strong> Tiempo de carga de páginas',
        '<strong>Errores:</strong> Detección de problemas técnicos',
        '<strong>Nota:</strong> Este sistema NO utiliza Google Analytics ni herramientas de terceros'
      ]
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          color: '#ffffff',
          py: 8,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle at 20px 20px, white 2px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Cookie sx={{ fontSize: 48, color: '#4A90E2' }} />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontFamily: "'Inter', 'Poppins', sans-serif",
                color: '#4A90E2'
              }}
            >
              Política de Cookies
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              maxWidth: '800px',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Conoce cómo utilizamos cookies para mejorar tu experiencia en el sistema.
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              mt: 2,
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Última actualización: Octubre 2025
          </Typography>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* ¿Qué son las cookies? */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            border: '1px solid',
            borderColor: 'rgba(74, 144, 226, 0.2)',
            borderRadius: 3
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 3,
              color: '#1a1a1a',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            ¿Qué son las Cookies? 🍪
          </Typography>
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.8,
              color: '#2c3e50',
              fontFamily: "'Inter', 'Poppins', sans-serif",
              mb: 2
            }}
          >
            Las cookies son pequeños archivos de texto que se almacenan en tu navegador cuando visitas 
            un sitio web. Sirven para recordar información sobre tu visita, como tu sesión de usuario, 
            preferencias y configuraciones.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.8,
              color: '#2c3e50',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            En nuestro sistema, las cookies son <strong>esenciales para que puedas iniciar sesión y 
            navegar de forma segura</strong>. No utilizamos cookies de publicidad ni rastreadores de terceros.
          </Typography>
        </Paper>

        {/* Tipos de Cookies */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 4,
            color: '#1a1a1a',
            fontFamily: "'Inter', 'Poppins', sans-serif"
          }}
        >
          Tipos de Cookies que Utilizamos
        </Typography>

        {cookieTypes.map((cookie, index) => (
          <Paper
            key={index}
            elevation={0}
            sx={{
              p: 4,
              mb: 3,
              border: '1px solid',
              borderColor: cookie.required ? 'rgba(74, 144, 226, 0.3)' : 'rgba(0, 0, 0, 0.08)',
              borderRadius: 3,
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: 'rgba(74, 144, 226, 0.4)',
                boxShadow: '0 4px 12px rgba(74, 144, 226, 0.1)'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: cookie.required 
                      ? 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)'
                      : 'linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}
                >
                  {cookie.icon}
                </Box>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: '#1a1a1a',
                      fontFamily: "'Inter', 'Poppins', sans-serif"
                    }}
                  >
                    {cookie.title}
                  </Typography>
                  {cookie.required && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#4A90E2',
                        fontWeight: 600,
                        fontFamily: "'Inter', 'Poppins', sans-serif"
                      }}
                    >
                      SIEMPRE ACTIVAS
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
            
            <Typography
              variant="body1"
              sx={{
                color: '#2c3e50',
                mb: 2,
                lineHeight: 1.7,
                fontFamily: "'Inter', 'Poppins', sans-serif"
              }}
            >
              {cookie.description}
            </Typography>

            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: '#1a1a1a',
                mb: 1.5,
                fontFamily: "'Inter', 'Poppins', sans-serif"
              }}
            >
              Ejemplos:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {cookie.examples.map((example, idx) => (
                <Box
                  key={idx}
                  component="li"
                  sx={{
                    mb: 1,
                    color: '#2c3e50',
                    fontFamily: "'Inter', 'Poppins', sans-serif",
                    lineHeight: 1.7
                  }}
                  dangerouslySetInnerHTML={{ __html: example }}
                />
              ))}
            </Box>
          </Paper>
        ))}

        {/* Información Adicional */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            background: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid',
            borderColor: 'rgba(76, 175, 80, 0.3)',
            borderRadius: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <CheckCircle sx={{ color: '#4caf50', fontSize: 32 }} />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#2e7d32',
                  mb: 2,
                  fontFamily: "'Inter', 'Poppins', sans-serif"
                }}
              >
                ¿Qué NO hacemos con las Cookies?
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {[
                  '❌ NO vendemos tu información a terceros',
                  '❌ NO usamos cookies de publicidad',
                  '❌ NO rastreamos tu navegación fuera de este sistema',
                  '❌ NO compartimos datos con redes sociales',
                  '✅ Solo usamos cookies para que el sistema funcione correctamente'
                ].map((item, idx) => (
                  <Box
                    key={idx}
                    component="li"
                    sx={{
                      mb: 1.5,
                      color: '#2c3e50',
                      fontFamily: "'Inter', 'Poppins', sans-serif",
                      lineHeight: 1.7,
                      fontWeight: item.startsWith('✅') ? 600 : 400
                    }}
                  >
                    {item}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Cómo gestionar cookies */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            border: '1px solid',
            borderColor: 'rgba(0, 0, 0, 0.08)',
            borderRadius: 3
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 3,
              color: '#1a1a1a',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            ¿Cómo Gestionar las Cookies?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.8,
              color: '#2c3e50',
              fontFamily: "'Inter', 'Poppins', sans-serif",
              mb: 2
            }}
          >
            Puedes configurar tu navegador para rechazar cookies, pero esto podría afectar el 
            funcionamiento del sistema. Para gestionar cookies en tu navegador:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Box component="li" sx={{ mb: 1, color: '#2c3e50', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
              <strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies
            </Box>
            <Box component="li" sx={{ mb: 1, color: '#2c3e50', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
              <strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies y datos del sitio
            </Box>
            <Box component="li" sx={{ mb: 1, color: '#2c3e50', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
              <strong>Edge:</strong> Configuración → Privacidad → Cookies y permisos del sitio
            </Box>
            <Box component="li" sx={{ color: '#2c3e50', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
              <strong>Safari:</strong> Preferencias → Privacidad → Cookies y datos de sitios web
            </Box>
          </Box>
        </Paper>

        {/* Contacto */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 5 },
            background: '#f8fafc',
            border: '1px solid rgba(74, 144, 226, 0.1)',
            borderRadius: 5,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: '#1a1a1a',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            ¿Preguntas sobre las Cookies?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              color: '#4a4a4a',
              lineHeight: 1.9,
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Si tienes dudas sobre cómo utilizamos las cookies, contáctanos:
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              fontFamily: "'Inter', 'Poppins', sans-serif",
              color: '#4a4a4a',
              lineHeight: 1.9
            }}
          >
            📧 Email: info@restaurante.edu.co<br />
            📞 Teléfono: +57 (604) 123 4567<br />
            📍 Institución Educativa San Antonio de Prado, Medellín, Colombia
          </Typography>
        </Paper>

        {/* Botón Volver */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography
            variant="body1"
            onClick={() => navigate('/')}
            sx={{
              color: '#4A90E2',
              cursor: 'pointer',
              fontFamily: "'Inter', 'Poppins', sans-serif",
              fontWeight: 600,
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            ← Volver al inicio
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Cookies;
