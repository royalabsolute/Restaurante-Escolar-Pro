import { useState } from 'react';
import { Box, Button, IconButton, List, ListItem, ListItemButton, ListItemText, Typography, Collapse } from '@mui/material';
import { Menu as MenuIcon, Home, People, Gavel, Login, MenuBook } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import BrandLogo from 'components/BrandLogo';

const DynamicNavbar = ({ activeSection, onNavigate }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: <Home sx={{ fontSize: 20 }} />, path: '/' },
    { id: 'nosotros', label: 'Nosotros', icon: <People sx={{ fontSize: 20 }} />, path: '/nosotros' },
    { id: 'leyes', label: 'Marco Legal', icon: <Gavel sx={{ fontSize: 20 }} />, path: '/marco-legal' },
    { id: 'manual', label: 'Manual', icon: <MenuBook sx={{ fontSize: 20 }} />, path: '/manual' }
  ];

  const handleNavigation = (item) => {
    if (item.path.startsWith('/') && item.path !== '/') {
      navigate(item.path);
    } else if (item.id === 'inicio') {
      navigate('/');
    } else {
      onNavigate(item.id);
    }
    setMobileOpen(false);
  };

  return (
    <>
      {/* Dynamic Island Navbar */}
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1200,
          width: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 32px)', md: '97%', lg: '94%', xl: '1600px' },
          maxWidth: '1600px',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Box
          sx={{
            bgcolor: 'rgba(26, 26, 26, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: { xs: 3, sm: 4, md: 5 },
            px: { xs: 2.5, sm: 3, md: 4 },
            py: { xs: 1.5, sm: 2 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              transition: 'opacity 0.3s',
              '&:hover': { opacity: 0.8 }
            }}
            onClick={() => handleNavigation({ id: 'inicio', path: '/' })}
          >
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                width: 56,
                height: 56,
                borderRadius: '50%',
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BrandLogo width="100%" height="100%" sx={{ borderRadius: '50%' }} />
            </Box>
            <Box
              sx={{
                display: { xs: 'flex', sm: 'none' },
                width: 28,
                height: 28,
                borderRadius: '50%',
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BrandLogo width="100%" height="100%" sx={{ borderRadius: '50%' }} />
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: '#F5F5DC',
                  lineHeight: 1.2,
                  fontFamily: "'Inter', 'Poppins', sans-serif"
                }}
              >
                Restaurante Escolar
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(245, 245, 220, 0.7)',
                  fontSize: '0.75rem',
                  fontFamily: "'Inter', 'Poppins', sans-serif"
                }}
              >
                Sistema de Gestión
              </Typography>
            </Box>
          </Box>

          {/* Desktop Menu */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, alignItems: 'center' }}>
            {menuItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => handleNavigation(item)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                startIcon={item.icon}
                sx={{
                  color: activeSection === item.id ? '#4A90E2' : '#F5F5DC',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  fontWeight: activeSection === item.id ? 600 : 500,
                  px: 2.5,
                  py: 1,
                  borderRadius: 3,
                  position: 'relative',
                  fontFamily: "'Inter', 'Poppins', sans-serif",
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: 'rgba(74, 144, 226, 0.08)',
                    color: '#4A90E2',
                    transform: 'translateY(-1px)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    bottom: 6,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: activeSection === item.id ? '50%' : '0%',
                    height: 2,
                    bgcolor: '#4A90E2',
                    borderRadius: 1,
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  },
                  '&::after': hoveredItem === item.id && activeSection !== item.id ? {
                    content: '""',
                    position: 'absolute',
                    bottom: 6,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '30%',
                    height: 2,
                    bgcolor: 'rgba(74, 144, 226, 0.3)',
                    borderRadius: 1,
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  } : {}
                }}
              >
                {item.label}
              </Button>
            ))}
            
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              startIcon={<Login />}
              sx={{
                background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                ml: 1.5,
                borderRadius: 3,
                fontFamily: "'Inter', 'Poppins', sans-serif",
                boxShadow: '0 4px 15px rgba(74, 144, 226, 0.35)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: '0 6px 24px rgba(74, 144, 226, 0.5)',
                  transform: 'translateY(-2px)',
                  background: 'linear-gradient(135deg, #357ABD 0%, #2868a8 100%)'
                }
              }}
            >
              Ingresar
            </Button>
          </Box>

          {/* Mobile Menu Button */}
          <IconButton 
            onClick={() => setMobileOpen(!mobileOpen)} 
            sx={{ 
              display: { xs: 'flex', md: 'none' },
              color: '#ffffff',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': { 
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.3s'
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Mobile Menu Collapse - Integrated in Dynamic Island */}
        <Collapse in={mobileOpen} timeout={400} sx={{ display: { xs: 'block', md: 'none' } }}>
          <Box sx={{ 
            pt: 3,
            pb: 2,
            px: 2,
            bgcolor: 'rgba(26, 26, 26, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            mt: 2,
            borderRadius: 4,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
          }}>
            <List sx={{ p: 0 }}>
              {menuItems.map((item) => (
                <ListItem key={item.id} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton 
                    onClick={() => handleNavigation(item)}
                    selected={activeSection === item.id}
                    sx={{
                      borderRadius: 2,
                      color: '#ffffff',
                      transition: 'all 0.3s',
                      '&:hover': { 
                        bgcolor: 'rgba(74, 144, 226, 0.2)',
                        transform: 'translateX(4px)'
                      },
                      '&.Mui-selected': {
                        bgcolor: 'rgba(74, 144, 226, 0.25)',
                        '&:hover': { bgcolor: 'rgba(74, 144, 226, 0.3)' }
                      }
                    }}
                  >
                    <Box sx={{ mr: 2, color: '#4A90E2', display: 'flex' }}>{item.icon}</Box>
                    <ListItemText 
                      primary={item.label} 
                      primaryTypographyProps={{ 
                        fontWeight: activeSection === item.id ? 600 : 500,
                        color: activeSection === item.id ? '#4A90E2' : '#e0e0e0',
                        fontSize: '0.95rem',
                        fontFamily: "'Inter', 'Poppins', sans-serif"
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            
            <Box sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/login')}
                startIcon={<Login />}
                sx={{
                  background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.5,
                  borderRadius: 2.5,
                  fontFamily: "'Inter', 'Poppins', sans-serif",
                  boxShadow: '0 4px 15px rgba(74, 144, 226, 0.4)',
                  '&:hover': { 
                    boxShadow: '0 6px 24px rgba(74, 144, 226, 0.6)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s'
                }}
              >
                Ingresar al Sistema
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Box>
    </>
  );
};

DynamicNavbar.propTypes = {
  scrolled: PropTypes.bool.isRequired,
  activeSection: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired
};

export default DynamicNavbar;
