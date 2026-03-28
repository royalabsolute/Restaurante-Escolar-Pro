import { Box, Container, Typography, Accordion, AccordionSummary, AccordionDetails, Chip } from '@mui/material';
import { ExpandMore, Gavel, Description, Policy } from '@mui/icons-material';
import { useState } from 'react';
import DynamicNavbar from './components/DynamicNavbar';
import Footer from './components/Footer';

const MarcoLegal = () => {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const legalFramework = [
    {
      title: 'Ley 1355 de 2009',
      subtitle: 'Obesidad y enfermedades crónicas no transmisibles',
      icon: <Policy />,
      content: 'Define la obesidad y las enfermedades crónicas no transmisibles como una prioridad de salud pública, estableciendo medidas para promover ambientes sanos en instituciones educativas mediante la alimentación balanceada.',
      year: '2009',
      type: 'Ley Nacional'
    },
    {
      title: 'Ley 1098 de 2006',
      subtitle: 'Código de la Infancia y la Adolescencia',
      icon: <Description />,
      content: 'Garantiza el derecho fundamental a la alimentación equilibrada de niños, niñas y adolescentes, estableciendo la corresponsabilidad del Estado, la familia y la sociedad en su protección.',
      year: '2006',
      type: 'Ley Nacional'
    },
    {
      title: 'Ley 1176 de 2007',
      subtitle: 'Sistema General de Participaciones',
      icon: <Gavel />,
      content: 'Regula los recursos destinados por el Estado para programas de alimentación escolar, asegurando su correcta distribución y uso en las instituciones educativas del país.',
      year: '2007',
      type: 'Ley Nacional'
    },
    {
      title: 'Ley 1581 de 2012',
      subtitle: 'Protección de Datos Personales',
      icon: <Policy />,
      content: 'Regula el tratamiento de datos personales registrados en bases de datos, aplicable a la información de estudiantes y usuarios del sistema de gestión del restaurante escolar.',
      year: '2012',
      type: 'Ley Nacional'
    },
    {
      title: 'Ley 715 de 2001',
      subtitle: 'Recursos y Competencias',
      icon: <Description />,
      content: 'Establece normas sobre recursos y competencias para la prestación de servicios de educación y salud, incluyendo los programas de alimentación escolar.',
      year: '2001',
      type: 'Ley Nacional'
    },
    {
      title: 'Decreto 1075 de 2015',
      subtitle: 'Sector Educación',
      icon: <Gavel />,
      content: 'Decreto Único Reglamentario del Sector Educación que compila las normas reglamentarias vigentes, incluyendo disposiciones sobre programas de alimentación y bienestar estudiantil.',
      year: '2015',
      type: 'Decreto'
    }
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#ffffff'
      }}
    >
      <DynamicNavbar activeSection="leyes" />
      
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
            LEGISLACIÓN COLOMBIANA
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
            Marco Legal
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
            Normativa colombiana vigente que fundamenta y regula los programas de
            alimentación escolar y protección de datos personales.
          </Typography>
        </Box>

        {/* Legal Framework Accordions */}
        <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
          {legalFramework.map((law, index) => (
            <Accordion
              key={index}
              expanded={expanded === `panel${index}`}
              onChange={handleChange(`panel${index}`)}
              sx={{
                mb: 2,
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: expanded === `panel${index}` 
                  ? '0 8px 32px rgba(74, 144, 226, 0.2)' 
                  : '0 2px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.3s',
                '&:before': {
                  display: 'none'
                },
                '&:hover': {
                  boxShadow: '0 6px 24px rgba(0,0,0,0.12)'
                }
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: '#4A90E2' }} />}
                sx={{
                  bgcolor: expanded === `panel${index}` ? '#f8f9fa' : '#ffffff',
                  transition: 'background-color 0.3s',
                  '& .MuiAccordionSummary-content': {
                    my: 2,
                    alignItems: 'center'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #4A90E2 0%, #5EC48E 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      '& svg': {
                        color: '#ffffff',
                        fontSize: 24
                      }
                    }}
                  >
                    {law.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: '#1a1a1a',
                          fontSize: '1.1rem'
                        }}
                      >
                        {law.title}
                      </Typography>
                      <Chip
                        label={law.year}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(74, 144, 226, 0.1)',
                          color: '#4A90E2',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666',
                        fontSize: '0.9rem'
                      }}
                    >
                      {law.subtitle}
                    </Typography>
                  </Box>
                  <Chip
                    label={law.type}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(94, 196, 142, 0.1)',
                      color: '#5EC48E',
                      fontWeight: 600,
                      display: { xs: 'none', sm: 'flex' }
                    }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  bgcolor: '#f8f9fa',
                  borderTop: '1px solid rgba(0,0,0,0.08)',
                  p: 3
                }}
              >
                <Typography
                  sx={{
                    color: '#444',
                    lineHeight: 1.8,
                    fontSize: '0.95rem'
                  }}
                >
                  {law.content}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* Info Box */}
        <Box
          sx={{
            mt: 8,
            p: { xs: 4, md: 5 },
            background: '#f8fafc',
            border: '1px solid rgba(74, 144, 226, 0.1)',
            borderRadius: 5,
            textAlign: 'center',
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
            Cumplimiento Normativo
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.9,
              fontWeight: 400,
              fontSize: { xs: '1rem', md: '1.05rem' },
              color: '#4a4a4a',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.3px'
            }}
          >
            Nuestro sistema de gestión cumple con toda la legislación colombiana vigente,
            garantizando transparencia, seguridad de datos y alineación con los objetivos
            de salud pública y educación del país.
          </Typography>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default MarcoLegal;
