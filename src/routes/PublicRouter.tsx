import { Route } from 'react-router-dom';
import { lazy } from 'react';
import { routePatterns } from '../lib/router';

const HomePage = lazy(() => import('../pages/HomePage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const PublicInvoicePage = lazy(() => import('../pages/public/PublicInvoicePage'));

export const PublicRoutes = () => (
  <>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path={routePatterns.publicInvoice} element={<PublicInvoicePage />} />
  </>
);
