import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import logoImage from 'assets/images/Logo Restaurante.png';

const BrandLogo = ({ width = 160, height, sx }) => (
  <Box
    component="img"
    src={logoImage}
    alt="Logo Restaurante Escolar"
    sx={{
      width,
      height: height || 'auto',
      display: 'block',
      objectFit: 'contain',
      ...sx
    }}
  />
);

BrandLogo.propTypes = {
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  sx: PropTypes.object
};

export default BrandLogo;
