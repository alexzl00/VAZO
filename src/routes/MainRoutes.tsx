import { lazy } from 'react';

// project import
import Loadable from '../components/Loadable';
import MainLayout from '../layouts/MainLayout';

// pages routing
const SalaryCalculator = Loadable(lazy(() => import('../pages/salaries/CreateSalary')))
const UpdateSalary = Loadable(lazy(() => import('../pages/salaries/UpdateSalary')))

const Salaries = Loadable(lazy(() => import('../pages/salaries/Salaries')))

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
      path: 'salaries',
      element: <Salaries />,
    },
    {
      path: 'update-salary/:id',
      element: <UpdateSalary />
    }
  ]
};

export default MainRoutes;
