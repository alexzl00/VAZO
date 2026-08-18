// import { lazy } from 'react';

import { createBrowserRouter } from 'react-router-dom';

// project import
import MainRoutes from './MainRoutes';
import AuthRoutes from './AuthRoutes';
// import Loadable from 'components/Loadable';

//const NotFoundPage = Loadable(lazy(() => import('pages/maintenance/404')));

// ==============================|| ROUTING RENDER ||============================== //

const router = createBrowserRouter(
  [
    {
      path: '*',
      element: <div>404 Not Found</div>
    },
    MainRoutes,
    AuthRoutes,
  ],
  { basename: import.meta.env.VITE_APP_BASE_NAME }
);

export default router;
