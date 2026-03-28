// Menu configuration for Restaurante Escolar
const menuItems = {
  items: [
    {
      id: 'navigation',
      title: 'Navegación',
      type: 'group',
      icon: 'icon-navigation',
      children: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'dashboard',
          url: '/dashboard'
        },
        {
          id: 'asistencia',
          title: 'Control de Asistencia',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'qr_code_scanner',
          url: '/asistencia/scanner'
        }
      ]
    },
    {
      id: 'gestion',
      title: 'GESTIÓN DE USUARIOS',
      subtitle: 'Administración de Cuentas',
      type: 'group',
      icon: 'icon-ui',
      children: [
        {
          id: 'estudiantes-gestion',
          title: 'Gestión de Usuarios',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'people',
          url: '/estudiantes/gestion'
        },
        {
          id: 'alfabetizadores',
          title: 'Alfabetizadores',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'engineering',
          url: '/alfabetizadores'
        },
        {
          id: 'justificaciones',
          title: 'Justificaciones',
          type: 'collapse',
          icon: 'material-icons-two-tone',
          iconname: 'assignment',
          children: [
            {
              id: 'justificaciones-todas',
              title: 'Gestionar Todas',
              type: 'item',
              url: '/justificaciones'
            },
            {
              id: 'justificaciones-mis',
              title: 'Mis Justificaciones',
              type: 'item',
              url: '/justificaciones/mis-justificaciones'
            }
          ]
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
          id: 'estadisticas',
          title: 'Estadísticas e Informes',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'analytics',
          url: '/reportes/estadisticas'
        },
        {
          id: 'estudiantes-grupos',
          title: 'Estudiantes por Grupos',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'groups',
          url: '/reportes/estudiantes'
        }
      ]
    },
    {
      id: 'sistema',
      title: 'SISTEMA Y SEGURIDAD',
      subtitle: 'Mantenimiento y Control',
      type: 'group',
      icon: 'icon-settings',
      children: [
        {
          id: 'audit-log',
          title: 'Logs de Auditoría',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'history_edu',
          url: '/audit-log'
        },
        {
          id: 'configuracion',
          title: 'Configuración',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'settings',
          url: '/configuracion'
        },
        {
          id: 'respaldos',
          title: 'Respaldos y BD',
          type: 'item',
          icon: 'material-icons-two-tone',
          iconname: 'storage',
          url: '/respaldos'
        }
      ]
    }
  ]
};

export default menuItems;
