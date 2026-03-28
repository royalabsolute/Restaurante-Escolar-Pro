const commonManagementItems = [
  {
    id: 'navigation',
    title: 'Panel Gestión',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'item',
        icon: 'material-icons-two-tone',
        iconname: 'dashboard',
        url: '' // Se sobreescribirá según el rol
      }
    ]
  },
  {
    id: 'gestion',
    title: 'GESTIÓN',
    subtitle: 'Administración del Sistema',
    type: 'group',
    icon: 'icon-ui',
    children: [
      {
        id: 'estudiantes',
        title: 'Gestión de Estudiantes',
        type: 'item',
        icon: 'material-icons-two-tone',
        iconname: 'school',
        url: '/app/estudiantes/gestion'
      },
      {
        id: 'qr-codes',
        title: 'Códigos QR',
        type: 'item',
        icon: 'material-icons-two-tone',
        iconname: 'qr_code',
        url: '/app/qr-codes'
      },
      {
        id: 'justificaciones',
        title: 'Gestión de Justificaciones',
        type: 'item',
        icon: 'material-icons-two-tone',
        iconname: 'assignment',
        url: '/app/justificaciones'
      },
      {
        id: 'qr-suplente',
        title: 'QR Suplente',
        type: 'item',
        icon: 'material-icons-two-tone',
        iconname: 'confirmation_number',
        url: '/app/qr-suplente'
      },
      {
        id: 'grupos-academicos-sec',
        title: 'Grupos Académicos',
        type: 'item',
        icon: 'material-icons-two-tone',
        iconname: 'class',
        url: '/app/admin/grupos'
      },
      {
        id: 'registro-estudiante-sec',
        title: 'Registro de Estudiante',
        type: 'item',
        icon: 'material-icons-two-tone',
        iconname: 'person_add_alt',
        url: '/app/registro-estudiante'
      },
      {
        id: 'asistencia',
        title: 'Control de Asistencia',
        type: 'item',
        icon: 'material-icons-two-tone',
        iconname: 'qr_code_scanner',
        url: '/app/asistencia/scanner'
      }
    ]
  },
  {
    id: 'reportes',
    title: 'REPORTES Y ANÁLISIS',
    subtitle: 'Análisis Completo Del Sistema',
    type: 'group',
    icon: 'icon-pages',
    children: [
      {
        id: 'reportes-estadisticas',
        title: 'Estadísticas e Informes',
        type: 'item',
        icon: 'material-icons-two-tone',
        iconname: 'analytics',
        url: '/app/reportes/estadisticas'
      },
      {
        id: 'reportes-estudiantes',
        title: 'Estudiantes por Grupos',
        type: 'item',
        icon: 'material-icons-two-tone',
        iconname: 'group',
        url: '/app/reportes/estudiantes'
      }
    ]
  },
  {
    id: 'documentacion-sec',
    title: 'DOCUMENTACIÓN',
    subtitle: 'Formatos y Formularios',
    type: 'group',
    icon: 'icon-pages',
    children: [
      {
        id: 'formatos-manuales',
        title: 'Formatos Manuales',
        type: 'item',
        icon: 'material-icons-two-tone',
        iconname: 'description',
        url: '/app/documentacion'
      }
    ]
  }
];

const menusByRole = {
  estudiante: {
    items: [
      {
        id: 'navigation',
        title: 'Mi Panel',
        type: 'group',
        icon: 'icon-navigation',
        children: [
          {
            id: 'dashboard',
            title: 'Mi Dashboard',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'dashboard',
            url: '/app/dashboard/estudiante'
          },
          {
            id: 'mi-perfil',
            title: 'Mi Perfil',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'person',
            url: '/app/mi-perfil'
          },
          {
            id: 'mis-asistencias',
            title: 'Mis Asistencias',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'event_available',
            url: '/app/mis-asistencias'
          },
          {
            id: 'generar-qr',
            title: 'Mi Código QR',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'qr_code',
            url: '/app/generar-qr'
          },
          {
            id: 'mis-justificaciones',
            title: 'Mis Justificaciones',
            type: 'collapse',
            icon: 'material-icons-two-tone',
            iconname: 'assignment',
            children: [
              {
                id: 'crear-justificacion',
                title: 'Crear Justificación',
                type: 'item',
                url: '/app/justificaciones/crear'
              },
              {
                id: 'mis-justificaciones-lista',
                title: 'Ver Mis Justificaciones',
                type: 'item',
                url: '/app/justificaciones/mis-justificaciones'
              }
            ]
          }
        ]
      }
    ]
  },

  escaner: {
    items: [
      {
        id: 'navigation',
        title: 'Escáner',
        type: 'group',
        icon: 'icon-navigation',
        children: [
          {
            id: 'dashboard',
            title: 'Inicio',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'home',
            url: '/app/dashboard/escaner'
          },
          {
            id: 'scanner',
            title: 'Escanear QR',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'qr_code_scanner',
            url: '/app/asistencia/scanner'
          }
        ]
      }
    ]
  },

  alfabetizador: {
    items: [
      {
        id: 'navigation',
        title: 'Servicio Alfabetizador',
        type: 'group',
        icon: 'icon-navigation',
        children: [
          {
            id: 'scanner-mobile',
            title: 'Escaneo Móvil',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'qr_code_scanner',
            url: '/app/alfabetizador/escaneo'
          }
        ]
      }
    ]
  },

  docente: {
    items: [
      {
        id: 'navigation',
        title: 'Panel Docente',
        type: 'group',
        icon: 'icon-navigation',
        children: [
          {
            id: 'dashboard',
            title: 'Dashboard',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'dashboard',
            url: '/app/dashboard/docente'
          },
          {
            id: 'scanner',
            title: 'Escanear Asistencia',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'qr_code_scanner',
            url: '/app/asistencia/scanner'
          },
          {
            id: 'mi-grupo',
            title: 'Mi Grupo',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'groups',
            url: '/app/docente/mi-grupo'
          },
          {
            id: 'perfil-docente',
            title: 'Mi Perfil',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'manage_accounts',
            url: '/app/docente/perfil'
          }
        ]
      }
    ]
  },

  secretaria: {
    items: commonManagementItems.map(group => {
      if (group.id === 'navigation') {
        const newGroup = JSON.parse(JSON.stringify(group));
        newGroup.children[0].url = '/app/dashboard/secretaria';
        return newGroup;
      }
      return group;
    })
  },

  coordinador_convivencia: {
    items: commonManagementItems.map(group => {
      if (group.id === 'navigation') {
        const newGroup = JSON.parse(JSON.stringify(group));
        newGroup.title = 'PANEL COORDINADOR';
        newGroup.children[0].url = '/app/dashboard/coordinador';
        return newGroup;
      }
      return group;
    })
  },

  admin: {
    items: [
      {
        id: 'navigation',
        title: 'Panel Administrador',
        type: 'group',
        icon: 'icon-navigation',
        children: [
          {
            id: 'dashboard',
            title: 'Dashboard',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'dashboard',
            url: '/app/dashboard/admin'
          }
        ]
      },
      {
        id: 'gestion',
        title: 'GESTIÓN COMPLETA',
        subtitle: 'Administración Total del Sistema',
        type: 'group',
        icon: 'icon-ui',
        children: [
          {
            id: 'estudiantes-completo',
            title: 'Gestión de Estudiantes',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'school',
            url: '/app/estudiantes/gestion'
          },
          {
            id: 'qr-codes',
            title: 'Gestión de QR',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'qr_code',
            url: '/app/qr-codes'
          },
          {
            id: 'justificaciones',
            title: 'Todas las Justificaciones',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'assignment',
            url: '/app/justificaciones'
          },
          {
            id: 'asistencia-admin',
            title: 'Control de Asistencia',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'qr_code_scanner',
            url: '/app/asistencia/scanner'
          },
          {
            id: 'grupos-admin',
            title: 'Grupos Académicos',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'class',
            url: '/app/admin/grupos'
          },
          {
            id: 'qr-suplente-admin',
            title: 'QR Suplente',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'confirmation_number',
            url: '/app/qr-suplente'
          }
        ]
      },
      {
        id: 'reportes',
        title: 'REPORTES Y ANÁLISIS',
        subtitle: 'Análisis Completo del Sistema',
        type: 'group',
        icon: 'icon-pages',
        children: [
          {
            id: 'reportes-estadisticas',
            title: 'Estadísticas e Informes',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'analytics',
            url: '/app/reportes/estadisticas'
          },
          {
            id: 'reportes-estudiantes',
            title: 'Estudiantes por Grupos',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'group',
            url: '/app/reportes/estudiantes'
          }
        ]
      },
      {
        id: 'admin-tools',
        title: 'HERRAMIENTAS ADMIN',
        subtitle: 'Configuración y Mantenimiento',
        type: 'group',
        icon: 'icon-other',
        children: [
          {
            id: 'admin-config',
            title: 'Configuración del Sistema',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'settings',
            url: '/app/configuracion'
          },
          {
            id: 'admin-backup',
            title: 'Respaldo de Datos',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'backup',
            url: '/app/respaldos'
          }
        ]
      },
      {
        id: 'documentacion-admin',
        title: 'DOCUMENTACIÓN',
        subtitle: 'Formatos y Formularios',
        type: 'group',
        icon: 'icon-pages',
        children: [
          {
            id: 'formatos-manuales',
            title: 'Formatos Manuales',
            type: 'item',
            icon: 'material-icons-two-tone',
            iconname: 'description',
            url: '/app/documentacion'
          }
        ]
      }
    ]
  }
};

export default menusByRole;
