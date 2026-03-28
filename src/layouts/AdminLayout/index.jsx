import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

// project imports
import MobileHeader from './MobileHeader';
import Navigation from './Navigation';
import NavBar from './NavBar';
import Breadcrumb from './Breadcrumb';
import Loader from 'components/Loader/Loader';
import NotificationBar from 'components/NotificationBar';
import NotificationHistory from 'components/NotificationHistory';

// -----------------------|| ADMIN LAYOUT ||-----------------------//

export default function AdminLayout() {
  let containerClass = ['pc-container'];

  let adminlayout = (
    <>
      <MobileHeader />
      <NavBar />
      <NotificationBar />
      <NotificationHistory />
      <Navigation />
      {/* Contenido principal con margen fijo para el navbar */}
      <Box
        sx={{
          marginLeft: { xs: 0, lg: '280px' },
          width: { xs: '100%', lg: 'calc(100% - 280px)' },
          minHeight: '100vh',
          padding: { xs: '90px 12px 12px', lg: '100px 16px 16px' },
        }}
      >
        <div className={containerClass.join(' ')}>
          <div className="pcoded-content">
            <Breadcrumb />
            <Suspense fallback={<Loader />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </Box>
    </>
  );
  return <>{adminlayout}</>;
}
