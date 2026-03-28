import { Box, Container, Typography, Paper } from '@mui/material';
import { Gavel, Warning, CheckCircle, Cancel, Update, Security } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Terminos = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: <CheckCircle />,
      title: '1. Aceptación de Términos',
      content: [
        'Al acceder y utilizar el Sistema de Gestión de Restaurante Escolar, usted acepta estar sujeto a estos Términos y Condiciones.',
        'Si no está de acuerdo con alguna parte de estos términos, no debe utilizar el sistema.',
        'El uso continuado del sistema implica la aceptación de estos términos y cualquier modificación futura.'
      ]
    },
    {
      icon: <Security />,
      title: '2. Usuarios Autorizados',
      content: [
        '<strong>Estudiantes:</strong> Beneficiarios del programa de alimentación escolar registrados en la institución.',
        '<strong>Alfabetizadores:</strong> Personal autorizado para gestionar grupos y registrar asistencia.',
        '<strong>Administradores:</strong> Personal con acceso completo al sistema para configuración y gestión.',
        'Solo usuarios con credenciales válidas proporcionadas por la institución pueden acceder.',
        'Está prohibido compartir credenciales de acceso con terceros.'
      ]
    },
    {
      icon: <Warning />,
      title: '3. Uso Apropiado del Sistema',
      content: [
        '<strong>Permitido:</strong> Utilizar el sistema para gestionar asistencia, consultar menús, generar reportes y administrar beneficiarios.',
        '<strong>Prohibido:</strong> Intentar acceder a datos de otros usuarios sin autorización.',
        '<strong>Prohibido:</strong> Manipular, alterar o falsificar registros de asistencia o consumo.',
        '<strong>Prohibido:</strong> Realizar ataques informáticos, inyección de código o intentos de hackeo.',
        '<strong>Prohibido:</strong> Usar el sistema para fines comerciales o no autorizados.',
        'Cualquier uso indebido resultará en la suspensión inmediata de la cuenta.'
      ]
    },
    {
      icon: <Gavel />,
      title: '4. Responsabilidades del Usuario',
      content: [
        'Mantener la confidencialidad de su contraseña y datos de acceso.',
        'Notificar inmediatamente cualquier uso no autorizado de su cuenta.',
        'Proporcionar información precisa y actualizada en su perfil.',
        '<strong>Subir una fotografía de perfil OBLIGATORIA para identificación.</strong>',
        'No compartir códigos QR personales con otros estudiantes.',
        'Utilizar el sistema de manera responsable y ética.',
        'Cumplir con las políticas institucionales de la IE San Antonio de Prado.'
      ]
    },
    {
      icon: <Cancel />,
      title: '5. Limitaciones de Responsabilidad',
      content: [
        'El sistema se proporciona "tal cual" sin garantías de ningún tipo.',
        'La institución no se hace responsable de interrupciones temporales del servicio por mantenimiento.',
        'No somos responsables de pérdidas de datos causadas por el usuario (ej: olvidar contraseña).',
        'El acceso al servicio de alimentación está sujeto a disponibilidad de cupos y presupuesto.',
        'Los reportes generados son informativos y pueden contener errores si los datos ingresados son incorrectos.'
      ]
    },
    {
      icon: <Update />,
      title: '6. Modificaciones al Servicio',
      content: [
        'La institución se reserva el derecho de modificar o descontinuar el servicio en cualquier momento.',
        'Podemos actualizar estos términos periódicamente, notificando a los usuarios con anticipación.',
        'Las funcionalidades pueden cambiar para mejorar el servicio sin previo aviso.',
        'Mantenimientos programados serán notificados con al menos 24 horas de anticipación.',
        'El uso continuado después de cambios implica aceptación de los nuevos términos.'
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
            <Gavel sx={{ fontSize: 48, color: '#4A90E2' }} />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontFamily: "'Inter', 'Poppins', sans-serif",
                color: '#4A90E2'
              }}
            >
              Términos y Condiciones
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
            Normas de uso y responsabilidades para el Sistema de Gestión de Restaurante Escolar.
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
            Bienvenido al <strong>Sistema de Gestión de Restaurante Escolar</strong> de la Institución 
            Educativa San Antonio de Prado. Estos Términos y Condiciones establecen las reglas y 
            regulaciones para el uso de nuestro sistema.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.8,
              color: '#2c3e50',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Por favor, lea estos términos cuidadosamente antes de utilizar el sistema. Su acceso y uso 
            del servicio está condicionado a su aceptación y cumplimiento de estos términos.
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
                  dangerouslySetInnerHTML={{ __html: item }}
                />
              ))}
            </Box>
          </Paper>
        ))}

        {/* Advertencia Legal */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid',
            borderColor: 'rgba(255, 193, 7, 0.3)',
            borderRadius: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Warning sx={{ color: '#f57c00', fontSize: 32 }} />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: '#f57c00',
                  mb: 1,
                  fontFamily: "'Inter', 'Poppins', sans-serif"
                }}
              >
                Importante
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#2c3e50',
                  lineHeight: 1.7,
                  fontFamily: "'Inter', 'Poppins', sans-serif"
                }}
              >
                El incumplimiento de estos términos puede resultar en la <strong>suspensión o terminación</strong> de 
                su cuenta sin previo aviso. En casos graves, se tomarán medidas disciplinarias de acuerdo con el 
                reglamento institucional.
              </Typography>
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
            ¿Preguntas sobre los Términos?
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
            Si tienes dudas sobre estos términos y condiciones, contáctanos:
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

export default Terminos;
