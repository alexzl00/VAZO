import { lazy } from 'react';

// project import
import Loadable from '../components/Loadable';
import MainLayout from '../layouts/MainLayout';
import TaxChart from '../components/Calculator/TaxChart';
import Navbar from '../components/Navbar';

// pages routing
const SalaryCalculator = Loadable(lazy(() => import('../pages/SalaryCalculator')))

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
      path: '/feature-chart',
      element: <TaxChart/>
      // element: <Navbar/>
    }
  ]
};

export default MainRoutes;
