import { Box, Container, Typography, Grid, Divider } from '@mui/material';
import { Email, Phone, LocationOn } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import BrandLogo from 'components/BrandLogo';

const Footer = () => {
  const navigate = useNavigate();

  const quickLinks = [
    { label: 'Inicio', action: () => navigate('/') },
    { label: 'Nosotros', action: () => navigate('/nosotros') },
    { label: 'Marco Legal', action: () => navigate('/marco-legal') },
    { label: 'Manual', action: () => navigate('/manual') }
  ];

  const resources = [
    { label: 'Privacidad', action: () => navigate('/privacidad') },
    { label: 'Términos', action: () => navigate('/terminos') },
    { label: 'Cookies', action: () => navigate('/cookies') }
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#1a1a1a',
        color: '#ffffff',
        pt: 6,
        pb: 3,
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
          opacity: 0.03,
          backgroundImage: 'radial-gradient(circle at 20px 20px, white 2px, transparent 0)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none'
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <BrandLogo width={180} sx={{ mx: 'auto', mb: 1 }} />
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.75rem',
              fontFamily: "'Inter', 'Poppins', sans-serif",
              letterSpacing: 1.2
            }}
          >
            SISTEMA DE GESTIÓN RESTAURANTE ESCOLAR
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: 1.6,
              maxWidth: '600px',
              mx: 'auto',
              fontSize: '0.85rem',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Sistema de gestión integral para la IE San Antonio de Prado, promoviendo eficiencia y transparencia.
          </Typography>
        </Box>

        <Grid container spacing={3} justifyContent="center" sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3} md={2.4}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                fontSize: '0.9rem',
                color: '#4A90E2',
                fontFamily: "'Inter', 'Poppins', sans-serif",
                textAlign: { xs: 'center', md: 'left' }
              }}
            >
              Enlaces Rápidos
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, alignItems: { xs: 'center', md: 'flex-start' } }}>
              {quickLinks.map((link, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  onClick={link.action}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    fontSize: '0.8rem',
                    fontFamily: "'Inter', 'Poppins', sans-serif",
                    '&:hover': { color: '#4A90E2', pl: { xs: 0, md: 1 } }
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Box>
          </Grid>

          <Grid item xs={6} sm={3} md={2.4}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                fontSize: '0.9rem',
                color: '#4A90E2',
                fontFamily: "'Inter', 'Poppins', sans-serif",
                textAlign: { xs: 'center', md: 'left' }
              }}
            >
              Recursos
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, alignItems: { xs: 'center', md: 'flex-start' } }}>
              {resources.map((resource, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  onClick={resource.action}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    fontSize: '0.8rem',
                    fontFamily: "'Inter', 'Poppins', sans-serif",
                    '&:hover': { color: '#4A90E2', pl: { xs: 0, md: 1 } }
                  }}
                >
                  {resource.label}
                </Typography>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3.6}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                fontSize: '0.9rem',
                color: '#4A90E2',
                fontFamily: "'Inter', 'Poppins', sans-serif",
                textAlign: { xs: 'center', md: 'left' }
              }}
            >
              Contacto
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: { xs: 'center', md: 'flex-start' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: 16, color: '#4A90E2' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                  restaurante.escolar@iesap.edu.co
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 16, color: '#4A90E2' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                  (sin información)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ fontSize: 16, color: '#4A90E2' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                  Medellín, Colombia
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={3.6}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                fontSize: '0.9rem',
                color: '#4A90E2',
                fontFamily: "'Inter', 'Poppins', sans-serif",
                textAlign: { xs: 'center', md: 'left' }
              }}
            >
              Instituciones Aliadas
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 2, md: 1.5 }, 
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', md: 'flex-start' },
              alignItems: 'center'
            }}>
              <Box
                component="img"
                src="/src/assets/images/Pascual.png"
                alt="Pascual Bravo"
                sx={{
                  height: { xs: 40, md: 46 },
                  width: 'auto',
                  maxWidth: { xs: 110, md: 120 },
                  objectFit: 'contain',
                  opacity: 0.95,
                  transition: 'all 0.3s',
                  '&:hover': { opacity: 1, transform: 'scale(1.05)' }
                }}
              />
              <Box
                component="img"
                src="/src/assets/images/Iesadep.png"
                alt="IESADEP"
                sx={{
                  height: { xs: 40, md: 46 },
                  width: 'auto',
                  maxWidth: { xs: 110, md: 120 },
                  objectFit: 'contain',
                  opacity: 0.95,
                  transition: 'all 0.3s',
                  '&:hover': { opacity: 1, transform: 'scale(1.05)' }
                }}
              />
              <Box
                component="img"
                src="/src/assets/images/Secretaria.png"
                alt="Secretaría"
                sx={{
                  height: { xs: 40, md: 46 },
                  width: 'auto',
                  maxWidth: { xs: 110, md: 120 },
                  objectFit: 'contain',
                  opacity: 0.95,
                  transition: 'all 0.3s',
                  '&:hover': { opacity: 1, transform: 'scale(1.05)' }
                }}
              />
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 2.5 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.75rem'
            }}
          >
            © 2025 Equipo Absolute. Todos los derechos reservados.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
