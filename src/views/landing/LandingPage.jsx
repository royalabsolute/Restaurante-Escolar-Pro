import { Box } from '@mui/material';
import DynamicNavbar from './components/DynamicNavbar';
import HeroSection from './components/HeroSection';
import Footer from './components/Footer';

const LandingPage = () => {
  return (
    <Box sx={{ 
      bgcolor: '#ffffff', 
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <DynamicNavbar 
        activeSection="inicio"
      />
      
  <HeroSection />
      <Footer />
    </Box>
  );
};

export default LandingPage;
