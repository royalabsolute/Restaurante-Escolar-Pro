import { useMemo } from 'react';
import { useAuth } from './useAuth';

const useRoleBasedApi = () => {
  const { user } = useAuth();

  const isAdmin = user?.rol === 'admin';
  const isSecretary = user?.rol === 'secretaria';
  const isCoordinador = user?.rol === 'coordinador_convivencia';
  const isInvitado = user?.rol === 'invitado';

  const endpoints = useMemo(() => {
    if (isAdmin) {
      return {
        // Admin tiene acceso completo
        students: {
          pending: '/admin/students?estado=pendiente',
          validated: '/admin/students?estado=validado',
          rejected: '/admin/students?estado=rechazado',
          suspended: '/admin/students?estado=suspendido',
          validate: (id) => `/admin/students/${id}/validate`,
          reject: (id) => `/admin/students/${id}/reject`,
          delete: (id) => `/admin/students/${id}`,
          update: (id) => `/admin/students/${id}`,
          resetPassword: (id) => `/admin/students/${id}/reset-password`,
          create: '/admin/usuarios/crear-completo'
        },
        justifications: {
          pending: '/admin/justifications?estado=pendiente',
          approved: '/admin/justifications?estado=aprobada',
          rejected: '/admin/justifications?estado=rechazada',
          review: (id) => `/admin/justifications/${id}/review`,
          delete: (id) => `/admin/justifications/${id}`
        },
        users: {
          list: '/admin/users',
          create: '/admin/users',
          update: (id) => `/admin/users/${id}`,
          delete: (id) => `/admin/users/${id}`,
          resetPassword: (id) => `/admin/users/${id}/reset-password`
        },
      };
    } else if (isSecretary || isCoordinador || isInvitado) {
      // Secretaría, Coordinador e Invitados comparten endpoints base de gestión
      // El backend se encarga de filtrar por permisos dinámicos (access_config)
      return {
        // Secretaría/Coordinador tiene permisos limitados (NO DELETE)
        students: {
          pending: '/secretary/students/pending',
          validated: '/secretary/students/validated',
          rejected: '/secretary/students/rejected',
          suspended: '/secretary/students/suspended',
          validate: (id) => `/secretary/students/${id}/validate`,
          reject: (id) => `/secretary/students/${id}/validate`,
          update: (id) => `/secretary/students/${id}`,
          resetPassword: (id) => `/secretary/students/${id}/reset-password`,
          suspend: (id) => `/secretary/students/${id}/suspend`,
          message: (id) => `/secretary/students/${id}/message`,
          notifyParent: (id) => `/secretary/students/${id}/notify-parent`,
          create: '/secretary/students'
        },
        justifications: {
          pending: '/secretary/justifications/pending',
          approved: '/secretary/justifications/approved',
          rejected: '/secretary/justifications/rejected',
          review: (id) => `/secretary/justifications/${id}/review`
        },
        qr: {
          students: '/secretary/qr/students',
          generate: (id) => `/secretary/qr/generate/${id}`
        }
      };
    }

    // Rol por defecto (estudiante, docente, etc.)
    return {
      students: {},
      justifications: {},
      users: {}
    };
  }, [isAdmin, isSecretary, isCoordinador, isInvitado]);

  const permissions = useMemo(() => ({
    canDelete: isAdmin,
    canCreate: isAdmin || isSecretary || isCoordinador,
    canUpdate: isAdmin || isSecretary || isCoordinador || isInvitado,
    canValidate: isAdmin || isSecretary || isCoordinador || isInvitado,
    isAdmin,
    isSecretary,
    isCoordinador,
    isInvitado
  }), [isAdmin, isSecretary, isCoordinador, isInvitado]);

  return {
    endpoints,
    permissions
  };
};

export default useRoleBasedApi;