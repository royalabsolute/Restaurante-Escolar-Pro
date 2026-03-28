// project imports
import NavContent from './NavContent';
import useWindowSize from 'hooks/useWindowSize';
import { useMenuByRole } from 'hooks/useMenuByRole';

// -----------------------|| NAVIGATION ||-----------------------//

export default function Navigation() {
  const windowSize = useWindowSize();

  // Obtener menú dinámico basado en el rol del usuario
  const { menuItems } = useMenuByRole();

  let navClass = ['dark-sidebar', 'pc-sidebar'];

  // Ocultar completamente en móviles (menor a 1200px)
  if (windowSize.width < 1200) {
    return null;
  }

  let navBarClass = ['navbar-wrapper'];

  // Usar menú dinámico basado en el rol del usuario
  let navContent = <NavContent navigation={menuItems.items || []} />;
  let navContentDOM = <div className={navBarClass.join(' ')}>{navContent}</div>;

  return (
    <nav className={navClass.join(' ')}>
      {navContentDOM}
    </nav>
  );
}
