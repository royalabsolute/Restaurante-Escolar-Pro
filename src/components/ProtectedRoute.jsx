import { Navigate, useLocation } from 'react-router-dom';
import { hasAccessToRoute } from 'hooks/useMenuByRole';
import { useAuth } from 'hooks/useAuth';
import Loader from '../components/Loader/Loader';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const location = useLocation();
  const { user, loading, initialized } = useAuth();

  // Mostrar loader mientras se verifica la autenticación O mientras no se haya inicializado
  if (loading || !initialized) {
    return <Loader />;
  }

  // Si no hay usuario autenticado DESPUÉS de inicializar, redirigir al login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si el usuario tiene acceso a la ruta actual
  const currentPath = location.pathname;
  const userRole = user.rol;

  // Rutas públicas o de redirección básica que siempre están permitidas
  const publicRoutes = ['/app/dashboard', '/app/dashboard/guest', '/login', '/register', '/'];

  if (publicRoutes.includes(currentPath)) {
    return children;
  }

  // Si se especifica un rol requerido, verificarlo
  if (requiredRole) {
    let hasRequiredRole = false;

    if (Array.isArray(requiredRole)) {
      // Si requiredRole es un array, verificar si el usuario tiene alguno de esos roles
      hasRequiredRole = requiredRole.includes(userRole);
    } else {
      // Si requiredRole es un string, verificar coincidencia exacta
      hasRequiredRole = userRole === requiredRole;
    }

    if (!hasRequiredRole) {
      console.warn(`Usuario con rol '${userRole}' no tiene acceso a ruta que requiere '${Array.isArray(requiredRole) ? requiredRole.join(',') : requiredRole}'`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Verificar acceso específico según el rol y el menú
  // El administrador tiene acceso a TODAS las rutas
  if (userRole === 'admin') {
    console.log(`Administrador accediendo a: ${currentPath}`);
    return children;
  }

  if (!hasAccessToRoute(currentPath, user)) {
    // Redirigir al dashboard si no tiene acceso
    console.warn(`Usuario con rol '${userRole}' no tiene acceso a '${currentPath}'`);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
