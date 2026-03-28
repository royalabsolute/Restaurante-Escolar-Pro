import { lazy } from 'react';

import AdminLayout from 'layouts/AdminLayout';
import ProtectedRoute from 'components/ProtectedRoute';

// Dashboard
const AdminDashboard = lazy(() => import('../views/dashboard/AdminDashboard'));
const SecretariaDashboard = lazy(() => import('../views/dashboard/SecretariaDashboard'));
const CoordinadorDashboard = lazy(() => import('../views/dashboard/CoordinadorDashboard'));
const EscanerDashboard = lazy(() => import('../views/dashboard/EscanerDashboard'));
const DocenteDashboard = lazy(() => import('../views/dashboard/DocenteDashboard'));
const EstudianteDashboard = lazy(() => import('../views/dashboard/EstudianteDashboard'));
const GuestDashboard = lazy(() => import('../views/dashboard/GuestDashboard'));
const DashboardRedirect = lazy(() => import('../views/dashboard/DashboardRedirect'));

// Asistencia pages
const AsistenciaScanner = lazy(() => import('../views/asistencia/Scanner'));
const HistorialAsistencia = lazy(() => import('../views/asistencia/HistorialAsistencia'));

// Estudiantes pages
const EstudiantesList = lazy(() => import('../views/estudiantes/EstudiantesList'));
const EstudiantesForm = lazy(() => import('../views/estudiantes/EstudiantesForm'));
const GestionUnificada = lazy(() => import('../views/estudiantes/GestionUnificada'));
const CodigosQR = lazy(() => import('../views/qr/CodigosQR'));

// Páginas específicas para estudiantes
const MiPerfil = lazy(() => import('../views/estudiante/MiPerfil'));
const MisAsistencias = lazy(() => import('../views/estudiante/MisAsistencias'));
const GenerarQR = lazy(() => import('../views/estudiante/GenerarQR'));

// QR pages
const GestionQR = lazy(() => import('../views/qr/GestionQR'));
const TestQRManager = lazy(() => import('../views/qr/TestQRManager'));

// Justificaciones pages
const GestionUnificadaJustificaciones = lazy(() => import('../views/justificaciones/GestionUnificadaJustificaciones'));
const CrearJustificacion = lazy(() => import('../views/justificaciones/CrearJustificacion'));
const MisJustificaciones = lazy(() => import('../views/justificaciones/MisJustificaciones'));

// Reportes pages
const EstadisticasInformes = lazy(() => import('../views/reportes/EstadisticasInformes'));
const EstudiantesGrupos = lazy(() => import('../views/reportes/EstudiantesGrupos'));

// Admin: Gestión de Grupos Académicos
const GestionGrupos = lazy(() => import('../views/admin/GestionGrupos'));
const GestionQRSuplente = lazy(() => import('../views/admin/GestionQRSuplente'));

// Alfabetizador Mobile View
const ScannerMobile = lazy(() => import('../views/alfabetizador/ScannerMobile'));

// Docente: Panel propio
const MiGrupo = lazy(() => import('../views/docente/MiGrupo'));
const PerfilDocente = lazy(() => import('../views/docente/PerfilDocente'));

// Configuración y Sistema
const Configuracion = lazy(() => import('../views/configuracion/ConfiguracionNueva'));
const Respaldos = lazy(() => import('../views/respaldos/RespaldosNuevo'));
const LogsAuditoria = lazy(() => import('../views/audit/LogsAuditoria'));

// Documentación
const Documentacion = lazy(() => import('../views/documentacion/Documentacion'));
const RegistroEstudiante = lazy(() => import('../views/estudiantes/RegistroEstudiante'));

const MainRoutes = {
  path: '/app',
  element: (
    <ProtectedRoute>
      <AdminLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      index: true,
      element: <DashboardRedirect />
    },
    {
      path: 'dashboard',
      element: <DashboardRedirect />
    },
    {
      path: 'dashboard/admin',
      element: <AdminDashboard />
    },
    {
      path: 'dashboard/secretaria',
      element: <SecretariaDashboard />
    },
    {
      path: 'dashboard/coordinador',
      element: <CoordinadorDashboard />
    },
    {
      path: 'dashboard/escaner',
      element: <ProtectedRoute allowedRoles={['escaner', 'admin', 'secretaria']}><EscanerDashboard /></ProtectedRoute>
    },
    {
      path: 'dashboard/docente',
      element: <ProtectedRoute allowedRoles={['docente']}><DocenteDashboard /></ProtectedRoute>
    },
    {
      path: 'dashboard/estudiante',
      element: <ProtectedRoute allowedRoles={['estudiante']}><EstudianteDashboard /></ProtectedRoute>
    },
    {
      path: 'dashboard/guest',
      element: <GuestDashboard />
    },
    // Asistencia (scanner) - accesible por docentes, admin, secretaria, escaner
    {
      path: 'asistencia/scanner',
      element: <ProtectedRoute allowedRoles={['admin', 'secretaria', 'escaner', 'docente', 'alfabetizador']}><AsistenciaScanner /></ProtectedRoute>
    },
    // Admin: Gestión de Grupos Académicos
    {
      path: 'admin/grupos',
      element: <GestionGrupos />
    },
    // Registro de Estudiante (Secretaría / Coordinador / Admin)
    {
      path: 'registro-estudiante',
      element: <RegistroEstudiante />
    },
    // Docente: Panel específico (Protegido por rol)
    {
      path: 'docente/mi-grupo',
      element: <ProtectedRoute allowedRoles={['docente']}><MiGrupo /></ProtectedRoute>
    },
    {
      path: 'docente/perfil',
      element: <ProtectedRoute allowedRoles={['docente']}><PerfilDocente /></ProtectedRoute>
    },
    {
      path: 'qr-suplente',
      element: <GestionQRSuplente />
    },
    {
      path: 'asistencia/historial',
      element: <HistorialAsistencia />
    },
    {
      path: 'asistencia/hoy',
      element: <HistorialAsistencia />
    },
    // Estudiantes (según rol)
    {
      path: 'estudiantes',
      element: <EstudiantesList />
    },
    {
      path: 'estudiantes/gestion',
      element: <ProtectedRoute allowedRoles={['admin', 'secretaria', 'coordinador_convivencia']}><GestionUnificada /></ProtectedRoute>
    },
    {
      path: 'estudiantes/consulta',
      element: <EstudiantesList />
    },
    {
      path: 'estudiantes/nuevo',
      element: <EstudiantesForm />
    },
    {
      path: 'estudiantes/editar/:id',
      element: <EstudiantesForm />
    },
    {
      path: 'estudiantes/codigos',
      element: <CodigosQR />
    },
    // Páginas específicas para estudiantes (Protegidas por rol)
    {
      path: 'mi-perfil',
      element: <ProtectedRoute allowedRoles={['estudiante']}><MiPerfil /></ProtectedRoute>
    },
    {
      path: 'mis-asistencias',
      element: <ProtectedRoute allowedRoles={['estudiante']}><MisAsistencias /></ProtectedRoute>
    },
    {
      path: 'generar-qr',
      element: <ProtectedRoute allowedRoles={['estudiante']}><GenerarQR /></ProtectedRoute>
    },
    // Gestión de QR (admin y secretaria)
    {
      path: 'qr-codes',
      element: <GestionQR />
    },
    // Justificaciones (según rol)
    {
      path: 'justificaciones',
      element: <GestionUnificadaJustificaciones />
    },
    {
      path: 'justificaciones/crear',
      element: <ProtectedRoute allowedRoles={['estudiante']}><CrearJustificacion /></ProtectedRoute>
    },
    {
      path: 'justificaciones/mis-justificaciones',
      element: <ProtectedRoute allowedRoles={['estudiante']}><MisJustificaciones /></ProtectedRoute>
    },
    // Reportes (solo secretaria/admin)
    {
      path: 'reportes/estadisticas',
      element: (
        <ProtectedRoute requiredRole={['admin', 'secretaria', 'coordinador_convivencia']}>
          <EstadisticasInformes />
        </ProtectedRoute>
      )
    },
    {
      path: 'reportes/estudiantes',
      element: (
        <ProtectedRoute requiredRole={['admin', 'secretaria', 'coordinador_convivencia']}>
          <EstudiantesGrupos />
        </ProtectedRoute>
      )
    },
    // Configuración (solo admin)
    {
      path: 'configuracion',
      element: (
        <ProtectedRoute requiredRole="admin">
          <Configuracion />
        </ProtectedRoute>
      )
    },
    {
      path: 'respaldos',
      element: (
        <ProtectedRoute requiredRole="admin">
          <Respaldos />
        </ProtectedRoute>
      )
    },
    {
      path: 'audit-log',
      element: (
        <ProtectedRoute requiredRole="admin">
          <LogsAuditoria />
        </ProtectedRoute>
      )
    },
    {
      path: 'documentacion',
      element: <Documentacion />
    },
    // Panel temporal de pruebas QR (solo admin)
    {
      path: 'test-qr-manager',
      element: (
        <ProtectedRoute requiredRole="admin">
          <TestQRManager />
        </ProtectedRoute>
      )
    },
    {
      path: '*',
      element: <h1>Página no encontrada</h1>
    }
  ]
};

export default MainRoutes;
