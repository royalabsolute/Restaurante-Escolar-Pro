import { lazy } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';

// project import
import MainRoutes from './MainRoutes';

// render - landing page
const LandingPage = lazy(() => import('../views/landing/LandingPage'));
const Nosotros = lazy(() => import('../views/landing/Nosotros'));
const MarcoLegal = lazy(() => import('../views/landing/MarcoLegal'));
const ManualUsuario = lazy(() => import('../views/landing/ManualUsuario'));
const CreativeWorkshop = lazy(() => import('../views/landing/CreativeWorkshop.jsx'));

// render - legal pages
const Privacidad = lazy(() => import('../views/landing/Privacidad'));
const Terminos = lazy(() => import('../views/landing/Terminos'));
const Cookies = lazy(() => import('../views/landing/Cookies'));

// render - auth pages
const Login = lazy(() => import('../views/auth/login'));
const Register = lazy(() => import('../views/auth/register'));
const ForgotPassword = lazy(() => import('../views/auth/forgot-password'));
const ResetPassword = lazy(() => import('../views/auth/reset-password'));

const LegacyAppRedirect = () => {
  const location = useLocation();
  const targetPath = location.pathname.startsWith('/app')
    ? location.pathname
    : `/app${location.pathname}`;

  return (
    <Navigate
      to={`${targetPath}${location.search}${location.hash}`}
      replace
    />
  );
};

// ==============================|| ROUTING RENDER ||============================== //

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <LandingPage />
    },
    {
      path: '/nosotros',
      element: <Nosotros />
    },
    {
      path: '/marco-legal',
      element: <MarcoLegal />
    },
    {
      path: '/manual',
      element: <ManualUsuario />
    },
    {
      path: '/taller-creativo',
      element: <CreativeWorkshop />
    },
    {
      path: '/privacidad',
      element: <Privacidad />
    },
    {
      path: '/terminos',
      element: <Terminos />
    },
    {
      path: '/cookies',
      element: <Cookies />
    },
    {
      path: '/login',
      element: <Login />
    },
    {
      path: '/register',
      element: <Register />
    },
    {
      path: '/forgot-password',
      element: <ForgotPassword />
    },
    {
      path: '/reset-password',
      element: <ResetPassword />
    },
    {
      path: '/dashboard/*',
      element: <LegacyAppRedirect />
    },
    {
      path: '/estudiantes/*',
      element: <LegacyAppRedirect />
    },
    {
      path: '/asistencia/*',
      element: <LegacyAppRedirect />
    },
    {
      path: '/justificaciones/*',
      element: <LegacyAppRedirect />
    },
    {
      path: '/qr-codes/*',
      element: <LegacyAppRedirect />
    },
    {
      path: '/alfabetizadores/*',
      element: <LegacyAppRedirect />
    },
    {
      path: '/usuarios/*',
      element: <LegacyAppRedirect />
    },
    {
      path: '/reportes/*',
      element: <LegacyAppRedirect />
    },
    {
      path: '/configuracion/*',
      element: <LegacyAppRedirect />
    },
    {
      path: '/respaldos/*',
      element: <LegacyAppRedirect />
    },
    {
      path: '/mi-perfil',
      element: <Navigate to="/app/mi-perfil" replace />
    },
    {
      path: '/mis-asistencias',
      element: <Navigate to="/app/mis-asistencias" replace />
    },
    {
      path: '/generar-qr',
      element: <Navigate to="/app/generar-qr" replace />
    },
    MainRoutes
  ],
  { 
    basename: import.meta.env.VITE_APP_BASE_NAME,
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

export default router;
