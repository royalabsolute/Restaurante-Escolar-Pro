// react-bootstrap
import { ListGroup } from 'react-bootstrap';

// third party
import { useContext } from 'react';
import { AuthContext } from 'contexts/AuthContext';

// Material UI
import { IconButton, Badge } from '@mui/material';
import { Message, Search } from '@mui/icons-material';

// -----------------------|| NAV LEFT ||-----------------------//

export default function NavLeft() {
  const { user } = useContext(AuthContext);

  // Solo mostrar elementos para roles específicos
  const canUseMessages = ['estudiante', 'secretaria', 'admin'].includes(user?.rol);
  const canUseSearch = ['admin', 'secretaria', 'alfabetizador'].includes(user?.rol);

  return (
    <ListGroup as="ul" bsPrefix=" " className="list-unstyled">
      {canUseMessages && (
        <li className="pc-h-item">
          <IconButton 
            color="inherit" 
            sx={{ color: '#fff', marginRight: 1 }}
            title="Mensajes"
          >
            <Badge badgeContent={0} color="error">
              <Message />
            </Badge>
          </IconButton>
        </li>
      )}
      
      {canUseSearch && (
        <li className="pc-h-item">
          <IconButton 
            color="inherit" 
            sx={{ color: '#fff' }}
            title="Búsqueda"
          >
            <Search />
          </IconButton>
        </li>
      )}
    </ListGroup>
  );
}
