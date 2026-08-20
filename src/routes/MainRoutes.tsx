import { lazy } from 'react';

// project import
import Loadable from '../components/Loadable';
import MainLayout from '../layouts/MainLayout';

import ProtectedRoute from '../auth/ProtectedRoute';

// pages routing
const SalaryCalculator = Loadable(lazy(() => import('../pages/salaries/CreateSalary')))
const UpdateSalary = Loadable(lazy(() => import('../pages/salaries/UpdateSalary')))

const Salaries = Loadable(lazy(() => import('../pages/salaries/Salaries')))

const Profile = Loadable(lazy(() => import('../pages/user/Profile')))

const MainRoutes = {
  path: '/',
  element: <MainLayout />, // wrap all children with MainLayout
  children: [
    {
      path: '', // root path "/"
      element: <SalaryCalculator />,
    },
    {
      path: 'salary-calculator',
      element: <SalaryCalculator />,
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: 'salaries',
          element: <Salaries />,
        },
        {
          path: 'update-salary/:id',
          element: <UpdateSalary />,
        },
        {
          path: 'profile',
          element: <Profile />
        }
      ],
    },
  ]
};

export default MainRoutes;
