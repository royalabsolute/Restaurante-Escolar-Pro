import { useState, useEffect, useContext } from 'react';
import { AuthContext } from 'contexts/AuthContext';
import menusByRole from '../config/menusByRole';

// Hook personalizado para obtener el menú según el rol del usuario
export const useMenuByRole = () => {
  const [menuItems, setMenuItems] = useState({ items: [] });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user && user.rol) {
      let role = user.rol;
      let roleMenu = menusByRole[role];

      // Lógica específica para rol de invitado con permisos dinámicos
      if (role === 'invitado') {
        try {
          let config = user.access_config;
          if (typeof config === 'string') config = JSON.parse(config);
          if (!Array.isArray(config)) config = [];

          const guestItems = [];
          const secItems = menusByRole.secretaria.items;

          // Mapeo de permisos a IDs de módulos en el menú de secretaría
          const permissionToModuleId = {
            'dashboard': 'dashboard',
            'estudiantes_gestion': 'gestion',
            'justificaciones': 'justificaciones',
            'asistencia': 'asistencia',
            'reportes': 'reportes',
            'alfabetizadores': 'alfabetizadores'
          };

          config.forEach(perm => {
            const modId = permissionToModuleId[perm];
            if (!modId) return;

            // Encontrar el módulo original
            let module = secItems.find(item => item.id === modId);

            if (module) {
              // Deep clone para no mutar el original
              module = JSON.parse(JSON.stringify(module));

              // Ajustes específicos por módulo
              if (perm === 'dashboard') {
                if (module.children?.[0]) {
                  module.children[0].title = 'Dashboard Invitado';
                  module.children[0].url = '/app/dashboard/guest';
                }
              } else if (perm === 'estudiantes_gestion') {
                // Filtrar solo el sub-módulo de estudiantes
                if (module.children) {
                  module.children = module.children.filter(child => child.id === 'estudiantes');
                }
              }
              guestItems.push(module);
            }
          });

          roleMenu = { items: guestItems };

        } catch (error) {
          console.error('Error generando menú de invitado:', error);
          roleMenu = { items: [] };
        }
      }

      if (roleMenu) {
        setMenuItems(roleMenu);
        console.log(`Menú cargado para rol: ${role}`, roleMenu);
      } else {
        // Menú por defecto si el rol no existe
        console.warn(`Rol no reconocido: ${role}`);
        setMenuItems(menusByRole.estudiante); // Menú más restrictivo por defecto
      }
    } else {
      // Si no hay información del usuario
      console.warn('No hay información del usuario disponible');
      setMenuItems({ items: [] });
    }
  }, [user]);

  return { menuItems, userRole: user?.rol };
};

// Función auxiliar para comparar rutas con soporte para parámetros dinámicos
const matchRoute = (menuUrl, currentRoute) => {
  if (!menuUrl) return false;
  // Si la ruta del menú tiene :id, compara solo el inicio
  if (menuUrl.includes(':id')) {
    const baseMenuUrl = menuUrl.split('/:id')[0];
    return currentRoute.startsWith(baseMenuUrl + '/');
  }
  return menuUrl === currentRoute;
};

// Función auxiliar para verificar si el usuario tiene acceso a una ruta específica
export const hasAccessToRoute = (route, user) => {
  if (!user || !user.rol || !route) return false;

  const userRole = user.rol;

  // Rutas públicas que siempre están permitidas
  const publicRoutes = ['/app/dashboard', '/login', '/register'];

  // Rutas adicionales para secretaria
  const secretaryRoutes = [
    '/app/estudiantes/gestion',
    '/app/estudiantes/pendientes',
    '/app/estudiantes/validados',
    '/app/estudiantes/rechazados',
    '/app/qr-codes',
    '/app/justificaciones/pendientes',
    '/app/justificaciones/aprobadas',
    '/app/justificaciones/rechazadas',
    '/app/alfabetizadores/horas',
    '/app/alfabetizadores/sesiones',
    '/app/reportes/historial-completo',
    '/app/reportes/analisis'
  ];

  if (publicRoutes.includes(route)) {
    return true;
  }

  // El administrador tiene acceso a TODAS las rutas
  if (userRole === 'admin') {
    return true;
  }

  // Si es secretaria, verificar rutas adicionales
  if (userRole === 'secretaria' && secretaryRoutes.includes(route)) {
    return true;
  }

  // Lógica específica para invitados con permisos dinámicos
  if (userRole === 'invitado') {
    try {
      let config = user.access_config;
      if (typeof config === 'string') config = JSON.parse(config);
      if (!Array.isArray(config)) config = [];

      // Mapeo de rutas a permisos
      const routeToPermission = {
        '/app/dashboard/guest': 'dashboard',
        '/app/estudiantes/gestion': 'estudiantes_gestion',
        '/app/justificaciones': 'justificaciones',
        '/app/asistencia': 'asistencia',
        '/app/reportes': 'reportes',
        '/app/alfabetizadores': 'alfabetizadores'
      };

      // Si la ruta comienza con el prefijo de un módulo permitido
      for (const [routeBase, permission] of Object.entries(routeToPermission)) {
        if (route.startsWith(routeBase) && config.includes(permission)) {
          return true;
        }
      }

      // El dashboard de invitado siempre debe estar permitido si el usuario está logueado como invitado
      if (route === '/app/dashboard/guest' || route === '/app/dashboard') return true;

      return false; // Si no hay coincidencia positiva, denegar
    } catch (e) {
      console.error('Error validando acceso de invitado:', e);
      return false;
    }
  }

  const roleMenu = menusByRole[userRole];
  if (!roleMenu) return false;

  // Función recursiva para buscar la ruta en el menú
  const findRoute = (items) => {
    for (const item of items) {
      if (matchRoute(item.url, route)) return true;
      if (item.children && findRoute(item.children)) return true;
    }
    return false;
  };

  return findRoute(roleMenu.items);
};

// Función para obtener rutas permitidas según el rol
export const getAllowedRoutes = (userRole) => {
  if (!userRole) return [];

  const roleMenu = menusByRole[userRole];
  if (!roleMenu) return [];

  const routes = [];

  // Función recursiva para extraer todas las rutas
  const extractRoutes = (items) => {
    for (const item of items) {
      if (item.url) {
        routes.push(item.url);
      }
      if (item.children) {
        extractRoutes(item.children);
      }
    }
  };

  extractRoutes(roleMenu.items);
  return routes;
};

export default useMenuByRole;
