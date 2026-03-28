import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { Code, Psychology, EmojiPeople, Group } from '@mui/icons-material';
import DynamicNavbar from './components/DynamicNavbar';
import Footer from './components/Footer';
import getImageUrl from '../../utils/getImageUrl';

const Nosotros = () => {
  const teamMembers = [
    {
      name: 'Joseph Castañeda',
      role: 'Full Stack Developer',
      image: getImageUrl('Joseph.jpg', 'team'),
      icon: <Code />,
      contributions: 'Arquitectura del sistema y desarrollo backend',
      specialty: 'Node.js, Express, MySQL'
    },
    {
      name: 'Juan Maya',
      role: 'Frontend Developer',
      image: getImageUrl('Maya.jpg', 'team'),
      icon: <Psychology />,
      contributions: 'Interfaz de usuario y experiencia',
      specialty: 'React, Material-UI, UX Design'
    },
    {
      name: 'Pablo Borja',
      role: 'Backend Developer',
      image: getImageUrl('Pablo.jpg', 'team'),
      icon: <EmojiPeople />,
      contributions: 'APIs REST y base de datos',
      specialty: 'MySQL, API Development, Optimización'
    },
    {
      name: 'Santiago Cueva',
      role: 'QA & DevOps',
      image: getImageUrl('Santiago.jpg', 'team'),
      icon: <Group />,
      contributions: 'Testing y automatización',
      specialty: 'Testing, CI/CD, Deployment'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#ffffff'
      }}
    >
      <DynamicNavbar activeSection="nosotros" />
      
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
            NUESTRO EQUIPO
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
            Team Absolut
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666',
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.8,
              fontSize: { xs: '1rem', md: '1.1rem' }
            }}
          >
            Un equipo de desarrolladores apasionados comprometidos con crear
            plataformas tecnológicas innovadoras para la gestión educativa.
          </Typography>
        </Box>

        {/* Team Grid */}
        <Grid container spacing={4}>
          {teamMembers.map((member, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  background: '#ffffff',
                  borderRadius: 4,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-12px)',
                    boxShadow: '0 12px 40px rgba(74, 144, 226, 0.2)',
                    '& .member-image': {
                      transform: 'scale(1.1)'
                    }
                  }
                }}
              >
                {/* Image Container */}
                <Box
                  sx={{
                    position: 'relative',
                    height: 280,
                    overflow: 'hidden',
                    bgcolor: '#f5f7fa'
                  }}
                >
                  <Box
                    component="img"
                    src={member.image}
                    alt={member.name}
                    className="member-image"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                </Box>

                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: '#1a1a1a',
                      mb: 0.5
                    }}
                  >
                    {member.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#4A90E2',
                      fontWeight: 600,
                      mb: 2,
                      fontSize: '0.85rem'
                    }}
                  >
                    {member.role}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      mb: 1.5,
                      lineHeight: 1.6
                    }}
                  >
                    {member.contributions}
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-block',
                      bgcolor: 'rgba(74, 144, 226, 0.1)',
                      color: '#4A90E2',
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {member.specialty}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Mission Statement */}
        <Box
          sx={{
            mt: 10,
            p: { xs: 4, md: 6 },
            background: '#f8fafc',
            border: '1px solid rgba(74, 144, 226, 0.1)',
            borderRadius: 5,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              color: '#1a1a1a',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Nuestra Misión
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.9,
              fontWeight: 400,
              fontSize: { xs: '1rem', md: '1.15rem' },
              color: '#4a4a4a',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.3px'
            }}
          >
            Desarrollar soluciones tecnológicas innovadoras que optimicen la gestión
            escolar, promoviendo la eficiencia, transparencia y accesibilidad en el
            sistema educativo mediante herramientas digitales intuitivas y seguras.
          </Typography>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default Nosotros;
