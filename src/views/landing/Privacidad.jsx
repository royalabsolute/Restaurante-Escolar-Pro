import { Box, Container, Typography, Paper } from '@mui/material';
import { Shield, Lock, Person, Description, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Privacidad = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: <Description />,
      title: '1. Información que Recopilamos',
      content: [
        'Datos personales: Nombre completo, documento de identidad, correo electrónico',
        'Datos académicos: Grado, grupo, institución educativa',
        'Datos de acceso: Usuario, contraseña encriptada',
        'Fotografías de perfil (opcional)',
        'Registros de asistencia y consumo de alimentos',
        'Códigos QR para control de acceso'
      ]
    },
    {
      icon: <CheckCircle />,
      title: '2. Uso de la Información',
      content: [
        'Gestión del programa de alimentación escolar',
        'Control de asistencia y beneficiarios',
        'Generación de reportes estadísticos',
        'Comunicación con estudiantes y alfabetizadores',
        'Mejora del servicio y experiencia de usuario',
        'Cumplimiento de requisitos legales y administrativos'
      ]
    },
    {
      icon: <Lock />,
      title: '3. Protección de Datos',
      content: [
        'Contraseñas encriptadas con algoritmos seguros (bcrypt)',
        'Base de datos protegida con acceso restringido',
        'Conexiones seguras mediante HTTPS',
        'Tokens de autenticación JWT con expiración',
        'Copias de seguridad periódicas',
        'Acceso limitado solo a personal autorizado'
      ]
    },
    {
      icon: <Person />,
      title: '4. Derechos del Usuario',
      content: [
        'Acceder a sus datos personales en cualquier momento',
        'Solicitar corrección de información incorrecta',
        'Solicitar eliminación de datos (sujeto a requisitos legales)',
        'Conocer quién tiene acceso a su información',
        'Revocar consentimiento (cuando aplique)',
        'Presentar quejas ante la autoridad competente'
      ]
    },
    {
      icon: <Shield />,
      title: '5. Compartir Información',
      content: [
        'NO vendemos ni compartimos datos con terceros comerciales',
        'Solo compartimos con autoridades educativas cuando es requerido',
        'Reportes estadísticos sin identificación personal',
        'Datos agregados para análisis institucional',
        'Cumplimiento de órdenes judiciales cuando aplique'
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
            <Shield sx={{ fontSize: 48, color: '#4A90E2' }} />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontFamily: "'Inter', 'Poppins', sans-serif",
                color: '#4A90E2'
              }}
            >
              Política de Privacidad
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
            Tu privacidad es importante para nosotros. Conoce cómo protegemos y utilizamos tu información personal.
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
        {/* Introducción */}
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
            variant="body1"
            sx={{
              lineHeight: 1.8,
              color: '#2c3e50',
              fontFamily: "'Inter', 'Poppins', sans-serif",
              mb: 2
            }}
          >
            La <strong>Institución Educativa San Antonio de Prado</strong> se compromete a proteger 
            la privacidad y seguridad de los datos personales de todos los usuarios del Sistema de 
            Gestión de Restaurante Escolar. Esta política describe cómo recopilamos, usamos, 
            almacenamos y protegemos su información personal.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.8,
              color: '#2c3e50',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Al utilizar este sistema, usted acepta las prácticas descritas en esta política de privacidad.
          </Typography>
        </Paper>

        {/* Secciones */}
        {sections.map((section, index) => (
          <Paper
            key={index}
            elevation={0}
            sx={{
              p: 4,
              mb: 3,
              border: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.08)',
              borderRadius: 3,
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: 'rgba(74, 144, 226, 0.3)',
                boxShadow: '0 4px 12px rgba(74, 144, 226, 0.1)'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}
              >
                {section.icon}
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: '#1a1a1a',
                  fontFamily: "'Inter', 'Poppins', sans-serif"
                }}
              >
                {section.title}
              </Typography>
            </Box>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {section.content.map((item, idx) => (
                <Box
                  key={idx}
                  component="li"
                  sx={{
                    mb: 1.5,
                    color: '#2c3e50',
                    fontFamily: "'Inter', 'Poppins', sans-serif",
                    lineHeight: 1.7
                  }}
                >
                  {item}
                </Box>
              ))}
            </Box>
          </Paper>
        ))}

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
            ¿Preguntas sobre tu Privacidad?
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
            Si tienes preguntas sobre esta política de privacidad o sobre cómo manejamos tus datos, 
            contáctanos:
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

export default Privacidad;
