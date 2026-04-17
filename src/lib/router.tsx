export { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

export const routePatterns = {
  adminPortal: '/admin',
  createInvoice: '/jobs/:jobId/invoices/new',
  invoiceDetail: '/invoices/:id',
  publicInvoice: '/pay/:token',
  jobApproval: '/jobs/approve/:token',
};

export const routePaths = {
  adminPortal: () => '/admin',
  createInvoice: (jobId: string) => `/jobs/${jobId}/invoices/new`,
  invoiceDetail: (id: string) => `/invoices/${id}`,
  publicInvoice: (token: string) => `/pay/${token}`,
  jobApproval: (token: string) => `/jobs/approve/${token}`,
};
