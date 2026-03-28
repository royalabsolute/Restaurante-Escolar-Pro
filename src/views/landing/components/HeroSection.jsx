import { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, IconButton } from '@mui/material';
import { ArrowForward, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import getImageUrl from '../../../utils/getImageUrl';

const HeroSection = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const carouselSlides = [
    {
      image: getImageUrl('1.jpg', 'restaurante'),
      title: 'Tecnología al Servicio de la Educación',
      subtitle: 'Sistema moderno de gestión para el restaurante escolar'
    },
    {
      image: getImageUrl('2.jpg', 'restaurante'),
      title: 'Control Total de Asistencia',
      subtitle: 'Gestión eficiente de información escolar'
    },
    {
      image: getImageUrl('3.jpg', 'restaurante'),
      title: 'Transparencia Garantizada',
      subtitle: 'Sistema confiable y verificable para todos'
    },
    {
      image: getImageUrl('4.jpg', 'restaurante'),
      title: 'Registro Rápido con QR',
      subtitle: 'Asistencia mediante código QR único'
    },
    {
      image: getImageUrl('5.jpg', 'restaurante'),
      title: 'Eficiencia y Transparencia',
      subtitle: 'Promovemos la eficiencia en cada proceso'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [carouselSlides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);

  return (
    <Box
      id="inicio"
      sx={{
        minHeight: '100vh',
        pt: { xs: 12, md: 16 },
        pb: { xs: 4, md: 6 },
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)'
      }}
    >
      <Container maxWidth="xl">
        {/* Title and Description - Centered at Top */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="overline"
            sx={{
              color: '#4A90E2',
              fontSize: '1rem',
              fontWeight: 600,
              letterSpacing: 2,
              mb: 2,
              display: 'block',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            SISTEMA DE GESTIÓN EDUCATIVA
          </Typography>
          
          <Typography
            variant="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2.5rem', md: '4rem' },
              lineHeight: 1.2,
              mb: 3,
              background: 'linear-gradient(135deg, #1a1a1a 0%, #4A90E2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Restaurante Escolar{' '}
            <Box component="span" sx={{ color: '#5EC48E' }}>
              
            </Box>
          </Typography>

          <Typography
            variant="h5"
            sx={{
              color: '#666',
              mb: 3,
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              maxWidth: '900px',
              mx: 'auto',
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Optimizamos el registro y control de asistencia mediante
            tecnología QR, facilitando la gestión entre secretaría,
            estudiantes y alfabetizadores.
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#4A90E2',
              fontSize: '1.1rem',
              fontWeight: 600,
              mb: 4,
              fontFamily: "'Inter', 'Poppins', sans-serif"
            }}
          >
            Promovemos eficiencia y transparencia en cada proceso.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 6 }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/login')}
              sx={{
                bgcolor: '#4A90E2',
                color: '#ffffff',
                px: 5,
                py: 1.8,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 3,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(74, 144, 226, 0.4)',
                fontFamily: "'Inter', 'Poppins', sans-serif",
                '&:hover': {
                  bgcolor: '#357ABD',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(74, 144, 226, 0.5)'
                },
                transition: 'all 0.3s'
              }}
            >
              Comenzar Ahora
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/manual')}
              sx={{
                borderColor: '#4A90E2',
                color: '#4A90E2',
                px: 5,
                py: 1.8,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 3,
                borderWidth: 2,
                textTransform: 'none',
                fontFamily: "'Inter', 'Poppins', sans-serif",
                '&:hover': {
                  borderColor: '#357ABD',
                  bgcolor: 'rgba(74, 144, 226, 0.05)',
                  borderWidth: 2
                }
              }}
            >
              Ver Manual
            </Button>

            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/taller-creativo')}
              sx={{
                bgcolor: '#5EC48E',
                color: '#0F3B2E',
                px: 5,
                py: 1.8,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 3,
                textTransform: 'none',
                fontFamily: "'Inter', 'Poppins', sans-serif",
                boxShadow: '0 4px 14px rgba(94, 196, 142, 0.45)',
                '&:hover': {
                  bgcolor: '#4AA976',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 18px rgba(74, 169, 118, 0.35)'
                }
              }}
            >
              Entrena tu talento
            </Button>
          </Box>
        </Box>

        {/* Large Horizontal Carousel */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: { xs: '450px', sm: '550px', md: '650px', lg: '750px' },
            borderRadius: 5,
            overflow: 'hidden',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.25)'
          }}
        >
          {/* Carousel Images */}
          {carouselSlides.map((slide, index) => (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                top: 2,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: currentSlide === index ? 1 : 0,
                transition: 'opacity 1.5s ease-in-out',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 100%)',
                  zIndex: 1
                }
              }}
            >
              <Box
                component="img"
                src={slide.image}
                alt={slide.title}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
              />
              
              {/* Slide Text Overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: { xs: 3, md: 5 },
                  zIndex: 2,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)'
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    color: '#ffffff',
                    fontWeight: 700,
                    mb: 1.5,
                    fontSize: { xs: '1.8rem', md: '2.5rem', lg: '3rem' },
                    fontFamily: "'Inter', 'Poppins', sans-serif"
                  }}
                >
                  {slide.title}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontSize: { xs: '1rem', md: '1.2rem', lg: '1.4rem' },
                    fontWeight: 400,
                    fontFamily: "'Inter', 'Poppins', sans-serif"
                  }}
                >
                  {slide.subtitle}
                </Typography>
              </Box>
            </Box>
          ))}

          {/* Navigation Arrows */}
          <IconButton
            onClick={prevSlide}
            sx={{
              position: 'absolute',
              left: { xs: 15, md: 30 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              width: { xs: 45, md: 60 },
              height: { xs: 45, md: 60 },
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              '&:hover': {
                bgcolor: '#ffffff',
                transform: 'translateY(-50%) scale(1.1)'
              },
              transition: 'all 0.3s'
            }}
          >
            <ChevronLeft sx={{ fontSize: { xs: 28, md: 36 } }} />
          </IconButton>

          <IconButton
            onClick={nextSlide}
            sx={{
              position: 'absolute',
              right: { xs: 15, md: 30 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              width: { xs: 45, md: 60 },
              height: { xs: 45, md: 60 },
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              '&:hover': {
                bgcolor: '#ffffff',
                transform: 'translateY(-50%) scale(1.1)'
              },
              transition: 'all 0.3s'
            }}
          >
            <ChevronRight sx={{ fontSize: { xs: 28, md: 36 } }} />
          </IconButton>

          {/* Slide Indicators */}
          <Box
            sx={{
              position: 'absolute',
              bottom: { xs: 20, md: 30 },
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1.5,
              zIndex: 3,
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 5,
              p: 1.5
            }}
          >
            {carouselSlides.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentSlide(index)}
                sx={{
                  width: currentSlide === index ? 40 : 12,
                  height: 12,
                  borderRadius: 6,
                  bgcolor: currentSlide === index ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: currentSlide === index ? '#ffffff' : 'rgba(255, 255, 255, 0.8)'
                  }
                }}
              />
            ))}
          </Box>
        </Box>

      </Container>
    </Box>
  );
};

export default HeroSection;
