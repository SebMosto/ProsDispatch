import { Route, Outlet } from 'react-router-dom';
import { lazy } from 'react';
import { ProtectedRoute } from '../lib/auth';
import { routePatterns } from '../lib/router';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const CreateJobPage = lazy(() => import('../pages/jobs/CreateJobPage'));
const JobDetailPage = lazy(() => import('../pages/jobs/JobDetailPage'));
const CreateInvoicePage = lazy(() => import('../pages/invoices/CreateInvoicePage'));
const InvoiceDetailPage = lazy(() => import('../pages/invoices/InvoiceDetailPage'));
const JobsListPage = lazy(() => import('../pages/jobs/JobsListPage'));
const ClientsListPage = lazy(() => import('../pages/clients/ClientsListPage'));
const CreateClientPage = lazy(() => import('../pages/clients/CreateClientPage'));
const CreatePropertyPage = lazy(() => import('../pages/clients/CreatePropertyPage'));
const ClientDetailPage = lazy(() => import('../pages/clients/ClientDetailPage'));

export const ProviderRoutes = () => (
  <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/jobs" element={<JobsListPage />} />
    <Route path="/jobs/new" element={<CreateJobPage />} />
    <Route path="/jobs/:id" element={<JobDetailPage />} />
    <Route path={routePatterns.createInvoice} element={<CreateInvoicePage />} />
    <Route path={routePatterns.invoiceDetail} element={<InvoiceDetailPage />} />
    <Route path="/invoices/:id/edit" element={<InvoiceDetailPage />} />
    <Route path="/clients" element={<ClientsListPage />} />
    <Route path="/clients/new" element={<CreateClientPage />} />
    <Route path="/clients/:id" element={<ClientDetailPage />} />
    <Route path="/clients/:id/properties/new" element={<CreatePropertyPage />} />
  </Route>
);
