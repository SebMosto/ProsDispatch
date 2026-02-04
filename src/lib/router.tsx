import {
  BrowserRouter,
  Routes as RRoutes,
  Route as RRoute,
  Navigate as RNavigate,
  Link as RLink,
  useLocation as useRLocation,
  useNavigate as useRNavigate,
  Outlet as ROutlet
} from 'react-router-dom';

// Export RouterProvider as alias for BrowserRouter to maintain compatibility
export const RouterProvider = BrowserRouter;
export const Routes = RRoutes;
export const Route = RRoute;
export const Navigate = RNavigate;
export const Link = RLink;
export const Outlet = ROutlet;

export const useLocation = useRLocation;
export const useNavigate = useRNavigate;

// Keep existing patterns
export const routePatterns = {
  createInvoice: '/jobs/:jobId/invoices/new',
  invoiceDetail: '/invoices/:id',
  publicInvoice: '/pay/:token',
};

export const routePaths = {
  createInvoice: (jobId: string) => `/jobs/${jobId}/invoices/new`,
  invoiceDetail: (id: string) => `/invoices/${id}`,
  publicInvoice: (token: string) => `/pay/${token}`,
};
