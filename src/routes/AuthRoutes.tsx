import { lazy } from 'react';

import Loadable from '../components/Loadable';
import AuthLayout from '../layouts/AuthLayout';

const Login = Loadable(
  lazy(() => import('../pages/auth/Login'))
);

const SignUp = Loadable(
  lazy(() => import('../pages/auth/Register'))
);

const ResetPassword = Loadable(
  lazy(() => import('../pages/auth/ResetPassword'))
);

const UpdatePassword = Loadable(
  lazy(() => import('../pages/auth/UpdatePassword'))
);

const AuthRoutes = {
  path: '/',
  element: <AuthLayout />,
  children: [
    {
      path: 'login',
      element: <Login />,
    },
    {
      path: 'signup',
      element: <SignUp />,
    },
    {
      path: 'reset-password',
      element: <ResetPassword />,
    },
    {
      path: 'update-password',
      element: <UpdatePassword />,
    }
  ],
};

export default AuthRoutes;