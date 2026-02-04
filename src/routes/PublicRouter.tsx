import type { RouteObject } from 'react-router-dom';
import { routePatterns } from '../lib/router';
import HomePage from '../pages/HomePage';
import SignInPage from '../pages/auth/SignInPage';
import SignUpPage from '../pages/auth/SignUpPage';
import PublicInvoicePage from '../pages/public/PublicInvoicePage';

export const publicRoutes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <SignInPage /> },
  { path: '/register', element: <SignUpPage /> },
  { path: routePatterns.publicInvoice, element: <PublicInvoicePage /> },
];
