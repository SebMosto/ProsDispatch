import type { RouteObject } from 'react-router-dom';
import { routePatterns, Outlet } from '../lib/router';
import { ProtectedRoute } from '../lib/auth';
import DashboardPage from '../pages/DashboardPage';
import JobsListPage from '../pages/jobs/JobsListPage';
import CreateJobPage from '../pages/jobs/CreateJobPage';
import JobDetailPage from '../pages/jobs/JobDetailPage';
import CreateInvoicePage from '../pages/invoices/CreateInvoicePage';
import InvoiceDetailPage from '../pages/invoices/InvoiceDetailPage';
import ClientsListPage from '../pages/clients/ClientsListPage';
import CreateClientPage from '../pages/clients/CreateClientPage';
import ClientDetailPage from '../pages/clients/ClientDetailPage';
import CreatePropertyPage from '../pages/clients/CreatePropertyPage';

export const providerRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute><Outlet /></ProtectedRoute>,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/jobs', element: <JobsListPage /> },
      { path: '/jobs/new', element: <CreateJobPage /> },
      { path: '/jobs/:id', element: <JobDetailPage /> },

      { path: routePatterns.createInvoice, element: <CreateInvoicePage /> },
      { path: routePatterns.invoiceDetail, element: <InvoiceDetailPage /> },
      { path: '/invoices/:id/edit', element: <InvoiceDetailPage /> },

      { path: '/clients', element: <ClientsListPage /> },
      { path: '/clients/new', element: <CreateClientPage /> },
      { path: '/clients/:id', element: <ClientDetailPage /> },
      { path: '/clients/:id/properties/new', element: <CreatePropertyPage /> },
    ]
  }
];
