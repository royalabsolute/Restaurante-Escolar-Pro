import { useNavigate } from 'react-router-dom';
// react-bootstrap
import { ListGroup } from 'react-bootstrap';
// Material UI
import { IconButton, Tooltip } from '@mui/material';
import { ExitToApp } from '@mui/icons-material';

import { useAuth } from 'hooks/useAuth';

// -----------------------|| NAV RIGHT ||-----------------------//

const NavRight = () => {
  const { isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Si está cargando o no autenticado, no mostrar nada
  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <ListGroup as="ul" bsPrefix=" " className="list-unstyled">
      <ListGroup.Item as="li" bsPrefix=" " className="pc-h-item">
        <Tooltip title="Cerrar Sesión" placement="bottom">
          <IconButton
            onClick={handleLogout}
            sx={{
              color: '#ff4757',
              '&:hover': {
                backgroundColor: 'rgba(255, 71, 87, 0.1)',
                color: '#ff3742'
              },
              transition: 'all 0.2s ease-in-out'
            }}
            size="medium"
          >
            <ExitToApp />
          </IconButton>
        </Tooltip>
      </ListGroup.Item>
    </ListGroup>
  );
};

export default NavRight;
